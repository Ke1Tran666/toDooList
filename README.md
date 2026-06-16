# toDooList

Ứng dụng desktop giúp phân tích dự án từ đường dẫn local hoặc URL GitHub, sau đó tạo danh sách task để theo dõi công việc. App hỗ trợ import/export task bằng JSON/XLSX, lập kế hoạch theo quỹ thời gian và đánh dấu task hoàn thành/chưa hoàn thành.

## Tác giả

KeiTran666

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

## Cài đặt dự án

Mở PowerShell tại thư mục dự án:

```powershell
cd D:\job\Project\toDooList
corepack enable
corepack yarn install
```

## Chạy khi phát triển

```powershell
corepack yarn tauri dev
```

Nếu chỉ muốn chạy giao diện web bằng Vite:

```powershell
corepack yarn dev
```

## Build

Build phần frontend:

```powershell
corepack yarn build
```

Build ứng dụng desktop Tauri:

```powershell
corepack yarn tauri build
```

Sau khi build Tauri, file cài đặt thường nằm trong:

```text
src-tauri\target\release\bundle
```

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

## Tải source code từ GitHub

Có 2 cách tải source:

### Cách 1: Clone bằng Git

```powershell
git clone <github-repository-url>
cd toDooList
corepack yarn install
```

### Cách 2: Tải file nén ZIP

Trên GitHub:

1. Mở repository.
2. Bấm nút **Code**.
3. Chọn **Download ZIP**.
4. Giải nén file vừa tải.
5. Mở PowerShell trong thư mục đã giải nén.
6. Chạy:

```powershell
corepack enable
corepack yarn install
corepack yarn tauri dev
```

## Tạo file nén để chia sẻ

Không nên nén các thư mục build/cache như `node_modules`, `dist`, `src-tauri\target`.

Ví dụ tạo file nén source:

```powershell
Compress-Archive -Path .\* -DestinationPath ..\toDooList-source.zip -Force
```

Nếu muốn file nén nhẹ hơn, hãy loại trừ các thư mục nặng trước khi nén hoặc dùng script đóng gói riêng.

## Ghi chú

- Project dùng Yarn qua Corepack, không dùng `package-lock.json`.
- Không cần API key AI cho phiên bản hiện tại.
- Kết nối GitHub API và tạo GitHub Issue thật có thể được bổ sung ở giai đoạn sau.
