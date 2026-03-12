# Steam Motor App (Sistem Pencatatan Cuci Motor)

Sebuah aplikasi untuk mencatat transaksi harian, mengelola pelanggan (berdasarkan nomor polisi), dan melihat laporan pendapatan harian dari jasa cuci motor (Steam Motor).

## Teknologi
- **Backend:** Golang dengan framework Fiber
- **Database:** MySQL
- **Frontend:** HTML, CSS, JavaScript Vanilla

## Persyaratan
- [Go](https://go.dev/dl/) (versi 1.18+)
- MySQL Server berjalan di localhost port 3306

---

## Cara Menjalankan Project

### 1. Setup Database
1. Buka MySQL client Anda (misal phpMyAdmin, DBeaver, atau Command Line).
2. Jalankan isi file `database.sql`. Script ini akan otomatis:
   - Membuat database `steammotor_db`.
   - Membuat tabel `users` dan `transactions`.
   - Mengisi (insert) contoh data / sample data untuk admin dan beberapa transaksi.
3. Struktur contoh data yang ditambahkan:
   - **Admin Login:** `Username: admin` | `Password: admin123`
   - **Transaksi:** Terdapat 2 transaksi contoh.

*(Catatan: Konfigurasi default di `backend/database/database.go` menggunakan user `root` tanpa password di `127.0.0.1:3306`. Sesuaikan jika kredensial MySQL Anda berbeda).*

### 2. Jalankan Backend (Go)
1. Buka terminal/command prompt.
2. Masuk ke folder backend: `cd backend`
3. Download seluruh dependencies:
   ```bash
   go mod tidy
   ```
4. Jalankan server:
   ```bash
   go run main.go
   ```
5. Server akan berjalan di `http://localhost:8000`.

### 3. Jalankan Frontend
1. Buka folder `frontend`.
2. Anda bisa langsung membuka file `index.html` di browser Anda (klik dua kali filenya).
3. Namun sangat disarankan menggunakan ekstensi seperti **Live Server** (jika memakai VS Code) untuk menghindari block CORS yang lebih ketat di beberapa peramban modern.
4. Login menggunakan akun contoh:
   - **Username:** `admin`
   - **Password:** `admin123`

---

## Struktur Folder Project

```
project stim/
├── backend/                  # Folder Project Golang (Fiber)
│   ├── controllers/          # Logika Request & Respons API
│   ├── database/             # File koneksi MySQL GORM
│   ├── models/               # Definisi Tabel DB / Structs
│   ├── go.mod                # Daftar Package Go
│   └── main.go               # Entry point Server Fiber
│
├── frontend/                 # Folder Frontend Native
│   ├── css/
│   │   └── style.css         # Desain aesthetic dengan Vanilla CSS
│   ├── js/
│   │   └── app.js            # Interaksi Fetch API, format IDR, & Modal
│   ├── index.html            # Halaman Login
│   ├── dashboard.html        # Halaman Dashboard / Laporan
│   └── transactions.html     # Halaman CRUD Transaksi
│
├── database.sql              # Script SQL untuk Import Skema dan Sample Data
└── README.md                 # Dokumentasi Aplikasi
```

---

## Endpoint API

Server berjalan di basis url: `http://localhost:8000`

### Authentication (Admin)
- `POST /api/login`
  - **Body (JSON):** `{"username": "admin", "password": "password"}`
  - **Fungsi:** Mendapatkan JSON Web Token (JWT) untuk session login.

### Transaksi
- `GET /api/transactions`
  - **Query (opsional):** `?tanggal=YYYY-MM-DD` atau `?no_polisi=A123`
  - **Fungsi:** Mengambil data semua transaksi.
- `POST /api/transactions`
  - **Body (JSON):** `{"tanggal":"...", "no_polisi":"...", "jenis_kendaraan":"...", "harga":..., "petugas":"..."}`
  - **Fungsi:** Menambah data transaksi baru.
- `PUT /api/transactions/:id`
  - **Body (JSON):** Sama seperti POST.
  - **Fungsi:** Memperbarui data transaksi berdasarkan ID.
- `DELETE /api/transactions/:id`
  - **Fungsi:** Menghapus data transaksi.

### Reports
- `GET /api/reports`
  - **Query (opsional):** `?tanggal=YYYY-MM-DD` (Jika kosong, menghitung default sesuai konfigurasi, disini difilter hari itu jika parameter ada).
  - **Fungsi:** Mengembalikan metrik jumlah motor dicuci dan total pendapatan (`total_motor`, `total_income`).
