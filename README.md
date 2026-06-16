# toDooList

Ứng dụng desktop giúp phân tích dự án từ đường dẫn local hoặc URL GitHub, sau đó tạo danh sách task để theo dõi công việc. App hỗ trợ import/export task bằng JSON/XLSX, lập kế hoạch theo quỹ thời gian và đánh dấu task hoàn thành/chưa hoàn thành.

## Phiên bản

v1.0.0

## Tác giả

KeiTran666

## Repository

GitHub: [Ke1Tran666/toDooList](https://github.com/Ke1Tran666/toDooList)

## Công nghệ

- Tauri
- React JavaScript
- Vite
- Tailwind CSS
- Yarn qua Corepack
- Rust/Cargo
- XLSX để đọc và ghi file Excel

## Yêu cầu cài đặt

Trước khi chạy dự án, máy cần có:

- Node.js
- Yarn qua Corepack
- Rust và Cargo
- Git
- Visual Studio Build Tools 2022 trên Windows

Kiểm tra nhanh:

```powershell
node -v
corepack -v
rustc --version
cargo --version
git --version
```

## Tải source code từ GitHub

Bạn có 2 cách tải source.

### Cách 1: Clone bằng Git

```powershell
git clone https://github.com/Ke1Tran666/toDooList.git
cd toDooList
corepack enable
corepack yarn install
```

### Cách 2: Tải file nén ZIP từ GitHub

1. Mở repository: [https://github.com/Ke1Tran666/toDooList](https://github.com/Ke1Tran666/toDooList)
2. Bấm nút **Code**.
3. Chọn **Download ZIP**.
4. Giải nén file ZIP vừa tải.
5. Mở PowerShell trong thư mục đã giải nén.
6. Cài dependency:

```powershell
corepack enable
corepack yarn install
```

## Chạy khi phát triển

Chạy app desktop bằng Tauri:

```powershell
corepack yarn tauri dev
```

Nếu chỉ muốn chạy giao diện web bằng Vite:

```powershell
corepack yarn dev
```

## Build và đóng gói v1

Build phần frontend:

```powershell
corepack yarn build
```

Đóng gói ứng dụng desktop Tauri:

```powershell
corepack yarn tauri build
```

Sau khi build Tauri, file cài đặt thường nằm trong:

```text
src-tauri\target\release\bundle
```

## File nén v1

Repo có kèm thư mục `release/` chứa file nén tất cả trong một của bản v1:

```text
release\toDooList-v1.zip
```

Khi tải file này:

1. Tải `release/toDooList-v1.zip` từ GitHub.
2. Giải nén `toDooList-v1.zip`.
3. Mở thư mục vừa giải nén.
4. Nếu muốn cài app desktop, mở thư mục `windows` và chạy file setup.
5. Nếu muốn chạy source, mở PowerShell trong thư mục `source`.
6. Chạy:

```powershell
corepack enable
corepack yarn install
corepack yarn tauri dev
```

File nén v1 gồm:

- `source/`: source code sạch, không gồm `node_modules`, `dist`, `src-tauri/target`.
- `windows/`: bộ cài Windows được build từ Tauri v1.

Nếu muốn tự tạo lại file nén source:

```powershell
powershell -ExecutionPolicy Bypass -Command "Compress-Archive -Path .\* -DestinationPath ..\toDooList-v1-source.zip -Force"
```

Không nên nén các thư mục build/cache như `node_modules`, `dist`, `src-tauri\target`.

## Tính năng hiện tại

- Nhận diện file local, thư mục local và URL GitHub.
- Quét thư mục local từ backend Tauri.
- Hiển thị cây thư mục dự án.
- Sinh task nháp theo rule/template từ tín hiệu dự án.
- Chỉnh sửa, thêm và xóa task thủ công.
- Bấm vào task để xem hướng dẫn thực hiện, tiêu chí hoàn thành và chú thích.
- Đánh dấu task hoàn thành hoặc chưa hoàn thành.
- Ước lượng độ khó và thời gian thực hiện cho từng task.
- Lập kế hoạch task theo quỹ thời gian, ví dụ 3 giờ.
- Import task từ `.json`, `.xlsx` hoặc `.xls`.
- Export toàn bộ task ra `.json` hoặc `.xlsx`.
- Khi import rồi export lại, app tạo file cập nhật để tiếp tục theo dõi.
- Có cài đặt giao diện sáng/tối và ngôn ngữ Việt/Anh.

## Ghi chú

- Project dùng Yarn qua Corepack, không dùng `package-lock.json`.
- Không cần API key AI cho phiên bản hiện tại.
- Kết nối GitHub API và tạo GitHub Issue thật có thể được bổ sung ở giai đoạn sau.
