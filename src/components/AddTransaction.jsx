import { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db.js';
import { formatIDR } from '../utils/formatter.js';

const VALIDATION_RULES = {
  amount: {
    min: 1,
    max: 999999999,
    required: true
  },
  category: {
    required: true
  },
  wallet: {
    required: true
  }
};

export default function AddTransaction({ onBack }) {
  const [type, setType] = useState('expense');
  const [amountInput, setAmountInput] = useState('');
  const [rawAmount, setRawAmount] = useState(0);
  const [category, setCategory] = useState('');
  const [wallet, setWallet] = useState('');
  const [note, setNote] = useState('');
  const [date, setDate] = useState(getLocalDatetime());
  const [isWalletOpen, setIsWalletOpen] = useState(false);
  const [errors, setErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  const categories = useLiveQuery(() => 
    db.categories.filter(c => c.type === type).toArray(), 
    [type]
  ) || [];
  
  const wallets = useLiveQuery(() => db.wallets.toArray()) || [];

  useEffect(() => {
    if (categories.length > 0) {
      const isCategoryValid = categories.some(c => c.name === category);
      if (!category || !isCategoryValid) {
        setCategory(categories[0].name);
      }
    }
  }, [categories, category]);

  useEffect(() => {
    if (wallets.length > 0 && !wallet) {
      setWallet(wallets[0].name);
    }
  }, [wallets, wallet]);

  function getLocalDatetime() {
    const now = new Date();
    const tzOffset = now.getTimezoneOffset() * 60000;
    return new Date(now.getTime() - tzOffset).toISOString().slice(0, 16);
  }

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
    
    // Clear error when user starts typing
    if (errors.amount) {
      setErrors(prev => ({ ...prev, amount: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Validate amount
    if (!rawAmount) {
      newErrors.amount = 'Nominal harus diisi';
    } else if (rawAmount < VALIDATION_RULES.amount.min) {
      newErrors.amount = `Nominal minimal adalah ${formatIDR(VALIDATION_RULES.amount.min)}`;
    } else if (rawAmount > VALIDATION_RULES.amount.max) {
      newErrors.amount = `Nominal maksimal adalah ${formatIDR(VALIDATION_RULES.amount.max)}`;
    }

    // Validate category
    if (!category) {
      newErrors.category = 'Kategori harus dipilih';
    }

    // Validate wallet
    if (!wallet) {
      newErrors.wallet = 'Dompet harus dipilih';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSaving(true);
    try {
      await db.transactions.add({
        type,
        amount: rawAmount,
        category,
        wallet,
        note: note.trim(),
        date: new Date(date).toISOString(),
        createdAt: new Date().toISOString()
      });

      setIsSaving(false);
      if (onBack) onBack();
    } catch (error) {
      setIsSaving(false);
      setErrors({
        submit: `Gagal menyimpan transaksi: ${error.message}`
      });
      console.error('Save error:', error);
    }
  };

  return (
    <div className="w-full bg-gradient-to-b from-slate-100 to-slate-500 min-h-screen text-slate-900 pb-32 relative max-w-md mx-auto shadow-xl overflow-hidden font-inter">
      <header className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white pt-6 pb-14 px-6 rounded-b-3xl relative overflow-hidden">
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
          <h1 className="flex-1 text-center text-xl font-bold">Tambah Transaksi</h1>
          <div className="w-10"></div>
        </div>
      </header>

      <div className="px-6 -mt-8 relative z-10">
        <form onSubmit={handleSave} className="bg-white rounded-2xl shadow-md border border-slate-200 p-5 space-y-5">
          
          {/* Error summary */}
          {errors.submit && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex gap-2">
              <span>⚠️</span>
              <span>{errors.submit}</span>
            </div>
          )}

          {/* Type toggle */}
          <div className="flex bg-slate-100 p-1.5 rounded-xl gap-1">
            <button 
              type="button" 
              onClick={() => setType('expense')} 
              className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${
                type === 'expense' 
                  ? 'bg-white text-rose-600 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Pengeluaran
            </button>
            <button 
              type="button" 
              onClick={() => setType('income')} 
              className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${
                type === 'income' 
                  ? 'bg-white text-emerald-600 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Pemasukan
            </button>
          </div>

          {/* Amount input */}
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">
              Nominal (Rp)
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">Rp</span>
              <input 
                type="text" 
                inputMode="numeric" 
                value={amountInput} 
                onChange={handleAmountChange} 
                placeholder="0" 
                className={`w-full bg-slate-50 border text-2xl font-black rounded-xl py-3 pl-12 pr-4 outline-none focus:border-blue-500 transition-colors ${
                  type === 'expense' ? 'text-rose-600' : 'text-emerald-600'
                } ${errors.amount ? 'border-red-500 focus:border-red-500' : 'border-slate-200'}`}
              />
            </div>
            {errors.amount && (
              <p className="text-red-500 text-xs mt-1.5 flex gap-1">
                <span>✗</span>
                <span>{errors.amount}</span>
              </p>
            )}
          </div>

          {/* Category select */}
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">
              Kategori
            </label>
            <select 
              value={category} 
              onChange={(e) => {
                setCategory(e.target.value);
                if (errors.category) {
                  setErrors(prev => ({ ...prev, category: '' }));
                }
              }} 
              className={`w-full bg-slate-50 border text-sm font-semibold rounded-xl p-3 outline-none focus:border-blue-500 ${
                errors.category ? 'border-red-500 focus:border-red-500' : 'border-slate-200'
              }`}
            >
              {!categories || categories.length === 0 ? (
                <option value="">Memuat...</option>
              ) : (
                categories.map(c => (
                  <option key={c.id} value={c.name}>
                    {c.icon} {c.name}
                  </option>
                ))
              )}
            </select>
            {errors.category && (
              <p className="text-red-500 text-xs mt-1.5 flex gap-1">
                <span>✗</span>
                <span>{errors.category}</span>
              </p>
            )}
          </div>

          {/* Wallet select */}
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">
              Dompet
            </label>
            <div className="relative w-full">
              <button
                type="button"
                onClick={() => setIsWalletOpen(!isWalletOpen)}
                className={`w-full bg-slate-50 border text-sm font-semibold rounded-xl p-3 flex justify-between items-center outline-none focus:border-blue-500 ${
                  errors.wallet ? 'border-red-500 focus:border-red-500' : 'border-slate-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  {wallet ? (
                    <>
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
                <span className="text-xs text-slate-400">▼</span>
              </button>

              {isWalletOpen && (
                <ul className="absolute z-10 w-full mt-2 bg-white border border-slate-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                  {!wallets || wallets.length === 0 ? (
                    <li className="p-3 text-sm text-slate-500 text-center">Memuat...</li>
                  ) : (
                    wallets.map((w) => (
                      <li
                        key={w.id}
                        onClick={() => {
                          setWallet(w.name);
                          setIsWalletOpen(false);
                          if (errors.wallet) {
                            setErrors(prev => ({ ...prev, wallet: '' }));
                          }
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
            {errors.wallet && (
              <p className="text-red-500 text-xs mt-1.5 flex gap-1">
                <span>✗</span>
                <span>{errors.wallet}</span>
              </p>
            )}
          </div>

          {/* Date input */}
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">
              Tanggal & Waktu
            </label>
            <input 
              type="datetime-local" 
              value={date} 
              onChange={(e) => setDate(e.target.value)} 
              className="w-full bg-slate-50 border border-slate-200 text-sm font-medium rounded-xl p-3 outline-none focus:border-blue-500" 
            />
          </div>

          {/* Note input */}
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">
              Catatan (Opsional)
            </label>
            <input 
              type="text" 
              value={note} 
              onChange={(e) => setNote(e.target.value)} 
              placeholder="Contoh: Makan di restoran..."
              maxLength={150}
              className="w-full bg-slate-50 border border-slate-200 text-sm rounded-xl p-3 outline-none focus:border-blue-500" 
            />
            <p className="text-xs text-slate-400 mt-1">{note.length}/150 karakter</p>
          </div>

          {/* Submit button */}
          <button 
            type="submit" 
            disabled={isSaving}
            className={`w-full font-bold text-sm py-4 rounded-xl shadow-md transition-colors mt-2 ${
              isSaving 
                ? 'bg-slate-400 text-white cursor-not-allowed' 
                : 'bg-slate-800 text-white hover:bg-slate-700 active:bg-slate-900'
            }`}
          >
            {isSaving ? '⏳ Menyimpan...' : '✓ Simpan Transaksi'}
          </button>
        </form>
      </div>
    </div>
  );
}