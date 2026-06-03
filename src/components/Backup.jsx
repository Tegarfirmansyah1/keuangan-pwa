import { useRef } from 'react';
import { db } from '../db';

export default function Backup({ onBack }) {
  const fileInputRef = useRef(null);

  const handleBackup = async () => {
    try {
      // Mengambil semua data dari tabel yang ada di Dexie
      const transactions = await db.transactions.toArray();
      const wallets = await db.wallets.toArray(); // Opsional: jika ingin membackup dompet juga

      const backupData = {
        transactions,
        wallets,
        date: new Date().toISOString()
      };

      const dataStr = JSON.stringify(backupData);
      const blob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement("a");
      link.href = url;
      // Nama file dibuat dinamis berdasarkan tanggal hari itu
      link.download = `backup-keuangan-${new Date().toISOString().slice(0,10)}.json`;
      link.click();
      
      URL.revokeObjectURL(url);
      alert("Backup berhasil diunduh! Cek folder Download HP Anda.");
    } catch (error) {
      alert("Terjadi kesalahan saat membuat backup.");
      console.error(error);
    }
  };

  const handleRestore = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = JSON.parse(e.target.result);
        
        // Validasi sederhana memastikan file JSON benar
        if (!data.transactions) {
          throw new Error("Format file tidak sesuai");
        }

        // Konfirmasi ke user sebelum menimpa data
        const confirmRestore = window.confirm(
          "Peringatan: Proses ini akan menghapus data saat ini dan menggantinya dengan data dari file backup. Lanjutkan?"
        );

        if (confirmRestore) {
          // Bersihkan data lama, masukkan data baru
          await db.transactions.clear();
          await db.transactions.bulkAdd(data.transactions);
          
          if (data.wallets && data.wallets.length > 0) {
            await db.wallets.clear();
            await db.wallets.bulkAdd(data.wallets);
          }

          alert("Data berhasil dipulihkan!");
          window.history.back(); // Kembali ke home
          setTimeout(() => window.location.reload(), 100); // Refresh agar state React memuat ulang data baru
        }
      } catch (error) {
        alert("Gagal memulihkan data: File tidak valid atau korup.");
        console.error(error);
      }
    };
    
    reader.readAsText(file);
  };

  return (
    <div className="bg-gradient-to-b from-slate-100 to-slate-500 min-h-screen text-slate-900 pb-20 relative max-w-md mx-auto shadow-xl overflow-hidden font-sans">
      {/* HEADER Teks */}
      <header className="app-header text-white pt-6 pb-14 px-6 rounded-b-3xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-blue-500 rounded-full -mr-20 -mt-20 opacity-30"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-400 rounded-full -ml-16 -mb-16 opacity-20"></div>
        <div className="relative z-10 flex items-center justify-between">
          <button 
            type="button" 
            onClick={onBack} 
            className="w-6 h-6 mt-0.5 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/30 transition-colors border border-white/30 cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
            </svg>
          </button>
          <h1 className="flex-1 text-center text-xl font-bold">Backup Data</h1>
          <div className="w-10"></div>
        </div>
      </header>

      <section className="px-6 mt-8 flex flex-col gap-6">
        
        {/* KARTU BACKUP */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-2">Simpan Data (Backup)</h3>
          <p className="text-sm text-slate-500 mb-6">Unduh semua riwayat transaksi Anda ke dalam satu file di memori HP.</p>
          <button 
            onClick={handleBackup}
            className="w-full bg-blue-600 text-white font-bold mt-4 py-3 rounded-xl hover:bg-blue-700 active:scale-[0.98] transition-all shadow-md shadow-blue-200"
          >
            Mulai Backup Sekarang
          </button>
        </div>

        {/* KARTU RESTORE */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-2">Pulihkan Data (Restore)</h3>
          <p className="text-sm text-slate-500 mb-6">Kembalikan data transaksi dari file backup yang pernah Anda unduh.</p>
          
          <input 
            type="file" 
            accept=".json" 
            ref={fileInputRef}
            onChange={handleRestore}
            className="hidden" 
          />
          <button 
            onClick={() => fileInputRef.current.click()}
            className="w-full bg-emerald-500 text-white font-bold mt-4 py-3 rounded-xl hover:bg-emerald-600 active:scale-[0.98] transition-all shadow-md shadow-emerald-200"
          >
            Pilih File Backup
          </button>
        </div>

      </section>
    </div>
  );
}