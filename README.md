# toDooList

🇻🇳 Tiếng Việt | 🇺🇸 English

---

# 🇻🇳 Giới thiệu

toDooList là ứng dụng desktop giúp phân tích dự án từ đường dẫn local hoặc URL GitHub, sau đó tạo danh sách task để theo dõi công việc.

Ứng dụng hỗ trợ:

* Phân tích cấu trúc dự án
* Sinh task tự động
* Lập kế hoạch theo quỹ thời gian
* Theo dõi tiến độ thực hiện
* Import/Export JSON và Excel

---

# 🇺🇸 Introduction

toDooList is a desktop application that analyzes projects from a local directory or GitHub repository URL and automatically generates task lists for project planning and tracking.

Features include:

* Project structure analysis
* Automatic task generation
* Time-based planning
* Progress tracking
* JSON and Excel import/export

---

# 📦 Version

**v1.0.0**

---

# 👨‍💻 Author

**KeiTran666**

---

# 🔗 Repository

https://github.com/Ke1Tran666/toDooList

---

# 🛠️ Technologies

* Tauri
* React
* Vite
* Tailwind CSS
* Yarn (Corepack)
* Rust / Cargo
* XLSX

---

# 📋 Requirements

## 🇻🇳 Yêu cầu

Trước khi chạy source code cần cài đặt:

* Node.js
* Yarn (Corepack)
* Rust
* Cargo
* Git
* Visual Studio Build Tools 2022 (Windows)

## 🇺🇸 Requirements

Before running the source code, install:

* Node.js
* Yarn (Corepack)
* Rust
* Cargo
* Git
* Visual Studio Build Tools 2022 (Windows)

Check versions:

```powershell
node -v
corepack -v
rustc --version
cargo --version
git --version
```

---

# 🚀 Installation

## Clone Repository

```powershell
git clone https://github.com/Ke1Tran666/toDooList.git
cd toDooList

corepack enable
corepack yarn install
```

---

# ▶️ Development

## Run Desktop App

```powershell
corepack yarn tauri dev
```

## Run Web UI Only

```powershell
corepack yarn dev
```

---

# 🏗️ Build

Build frontend:

```powershell
corepack yarn build
```

Build desktop installer:

```powershell
corepack yarn tauri build
```

Generated files:

```text
src-tauri/target/release/bundle
```

Examples:

```text
src-tauri/target/release/bundle/msi/
src-tauri/target/release/bundle/nsis/
```

---

# 💻 Windows Installer

## 🇻🇳

Tải file `.msi` hoặc `.exe` từ GitHub Releases và chạy trình cài đặt.

Người dùng không cần:

* Node.js
* Yarn
* Rust
* Cargo
* Visual Studio

Chỉ cần:

* Windows 10 hoặc Windows 11
* Microsoft Edge WebView2 Runtime

## 🇺🇸

Download the `.msi` or `.exe` installer from GitHub Releases and run the installer.

End users do NOT need:

* Node.js
* Yarn
* Rust
* Cargo
* Visual Studio

Required:

* Windows 10 or Windows 11
* Microsoft Edge WebView2 Runtime

---

# ✨ Features

## 🇻🇳

* Phân tích thư mục local và URL GitHub
* Hiển thị cây thư mục dự án
* Sinh task tự động
* Thêm, sửa, xoá task
* Đánh dấu hoàn thành/chưa hoàn thành
* Ước lượng độ khó và thời gian thực hiện
* Lập kế hoạch theo quỹ thời gian
* Import JSON/XLS/XLSX
* Export JSON/XLSX
* Giao diện sáng/tối
* Hỗ trợ tiếng Việt và tiếng Anh

## 🇺🇸

* Analyze local folders and GitHub repositories
* Project tree visualization
* Automatic task generation
* Create, edit, and delete tasks
* Task completion tracking
* Difficulty and time estimation
* Time-based planning
* JSON/XLS/XLSX import
* JSON/XLSX export
* Light/Dark theme
* Vietnamese and English support

---

# 📝 Notes

## 🇻🇳

* Sử dụng Yarn thông qua Corepack.
* Không sử dụng package-lock.json.
* Chưa yêu cầu API key AI.
* GitHub API integration sẽ được bổ sung trong tương lai.

## 🇺🇸

* Uses Yarn through Corepack.
* Does not use package-lock.json.
* No AI API key is required in the current version.
* GitHub API integration may be added in future releases.
