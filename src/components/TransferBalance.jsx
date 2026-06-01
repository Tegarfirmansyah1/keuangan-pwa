import { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db.js';

export default function TransferBalance({ onBack }) {
  const [amountInput, setAmountInput] = useState('');
  const [rawAmount, setRawAmount] = useState(0);
  const [fromWallet, setFromWallet] = useState('');
  const [toWallet, setToWallet] = useState('');
  const [note, setNote] = useState('');
  
  const getLocalDatetime = () => {
    const now = new Date();
    const tzOffset = now.getTimezoneOffset() * 60000;
    return new Date(now.getTime() - tzOffset).toISOString().slice(0, 16);
  };
  const [date, setDate] = useState(getLocalDatetime());

  const wallets = useLiveQuery(() => db.wallets.toArray()) || [];
  
  // 1. TAMBAHAN: Ambil semua transaksi untuk menghitung saldo saat ini
  const transactions = useLiveQuery(() => db.transactions.toArray()) || [];

  useEffect(() => {
    if (wallets?.length >= 2) {
      if (!fromWallet) setFromWallet(wallets[0].name);
      if (!toWallet) setToWallet(wallets[1].name); 
    } else if (wallets?.length === 1) {
      if (!fromWallet) setFromWallet(wallets[0].name);
      if (!toWallet) setToWallet(wallets[0].name);
    }
  }, [wallets, fromWallet, toWallet]);

  // 2. TAMBAHAN: Kalkulasi saldo dompet asal (fromWallet)
  const sourceIncome = transactions.filter(t => t.wallet === fromWallet && t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const sourceExpense = transactions.filter(t => t.wallet === fromWallet && t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  const sourceBalance = sourceIncome - sourceExpense;

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
    if (!rawAmount || !fromWallet || !toWallet) {
      alert("Harap lengkapi nominal dan pilih dompet!");
      return;
    }
    if (fromWallet === toWallet) {
      alert("Dompet asal dan tujuan tidak boleh sama!");
      return;
    }

    // 3. TAMBAHAN: Validasi pencegahan transfer jika saldo tidak cukup
    if (rawAmount > sourceBalance) {
      alert(`Gagal! Saldo ${fromWallet} Anda tidak mencukupi.\nSisa saldo saat ini: Rp ${new Intl.NumberFormat('id-ID').format(sourceBalance)}`);
      return;
    }

    try {
      const dateIso = new Date(date).toISOString();
      await db.transactions.bulkAdd([
        {
          type: 'expense',
          amount: rawAmount,
          category: 'Transfer Keluar',
          wallet: fromWallet,
          note: note || `Ke ${toWallet}`,
          date: dateIso
        },
        {
          type: 'income',
          amount: rawAmount,
          category: 'Transfer Masuk',
          wallet: toWallet,
          note: note || `Dari ${fromWallet}`,
          date: dateIso
        }
      ]);
      if (onBack) onBack(); 
    } catch (error) {
      alert("Terjadi kesalahan saat memproses transfer.");
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen text-slate-900 pb-8 flex flex-col max-w-md mx-auto shadow-xl font-sans relative">
      <header className="bg-gradient-to-br from-violet-600 via-purple-700 to-fuchsia-900 text-white pt-6 pb-14 px-6 rounded-b-3xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-white rounded-full -mr-20 -mt-20 opacity-10"></div>
        <div className="relative z-10 flex items-center justify-between">
          <button type="button" onClick={onBack} className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/30 transition-colors border border-white/30 cursor-pointer">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
          </button>
          <h1 className="flex-1 text-center text-xl font-bold">Transfer Saldo</h1>
          <div className="w-10"></div>
        </div>
      </header>

      <div className="px-6 -mt-8 relative z-10">
        <form onSubmit={handleSave} className="bg-white rounded-2xl shadow-md border border-slate-200 p-5 space-y-5">
          
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Nominal Transfer</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">Rp</span>
              <input type="text" inputMode="numeric" value={amountInput} onChange={handleAmountChange} placeholder="0" className="w-full bg-slate-50 border border-slate-200 text-2xl font-black rounded-xl py-3 pl-12 pr-4 outline-none focus:border-violet-500 text-violet-600 transition-colors" />
            </div>
          </div>

          <div className="flex items-start gap-2">
            <div className="flex-1">
              <label className="block text-[10px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Dari Dompet</label>
              <select value={fromWallet} onChange={(e) => setFromWallet(e.target.value)} className="w-full bg-slate-50 border border-slate-200 text-sm font-semibold rounded-xl p-3 outline-none focus:border-violet-500">
                {!wallets || wallets.length === 0 ? <option value="">Memuat...</option> : wallets.map(w => <option key={w.id} value={w.name}>{w.icon} {w.name}</option>)}
              </select>
              
              {/* 4. TAMBAHAN: Indikator UI Sisa Saldo Dompet Asal */}
              <p className={`text-[9px] mt-1.5 ml-1 font-bold tracking-wide ${rawAmount > sourceBalance ? 'text-rose-500' : 'text-slate-400'}`}>
                SISA: Rp {new Intl.NumberFormat('id-ID').format(sourceBalance)}
              </p>
            </div>
            
            <div className="mt-4 text-violet-500">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
            </div>

            <div className="flex-1">
              <label className="block text-[10px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Ke Dompet</label>
              <select value={toWallet} onChange={(e) => setToWallet(e.target.value)} className="w-full bg-slate-50 border border-slate-200 text-sm font-semibold rounded-xl p-3 outline-none focus:border-violet-500">
                {!wallets || wallets.length === 0 ? <option value="">Memuat...</option> : wallets.map(w => <option key={w.id} value={w.name}>{w.icon} {w.name}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Tanggal & Waktu</label>
            <input type="datetime-local" value={date} onChange={(e) => setDate(e.target.value)} className="w-full bg-slate-50 border border-slate-200 text-sm font-medium rounded-xl p-3 outline-none focus:border-violet-500" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Catatan</label>
            <input type="text" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Opsional..." className="w-full bg-slate-50 border border-slate-200 text-sm rounded-xl p-3 outline-none focus:border-violet-500" />
          </div>
          <button type="submit" className="w-full bg-violet-700 text-white font-bold text-sm py-4 rounded-xl shadow-md hover:bg-violet-800 active:bg-violet-900 transition-colors mt-2">
            Proses Transfer
          </button>
        </form>
      </div>
    </div>
  );
}