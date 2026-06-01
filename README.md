# KAS - Keuangan PWA 💰

Aplikasi pencatatan keuangan pribadi berbasis Progressive Web App (PWA) yang dirancang agar pintar, aman, dan mudah digunakan. Dibangun menggunakan ekosistem *modern web* (React & Vite), aplikasi KAS mengadopsi pendekatan *local-first*, sehingga semua data finansial Anda tersimpan secara mandiri dan tetap dapat diakses dengan lancar meskipun dalam keadaan *offline*.

## 🚀 Fitur Utama

- **Dasbor KAS (Balance Card):** Pantau total saldo secara *real-time* dengan antarmuka yang bersih, futuristik, dan minimalis.
- **Pencatatan Transaksi:** Modul form khusus (`TransactionForm` & `AddTransaction`) untuk memasukkan data arus kas harian Anda.
- **Riwayat Terperinci:** Tinjau seluruh aktivitas keluar masuk dana melalui `TransactionHistory`.
- **Dukungan PWA (Progressive Web App):** Dapat diinstal di perangkat *mobile* maupun *desktop*, memberikan pengalaman layaknya aplikasi *native*.
- **Penyimpanan Data Aman:** Memanfaatkan IndexedDB (`db.js`) untuk menyimpan semua riwayat transaksi secara lokal di *browser*. Privasi data terjamin secara penuh tanpa ketergantungan pada *cloud database* pihak ketiga.

## 🛠️ Teknologi & Arsitektur

KAS dibangun dengan struktur modular berbasis komponen:
- **Framework & Build Tool:** React.js + Vite
- **State Management & Logic:** Custom Hooks (`useTransactions.js`)
- **Penyimpanan Lokal:** `db.js` (IndexedDB / Dexie.js)
- **Linting & Code Quality:** ESLint (`eslint.config.js`)

## 📂 Struktur Proyek

```text
keuangan-pwa/
├── public/
│   ├── favicon.svg
│   └── icons.svg
├── src/
│   ├── assets/
│   │   ├── hero.png
│   │   ├── react.svg
│   │   └── vite.svg
│   ├── components/
│   │   ├── AddTransaction.jsx
│   │   ├── TransactionForm.jsx
│   │   ├── TransactionHistory.jsx
│   │   └── balanceCard.jsx
│   ├── hooks/
│   │   └── useTransactions.js
│   ├── App.jsx
│   ├── App.css
│   ├── index.css
│   ├── main.jsx
│   └── db.js
├── .gitignore
├── eslint.config.js
├── index.html
├── package.json
└── vite.config.js
```

## 💻 Panduan Instalasi & Pengembangan Lokal

Karena KAS dikembangkan untuk berjalan secara optimal di lingkungan lokal, Anda tidak perlu menyiapkan *database server*.

1. **Kloning Repositori**
   ```bash
   git clone <url-repositori-anda>
   cd keuangan-pwa
   ```

2. **Instalasi Dependensi**
   Pastikan Node.js sudah terinstal, lalu jalankan:
   ```bash
   npm install
   ```

3. **Menjalankan Development Server**
   ```bash
   npm run dev
   ```
   Buka *browser* pada alamat `http://localhost:5173` untuk melihat aplikasi.

4. **Build untuk Produksi**
   ```bash
   npm run build
   ```

## 🌐 Panduan Deployment

Aplikasi statis modern seperti ini dirancang untuk di-deploy secara *serverless*. 

**Deployment melalui Vercel:**
1. *Push* kode *source* Anda ke repositori GitHub.
2. Impor repositori tersebut ke dalam Vercel. Pengaturan Vite akan terdeteksi secara otomatis.
3. Klik **Deploy**.
4. Setelah proses selesai, integrasikan identitas KAS dengan memetakan aplikasi ke *subdomain* kustom (misalnya: `kas.tegarfirmansyah.my.id` atau `keuangan.tegarfirmansyah.my.id`) melalui menu *Settings > Domains*, lalu tambahkan *record* DNS yang sesuai.

---
*KAS - Pintar, Aman, dan Modern.*