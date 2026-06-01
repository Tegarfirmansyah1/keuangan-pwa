import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from './db';
import TransactionHistory from './components/TransactionHistory';
import AddTransaction from './components/AddTransaction';
import EditTransaction from './components/EditTransaction';
import Budget from './components/Budget';
import TransferBalance from './components/TransferBalance';

// Helper untuk format Rupiah (IDR)
const formatIDR = (number) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number || 0);
};

export default function App() {
  
  // Mengambil semua transaksi dari database dan mengurutkannya (terbaru di atas)
  const transactions = useLiveQuery(() => db.transactions.orderBy('date').reverse().toArray()) || [];
  const wallets = useLiveQuery(() => db.wallets.toArray()) || [];

  // Kalkulasi Saldo Otomatis berdasarkan transaksi betulan
  const totalIncome = transactions
    .filter(t => t.type === 'income' && t.category !== 'Transfer Masuk')
    .reduce((acc, curr) => acc + curr.amount, 0);
    
  const totalExpense = transactions
    .filter(t => t.type === 'expense' && t.category !== 'Transfer Keluar')
    .reduce((acc, curr) => acc + curr.amount, 0);
    
  const currentBalance = totalIncome - totalExpense;

  const [currentView, setCurrentView] = useState('home'); 
  const [selectedTransaction, setSelectedTransaction] = useState(null); 

  const walletBalances = wallets.map(wallet => {
    const income = transactions.filter(t => t.wallet === wallet.name && t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const expense = transactions.filter(t => t.wallet === wallet.name && t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    return { ...wallet, balance: income - expense };
  }).filter(w => w.balance !== 0);


  // ROUTING HALAMAN
  if (currentView === 'add') {
    return <AddTransaction onBack={() => setCurrentView('home')} />;
  }
  if (currentView === 'history') {
    return <TransactionHistory 
      onBack={() => setCurrentView('home')} 
      onEdit={(trx) => { setSelectedTransaction(trx); setCurrentView('edit'); }} 
    />;
  }
  // Rute baru untuk edit
  if (currentView === 'edit' && selectedTransaction) {
    return <EditTransaction 
      transaction={selectedTransaction} 
      onBack={() => { setCurrentView('home'); setSelectedTransaction(null); }} 
    />;
  }
  if (currentView === 'budget') {
    return <Budget onBack={() => setCurrentView('home')} />;
  }
  if (currentView === 'transfer') {
    return <TransferBalance onBack={() => setCurrentView('home')} />;
  }

  return (
    <div className="bg-gradient-to-b from-slate-50 to-slate-100 min-h-screen text-slate-900 pb-32 relative max-w-md mx-auto shadow-xl overflow-hidden font-sans">
      
      {/* HEADER GRADIENT */}
      <header className="bg-gradient-to-br from-blue-600 via-blue-600 to-blue-900 text-white pt-8 pb-12 px-6 rounded-b-3xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-blue-500 rounded-full -mr-20 -mt-20 opacity-30"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-400 rounded-full -ml-16 -mb-16 opacity-20"></div>
        
        <div className="relative z-10 flex justify-between items-start mb-8">
          <div>
            <p className="text-blue-200 text-sm pt-12 font-medium mb-1">Selamat datang kembali</p>
            <p className="text-2xl pt-2 pb-10 font-bold text-left">Sayang 🥰</p>
          </div>
          <button className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/30 transition-colors border border-white/30">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path>
            </svg>
          </button>
        </div>

        {/* BALANCE CARD */}
        <div className="relative z-10 bg-gradient-to-br from-white/15 to-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-2xl">
          <p className="text-blue-100 text-sm font-medium mb-5">Total Saldo Anda</p>
          <p className="text-2xl font-bold tracking-tight mb-5 break-words overflow-hidden">
            {formatIDR(currentBalance)}
          </p>
          
          {/* PERBAIKAN: Menggunakan flex-col untuk susun atas-bawah dan justify-between untuk kiri-kanan */}
          <div className="flex flex-col gap-2 mt-8">
            
            {/* Kotak Pemasukan */}
            <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2.5 border border-white/20 flex justify-between items-center">
              <p className="text-blue-200 text-xs font-medium">Pemasukan</p>
              <p className="text-sm font-bold text-emerald-300 truncate pl-4">
                {formatIDR(totalIncome)}
              </p>
            </div>
            
            {/* Kotak Pengeluaran */}
            <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2.5 border border-white/20 flex justify-between items-center">
              <p className="text-blue-200 text-xs font-medium">Pengeluaran</p>
              <p className="text-sm font-bold text-rose-300 truncate pl-4">
                {formatIDR(totalExpense)}
              </p>
            </div>

            {/* DESAIN BARU: Rincian Saldo Per Dompet - Simple List */}
          {walletBalances.length > 0 && (
            <div className="mt-5 pt-4 border-t border-white/15">
              <p className="text-[10px] text-blue-200 font-bold mb-3 uppercase tracking-wider">Rincian Dompet</p>
              <div className="flex flex-col gap-2.5">
                {walletBalances.map(wb => (
                  <div key={wb.id} className="flex justify-between items-center px-1">
                    <div className="flex items-center gap-2.5">
                      <span className="text-sm"><img 
                      src={wb.icon} 
                      alt={wb.name} 
                      style={{ width: '24px', height: '24px', objectFit: 'contain' }} 
                    /></span>
                      <span className="text-xs font-medium text-blue-50">{wb.name}</span>
                    </div>
                    <p className={`text-xs font-bold tracking-wide ${wb.balance < 0 ? 'text-rose-400' : 'text-white'}`}>
                      {formatIDR(wb.balance)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          </div>
        </div>
      </header>

      {/* QUICK ACTIONS */}
      <section className="px-10 flex flex-col items-center relative z-10 ">
        <div className="relative z-10 items-center w-full grid grid-cols-2 gap-3 mt-6">
        <button onClick={() => setCurrentView('add')} className="flex-1 bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow border border-slate-200 flex flex-col items-center gap-2 active:bg-slate-50">
          <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11h-4v4h-2v-4H7v-2h4V7h2v4h4v2z"/></svg>
          </div>
          <span className="text-xs font-semibold text-slate-700">Tambah</span>
        </button>
        <button onClick={() => setCurrentView('history')} className="flex-1 bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow border border-slate-200 flex flex-col items-center gap-2 active:bg-slate-50">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/></svg>
          </div>
          <span className="text-xs font-semibold text-slate-700">Riwayat</span>
        </button>
        <button onClick={() => setCurrentView('budget')} className="flex-1 bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow border border-slate-200 flex flex-col items-center gap-2 active:bg-slate-50">
          <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center text-purple-600">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14zm-5.04-6.71l-2.75 3.54h2.89v2.71h1.97v-2.71h2.89l-2.75-3.54 2.75-3.54h-2.89V7h-1.97v2.75h-2.89l2.75 3.54z"/></svg>
          </div>
          <span className="text-xs font-semibold text-slate-700">Budget</span>
        </button>
        <button onClick={() => setCurrentView('transfer')} className="flex-1 bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow border border-slate-200 flex flex-col items-center gap-2 active:bg-slate-50">
          <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center text-purple-600">
            <span className="text-black text-lg">⇄</span>
          </div>
            <span className="text-xs font-semibold text-slate-700">Transfer</span>
          </button>
        </div>
      </section>

      {/* TRANSACTION LIST */}
      <section className="px-6 mt-8 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-slate-900">Riwayat Transaksi Terbaru</h3>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          {transactions.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </div>
              <p className="text-slate-400 text-sm font-medium">Belum ada transaksi</p>
              <p className="text-slate-300 text-xs mt-1">Mulai tambahkan transaksi Anda</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
                {transactions.slice(0, 5).map((trx) => (
                  <div key={trx.id} className="p-4 transition-colors flex flex-col gap-1.5">
                    
                    {/* BARIS ATAS */}
                    <div className="flex justify-between items-center">
                      {/* Kiri Atas: Pilihan Dompet */}
                      <div className="flex items-center gap-1.5">
                        <div className={`w-2 h-2 rounded-full ${trx.type === 'income' ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
                        <span className="text-xs font-semibold text-slate-600">{trx.wallet}</span>
                      </div>
                      
                      {/* Kanan Atas: Kategori */}
                      <h4 className="font-bold text-slate-900 text-sm">{trx.category}</h4>
                    </div>
                    
                    {/* BARIS BAWAH */}
                    <div className="flex justify-between items-end mt-0.5">
                      {/* Kiri Bawah: Catatan */}
                      {/* Kiri Bawah: Catatan & Waktu */}
                        <div className="flex flex-col gap-0.5">
                          <p className="text-xs text-slate-500 truncate max-w-[100px]">{trx.note || '-'}</p>
                          <p className="text-[10px] text-left text-slate-400">
                            {new Date(trx.date).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      
                      {/* Kanan Bawah: Nominal */}
                      <div className="text-right">
                        <p className={`font-black text-sm ${trx.type === 'income' ? 'text-emerald-500' : 'text-rose-400'}`}>
                          {trx.type === 'income' ? '+' : '-'}{formatIDR(trx.amount)}
                        </p>
                      </div>
                    </div>

                  </div>
                ))}
              </div>
          )}
        </div>
      </section>
    </div>
  );
}