import { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db.js';

export default function AddTransaction({ onBack }) {
  const [type, setType] = useState('expense');
  const [amountInput, setAmountInput] = useState('');
  const [rawAmount, setRawAmount] = useState(0);
  const [category, setCategory] = useState('');
  const [wallet, setWallet] = useState('');
  const [note, setNote] = useState('');
  const [isWalletOpen, setIsWalletOpen] = useState(false);
  
  const getLocalDatetime = () => {
    const now = new Date();
    const tzOffset = now.getTimezoneOffset() * 60000;
    return new Date(now.getTime() - tzOffset).toISOString().slice(0, 16);
  };
  const [date, setDate] = useState(getLocalDatetime());

  // AMAN: Pastikan selalu menjadi array
  const categories = useLiveQuery(() => db.categories.filter(c => c.type === type).toArray(), [type]) || [];
  const wallets = useLiveQuery(() => db.wallets.toArray()) || [];

  useEffect(() => {
    if (categories.length > 0) {
      const isCategoryValid = categories.some(c => c.name === category);
      if (!category || !isCategoryValid) setCategory(categories[0].name);
    }
  }, [categories, category]);

  useEffect(() => {
    if (wallets.length > 0 && !wallet) setWallet(wallets[0].name);
  }, [wallets, wallet]);

  const handleAmountChange = (e) => {
    const numericValue = e.target.value.replace(/\D/g, '');
    if (!numericValue) {
      setAmountInput('');
      setRawAmount(0);
      return;
    }
    const number = parseInt(numericValue, 10);
    setRawAmount(number);
    setAmountInput(new Intl.NumberFormat('id-ID').format(number));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!rawAmount || !category || !wallet) {
      alert("Harap lengkapi nominal, kategori, dan dompet!");
      return;
    }
    try {
      await db.transactions.add({
        type, amount: rawAmount, category, wallet, note, date: new Date(date).toISOString() 
      });
      if (onBack) onBack(); 
    } catch (error) {
      // handle the error
      console.error(error);
      // or display an error message to the user
      alert("Terjadi kesalahan saat menyimpan data.");
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen text-slate-900 pb-8 flex flex-col max-w-md mx-auto shadow-xl font-sans relative">
      <header className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white pt-6 pb-14 px-6 rounded-b-3xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-blue-500 rounded-full -mr-20 -mt-20 opacity-30"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-400 rounded-full -ml-16 -mb-16 opacity-20"></div>
        <div className="relative z-10 flex items-center justify-between">
          <button type="button" onClick={onBack} className="w-6 h-6 mt-2 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/30 transition-colors border border-white/30 cursor-pointer">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
          </button>
          <h1 className="flex-1 text-center text-xl font-bold">Tambah Transaksi</h1>
          <div className="w-10"></div>
        </div>
      </header>

      <div className="px-6 -mt-8 relative z-10">
        <form onSubmit={handleSave} className="bg-white rounded-2xl shadow-md border border-slate-200 p-5 space-y-5">
          <div className="flex bg-slate-100 p-1.5 rounded-xl">
            <button type="button" onClick={() => setType('expense')} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${type === 'expense' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Pengeluaran</button>
            <button type="button" onClick={() => setType('income')} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${type === 'income' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Pemasukan</button>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Nominal (Rp)</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">Rp</span>
              <input type="text" inputMode="numeric" value={amountInput} onChange={handleAmountChange} placeholder="0" className={`w-full bg-slate-50 border border-slate-200 text-2xl font-black rounded-xl py-3 pl-12 pr-4 outline-none focus:border-blue-500 transition-colors ${type === 'expense' ? 'text-rose-600' : 'text-emerald-600'}`} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Kategori</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full bg-slate-50 border border-slate-200 text-sm font-semibold rounded-xl p-3 outline-none focus:border-blue-500">
                {/* PERBAIKAN: Gunakan kondisi !categories (jika null/undefined) agar tidak error saat dilooping */}
                {!categories || categories.length === 0 ? <option value="">Memuat...</option> : categories.map(c => <option key={c.id} value={c.name}>{c.icon} {c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Dompet</label>
              <div className="relative w-full">
                  {/* Tombol yang terlihat (Trigger) */}
                  <button
                    type="button"
                    onClick={() => setIsWalletOpen(!isWalletOpen)}
                    className="w-full bg-slate-50 border border-slate-200 text-sm font-semibold rounded-xl p-3 flex justify-between items-center outline-none focus:border-blue-500"
                  >
                    <div className="flex items-center gap-2">
                      {wallet ? (
                        <>
                          {/* Mencari data dompet yang sedang dipilih untuk menampilkan ikonnya di tombol */}
                          {(() => {
                            const selectedW = wallets.find((w) => w.name === wallet);
                            if (!selectedW) return wallet;
                            return (
                              <>
                                {selectedW.icon.includes('/') || selectedW.icon.startsWith('data:') ? (
                                  <img src={selectedW.icon} alt={selectedW.name} className="w-4 h-4 object-contain" />
                                ) : (
                                  <span className="text-lg">{selectedW.icon}</span>
                                )}
                                <span>{selectedW.name}</span>
                              </>
                            );
                          })()}
                        </>
                      ) : (
                        <span className="text-slate-400">Pilih Dompet...</span>
                      )}
                    </div>
                    {/* Ikon panah bawah kecil */}
                    <span className="text-xs text-slate-400">▼</span>
                  </button>

                  {/* Daftar Pilihan yang Muncul Saat Diklik (Menu) */}
                  {isWalletOpen && (
                    <ul className="absolute z-10 w-full mt-2 bg-white border border-slate-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                      {!wallets || wallets.length === 0 ? (
                        <li className="p-3 text-sm text-slate-500 text-center">Memuat...</li>
                      ) : (
                        wallets.map((w) => (
                          <li
                            key={w.id}
                            onClick={() => {
                              setWallet(w.name);       // Simpan pilihan
                              setIsWalletOpen(false);  // Tutup dropdown
                            }}
                            className="flex items-center gap-2 p-3 text-sm font-semibold cursor-pointer hover:bg-slate-50 border-b border-slate-50 last:border-0"
                          >
                            {w.icon.includes('/') || w.icon.startsWith('data:') ? (
                              <img src={w.icon} alt={w.name} className="w-4 h-4 object-contain" />
                            ) : (
                              <span className="text-lg">{w.icon}</span>
                            )}
                            {w.name}
                          </li>
                        ))
                      )}
                    </ul>
                  )}
                </div>
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Tanggal & Waktu</label>
            <input type="datetime-local" value={date} onChange={(e) => setDate(e.target.value)} className="w-full bg-slate-50 border border-slate-200 text-sm font-medium rounded-xl p-3 outline-none focus:border-blue-500" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Catatan</label>
            <input type="text" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Opsional..." className="w-full bg-slate-50 border border-slate-200 text-sm rounded-xl p-3 outline-none focus:border-blue-500" />
          </div>
          <button type="submit" className="w-full bg-slate-800 text-white font-bold text-sm py-4 rounded-xl shadow-md hover:bg-slate-700 active:bg-slate-900 transition-colors mt-2">
            Simpan Transaksi
          </button>
        </form>
      </div>
    </div>
  );
}