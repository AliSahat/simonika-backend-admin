# System Prompt: Refactor Desain UI/UX — Dark Glassmorphism Bento Dashboard

> **INSTRUKSI UTAMA & BATASAN KETAT (WAJIB DIPATUHI):**
> Tugas kamu **HANYA** merombak tampilan visual (**UI/UX, CSS/Tailwind, layout container, dan styling komponen**) pada kode yang diberikan agar mengikuti desain referensi **Dark Glassmorphism Bento Dashboard** di bawah ini. **JANGAN** mengotak-atik logika atau fungsi apa pun.

## 1. Aturan Mutlak Pelestarian Logic (Zero Logic Modification)

* **Dilarang Mengubah Business Logic:** Jangan mengubah perhitungan data, fungsi helper, algoritma, atau alur kerja aplikasi yang sudah berjalan.
* **Dilarang Mengubah Event Handlers:** Pertahankan seluruh atribut interaktif seperti `onClick`, `onChange`, `onSubmit`, `onKeyDown`, dan pemanggilan fungsi di dalamnya.
* **Dilarang Mengubah State & Props:** Jangan memodifikasi `useState`, `useEffect`, `useMemo`, `useCallback`, Redux/Zustand store, Context API, custom hooks, ataupun struktur `props`.
* **Dilarang Mengubah Data & Routing:** Jangan mengubah pemanggilan API (`fetch`/`axios`), query database, struktur objek/array, nama variabel, kondisi rendering (`if/else`, ternary, `.map()`), maupun sistem navigasi/routing.
* **Hanya Ubah Layer Presentasi:** Pertahankan seluruh elemen fungsional (input, tombol, tabel, daftar, grafik, filter) yang sudah ada, dan hanya perbarui struktur pembungkus visual (`div`/`section`), `className` (Tailwind/CSS), dan properti styling.

## 2. Sistem Warna & Token Visual (Design Tokens)

| Kategori Elemen | Token / Nilai CSS | Keterangan Penggunaan |
| :--- | :--- | :--- |
| **Base Background** | `#060911` – `#080C14` | Warna dasar layar utama (Obsidian / Midnight Navy) |
| **Ambient Orb — Amber** | `#F59E0B` / `#D97706` (Opacity `35%`, `blur(90px)`) | Cahaya dekoratif latar belakang di sudut kanan atas |
| **Ambient Orb — Blue** | `#1D4ED8` / `#2563EB` (Opacity `30%`, `blur(100px)`) | Cahaya dekoratif latar belakang di sisi kiri bawah sidebar |
| **Ambient Orb — Emerald** | `#10B981` (Opacity `25%`, `blur(90px)`) | Cahaya dekoratif latar belakang di bagian tengah bawah |
| **Ambient Orb — Cyan** | `#06B6D4` (Opacity `30%`, `blur(90px)`) | Cahaya dekoratif latar belakang di sudut kanan bawah |
| **Glass Card Surface** | `rgba(18, 24, 38, 0.68)` – `rgba(24, 31, 48, 0.74)` | Permukaan kartu utama dan sidebar dengan `backdrop-filter: blur(24px) saturate(160%)` |
| **Card Border** | `1px solid rgba(255, 255, 255, 0.08)` | Garis tepi kartu kaca dengan highlight atas `rgba(255, 255, 255, 0.14)` |
| **Primary Accent** | `#2563EB` – `#3B82F6` | Menu aktif, tombol utama (`+ Create`), garis grafik utama, dan progress utama |
| **Positive / Live Accent** | `#10B981` (Teks badge: `#34D399`, Bg: `rgba(16, 185, 129, 0.14)`) | Indikator live, toggle aktif, badge tren naik (`+18%`), dan status sehat |
| **Warning Accent** | `#F59E0B` | Indikator stok menipis dan segmen bar sekunder |
| **Negative Accent** | `#EF4444` (Teks badge: `#F87171`, Bg: `rgba(239, 68, 68, 0.14)`) | Indikator tren turun (`-14%`) |
| **Text Primary** | `#F8FAFC` | Judul halaman, angka KPI utama, nilai metrik, dan teks aktif |
| **Text Secondary** | `#94A3B8` | Subjudul, item navigasi tidak aktif, dan label informasi |
| **Text Muted** | `#64748B` | Header grup sidebar (`SHOP`, `MONEY`, `TALK`), label sumbu grafik, dan teks bantu |

## 3. Arsitektur Layout & Struktur Komponen

### A. Latar Belakang Ambient (Layer `z-0`)
* Gunakan kontainer utama `min-h-screen bg-[#060911] text-[#F8FAFC] relative overflow-hidden`.
* Tempatkan elemen-elemen lingkaran cahaya (*ambient glowing orbs*) dengan `position: fixed` atau `absolute`, `pointer-events: none`, dan `z-0` di belakang layout utama agar warna gradasinya menembus kartu kaca (*frosted glass*) secara halus.

### B. Floating Sidebar Kiri (`240px` – `260px`)
* **Kontainer Sidebar:** Panel kaca mengambang (`rounded-3xl`, margin luar `16px`, `backdrop-blur-xl`, border `1px solid rgba(255,255,255,0.08)`), tidak menempel kaku ke tepi layar.
* **Header Brand:** Ikon aplikasi kotak membulat berwarna biru cerah di kiri, nama brand tebal (`15px`, `#F8FAFC`) beserta subjudul tipis (`12px`, `#94A3B8`), dan tombol ikon collapse di kanan.
* **Search Input:** Kotak pencarian bergaya kapsul/rounded (`rounded-xl`, `bg-white/[0.04]`, border `border-white/[0.08]`) dengan ikon kaca pembesar di kiri dan badge shortcut `⌘K` di kanan.
* **Grup Navigasi:**
  * Label kategori menggunakan huruf kapital kecil (`10px`, `tracking-wider`, `font-semibold`, `#64748B`).
  * **Item Aktif:** Bentuk pill penuh (`rounded-xl`), background gradasi biru elektrik (`linear-gradient(90deg, #2563EB, #1D8CF8)`), teks putih tebal, dan bayangan biru lembut (`0 4px 14px rgba(37, 99, 235, 0.35)`).
  * **Item Tidak Aktif:** Teks `#94A3B8`, ikon senada, efek hover `hover:bg-white/[0.05] hover:text-white`, serta badge angka notifikasi bulat biru gelap di sisi kanan jika ada counter.
* **Footer Sidebar:**
  * Baris toggle **Dark mode** dengan switch pill berwarna hijau emerald (`#10B981`) saat aktif.
  * Kartu profil pengguna di bagian paling bawah berbentuk kapsul membulat (`rounded-2xl`, `bg-white/[0.05]`, border tipis) berisi avatar bulat, nama, email, dan ikon panah atas-bawah.

### C. Header Atas (Top Bar)
* **Sisi Kiri:** Judul sapaan utama berukuran `22px–24px` (`font-semibold`, `#F8FAFC`), diikuti baris subjudul di bawahnya yang memuat titik hijau menyala (`w-2 h-2 rounded-full bg-[#10B981] shadow-[0_0_8px_#10B981]`) serta informasi hari/tanggal dan nama halaman.
* **Sisi Kanan:** Deretan tombol ikon bulat bergaya kaca (`w-10 h-10 rounded-full bg-white/[0.06] border border-white/[0.08]`) untuk pencarian dan notifikasi (dengan badge angka biru di sudut kanan atas), didampingi tombol aksi utama (`+ Create`) berbentuk pill biru solid (`rounded-full bg-[#2563EB] hover:bg-[#1D4ED8] text-white px-4 py-2 font-medium shadow-lg shadow-blue-600/30`).

### D. Bento Grid Utama (Konten Dashboard)
* Gunakan sistem CSS Grid responsif dengan jarak antar kartu `16px–20px` (`gap-4` atau `gap-5`) dan sudut kartu `rounded-2xl` atau `rounded-3xl` (`20px–24px`).
* **Kartu Utama (Hero Analytics Card — Span 2 Kolom Kiri/Tengah):**
  * **Baris KPI Atas (3 Kolom):** Dipisahkan oleh garis vertikal tipis (`border-r border-white/[0.06]`) dan garis horizontal bawah (`border-b border-white/[0.06]`). Setiap kolom menampilkan label metrik (`12px`, `#94A3B8`), angka utama besar (`28px–32px`, `font-bold`, `tabular-nums`, `#F8FAFC`), pill persentase perubahan (`+18%` / `+5.9%` dengan background hijau transparan `rgba(16,185,129,0.14)` dan teks `#34D399`), teks pembanding waktu, serta mini sparkline biru pada kolom ketiga.
  * **Area Grafik Utama ("Sales pulse"):**
    * Header grafik memuat judul, subjudul ringkasan dengan highlight warna pada persentase perubahan, tombol filter pill biru (`Previous`), dan *segmented control* rentang waktu (`7d`, `14d`, `30d`, `1y`) di dalam track kapsul gelap (`bg-white/[0.05] rounded-full p-1`).
    * Visualisasi grafik menggunakan kurva halus (*smooth spline*) biru elektrik (`#3B82F6`) dengan *area gradient fill* biru transparan di bawahnya (`rgba(37, 99, 235, 0.25)` ke `0`), garis pembanding putus-putus abu-abu (`rgba(148, 163, 184, 0.35)`), serta garis grid horizontal tipis (`rgba(255, 255, 255, 0.05)`).
* **Kolom Kartu Kanan (Stacked Cards):**
  * **Kartu Target / Goal (Kanan Atas):** Menampilkan judul, sisa hari, tombol ikon edit bulat kecil, indikator *circular progress ring* (track gelap dengan busur biru elektrik dan titik biru menyala di ujungnya, persentase di tengah), serta daftar metrik ringkas (3 baris label kiri & nilai nominal kanan) di sebelahnya.
  * **Kartu Status Realtime ("Live store" — Kanan Tengah):** Header dengan titik hijau menyala dan tautan biru di kanan, angka pengunjung besar (`36px–40px`, `font-bold`), deretan bar vertikal mini (*equalizer style*) berwarna gradasi biru, 3 baris metrik dengan pembatas garis tipis, serta pill status hijau (`• Checkout healthy`) di bagian bawah.
  * **Kartu Distribusi Kanal (Kanan Bawah):** Judul dan total nilai, diikuti *stacked horizontal progress bar* multi-warna (biru, kuning amber, hijau, abu-abu slate) dan daftar rincian kanal dengan titik warna, nama kanal, persentase, serta nominal di sisi kanan.
* **Baris Kartu Bawah (Daftar Antrean & Inventaris):**
  * Menampilkan judul kartu, subjudul status di kiri, dan tautan aksi biru di kanan atas.
  * Setiap baris item tersusun rapi secara horizontal: avatar/ikon bulat di kiri, nama utama & detail sekunder di tengah, nilai atau mini progress bar di kanan tengah, serta tombol aksi sekunder berbentuk pill kaca (`rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.1] text-xs text-white px-3.5 py-1.5`) di sisi paling kanan.

## 4. Tipografi & Micro-Interactions

* Gunakan font sans-serif modern seperti **Inter**, **Plus Jakarta Sans**, atau **Geist Sans** dengan properti `font-variant-numeric: tabular-nums` pada seluruh angka dan metrik agar sejajar rapi.
* Berikan transisi halus (`transition-all duration-200`) pada semua tombol, item navigasi, dan kartu kaca (efek hover meningkatkan terangnya border menjadi `rgba(255, 255, 255, 0.16)`).
* Pastikan kontras teks tetap tajam dan mudah dibaca di atas permukaan kaca gelap, serta jaga konsistensi *padding* internal kartu (`20px` hingga `24px`).
