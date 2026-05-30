import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db.js';

export default function AddTransaction({ onBack }) {
  const [type, setType] = useState('expense');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  
  // State untuk pilihan aktif
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedWallet, setSelectedWallet] = useState(null);

  // Mengambil data kategori dan dompet dari Database Lokal
  const categories = useLiveQuery(() => db.categories.where('type').equals(type).toArray(), [type]);
  const wallets = useLiveQuery(() => db.wallets.toArray());

  const handleSave = async () => {
    if (!amount || !selectedCategory || !selectedWallet) {
      alert('Nominal, Kategori, dan Dompet harus diisi!');
      return;
    }

    // Simpan ke database lokal
    await db.transactions.add({
      type,
      amount: Number(amount),
      category: selectedCategory,
      wallet: selectedWallet,
      note,
      date: new Date().toISOString()
    });

    onBack(); // Kembali ke halaman utama setelah menyimpan
  };

  return (
    <div className="bg-[#f8f9fa] min-h-screen text-slate-900 pb-24 flex flex-col max-w-md mx-auto shadow-2xl">
      <header className="flex items-center p-6 bg-white">
        <button onClick={onBack} className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center text-slate-600">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
        </button>
        <h1 className="flex-1 text-center text-lg font-bold pr-10">Tambah Transaksi</h1>
      </header>

      <section className="bg-white px-6 pb-8 rounded-b-3xl text-center">
        <p className="text-sm text-slate-400 font-medium mb-4">Nominal (Rp)</p>
        <input 
          type="number" 
          placeholder="0"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="text-5xl font-black bg-transparent w-full text-center outline-none text-slate-800 placeholder:text-slate-300"
          autoFocus
        />
      </section>

      <section className="px-6 mt-6">
        <div className="flex bg-slate-200 p-1 rounded-full">
          <button onClick={() => setType('expense')} className={`flex-1 py-3 rounded-full text-sm font-bold ${type === 'expense' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'}`}>Pengeluaran</button>
          <button onClick={() => setType('income')} className={`flex-1 py-3 rounded-full text-sm font-bold ${type === 'income' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500'}`}>Pemasukan</button>
        </div>
      </section>

      <section className="px-6 mt-6 flex-1 overflow-y-auto">
        {/* Pilih Dompet */}
        <div className="mb-6">
          <label className="block text-sm font-bold text-slate-700 mb-2">Pilih Dompet</label>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {wallets?.map((w) => (
              <button 
                key={w.id} 
                onClick={() => setSelectedWallet(w.name)}
                className={`whitespace-nowrap px-4 py-2 rounded-full border text-sm font-medium transition-all ${selectedWallet === w.name ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-slate-200 bg-white text-slate-600'}`}
              >
                {w.icon} {w.name}
              </button>
            ))}
          </div>
        </div>

        {/* Pilih Kategori */}
        <div className="mb-6">
          <label className="block text-sm font-bold text-slate-700 mb-2">Kategori</label>
          <div className="grid grid-cols-4 gap-4 mt-3">
            {categories?.map((cat) => (
              <button key={cat.id} onClick={() => setSelectedCategory(cat.name)} className="flex flex-col items-center gap-2 group">
                <div className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl transition-all ${selectedCategory === cat.name ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white border border-slate-100 shadow-sm'}`}>
                  {cat.icon}
                </div>
                <span className={`text-xs font-medium ${selectedCategory === cat.name ? 'text-indigo-600' : 'text-slate-500'}`}>{cat.name}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-bold text-slate-700 mb-2">Catatan</label>
          <input type="text" placeholder="Cth: Makan siang bareng tim" value={note} onChange={(e) => setNote(e.target.value)} className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-4 text-sm outline-none focus:border-indigo-600 focus:ring-2" />
        </div>
      </section>

    <div className="mb-6">
      <div className="px-6 absolute  w-60 left-0 right-0 mx-auto">
        <button onClick={handleSave} className="w-full bg-indigo-600 text-white py-4 rounded-full font-bold text-lg shadow-lg active:scale-95 transition-transform">
          Simpan Transaksi
        </button>
      </div>
      </div>
    </div>
  );
}