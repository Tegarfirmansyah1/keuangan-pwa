import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db.js';

export default function Budget({ onBack }) {
  const [selectedCat, setSelectedCat] = useState(null);
  const [amountInput, setAmountInput] = useState('');
  const [rawAmount, setRawAmount] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Ambil data (Aman dengan || [])
  const categories = useLiveQuery(() => db.categories.filter(c => c.type === 'expense').toArray()) || [];
  const budgets = useLiveQuery(() => db.budgets.toArray()) || [];
  const transactions = useLiveQuery(() => db.transactions.filter(t => t.type === 'expense').toArray()) || [];

  const formatIDR = (number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number || 0);

  // Filter transaksi HANYA untuk bulan ini
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const thisMonthTx = transactions.filter(t => {
    const d = new Date(t.date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  // Hitung total pengeluaran per kategori
  const spentByCat = {};
  thisMonthTx.forEach(t => {
    if (!spentByCat[t.category]) spentByCat[t.category] = 0;
    spentByCat[t.category] += t.amount;
  });

  // Buka Modal Edit Budget
  const openBudgetModal = (catName) => {
    const existingBudget = budgets.find(b => b.category === catName);
    setSelectedCat(catName);
    if (existingBudget) {
      setRawAmount(existingBudget.amount);
      setAmountInput(new Intl.NumberFormat('id-ID').format(existingBudget.amount));
    } else {
      setRawAmount(0);
      setAmountInput('');
    }
    setIsModalOpen(true);
  };

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

  // Simpan Anggaran
  const handleSaveBudget = async (e) => {
    e.preventDefault();
    if (!selectedCat) return;

    const existingBudget = budgets.find(b => b.category === selectedCat);
    
    if (rawAmount === 0 && existingBudget) {
      // Jika diisi 0, hapus anggarannya
      await db.budgets.delete(existingBudget.id);
    } else if (existingBudget) {
      // Update
      await db.budgets.put({ ...existingBudget, amount: rawAmount });
    } else if (rawAmount > 0) {
      // Buat baru
      await db.budgets.add({ category: selectedCat, amount: rawAmount });
    }
    
    setIsModalOpen(false);
  };

  return (
    <div className="bg-slate-50 min-h-screen text-slate-900 pb-8 flex flex-col max-w-md mx-auto shadow-xl relative">
      {/* HEADER */}
      <header className="bg-gradient-to-br from-blue-600 via-blue-600 to-blue-900 text-white pt-6 pb-14 px-6 rounded-b-3xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-white rounded-full -mr-20 -mt-20 opacity-10"></div>
        <div className="relative z-10 flex items-center justify-between">
          <button onClick={onBack} className="w-6 h-6 mt-1 mr-4 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/30 transition-colors border border-white/30 cursor-pointer">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
          </button>
          <h1 className="flex-1 text-center text-xl font-bold">Anggaran Bulan Ini</h1>
          <div className="w-10"></div>
        </div>
      </header>

      {/* DAFTAR KATEGORI & PROGRESS */}
      <div className="px-6 -mt-8 relative z-10 space-y-4">
        {categories.map(cat => {
          const budget = budgets.find(b => b.category === cat.name);
          const limit = budget ? budget.amount : 0;
          const spent = spentByCat[cat.name] || 0;
          
          let percentage = limit > 0 ? (spent / limit) * 100 : 0;
          if (percentage > 100) percentage = 100; // Maksimal bar 100%

          // Warna bar berdasarkan persentase pengeluaran
          let barColor = "bg-emerald-500";
          if (percentage > 75) barColor = "bg-amber-400"; // Kuning peringatan
          if (percentage >= 100) barColor = "bg-rose-500"; // Merah over-budget

          return (
            <div 
              key={cat.id} 
              onClick={() => openBudgetModal(cat.name)}
              className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 cursor-pointer hover:shadow-md transition-all active:bg-slate-50"
            >
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{cat.icon}</span>
                  <h3 className="font-bold text-slate-800 text-sm">{cat.name}</h3>
                </div>
                {limit > 0 ? (
                  <p className="text-xs font-semibold text-slate-500">
                    Sisa: <span className={spent > limit ? "text-rose-600" : "text-emerald-600"}>
                      {formatIDR(limit - spent)}
                    </span>
                  </p>
                ) : (
                  <p className="text-[10px] text-slate-400 font-medium bg-slate-100 px-2 py-1 rounded-md">Belum diatur</p>
                )}
              </div>

              {limit > 0 && (
                <>
                  <div className="w-full bg-slate-100 rounded-full h-2.5 mb-1.5 overflow-hidden">
                    <div className={`${barColor} h-2.5 rounded-full transition-all duration-500`} style={{ width: `${percentage}%` }}></div>
                  </div>
                  <div className="flex justify-between text-[10px] font-bold text-slate-400">
                    <span>Terpakai {formatIDR(spent)}</span>
                    <span>Limit {formatIDR(limit)}</span>
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* MODAL SETTING BUDGET */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl animate-fade-in-up">
            <h3 className="text-lg font-bold text-slate-900 mb-1">Set Anggaran {selectedCat}</h3>
            <p className="text-xs text-slate-500 mb-5">Atur batas maksimal pengeluaran bulan ini (Biarkan 0 untuk menghapus).</p>
            
            <form onSubmit={handleSaveBudget}>
              <div className="relative mb-6">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">Rp</span>
                <input 
                  type="text" 
                  inputMode="numeric"
                  value={amountInput}
                  onChange={handleAmountChange}
                  placeholder="0"
                  className="w-full bg-slate-50 border border-slate-200 text-2xl font-black rounded-xl py-3 pl-12 pr-4 outline-none focus:border-emerald-500 text-emerald-600"
                  autoFocus
                />
              </div>
              <div className="flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 bg-slate-100 text-slate-600 font-bold text-sm py-3.5 rounded-xl hover:bg-slate-200 transition-colors"
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  className="flex-1 bg-emerald-600 text-white font-bold text-sm py-3.5 rounded-xl shadow-md hover:bg-emerald-700 transition-colors"
                >
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* CSS Animasi Sederhana untuk Modal */}
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          animation: fadeInUp 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
}