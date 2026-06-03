import { useEffect } from 'react';
import { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from './db';
import { formatIDR } from './utils/formatter';
import TransactionHistory from './components/TransactionHistory';
import AddTransaction from './components/AddTransaction';
import EditTransaction from './components/EditTransaction';
import Budget from './components/Budget';
import TransferBalance from './components/TransferBalance';
import { useRouter } from './hooks/useRouter';
import Backup from './components/Backup';
import Pinjaman from './components/Pinjaman';
import NameModal from './components/NameModal';
import SettingsModal from './components/SettingModal';

export default function App() {

  const [userName, setUserName] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFirstTime, setIsFirstTime] = useState(false);
  const [showModal, setShowModal] = useState(false);

  // Cek localStorage saat aplikasi pertama kali dimuat
  useEffect(() => {
      // Hanya fokus mengurus Nama User saja sekarang
      const savedName = localStorage.getItem('userNickname');
      if (savedName) {
        setUserName(savedName);
      } else {
        setIsFirstTime(true);
        setShowModal(true);
      }
    }, []);

  const handleSaveName = (name) => {
    localStorage.setItem('userNickname', name);
    setUserName(name);
    setIsFirstTime(false);
    setShowModal(false);
  };


  // Query database
  const transactions = useLiveQuery(() => 
    db.transactions.orderBy('date').reverse().toArray()
  ) || [];
  
  const wallets = useLiveQuery(() => db.wallets.toArray()) || [];

  // Calculate totals
  const totalIncome = transactions
    .filter(t => t.type === 'income' && t.category !== 'Transfer Masuk')
    .reduce((acc, curr) => acc + curr.amount, 0);
    
  const totalExpense = transactions
    .filter(t => t.type === 'expense' && t.category !== 'Transfer Keluar')
    .reduce((acc, curr) => acc + curr.amount, 0);
    
  const currentBalance = totalIncome - totalExpense;

  // State
  const { currentView, navigate, goBack } = useRouter('home');
const [selectedTransaction, setSelectedTransaction] = useState(null);

  // Optimized wallet balances calculation
  const walletBalances = useMemo(() => {
    const balanceMap = new Map();
    
    // Initialize all wallets
    wallets.forEach(w => {
      balanceMap.set(w.name, { ...w, balance: 0 });
    });
    
    // Single pass through transactions (O(n) instead of O(n²))
    transactions.forEach(t => {
      if (balanceMap.has(t.wallet)) {
        const wallet = balanceMap.get(t.wallet);
        if (t.type === 'income') {
          wallet.balance += t.amount;
        } else {
          wallet.balance -= t.amount;
        }
      }
    });
    
    // Filter wallets with non-zero balance
    return Array.from(balanceMap.values()).filter(w => w.balance !== 0);
      }, [wallets, transactions]);

      // Routing
      if (currentView === 'add') {
      return <AddTransaction onBack={() => goBack()} />;
    }
    if (currentView === 'history') {
      return <TransactionHistory 
        onBack={() => goBack()} 
        onEdit={(trx) => { 
          setSelectedTransaction(trx); 
          navigate('edit');
        }} 
      />;
    }
    if (currentView === 'edit' && selectedTransaction) {
      return <EditTransaction 
        transaction={selectedTransaction} 
        onBack={() => {
          setSelectedTransaction(null);
          goBack();
        }} 
      />;
    }
    if (currentView === 'budget') {
      return <Budget onBack={() => goBack()} />;
    }
    if (currentView === 'transfer') {
      return <TransferBalance onBack={() => goBack()} />;
    }
    if (currentView === 'backup') {
      return <Backup onBack={() => goBack()} />;
    }
    if (currentView === 'pinjaman') {
      return <Pinjaman onBack={() => goBack()} />;
    }
  return (
    <div className="w-full bg-gradient-to-b from-slate-100 to-slate-500 min-h-screen text-slate-900 pb-32 relative max-w-md mx-auto shadow-xl overflow-hidden font-inter">
      
      <SettingsModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        currentName={userName}
        onSaveName={handleSaveName}
        isFirstTime={isFirstTime}
        
      />

      {showModal && <NameModal onSave={handleSaveName} />}

      {/* HEADER GRADIENT */}
      <header className="app-header text-white pt-8 pb-12 px-6 rounded-b-3xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-blue-500 rounded-full -mr-20 -mt-20 opacity-30"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-400 rounded-full -ml-16 -mb-16 opacity-20"></div>
        
        <div className="relative z-10 flex justify-between items-start mb-8">
          <div>
            <p className="text-main text-[18px] pt-12 font-medium mb-1">Selamat datang kembali</p>
            <p className="text-[32px] pt-2 pb-10 font-bold text-left">{userName || 'User'}</p>
          </div>
          <button onClick={() => setIsModalOpen(true)} className="text-lg">
          ⚙️
        </button>
        </div>

        {/* BALANCE CARD */}
        <div className="relative z-10 app-card backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-2xl">
          <p className="text-main text-sm font-medium mb-5">Total Saldo Anda</p>
          <p className="text-2xl font-bold tracking-tight mb-5 break-words overflow-hidden">
            {formatIDR(currentBalance)}
          </p>
          
          <div className="flex flex-col gap-2 mt-8">
            <div className="app-bg backdrop-blur-sm rounded-lg px-4 py-2.5 border border-white/20 flex justify-between items-center">
              <p className="text-main text-xs font-medium">Pemasukan</p>
              <p className="text-sm font-bold text-emerald-500 truncate pl-4">
                {formatIDR(totalIncome)}
              </p>
            </div>
            
            <div className="app-bg backdrop-blur-sm rounded-lg px-4 py-2.5 border border-white/20 flex justify-between items-center">
              <p className="text-main text-xs font-medium">Pengeluaran</p>
              <p className="text-sm font-bold text-red-400 truncate pl-4">
                {formatIDR(totalExpense)}
              </p>
            </div>

            {/* Wallet Details */}
            {walletBalances.length > 0 && (
              <div className="mt-5 pt-4 border-t border-white/15">
                <p className="text-[10px] text-main font-bold mb-3 uppercase tracking-wider">Rincian Dompet</p>
                <div className="flex flex-col gap-2.5">
                  {walletBalances.map(wb => (
                    <div key={wb.id} className="flex justify-between items-center px-1">
                      <div className="flex items-center gap-2.5">
                        <span className="text-sm">
                          <img 
                            src={wb.icon} 
                            alt={wb.name} 
                            style={{ width: '24px', height: '24px', objectFit: 'contain' }} 
                          />
                        </span>
                        <span className="text-xs font-medium text-main">{wb.name}</span>
                      </div>
                      <p className={`text-xs font-bold tracking-wide ${wb.balance < 0 ? 'text-rose-400' : 'app-text'}`}>
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
      <section className="px-10 flex flex-col items-center relative z-10">
        <div className="relative z-10 items-center w-full grid grid-cols-3 gap-3 mt-6">
          <button onClick={() => navigate('add')} className="flex-1 bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow border border-slate-200 flex flex-col items-center gap-2 active:bg-slate-50">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-black">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
            </div>
            <span className="text-xs font-semibold text-slate-700">Tambah</span>
          </button>
          <button onClick={() => navigate('history')} className="flex-1 bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow border border-slate-200 flex flex-col items-center gap-2 active:bg-slate-50">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-black">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
            </div>
            <span className="text-xs font-semibold text-slate-700">Riwayat</span>
          </button>
          <button onClick={() => navigate('budget')} className="flex-1 bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow border border-slate-200 flex flex-col items-center gap-2 active:bg-slate-50">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-black">
              <span className="text-black text-lg"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.75M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm3 0h.008v.008H18V10.5Zm-12 0h.008v.008H6V10.5Z" />
              </svg>
              </span>
            </div>
            <span className="text-xs font-semibold text-slate-700">Budget</span>
          </button>
          <button onClick={() => navigate('transfer')} className="flex-1 bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow border border-slate-200 flex flex-col items-center gap-2 active:bg-slate-50">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-black">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
              </svg>
            </div>
            <span className="text-xs font-semibold text-slate-700">Transfer</span>
          </button>
          <button onClick={() => navigate('backup')} className="flex-1 bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow border border-slate-200 flex flex-col items-center gap-2 active:bg-slate-50">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-black">
              <span className="text-black text-lg"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-6 text-black">
                <path strokeLinecap="round" strokeLinejoin="round" d="m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5m8.25 3v6.75m0 0-3-3m3 3 3-3M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" />
              </svg>
              </span>
            </div>
            <span className="text-xs font-semibold text-slate-700">Backup</span>
          </button>
          <button onClick={() => navigate('pinjaman')} className="flex-1 bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow border border-slate-200 flex flex-col items-center gap-2 active:bg-slate-50">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-black">
                <span className="text-black text-lg"><svg className="h-8 w-8 text-black"  fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.25" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                </span>
              </div>
              <span className="text-xs font-semibold text-slate-700">Pinjaman</span>
            </button>
        </div>
      </section>

      {/* TRANSACTION LIST */}
      <section className="px-6 mt-8 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-slate-900">Riwayat Transaksi Terbaru</h3>
        </div>

        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          {transactions.length === 0 ? (
            <div className="p-12 text-center ">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 ">
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
                <div key={trx.id} className="p-4 transition-colors flex flex-col gap-1.5 border-b border-slate-300">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-1.5">
                      <div className={`w-2 h-2 rounded-full ${trx.type === 'income' ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
                      <span className="text-xs font-semibold text-slate-600">{trx.wallet}</span>
                    </div>
                    <h4 className="font-bold text-slate-900 text-sm">{trx.category}</h4>
                  </div>
                  
                  <div className="flex justify-between items-end mt-0.5">
                    <div className="flex flex-col gap-0.5">
                      <p className="text-xs text-slate-500 truncate max-w-[150px]">{trx.note || '-'}</p>
                      <p className="text-[10px] text-left text-slate-400">
                        {new Date(trx.date).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    
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