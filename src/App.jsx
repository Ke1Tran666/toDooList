import { invoke } from "@tauri-apps/api/core";
import { useEffect, useMemo, useState } from "react";
import { GitHubPanel } from "./components/GitHubPanel";
import { Header } from "./components/Header";
import { ProjectTreePanel } from "./components/ProjectTreePanel";
import { SettingsModal } from "./components/SettingsModal";
import { SignalsPanel } from "./components/SignalsPanel";
import { SourceInput } from "./components/SourceInput";
import { SourcePanel } from "./components/SourcePanel";
import { TaskBoard } from "./components/TaskBoard";
import {
  createTaskExportPayload,
  createTaskWorkbookBlob,
  parseTaskImportFile,
} from "./lib/exporters";
import { copy } from "./lib/i18n";
import {
  detectSourceKind,
  parseGithubLabel,
  statusKey,
} from "./lib/format";
import {
  applyTimePlan,
  normalizeTask,
  normalizeTasks,
  reconcileTasksWithAnalysis,
  translateTask,
} from "./lib/tasks";

const emptyStats = {
  filesScanned: 0,
  directoriesScanned: 0,
  todoMarkers: 0,
  languages: [],
  signals: [],
};

function App() {
  const [source, setSource] = useState("");
  const [result, setResult] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState("");
  const [githubTarget, setGithubTarget] = useState("");
  const [theme, setTheme] = useState(getInitialTheme);
  const [language, setLanguage] = useState(getInitialLanguage);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [timeBudgetHours, setTimeBudgetHours] = useState("3");
  const [importContext, setImportContext] = useState(null);
  const [importNotice, setImportNotice] = useState("");

  const t = copy[language];

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", theme === "dark");
    root.style.colorScheme = theme;
    localStorage.setItem("todoolist-theme", theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem("todoolist-language", language);
    setTasks((current) => applyTimePlan(
      current.map((task) => translateTask(task, language)),
      timeBudgetHours,
      language,
    ).tasks);
  }, [language]);

  const selectedCount = useMemo(
    () => tasks.filter((task) => task.selected).length,
    [tasks],
  );

  const sourceKind = useMemo(() => detectSourceKind(source), [source]);
  const planStats = useMemo(
    () => summarizePlan(tasks, timeBudgetHours),
    [tasks, timeBudgetHours],
  );

  async function analyzeSource() {
    const trimmed = source.trim();
    if (!trimmed) {
      setError(t.inputRequired);
      return;
    }

    setIsAnalyzing(true);
    setError("");

    try {
      const analysis = await invoke("analyze_source", {
        input: trimmed,
        language,
      });
      setResult(analysis);
      setTasks(planAnalyzedTasks(analysis.tasks));
      if (analysis.sourceType === "github") {
        setGithubTarget(analysis.sourceLabel);
      }
    } catch (invokeError) {
      const fallback = buildBrowserFallback(trimmed, language);
      setResult(fallback);
      setTasks(planAnalyzedTasks(fallback.tasks));
      setError(String(invokeError));
    } finally {
      setIsAnalyzing(false);
    }
  }

  function updateTask(id, changes) {
    setTasks((current) =>
      applyTimePlan(
        current.map((task, index) =>
          task.id === id
            ? normalizeTask(
                {
                  ...task,
                  ...changes,
                  updatedAt: new Date().toISOString(),
                },
                language,
                index,
              )
            : task,
        ),
        timeBudgetHours,
        language,
      ).tasks,
    );
  }

  function addTask() {
    const nextNumber = tasks.length + 1;
    setTasks((current) => {
      const nextTasks = [
        normalizeTask(
          {
            id: `manual-${Date.now()}`,
            title: t.newTask(nextNumber),
            detail: t.manualDetail,
            priority: t.priorities.medium,
            category: t.manualCategory,
            selected: true,
            status: t.statuses.todo,
            difficulty: t.difficulties.medium,
            estimatedMinutes: 60,
            actualMinutes: 0,
            trackingNote: "",
            sourceState: "manual",
          },
          language,
        ),
        ...current,
      ];

      return applyTimePlan(nextTasks, timeBudgetHours, language).tasks;
    });
  }

  function removeTask(id) {
    setTasks((current) => current.filter((task) => task.id !== id));
  }

  function exportTasks(format) {
    const payload = createTaskExportPayload({
      source: result?.sourceLabel ?? source,
      sourceType: result?.sourceType ?? sourceKind,
      githubTarget,
      language,
      tasks,
      timeBudgetHours,
      importContext,
    });
    const extension = format === "xlsx" ? "xlsx" : "json";
    const blob =
      extension === "xlsx"
        ? createTaskWorkbookBlob(payload)
        : new Blob([JSON.stringify(payload, null, 2)], {
            type: "application/json",
          });

    downloadBlob(blob, exportFilename(language, extension, importContext?.fileName));
  }

  async function importTaskFile(file) {
    if (!file) {
      return;
    }

    setError("");

    try {
      const imported = await parseTaskImportFile(file);
      const nextBudget = imported.timeBudgetHours || timeBudgetHours;
      const importedTasks = result?.tasks?.length
        ? reconcileTasksWithAnalysis(imported.tasks, result.tasks, language, t)
        : normalizeTasks(imported.tasks, language);
      const planned = applyTimePlan(importedTasks, nextBudget, language);

      setTasks(planned.tasks);
      setTimeBudgetHours(String(nextBudget));
      setImportContext({
        fileName: file.name,
        importedAt: new Date().toISOString(),
        history: imported.history,
      });
      setImportNotice(t.importSuccess(file.name, planned.tasks.length));

      if (imported.source) {
        setSource(imported.source);
      }

      if (imported.githubTarget) {
        setGithubTarget(imported.githubTarget);
      }
    } catch (importError) {
      setImportNotice("");
      setError(t.importFailed(String(importError.message ?? importError)));
    }
  }

  function updateTimeBudget(value) {
    setTimeBudgetHours(value);
    setTasks((current) => applyTimePlan(current, value, language).tasks);
  }

  function planAnalyzedTasks(analysisTasks) {
    const baseTasks = importContext
      ? reconcileTasksWithAnalysis(tasks, analysisTasks, language, t)
      : normalizeTasks(analysisTasks, language);

    return applyTimePlan(baseTasks, timeBudgetHours, language).tasks;
  }

  return (
    <main className="grid min-h-screen min-w-[320px] grid-rows-[auto_auto_1fr] gap-3.5 bg-[#eef2f6] p-3 text-slate-900 antialiased transition-colors sm:p-[18px] dark:bg-slate-950 dark:text-slate-100">
      <Header
        t={t}
        source={source}
        isAnalyzing={isAnalyzing}
        onAnalyze={analyzeSource}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      <SourceInput
        source={source}
        sourceKind={sourceKind}
        language={language}
        placeholder={t.sourcePlaceholder}
        onSourceChange={setSource}
      />

      <section className="grid min-h-0 grid-cols-[minmax(260px,340px)_minmax(0,1fr)] gap-3.5 max-lg:grid-cols-1">
        <aside className="grid min-w-0 content-start gap-3.5">
          <SourcePanel
            t={t}
            language={language}
            sourceType={result?.sourceType ?? sourceKind}
            sourceLabel={result?.sourceLabel}
            selectedCount={selectedCount}
          />
          <GitHubPanel
            t={t}
            githubTarget={githubTarget}
            onGithubTargetChange={setGithubTarget}
          />
          <ProjectTreePanel t={t} tree={result?.projectTree} />
          <SignalsPanel t={t} stats={result?.stats ?? emptyStats} />
        </aside>

        <TaskBoard
          t={t}
          language={language}
          summary={result?.summary}
          tasks={tasks}
          error={error}
          importNotice={importNotice}
          warnings={result?.warnings}
          selectedCount={selectedCount}
          timeBudgetHours={timeBudgetHours}
          planStats={planStats}
          onAddTask={addTask}
          onExport={exportTasks}
          onImport={importTaskFile}
          onTimeBudgetChange={updateTimeBudget}
          onUpdateTask={updateTask}
          onRemoveTask={removeTask}
        />
      </section>

      {isSettingsOpen ? (
        <SettingsModal
          t={t}
          theme={theme}
          language={language}
          onThemeChange={setTheme}
          onLanguageChange={setLanguage}
          onClose={() => setIsSettingsOpen(false)}
        />
      ) : null}
    </main>
  );
}

function buildBrowserFallback(input, language) {
  const t = copy[language];
  const isGithub = input.toLowerCase().includes("github.com/");
  const label = isGithub ? parseGithubLabel(input) : input;

  return {
    sourceType: isGithub ? "github" : "local",
    sourceLabel: label,
    summary: isGithub ? t.fallbackGithubSummary : t.fallbackLocalSummary,
    stats: {
      filesScanned: 0,
      directoriesScanned: 0,
      todoMarkers: 0,
      languages: [],
      signals: isGithub ? ["GitHub"] : ["Local"],
    },
    projectTree: null,
    warnings: [t.fallbackWarning],
    tasks: [
      {
        id: "fallback-1",
        title: isGithub ? t.connectGithub : t.scanLocal,
        detail: t.prepareAnalysis(label),
        priority: t.priorities.high,
        category: t.setup,
        selected: true,
      },
      {
        id: "fallback-2",
        title: t.reviewBacklog,
        detail: t.reviewBacklogDetail,
        priority: t.priorities.medium,
        category: t.planning,
        selected: true,
      },
    ],
  };
}

function getInitialTheme() {
  const saved = localStorage.getItem("todoolist-theme");

  if (saved === "light" || saved === "dark") {
    return saved;
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function getInitialLanguage() {
  const saved = localStorage.getItem("todoolist-language");

  if (saved === "vi" || saved === "en") {
    return saved;
  }

  return "vi";
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function exportFilename(language, extension, importedFileName) {
  const baseFromImport = importedFileName
    ? importedFileName.replace(/\.[^.]+$/, "")
    : "";
  const base =
    baseFromImport || (language === "vi" ? "danh-sach-nhiem-vu" : "task-drafts");

  if (baseFromImport) {
    return `${base}-updated.${extension}`;
  }

  return `${base}.${extension}`;
}

function summarizePlan(tasks, timeBudgetHours) {
  const budgetMinutes = Math.max(0, Math.round(Number(timeBudgetHours || 0) * 60));
  const plannedTasks = tasks.filter((task) => task.selected);
  const plannedMinutes = plannedTasks.reduce(
    (total, task) => total + (Number(task.estimatedMinutes) || 0),
    0,
  );
  const openCount = tasks.filter((task) => statusKey(task.status) !== "done").length;

  return {
    budgetMinutes,
    plannedMinutes,
    plannedCount: plannedTasks.length,
    openCount,
  };
}

export default App;
