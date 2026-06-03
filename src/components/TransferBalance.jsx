import { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db.js';

export default function TransferBalance({ onBack }) {
  const [amountInput, setAmountInput] = useState('');
  const [rawAmount, setRawAmount] = useState(0);
  const [note, setNote] = useState('');
  const [fromWallet, setFromWallet] = useState('');
  const [toWallet, setToWallet] = useState('');

  // State untuk mengontrol buka-tutup dropdown (HARUS BEDA)
  const [isFromWalletOpen, setIsFromWalletOpen] = useState(false);
  const [isToWalletOpen, setIsToWalletOpen] = useState(false);
  
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
    <div className="w-full bg-gradient-to-b from-slate-100 to-slate-500 min-h-screen text-slate-900 pb-32 relative max-w-md mx-auto shadow-xl overflow-hidden font-inter">
      <header className="app-header text-white pt-6 pb-14 px-6 rounded-b-3xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-white rounded-full -mr-20 -mt-20 opacity-10"></div>
        <div className="relative z-10 flex items-center justify-between">
          <button type="button" onClick={onBack} className="w-6 h-6 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/30 transition-colors border border-white/30 cursor-pointer">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
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
              <input type="text" inputMode="numeric" value={amountInput} onChange={handleAmountChange} placeholder="0" className="w-full bg-slate-50 border border-slate-200 text-2xl font-black rounded-xl py-3 pl-12 pr-4 outline-none focus:border-blue-500 text-blue-600 transition-colors" />
            </div>
          </div>
 
          <div className="flex items-start gap-2">
            <div className="flex flex-col gap-4 w-full">
              {/* ========================================= */}
              {/* DROPDOWN 1: DOMPET SUMBER (FROM WALLET) */}
              {/* ========================================= */}
              <div className="relative w-full">
                <label className="text-sm font-semibold text-slate-700 mb-1 block">Dari Dompet</label>
                <button
                  type="button"
                  onClick={() => {
                    setIsFromWalletOpen(!isFromWalletOpen);
                    setIsToWalletOpen(false); // Otomatis tutup dropdown sebelah jika sedang terbuka
                  }}
                  className="w-full -mb-2 bg-slate-50 border border-slate-200 text-sm font-semibold rounded-xl p-3 flex justify-between items-center outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                >
                  <div className="flex items-center gap-2">
                    {fromWallet ? (
                      <>
                        {(() => {
                          const selectedW = wallets.find((w) => w.name === fromWallet);
                          if (!selectedW) return fromWallet;
                          return (
                            <>
                              {selectedW.icon.includes('/') || selectedW.icon.startsWith('data:') ? (
                                <img src={selectedW.icon} alt={selectedW.name} className="w-5 h-5 object-contain" />
                              ) : (
                                <span className="text-lg">{selectedW.icon}</span>
                              )}
                              <span>{selectedW.name}</span>
                            </>
                          );
                        })()}
                      </>
                    ) : (
                      <span className="text-slate-400">Pilih Dompet Sumber...</span>
                    )}
                  </div>
                  <span className="text-xs text-slate-400">▼</span>
                </button>

                {isFromWalletOpen && (
                  <ul className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                    {!wallets || wallets.length === 0 ? (
                      <li className="p-3 text-sm text-slate-500 text-center">Memuat...</li>
                    ) : (
                      wallets.map((w) => (
                        <li
                          key={w.id}
                          onClick={() => {
                            setFromWallet(w.name);
                            setIsFromWalletOpen(false);
                          }}
                          className="flex items-center gap-2 p-3 text-sm font-semibold cursor-pointer hover:bg-slate-50 border-b border-slate-50 last:border-0"
                        >
                          {w.icon.includes('/') || w.icon.startsWith('data:') ? (
                            <img src={w.icon} alt={w.name} className="w-5 h-5 object-contain" />
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

              {/* 4. TAMBAHAN: Indikator UI Sisa Saldo Dompet Asal */}
              <p className={`text-[9px] pl-1 text-left font-bold tracking-wide ${rawAmount > sourceBalance ? 'text-rose-500' : 'text-slate-400'}`}>
                SISA: Rp {new Intl.NumberFormat('id-ID').format(sourceBalance)}
              </p>
            </div>

              {/* ========================================= */}
              {/* DROPDOWN 2: DOMPET TUJUAN (TO WALLET) */}
              {/* ========================================= */}
              <div className="relative w-full">
                <label className="text-sm font-semibold text-slate-700 mb-1 block">Ke Dompet</label>
                <button
                  type="button"
                  onClick={() => {
                    setIsToWalletOpen(!isToWalletOpen);
                    setIsFromWalletOpen(false); // Otomatis tutup dropdown sebelah jika sedang terbuka
                  }}
                  className="w-full bg-slate-50 border border-slate-200 text-sm font-semibold rounded-xl p-3 flex justify-between items-center outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                >
                  <div className="flex items-center gap-2">
                    {toWallet ? (
                      <>
                        {(() => {
                          const selectedW = wallets.find((w) => w.name === toWallet);
                          if (!selectedW) return toWallet;
                          return (
                            <>
                              {selectedW.icon.includes('/') || selectedW.icon.startsWith('data:') ? (
                                <img src={selectedW.icon} alt={selectedW.name} className="w-5 h-5 object-contain" />
                              ) : (
                                <span className="text-lg">{selectedW.icon}</span>
                              )}
                              <span>{selectedW.name}</span>
                            </>
                          );
                        })()}
                      </>
                    ) : (
                      <span className="text-slate-400">Pilih Dompet Tujuan...</span>
                    )}
                  </div>
                  <span className="text-xs text-slate-400">▼</span>
                </button>

                {isToWalletOpen && (
                  <ul className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                    {!wallets || wallets.length === 0 ? (
                      <li className="p-3 text-sm text-slate-500 text-center">Memuat...</li>
                    ) : (
                      wallets.map((w) => (
                        <li
                          key={`to-${w.id}`}
                          onClick={() => {
                            setToWallet(w.name);
                            setIsToWalletOpen(false);
                          }}
                          className="flex items-center gap-2 p-3 text-sm font-semibold cursor-pointer hover:bg-slate-50 border-b border-slate-50 last:border-0"
                        >
                          {w.icon.includes('/') || w.icon.startsWith('data:') ? (
                            <img src={w.icon} alt={w.name} className="w-5 h-5 object-contain" />
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

          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Tanggal & Waktu</label>
            <input type="datetime-local" value={date} onChange={(e) => setDate(e.target.value)} className="w-full bg-slate-50 border border-slate-200 text-sm font-medium rounded-xl p-3 outline-none focus:border-blue-500" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Catatan</label>
            <input type="text" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Opsional..." className="w-full bg-slate-50 border border-slate-200 text-sm rounded-xl p-3 outline-none focus:border-blue-500" />
          </div>
          <button type="submit" className="w-full app-btn text-white font-bold text-sm py-4 rounded-xl shadow-md hover:bg-blue-800 active:bg-blue-900 transition-colors mt-2">
            Proses Transfer
          </button>
        </form>
      </div>
    </div>
  );
}