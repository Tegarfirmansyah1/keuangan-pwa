import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db.js';

export default function TransactionHistory({ onBack }) {
  const [filterType, setFilterType] = useState('all');
  const [sortBy, setSortBy] = useState('newest');

  // Mengambil semua transaksi dari database
  const transactions = useLiveQuery(() => db.transactions.orderBy('date').reverse().toArray());

  // Helper untuk format Rupiah
  const formatIDR = (number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number || 0);
  };

  // Helper untuk format tanggal
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
  };

  // Filter transaksi berdasarkan tipe
  const filteredTransactions = filterType === 'all' 
    ? transactions 
    : transactions?.filter(t => t.type === filterType);

  // Hitung statistik
  const totalTransactions = filteredTransactions?.length || 0;
  const totalAmount = filteredTransactions?.reduce((sum, t) => {
    return t.type === 'income' ? sum + t.amount : sum - t.amount;
  }, 0) || 0;

  // Kelompokkan transaksi berdasarkan tanggal
  const groupedTransactions = {};
  filteredTransactions?.forEach(trx => {
    const date = formatDate(trx.date);
    if (!groupedTransactions[date]) {
      groupedTransactions[date] = [];
    }
    groupedTransactions[date].push(trx);
  });

  return (
    <div className="bg-gradient-to-b from-slate-50 to-slate-100 min-h-screen text-slate-900 pb-8 flex flex-col max-w-md mx-auto shadow-xl">
      
      {/* HEADER */}
      <header className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white pt-6 pb-8 px-6 rounded-b-3xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-blue-500 rounded-full -mr-20 -mt-20 opacity-30"></div>
        
        <div className="relative z-10 flex items-center justify-between mb-8">
          <button 
            onClick={onBack}
            className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/30 transition-colors border border-white/30"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
            </svg>
          </button>
          <h1 className="flex-1 text-center text-xl font-bold">Riwayat Transaksi</h1>
          <div className="w-10"></div>
        </div>

        {/* STATS CARD */}
        <div className="bg-gradient-to-br from-white/15 to-white/5 backdrop-blur-xl rounded-2xl p-4 border border-white/20">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-blue-200 text-xs font-medium mb-1">Total Transaksi</p>
              <p className="text-2xl font-black text-white">{totalTransactions}</p>
            </div>
            <div>
              <p className="text-blue-200 text-xs font-medium mb-1">Total Perubahan</p>
              <p className={`text-2xl font-black ${totalAmount >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
                {totalAmount >= 0 ? '+' : ''}{formatIDR(totalAmount)}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* FILTER TABS */}
      <section className="px-6 mt-6">
        <label className="block text-xs font-bold text-slate-600 mb-3 uppercase tracking-wider">Filter</label>
        <div className="flex gap-2 bg-white rounded-xl p-2 shadow-sm border border-slate-200">
          <button 
            onClick={() => setFilterType('all')}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all ${filterType === 'all' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-600 hover:text-slate-900'}`}
          >
            Semua
          </button>
          <button 
            onClick={() => setFilterType('income')}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all ${filterType === 'income' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-600 hover:text-slate-900'}`}
          >
            Pemasukan
          </button>
          <button 
            onClick={() => setFilterType('expense')}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all ${filterType === 'expense' ? 'bg-rose-600 text-white shadow-md' : 'text-slate-600 hover:text-slate-900'}`}
          >
            Pengeluaran
          </button>
        </div>
      </section>

      {/* TRANSACTION LIST */}
      <section className="px-6 mt-6 flex-1 overflow-y-auto">
        {filteredTransactions?.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
            <p className="text-slate-400 text-sm font-medium">Tidak ada transaksi</p>
            <p className="text-slate-300 text-xs mt-1">Coba ubah filter atau tambahkan transaksi baru</p>
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(groupedTransactions).map(([date, dateTransactions]) => (
              <div key={date}>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 px-3">{date}</p>
                <div className="space-y-2">
                  {dateTransactions.map((trx) => (
                    <div key={trx.id} className="bg-white rounded-xl p-4 shadow-sm border border-slate-200 hover:shadow-md transition-all">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1">
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold flex-shrink-0 ${trx.type === 'income' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                            {trx.type === 'income' ? '📥' : '📤'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-slate-900 text-sm">{trx.category}</h4>
                            <p className="text-xs text-slate-500 mt-1">{trx.wallet} {trx.note && `• ${trx.note}`}</p>
                          </div>
                        </div>
                        <div className="text-right ml-2 flex-shrink-0">
                          <p className={`font-bold text-sm ${trx.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {trx.type === 'income' ? '+' : '-'}{formatIDR(trx.amount)}
                          </p>
                          <p className="text-xs text-slate-400 mt-1">{new Date(trx.date).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
