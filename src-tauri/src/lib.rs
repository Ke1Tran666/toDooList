use serde::Serialize;
use std::{
    collections::BTreeMap,
    fs,
    path::{Path, PathBuf},
};

const MAX_FILES: usize = 650;
const MAX_DEPTH: usize = 6;
const MAX_TEXT_BYTES: u64 = 900_000;
const MAX_TODO_SAMPLES: usize = 8;
const MAX_TREE_DEPTH: usize = 4;
const MAX_TREE_CHILDREN: usize = 80;

const SKIP_DIRS: &[&str] = &[
    ".git",
    ".next",
    ".nuxt",
    ".turbo",
    ".venv",
    "build",
    "coverage",
    "dist",
    "node_modules",
    "out",
    "target",
    "vendor",
    "venv",
];

const TEXT_EXTENSIONS: &[&str] = &[
    "c", "cpp", "cs", "css", "go", "html", "java", "js", "json", "jsx", "kt", "md", "php", "py",
    "rs", "scss", "sql", "swift", "toml", "ts", "tsx", "txt", "vue", "yaml", "yml",
];

#[derive(Default)]
struct ScanContext {
    has_ci: bool,
    has_env_example: bool,
    has_package_json: bool,
    has_readme: bool,
    has_rust: bool,
    has_tests: bool,
    has_tauri: bool,
    has_vite: bool,
    package_json: Option<String>,
    todo_samples: Vec<String>,
}

#[derive(Default)]
struct ScanAccumulator {
    directories_scanned: usize,
    files_scanned: usize,
    language_counts: BTreeMap<String, usize>,
    todo_markers: usize,
    warnings: Vec<String>,
    context: ScanContext,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct AnalysisResult {
    source_type: String,
    source_label: String,
    summary: String,
    stats: ProjectStats,
    tasks: Vec<TaskDraft>,
    warnings: Vec<String>,
    project_tree: Option<ProjectTreeNode>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct ProjectStats {
    files_scanned: usize,
    directories_scanned: usize,
    todo_markers: usize,
    languages: Vec<LanguageCount>,
    signals: Vec<String>,
}

#[derive(Serialize)]
struct LanguageCount {
    name: String,
    files: usize,
}

#[derive(Serialize)]
struct TaskDraft {
    id: String,
    title: String,
    detail: String,
    priority: String,
    category: String,
    selected: bool,
}

#[derive(Serialize)]
struct ProjectTreeNode {
    name: String,
    path: String,
    kind: String,
    children: Vec<ProjectTreeNode>,
}

#[tauri::command]
fn analyze_source(input: String, language: Option<String>) -> Result<AnalysisResult, String> {
    let cleaned = clean_input(&input);
    let english = language.as_deref() == Some("en");

    if cleaned.is_empty() {
        return Err(if english {
            "Source is empty.".into()
        } else {
            "Nguồn đang trống.".into()
        });
    }

    if is_github_url(&cleaned) {
        return Ok(if english {
            analyze_github_source_en(&cleaned)
        } else {
            analyze_github_source(&cleaned)
        });
    }

    let path = PathBuf::from(&cleaned);

    if !path.exists() {
        return Ok(if english {
            unknown_source_en(&cleaned)
        } else {
            unknown_source(&cleaned)
        });
    }

    if path.is_file() {
        return if english {
            analyze_file_source_en(&path)
        } else {
            analyze_file_source(&path)
        };
    }

    if path.is_dir() {
        return if english {
            analyze_directory_source_en(&path)
        } else {
            analyze_directory_source(&path)
        };
    }

    Ok(if english {
        unknown_source_en(&cleaned)
    } else {
        unknown_source(&cleaned)
    })
}

pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![analyze_source])
        .run(tauri::generate_context!())
        .expect("failed to run toDooList");
}

fn clean_input(input: &str) -> String {
    input
        .trim()
        .trim_matches('"')
        .trim_matches('\'')
        .trim()
        .to_string()
}

fn is_github_url(input: &str) -> bool {
    let lowered = input.to_ascii_lowercase();
    lowered.starts_with("https://github.com/")
        || lowered.starts_with("http://github.com/")
        || lowered.starts_with("git@github.com:")
}

fn analyze_github_source(input: &str) -> AnalysisResult {
    let label = github_label(input);
    let kind = github_url_kind(input);
    let kind_label = github_kind_label(&kind);

    AnalysisResult {
        source_type: "github".into(),
        source_label: label.clone(),
        summary: format!("Đã nhận diện {} trên GitHub cho {}.", kind_label, label),
        stats: ProjectStats {
            files_scanned: 0,
            directories_scanned: 0,
            todo_markers: 0,
            languages: Vec::new(),
            signals: vec!["GitHub".into(), kind_label],
        },
        tasks: github_tasks(&label, &kind),
        warnings: vec!["Chưa cấu hình kết nối GitHub API.".into()],
        project_tree: None,
    }
}

fn analyze_github_source_en(input: &str) -> AnalysisResult {
    let label = github_label(input);
    let kind = github_url_kind(input);

    AnalysisResult {
        source_type: "github".into(),
        source_label: label.clone(),
        summary: format!("GitHub {} detected for {}.", kind, label),
        stats: ProjectStats {
            files_scanned: 0,
            directories_scanned: 0,
            todo_markers: 0,
            languages: Vec::new(),
            signals: vec!["GitHub".into(), kind.clone()],
        },
        tasks: github_tasks_en(&label, &kind),
        warnings: vec!["GitHub API connection is not configured yet.".into()],
        project_tree: None,
    }
}

fn analyze_file_source(path: &Path) -> Result<AnalysisResult, String> {
    let metadata = fs::metadata(path).map_err(|error| error.to_string())?;
    let mut todo_markers = 0;
    let mut tasks = vec![task(
        "file-review",
        "Rà soát tệp nguồn",
        format!(
            "Kiểm tra {} và chuyển các phát hiện quan trọng thành nhiệm vụ cần theo dõi.",
            path.display()
        ),
        "Trung bình",
        "Rà soát",
    )];

    if is_text_file(path) && metadata.len() <= MAX_TEXT_BYTES {
        if let Ok(content) = fs::read_to_string(path) {
            todo_markers = count_todo_markers(&content);
        }
    }

    if todo_markers > 0 {
        tasks.push(task(
            "file-todo",
            "Xử lý TODO/FIXME",
            format!(
                "Tìm thấy {} ghi chú TODO/FIXME trong {}.",
                todo_markers,
                path.display()
            ),
            "Cao",
            "Mã nguồn",
        ));
    }

    Ok(AnalysisResult {
        source_type: "file".into(),
        source_label: path.display().to_string(),
        summary: "Đã phân tích xong một tệp.".into(),
        stats: ProjectStats {
            files_scanned: 1,
            directories_scanned: 0,
            todo_markers,
            languages: extension_language(path)
                .map(|name| vec![LanguageCount { name, files: 1 }])
                .unwrap_or_default(),
            signals: vec!["Tệp local".into()],
        },
        tasks,
        warnings: Vec::new(),
        project_tree: Some(file_tree_node(path)),
    })
}

fn analyze_file_source_en(path: &Path) -> Result<AnalysisResult, String> {
    let metadata = fs::metadata(path).map_err(|error| error.to_string())?;
    let mut todo_markers = 0;
    let mut tasks = vec![task(
        "file-review",
        "Review source file",
        format!(
            "Inspect {} and turn important findings into tracked tasks.",
            path.display()
        ),
        "Medium",
        "Review",
    )];

    if is_text_file(path) && metadata.len() <= MAX_TEXT_BYTES {
        if let Ok(content) = fs::read_to_string(path) {
            todo_markers = count_todo_markers(&content);
        }
    }

    if todo_markers > 0 {
        tasks.push(task(
            "file-todo",
            "Resolve TODO/FIXME markers",
            format!(
                "Found {} TODO/FIXME marker(s) in {}.",
                todo_markers,
                path.display()
            ),
            "High",
            "Code",
        ));
    }

    Ok(AnalysisResult {
        source_type: "file".into(),
        source_label: path.display().to_string(),
        summary: "Single file analysis completed.".into(),
        stats: ProjectStats {
            files_scanned: 1,
            directories_scanned: 0,
            todo_markers,
            languages: extension_language(path)
                .map(|name| vec![LanguageCount { name, files: 1 }])
                .unwrap_or_default(),
            signals: vec!["Local file".into()],
        },
        tasks,
        warnings: Vec::new(),
        project_tree: Some(file_tree_node(path)),
    })
}

fn analyze_directory_source(path: &Path) -> Result<AnalysisResult, String> {
    let mut scan = ScanAccumulator::default();
    walk_directory(path, 0, &mut scan);

    let stats = ProjectStats {
        files_scanned: scan.files_scanned,
        directories_scanned: scan.directories_scanned,
        todo_markers: scan.todo_markers,
        languages: language_counts(scan.language_counts),
        signals: project_signals(&scan.context),
    };
    let tasks = local_project_tasks(path, &scan.context, scan.todo_markers);
    let mut warnings = scan.warnings;

    if scan.files_scanned >= MAX_FILES {
        warnings.push(format!(
            "Đã dừng quét ở {} tệp. Hãy tinh chỉnh danh sách loại trừ để phân tích sâu hơn.",
            MAX_FILES
        ));
    }

    Ok(AnalysisResult {
        source_type: "local".into(),
        source_label: path.display().to_string(),
        summary: format!(
            "Đã quét {} tệp trong {} thư mục.",
            stats.files_scanned, stats.directories_scanned
        ),
        stats,
        tasks,
        warnings,
        project_tree: Some(build_project_tree(path)),
    })
}

fn analyze_directory_source_en(path: &Path) -> Result<AnalysisResult, String> {
    let mut scan = ScanAccumulator::default();
    walk_directory(path, 0, &mut scan);

    let stats = ProjectStats {
        files_scanned: scan.files_scanned,
        directories_scanned: scan.directories_scanned,
        todo_markers: scan.todo_markers,
        languages: language_counts(scan.language_counts),
        signals: project_signals_en(&scan.context),
    };
    let tasks = local_project_tasks_en(path, &scan.context, scan.todo_markers);
    let mut warnings = scan.warnings;

    if scan.files_scanned >= MAX_FILES {
        warnings.push(format!(
            "Scan stopped at {} files. Refine excludes for deeper analysis.",
            MAX_FILES
        ));
    }

    Ok(AnalysisResult {
        source_type: "local".into(),
        source_label: path.display().to_string(),
        summary: format!(
            "Scanned {} files across {} folders.",
            stats.files_scanned, stats.directories_scanned
        ),
        stats,
        tasks,
        warnings,
        project_tree: Some(build_project_tree(path)),
    })
}

fn unknown_source(input: &str) -> AnalysisResult {
    AnalysisResult {
        source_type: "unknown".into(),
        source_label: input.into(),
        summary: "Không thể nhận diện nguồn trên máy này.".into(),
        stats: ProjectStats {
            files_scanned: 0,
            directories_scanned: 0,
            todo_markers: 0,
            languages: Vec::new(),
            signals: vec!["Cần kiểm tra".into()],
        },
        tasks: vec![task(
            "verify-source",
            "Kiểm tra nguồn đầu vào",
            "Xác nhận đường dẫn local tồn tại hoặc URL GitHub có thể truy cập.",
            "Cao",
            "Thiết lập",
        )],
        warnings: vec!["Đường dẫn nguồn không tồn tại trên máy.".into()],
        project_tree: None,
    }
}

fn unknown_source_en(input: &str) -> AnalysisResult {
    AnalysisResult {
        source_type: "unknown".into(),
        source_label: input.into(),
        summary: "Source could not be resolved on this machine.".into(),
        stats: ProjectStats {
            files_scanned: 0,
            directories_scanned: 0,
            todo_markers: 0,
            languages: Vec::new(),
            signals: vec!["Needs review".into()],
        },
        tasks: vec![task(
            "verify-source",
            "Verify source input",
            "Confirm that the local path exists or that the GitHub URL is reachable.",
            "High",
            "Setup",
        )],
        warnings: vec!["The source path does not exist locally.".into()],
        project_tree: None,
    }
}

fn walk_directory(path: &Path, depth: usize, scan: &mut ScanAccumulator) {
    if scan.files_scanned >= MAX_FILES || depth > MAX_DEPTH {
        return;
    }

    let entries = match fs::read_dir(path) {
        Ok(entries) => entries,
        Err(error) => {
            scan.warnings
                .push(format!("Không thể đọc {}: {}", path.display(), error));
            return;
        }
    };

    for entry in entries.flatten() {
        if scan.files_scanned >= MAX_FILES {
            return;
        }

        let entry_path = entry.path();
        let name = entry.file_name().to_string_lossy().to_string();
        let lowered = name.to_ascii_lowercase();

        if entry_path.is_dir() {
            if SKIP_DIRS.contains(&lowered.as_str()) {
                continue;
            }

            scan.directories_scanned += 1;
            mark_directory_signal(&lowered, &mut scan.context);
            walk_directory(&entry_path, depth + 1, scan);
            continue;
        }

        if !entry_path.is_file() {
            continue;
        }

        scan.files_scanned += 1;
        mark_file_signal(&entry_path, &lowered, scan);

        if let Some(language) = extension_language(&entry_path) {
            *scan.language_counts.entry(language).or_insert(0) += 1;
        }

        inspect_text_file(&entry_path, scan);
    }
}

fn build_project_tree(path: &Path) -> ProjectTreeNode {
    directory_tree_node(path, 0)
}

fn file_tree_node(path: &Path) -> ProjectTreeNode {
    ProjectTreeNode {
        name: path_name(path),
        path: path.display().to_string(),
        kind: "file".into(),
        children: Vec::new(),
    }
}

fn directory_tree_node(path: &Path, depth: usize) -> ProjectTreeNode {
    let mut children = Vec::new();

    if depth < MAX_TREE_DEPTH {
        if let Ok(entries) = fs::read_dir(path) {
            let mut items: Vec<_> = entries
                .flatten()
                .filter_map(|entry| {
                    let entry_path = entry.path();
                    let name = entry.file_name().to_string_lossy().to_string();
                    let lowered = name.to_ascii_lowercase();

                    if entry_path.is_dir() && SKIP_DIRS.contains(&lowered.as_str()) {
                        return None;
                    }

                    if entry_path.is_dir() || entry_path.is_file() {
                        Some((name, entry_path))
                    } else {
                        None
                    }
                })
                .collect();

            items.sort_by(|(left_name, left_path), (right_name, right_path)| {
                left_path
                    .is_file()
                    .cmp(&right_path.is_file())
                    .then_with(|| left_name.to_lowercase().cmp(&right_name.to_lowercase()))
            });

            children = items
                .into_iter()
                .take(MAX_TREE_CHILDREN)
                .map(|(_, child_path)| {
                    if child_path.is_dir() {
                        directory_tree_node(&child_path, depth + 1)
                    } else {
                        file_tree_node(&child_path)
                    }
                })
                .collect();
        }
    }

    ProjectTreeNode {
        name: path_name(path),
        path: path.display().to_string(),
        kind: "folder".into(),
        children,
    }
}

fn path_name(path: &Path) -> String {
    path.file_name()
        .and_then(|name| name.to_str())
        .map(|name| name.to_string())
        .unwrap_or_else(|| path.display().to_string())
}

fn mark_directory_signal(name: &str, context: &mut ScanContext) {
    if name == ".github" {
        context.has_ci = true;
    }

    if matches!(name, "test" | "tests" | "__tests__" | "spec" | "specs") {
        context.has_tests = true;
    }
}

fn mark_file_signal(path: &Path, name: &str, scan: &mut ScanAccumulator) {
    match name {
        "readme.md" | "readme.txt" => scan.context.has_readme = true,
        "package.json" => scan.context.has_package_json = true,
        "vite.config.ts" | "vite.config.js" | "vite.config.mjs" => scan.context.has_vite = true,
        "cargo.toml" => scan.context.has_rust = true,
        "tauri.conf.json" => scan.context.has_tauri = true,
        ".env.example" | ".env.sample" => scan.context.has_env_example = true,
        _ => {}
    }

    if name.ends_with(".test.ts")
        || name.ends_with(".test.tsx")
        || name.ends_with(".spec.ts")
        || name.ends_with(".spec.tsx")
        || name.ends_with(".test.js")
        || name.ends_with(".spec.js")
        || name.ends_with(".test.jsx")
        || name.ends_with(".spec.jsx")
    {
        scan.context.has_tests = true;
    }

    if path.components().any(|component| {
        component
            .as_os_str()
            .to_string_lossy()
            .eq_ignore_ascii_case("workflows")
    }) {
        scan.context.has_ci = true;
    }
}

fn inspect_text_file(path: &Path, scan: &mut ScanAccumulator) {
    let metadata = match fs::metadata(path) {
        Ok(metadata) => metadata,
        Err(_) => return,
    };

    if metadata.len() > MAX_TEXT_BYTES || !is_text_file(path) {
        return;
    }

    let content = match fs::read_to_string(path) {
        Ok(content) => content,
        Err(_) => return,
    };

    if path
        .file_name()
        .and_then(|name| name.to_str())
        .is_some_and(|name| name.eq_ignore_ascii_case("package.json"))
    {
        scan.context.package_json = Some(content.clone());
        let lowered = content.to_ascii_lowercase();
        if lowered.contains("\"@tauri-apps/") || lowered.contains("\"tauri\"") {
            scan.context.has_tauri = true;
        }
        if lowered.contains("\"vite\"") {
            scan.context.has_vite = true;
        }
    }

    for (index, line) in content.lines().enumerate() {
        let lowered = line.to_ascii_lowercase();
        if lowered.contains("todo") || lowered.contains("fixme") {
            scan.todo_markers += 1;

            if scan.context.todo_samples.len() < MAX_TODO_SAMPLES {
                scan.context.todo_samples.push(format!(
                    "{}:{} {}",
                    path.display(),
                    index + 1,
                    line.trim()
                ));
            }
        }
    }
}

fn is_text_file(path: &Path) -> bool {
    path.extension()
        .and_then(|extension| extension.to_str())
        .map(|extension| {
            let extension = extension.to_ascii_lowercase();
            TEXT_EXTENSIONS.contains(&extension.as_str())
        })
        .unwrap_or(false)
}

fn extension_language(path: &Path) -> Option<String> {
    let extension = path
        .extension()
        .and_then(|extension| extension.to_str())?
        .to_ascii_lowercase();

    let language = match extension.as_str() {
        "c" | "cpp" | "cs" | "go" | "java" | "kt" | "php" | "py" | "rs" | "swift" => {
            extension.to_uppercase()
        }
        "css" | "scss" => "CSS".into(),
        "html" => "HTML".into(),
        "js" | "jsx" => "JavaScript".into(),
        "json" => "JSON".into(),
        "md" => "Markdown".into(),
        "sql" => "SQL".into(),
        "toml" => "TOML".into(),
        "ts" | "tsx" => "TypeScript".into(),
        "txt" => "Text".into(),
        "vue" => "Vue".into(),
        "yaml" | "yml" => "YAML".into(),
        other => other.into(),
    };

    Some(language)
}

fn language_counts(counts: BTreeMap<String, usize>) -> Vec<LanguageCount> {
    let mut languages: Vec<_> = counts
        .into_iter()
        .map(|(name, files)| LanguageCount { name, files })
        .collect();

    languages.sort_by(|a, b| b.files.cmp(&a.files).then_with(|| a.name.cmp(&b.name)));
    languages
}

fn project_signals(context: &ScanContext) -> Vec<String> {
    let mut signals = Vec::new();

    if context.has_package_json {
        signals.push("Node".into());
    }
    if context.has_vite {
        signals.push("Vite".into());
    }
    if context.has_tauri {
        signals.push("Tauri".into());
    }
    if context.has_rust {
        signals.push("Rust".into());
    }
    if context.has_tests {
        signals.push("Kiểm thử".into());
    }
    if context.has_ci {
        signals.push("CI".into());
    }
    if context.has_env_example {
        signals.push("Mẫu env".into());
    }

    if signals.is_empty() {
        signals.push("Dự án".into());
    }

    signals
}

fn project_signals_en(context: &ScanContext) -> Vec<String> {
    let mut signals = Vec::new();

    if context.has_package_json {
        signals.push("Node".into());
    }
    if context.has_vite {
        signals.push("Vite".into());
    }
    if context.has_tauri {
        signals.push("Tauri".into());
    }
    if context.has_rust {
        signals.push("Rust".into());
    }
    if context.has_tests {
        signals.push("Tests".into());
    }
    if context.has_ci {
        signals.push("CI".into());
    }
    if context.has_env_example {
        signals.push("Env sample".into());
    }

    if signals.is_empty() {
        signals.push("Project".into());
    }

    signals
}

fn local_project_tasks(path: &Path, context: &ScanContext, todo_markers: usize) -> Vec<TaskDraft> {
    let mut tasks = Vec::new();

    if todo_markers > 0 {
        tasks.push(task(
            "todo-markers",
            "Xử lý TODO/FIXME",
            format!(
                "Rà soát {} ghi chú được tìm thấy trong {}. Bắt đầu với: {}",
                todo_markers,
                path.display(),
                context
                    .todo_samples
                    .first()
                    .cloned()
                    .unwrap_or_else(|| "không có mẫu được lưu".into())
            ),
            "Cao",
            "Mã nguồn",
        ));
    }

    if !context.has_readme {
        tasks.push(task(
            "readme",
            "Thêm README cho dự án",
            "Ghi lại cách thiết lập, lệnh phát triển, biến môi trường và quy trình phát hành.",
            "Trung bình",
            "Tài liệu",
        ));
    }

    if !context.has_tests {
        tasks.push(task(
            "tests",
            "Thêm kiểm thử smoke test",
            "Tạo nền tảng kiểm thử nhỏ cho luồng chính trước khi mở rộng backlog.",
            "Trung bình",
            "Chất lượng",
        ));
    }

    if !context.has_ci {
        tasks.push(task(
            "ci",
            "Thêm kiểm tra CI",
            "Chạy install, lint, test và build trên pull request.",
            "Trung bình",
            "Tự động hóa",
        ));
    }

    if context.has_package_json && !context.has_env_example {
        tasks.push(task(
            "env-example",
            "Thêm mẫu biến môi trường",
            "Tạo .env.example với các khóa bắt buộc và giá trị placeholder an toàn.",
            "Thấp",
            "Thiết lập",
        ));
    }

    if context.has_tauri {
        tasks.push(task(
            "tauri-permissions",
            "Rà soát quyền desktop",
            "Xác nhận quyền filesystem, network, updater và tích hợp GitHub trước khi phát hành.",
            "Cao",
            "Desktop",
        ));
    }

    tasks.push(task(
        "github-publish",
        "Chuẩn bị tạo GitHub Issue",
        "Ánh xạ từng nhiệm vụ được chọn sang label, assignee và milestone trước khi gọi GitHub API.",
        "Cao",
        "GitHub",
    ));

    tasks
}

fn local_project_tasks_en(
    path: &Path,
    context: &ScanContext,
    todo_markers: usize,
) -> Vec<TaskDraft> {
    let mut tasks = Vec::new();

    if todo_markers > 0 {
        tasks.push(task(
            "todo-markers",
            "Resolve TODO/FIXME markers",
            format!(
                "Review {} marker(s) found in {}. Start with: {}",
                todo_markers,
                path.display(),
                context
                    .todo_samples
                    .first()
                    .cloned()
                    .unwrap_or_else(|| "no sample captured".into())
            ),
            "High",
            "Code",
        ));
    }

    if !context.has_readme {
        tasks.push(task(
            "readme",
            "Add project README",
            "Document setup, development commands, environment variables, and release flow.",
            "Medium",
            "Docs",
        ));
    }

    if !context.has_tests {
        tasks.push(task(
            "tests",
            "Add smoke test coverage",
            "Create a small test baseline for the core workflow before expanding the backlog.",
            "Medium",
            "Quality",
        ));
    }

    if !context.has_ci {
        tasks.push(task(
            "ci",
            "Add CI checks",
            "Run install, lint, test, and build checks on pull requests.",
            "Medium",
            "Automation",
        ));
    }

    if context.has_package_json && !context.has_env_example {
        tasks.push(task(
            "env-example",
            "Add environment template",
            "Create .env.example with required keys and safe placeholder values.",
            "Low",
            "Setup",
        ));
    }

    if context.has_tauri {
        tasks.push(task(
            "tauri-permissions",
            "Review desktop permissions",
            "Confirm filesystem, network, updater, and GitHub integration permissions before release.",
            "High",
            "Desktop",
        ));
    }

    tasks.push(task(
        "github-publish",
        "Prepare GitHub issue publishing",
        "Map each selected task to labels, assignees, and milestone before calling the GitHub API.",
        "High",
        "GitHub",
    ));

    tasks
}

fn github_tasks(label: &str, kind: &str) -> Vec<TaskDraft> {
    let mut tasks = vec![task(
        "github-connect",
        "Kết nối GitHub API",
        format!(
            "Đọc metadata của {} và xác nhận quyền truy cập repository trước khi tạo nhiệm vụ.",
            label
        ),
        "Cao",
        "GitHub",
    )];

    match kind {
        "pull request" => tasks.push(task(
            "pr-review",
            "Rà soát ngữ cảnh pull request",
            "Thu thập file đã đổi, review thread chưa xử lý, check thất bại và nhiệm vụ cần theo dõi.",
            "Cao",
            "Rà soát",
        )),
        "issue" => tasks.push(task(
            "issue-triage",
            "Phân loại yêu cầu issue",
            "Rút ra tiêu chí hoàn thành, bước tái hiện, label và nhiệm vụ triển khai.",
            "Cao",
            "Lập kế hoạch",
        )),
        "file" => tasks.push(task(
            "file-analysis",
            "Phân tích tệp được liên kết",
            "Tạo nhiệm vụ từ comment trong code, kiểm thử còn thiếu và ghi chú ownership của tệp.",
            "Trung bình",
            "Mã nguồn",
        )),
        "branch" => tasks.push(task(
            "branch-analysis",
            "Phân tích trạng thái branch",
            "So sánh branch với branch mặc định và tạo nhiệm vụ tích hợp.",
            "Trung bình",
            "Lập kế hoạch",
        )),
        _ => tasks.push(task(
            "repo-scan",
            "Quét cấu trúc repository",
            "Lấy README, package files, issue đang mở và tín hiệu dự án trước khi tạo nhiệm vụ.",
            "Cao",
            "Phân tích",
        )),
    }

    tasks.push(task(
        "draft-issues",
        "Tạo bản nháp GitHub Issue",
        "Tạo bản nháp có thể chỉnh sửa gồm tiêu đề, nội dung, độ ưu tiên, label và phát hiện trùng lặp.",
        "Trung bình",
        "GitHub",
    ));

    tasks
}

fn github_tasks_en(label: &str, kind: &str) -> Vec<TaskDraft> {
    let mut tasks = vec![task(
        "github-connect",
        "Connect GitHub API",
        format!(
            "Read metadata for {} and confirm repository access before publishing tasks.",
            label
        ),
        "High",
        "GitHub",
    )];

    match kind {
        "pull request" => tasks.push(task(
            "pr-review",
            "Review pull request context",
            "Collect changed files, unresolved review threads, failed checks, and follow-up tasks.",
            "High",
            "Review",
        )),
        "issue" => tasks.push(task(
            "issue-triage",
            "Triage issue requirements",
            "Extract acceptance criteria, reproduction steps, labels, and implementation tasks.",
            "High",
            "Planning",
        )),
        "file" => tasks.push(task(
            "file-analysis",
            "Analyze linked file",
            "Create tasks from code comments, missing tests, and ownership notes for the linked file.",
            "Medium",
            "Code",
        )),
        "branch" => tasks.push(task(
            "branch-analysis",
            "Analyze branch state",
            "Compare branch context with the default branch and generate integration tasks.",
            "Medium",
            "Planning",
        )),
        _ => tasks.push(task(
            "repo-scan",
            "Scan repository structure",
            "Fetch README, package files, open issues, and project signals before task generation.",
            "High",
            "Analysis",
        )),
    }

    tasks.push(task(
        "draft-issues",
        "Generate draft GitHub issues",
        "Create editable drafts with title, body, priority, labels, and duplicate detection.",
        "Medium",
        "GitHub",
    ));

    tasks
}

fn task(
    id: impl Into<String>,
    title: impl Into<String>,
    detail: impl Into<String>,
    priority: impl Into<String>,
    category: impl Into<String>,
) -> TaskDraft {
    TaskDraft {
        id: id.into(),
        title: title.into(),
        detail: detail.into(),
        priority: priority.into(),
        category: category.into(),
        selected: true,
    }
}

fn count_todo_markers(content: &str) -> usize {
    content
        .lines()
        .filter(|line| {
            let lowered = line.to_ascii_lowercase();
            lowered.contains("todo") || lowered.contains("fixme")
        })
        .count()
}

fn github_label(input: &str) -> String {
    if let Some(rest) = input.strip_prefix("git@github.com:") {
        return rest.trim_end_matches(".git").into();
    }

    let path = input
        .trim_start_matches("https://github.com/")
        .trim_start_matches("http://github.com/");

    let parts: Vec<_> = path.split('/').filter(|part| !part.is_empty()).collect();

    if parts.len() >= 2 {
        format!("{}/{}", parts[0], parts[1].trim_end_matches(".git"))
    } else {
        input.into()
    }
}

fn github_url_kind(input: &str) -> String {
    let lowered = input.to_ascii_lowercase();

    if lowered.contains("/pull/") {
        "pull request".into()
    } else if lowered.contains("/issues/") {
        "issue".into()
    } else if lowered.contains("/blob/") {
        "file".into()
    } else if lowered.contains("/tree/") {
        "branch".into()
    } else {
        "repository".into()
    }
}

fn github_kind_label(kind: &str) -> String {
    match kind {
        "pull request" => "pull request".into(),
        "issue" => "issue".into(),
        "file" => "tệp".into(),
        "branch" => "branch".into(),
        _ => "repository".into(),
    }
}
