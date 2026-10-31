This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/pages/api-reference/create-next-app).

## Google Login (Web & Mobile Flutter)

Tambahkan environment variable berikut pada `.env.local`:

```env
MONGODB_URI=...
JWT_SECRET=...
GOOGLE_CLIENT_ID=...apps.googleusercontent.com
NEXT_PUBLIC_GOOGLE_CLIENT_ID=...apps.googleusercontent.com
GOOGLE_ANDROID_CLIENT_ID=...apps.googleusercontent.com
GOOGLE_IOS_CLIENT_ID=...apps.googleusercontent.com
```

Client (Web maupun aplikasi Mobile Flutter) mengirim Google ID token ke endpoint berikut:

```http
POST /api/auth/google
Content-Type: application/json

{"idToken":"<google-id-token>"}
```

Backend memverifikasi token dan audience ke Google (mendukung Client ID Web, Android, dan iOS sekaligus), membuat atau menautkan user jika belum ada, lalu mengembalikan JWT aplikasi yang sama dengan login username/password.

👉 **Panduan lengkap integrasi ke Mobile Flutter:** Lihat [docs/GOOGLE_OAUTH_FLUTTER.md](docs/GOOGLE_OAUTH_FLUTTER.md).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `pages/index.tsx`. The page auto-updates as you edit the file.

[API routes](https://nextjs.org/docs/pages/building-your-application/routing/api-routes) can be accessed on [http://localhost:3000/api/hello](http://localhost:3000/api/hello). This endpoint can be edited in `pages/api/hello.ts`.

The `pages/api` directory is mapped to `/api/*`. Files in this directory are treated as [API routes](https://nextjs.org/docs/pages/building-your-application/routing/api-routes) instead of React pages.

This project uses [`next/font`](https://nextjs.org/docs/pages/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn-pages-router) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/pages/building-your-application/deploying) for more details.
# Catatan backend MQTT SIMONIKA

Backend berlangganan ke `devices/+/data` dan menerbitkan konfigurasi ke
`devices/{serial}/command`. Kredensial broker hanya disimpan pada environment
server. Broker harus menerapkan ACL agar tiap perangkat hanya dapat publish dan
subscribe pada topic serialnya sendiri.

Subscriber MQTT yang dimulai dari API route Next.js tidak dijamin hidup 24/7 pada
platform serverless seperti Vercel. Untuk penerimaan telemetry produksi yang
andal, jalankan modul subscriber sebagai worker/service always-on. Perubahan
deployment tersebut tidak termasuk dalam pekerjaan ini.

## Migrasi data lama

Dokumen Pool lama (`keranTutup`, `keranNormal`, `keranBuka`) tidak dipetakan
otomatis karena tidak memiliki `jarakSensorDasar` dan `batasBuangMulai`, serta
makna field lama tidak cukup pasti. Isi keenam field konfigurasi baru dan
`modeAuto` setelah verifikasi per wadah, lalu hapus field lama dalam migrasi
terkontrol. Sebelum membuat index unik `unique_device_serial`, audit dan
selesaikan serial kosong/duplikat.

Telemetry baru menyimpan `poolId` dan `userId`. Riwayat lama yang hanya memiliki
`serial` tidak ditampilkan oleh API sampai dimigrasikan berdasarkan bukti
kepemilikan pada waktu telemetry dibuat; jangan mengaitkannya otomatis jika
serial pernah berpindah pemilik.
