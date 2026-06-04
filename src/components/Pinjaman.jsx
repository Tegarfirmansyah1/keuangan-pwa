import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db'; 
import { formatIDR,formatDateOnly } from '../utils/formatter';


export default function Pinjaman({ onBack }) {
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [loanName, setLoanName] = useState('');
  const [loanAmount, setLoanAmount] = useState('');

  // State untuk form Pembayaran (termasuk Custom Dropdown Dompet)
  const [payLoanId, setPayLoanId] = useState(null);
  const [payAmount, setPayAmount] = useState('');
  const [payWallet, setPayWallet] = useState('');
  const [isWalletOpen, setIsWalletOpen] = useState(false);

  // Ambil data pinjaman dan dompet dari database
  const loans = useLiveQuery(() => db.loans.toArray());
  const wallets = useLiveQuery(() => db.wallets.toArray());

  const handleFormatRupiah = (e, setter) => {
    // Hapus semua karakter yang bukan angka (termasuk titik)
    const rawValue = e.target.value.replace(/\D/g, '');
    setter(rawValue);
  };

  // Handler untuk memastikan state hanya menyimpan angka murni
const handleInputAngka = (e, setter) => {
  const rawValue = e.target.value.replace(/\D/g, '');
  setter(rawValue);
};

  // Fungsi Menambah Pinjaman Baru
  const handleSaveLoan = async (e) => {
    e.preventDefault();
    if (!loanName || !loanAmount) return alert('Nama dan jumlah wajib diisi!');

    if (editId) {
      // Mode Edit
      await db.loans.update(editId, {
        name: loanName,
        totalAmount: Number(loanAmount)
      });
    } else {
      // Mode Tambah Baru
      await db.loans.add({
        name: loanName,
        totalAmount: Number(loanAmount),
        paidAmount: 0,
        status: 'Belum Lunas',
        date: new Date().toISOString()
      });
    }
    resetForm();
  };

  const openEdit = (loan) => {
    setEditId(loan.id);
    setLoanName(loan.name);
    setLoanAmount(loan.totalAmount);
    setShowForm(true);
    setPayLoanId(null); // Tutup form bayar jika sedang terbuka
  };

  const resetForm = () => {
    setEditId(null);
    setLoanName('');
    setLoanAmount('');
    setShowForm(false);
  };

  // ==============================
  // 2. FITUR HAPUS
  // ==============================
  const handleDelete = async (id) => {
    if (window.confirm('Yakin ingin menghapus data pinjaman ini? (Data transaksi pembayaran terkait tidak akan terhapus)')) {
      await db.loans.delete(id);
    }
  };

  // ==============================
  // 3. FITUR BAYAR PINJAMAN
  // ==============================
  const handlePay = async (e) => {
    e.preventDefault();
    if (!payAmount || !payWallet) return alert('Pilih dompet dan masukkan nominal!');

    const loan = await db.loans.get(payLoanId);
    const amountToPay = Number(payAmount);

    // --- LOGIKA BARU: CEK SALDO DOMPET ---
    // 1. Ambil semua transaksi yang terkait dengan dompet yang dipilih
    const walletTransactions = await db.transactions
      .where('wallet')
      .equals(payWallet)
      .toArray();

    // 2. Hitung total saldo dompet tersebut
    let currentBalance = 0;
    walletTransactions.forEach(t => {
      if (t.type === 'income') currentBalance += t.amount;
      else if (t.type === 'expense') currentBalance -= t.amount;
    });

    // 3. Batalkan pembayaran jika saldo dompet tidak cukup
    if (amountToPay > currentBalance) {
      return alert(`Gagal! Saldo ${payWallet} kamu tidak cukup.\nSisa saldo dompet ini: ${formatIDR(currentBalance)}`);
    }
    // -------------------------------------

    // Jika saldo cukup, lanjutkan menambah pengeluaran ke transaksi
    await db.transactions.add({
      type: 'expense',
      amount: amountToPay,
      category: 'Bayar Pinjaman',
      wallet: payWallet,
      date: new Date().toISOString(),
      note: `Bayar pinjaman: ${loan.name}`,
      loanId: loan.id
    });

    // Update progress pinjaman
    const newPaidAmount = loan.paidAmount + amountToPay;
    const newStatus = newPaidAmount >= loan.totalAmount ? 'Lunas' : 'Belum Lunas';

    await db.loans.update(payLoanId, {
      paidAmount: newPaidAmount,
      status: newStatus
    });

    alert(`Berhasil membayar ${formatIDR(amountToPay)} menggunakan ${payWallet}!`);
    setPayLoanId(null);
    setPayAmount('');
    setPayWallet('');
  };

  if (!loans || !wallets) return <div className="p-4 text-center text-slate-500">Memuat data...</div>;
  
  return (
    <div className="w-full bg-gradient-to-b from-slate-100 to-slate-500 min-h-screen text-slate-900 pb-32 relative max-w-md mx-auto shadow-xl overflow-hidden font-inter">

      {/* HEADER */}
<header className="app-header text-white pt-6 pb-14 px-6 rounded-b-3xl relative overflow-hidden">
    <div className="absolute top-0 right-0 w-40 h-40 bg-white rounded-full -mr-20 -mt-20 opacity-10"></div>
     <div className="relative z-10 flex items-center justify-between">
        <button onClick={onBack} className="w-6 h-6 mr-4 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/30 transition-colors border border-white/30 cursor-pointer">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
          </button>
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold text-white">Pinjaman Saya</h1>
      </div>
     <div className="w-10"></div>
    </div>
</header>

    <div className="px-6 -mt-8 relative z-10">
        <div className="bg-white rounded-2xl shadow-md border border-slate-200 p-5 space-y-5 items-center">
          <p className="text-lg font-semibold text-black mb-10">Tambah Pinjaman Baru</p>
          {!showForm && (
          <button 
            onClick={() => { resetForm(); setShowForm(true); }} 
            className="flex mx-auto items-center gap-1 app-btn text-white px-4 py-2 mt-4 rounded-xl text-sm font-semibold hover:bg-violet-700 transition"
          >
            {/* Ikon Plus */}
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Baru
          </button>
        )}
        </div>
    </div>

      {/* FORM TAMBAH / EDIT */}
      {showForm && (
        <form onSubmit={handleSaveLoan} className="bg-white p-5 mt-10 rounded-2xl shadow-sm border border-slate-200 mb-6 flex flex-col gap-4 animate-fade-in">
          <div className="flex justify-between items-center mb-2">
            <h2 className="font-bold text-slate-800">{editId ? 'Edit Pinjaman' : 'Tambah Pinjaman'}</h2>
            <button type="button" onClick={resetForm} className="text-slate-400 hover:text-red-500">
              {/* Ikon Close/Silang */}
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
          
          <div>
            <label className="text-xs font-semibold text-slate-500 mb-1 block">Nama / Keterangan</label>
            <input type="text" placeholder="Misal: Pinjaman Bank, Teman..." value={loanName} onChange={(e) => setLoanName(e.target.value)} className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl outline-none focus:border-violet-500 text-sm" />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 mb-1 block">Total Pinjaman (Rp)</label>
                <input 
                type="text" 
                inputMode="numeric"
                placeholder="0" 
                // Gunakan formatIDR, lalu hapus tulisan 'Rp' dan spasinya khusus untuk di dalam input
                value={loanAmount ? formatIDR(loanAmount).replace(/Rp\s?/g, '').trim() : ''} 
                onChange={(e) => handleInputAngka(e, setLoanAmount)} 
                className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl outline-none focus:border-violet-500 text-sm" 
                />
          </div>
          <button type="submit" className="w-full bg-slate-800 text-white py-3 rounded-xl font-semibold mt-2 hover:bg-slate-900 transition">
            {editId ? 'Simpan Perubahan' : 'Simpan Pinjaman'}
          </button>
        </form>
      )}

      {/* LIST PINJAMAN */}
      <div className="flex flex-col gap-4 mt-6">
        {loans.map(loan => {
          const sisaPinjaman = loan.totalAmount - loan.paidAmount;
          const progress = (loan.paidAmount / loan.totalAmount) * 100;
          
          return (
            <div key={loan.id} className="bg-white w-auto mx-auto p-5 rounded-2xl shadow-sm border border-slate-200">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-bold text-lg text-left text-slate-800">{loan.name}</h3>
                  <span className={`text-[8px] font-bold px-2 py-1 rounded-md uppercase tracking-wider ${loan.status === 'Lunas' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                    {loan.status}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  
                  {/* TOMBOL EDIT & HAPUS (Kecil di pojok) */}
                  <button onClick={() => openEdit(loan)} className="text-slate-400 hover:text-blue-500 p-1">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" /></svg>
                  </button>
                  <button onClick={() => handleDelete(loan.id)} className="text-slate-400 hover:text-red-500 p-1">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
                  </button>
                </div>
              </div>
              
              {/* Progress Bar Minimalis */}
              <div className="w-full bg-slate-100 rounded-full h-2 mb-4 overflow-hidden">
                <div className="app-btn h-full rounded-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
              </div>
              
              {/* LAYOUT BARU: GRID 2x2 (Kiri 2, Kanan 2) */}
              <div className="grid grid-cols-2 gap-y-3 gap-x-4 mb-5">
                {/* Kiri Atas */}
                <div className="flex flex-col text-left">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Dibuat Pada</span>
                  <span className="text-xs font-bold text-slate-700">{formatDateOnly(loan.date)}</span>
                </div>
                {/* Kanan Atas */}
                <div className="flex flex-col text-right">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Total Pinjaman</span>
                  <span className="text-xs font-bold text-slate-700">{formatIDR(loan.totalAmount)}</span>
                </div>
                {/* Kiri Bawah */}
                <div className="flex flex-col text-left border-t border-slate-100 pt-2">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Sudah Dibayar</span>
                  <span className="text-xs font-bold app-text">{formatIDR(loan.paidAmount)}</span>
                </div>
                {/* Kanan Bawah */}
                <div className="flex flex-col text-right border-t border-slate-100 pt-2">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Sisa Tagihan</span>
                  <span className="text-xs font-bold text-rose-500">{formatIDR(sisaPinjaman)}</span>
                </div>
              </div>

              {/* AREA PEMBAYARAN */}
              {loan.status !== 'Lunas' && (
                <>
                  {payLoanId === loan.id ? (
                    <form onSubmit={handlePay} className="flex flex-col gap-3 pt-4 border-t border-slate-100">
                      
                      {/* CUSTOM DROPDOWN DOMPET (Mendukung Ikon Gambar) */}
                      <div className="relative w-full">
                        <button type="button" onClick={() => setIsWalletOpen(!isWalletOpen)} className="w-full bg-slate-50 border border-slate-200 text-sm font-semibold rounded-xl p-3 flex justify-between items-center outline-none focus:border-violet-500">
                          <div className="flex items-center gap-2">
                            {payWallet ? (
                              wallets.find(w => w.name === payWallet) && (
                                <>
                                  {wallets.find(w => w.name === payWallet).icon.includes('/') || wallets.find(w => w.name === payWallet).icon.startsWith('data:') ? (
                                    <img src={wallets.find(w => w.name === payWallet).icon} alt={payWallet} className="w-5 h-5 object-contain" />
                                  ) : (
                                    <span className="text-lg">{wallets.find(w => w.name === payWallet).icon}</span>
                                  )}
                                  <span>{payWallet}</span>
                                </>
                              )
                            ) : (
                              <span className="text-slate-400">Pilih Sumber Dana...</span>
                            )}
                          </div>
                          <span className="text-xs text-slate-400">▼</span>
                        </button>
                        
                        {isWalletOpen && (
                          <ul className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                            {wallets.map((w) => (
                              <li key={w.id} onClick={() => { setPayWallet(w.name); setIsWalletOpen(false); }} className="flex items-center gap-2 p-3 text-sm font-semibold cursor-pointer hover:bg-slate-50 border-b border-slate-50 last:border-0">
                                {w.icon.includes('/') || w.icon.startsWith('data:') ? (
                                  <img src={w.icon} alt={w.name} className="w-5 h-5 object-contain" />
                                ) : (
                                  <span className="text-lg">{w.icon}</span>
                                )}
                                {w.name}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>

                      <input 
                        type="text" 
                        inputMode="numeric"
                        placeholder="Nominal Bayar" 
                        value={payAmount ? formatIDR(payAmount).replace(/Rp\s?/g, '').trim() : ''} 
                        onChange={(e) => {
                            const rawValue = e.target.value.replace(/\D/g, '');
                            // Cegah input melebihi sisa pinjaman
                            if (Number(rawValue) > sisaPinjaman) {
                            setPayAmount(sisaPinjaman.toString());
                            } else {
                            setPayAmount(rawValue);
                            }
                        }} 
                        className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl outline-none focus:border-violet-500 text-sm" 
                        />
                      
                      <div className="flex gap-2 mt-1">
                        <button type="submit" className="flex-1 app-btn text-white py-2.5 rounded-xl font-semibold text-sm hover:bg-slate-200 transition">Bayar</button>
                        <button type="button" onClick={() => setPayLoanId(null)} className="flex-1 bg-slate-100 text-slate-600 py-2.5 rounded-xl font-semibold text-sm hover:bg-slate-200 transition">Batal</button>
                      </div>
                    </form>
                  ) : (
                    <button onClick={() => { setPayLoanId(loan.id); setShowForm(false); }} className="w-full flex justify-center items-center gap-2 border border-violet-200 app-btn bg-violet-50 py-2.5 rounded-xl font-semibold text-sm hover:bg-violet-100 transition">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" /></svg>
                      Bayar / Cicil
                    </button>
                  )}
                </>
              )}
            </div>
          );
        })}
        {loans.length === 0 && (
          <div className="text-center py-10">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-16 h-16 mx-auto text-slate-300 mb-3"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <p className="text-slate-500 font-medium">Belum ada catatan pinjaman.</p>
          </div>
        )}
      </div>
    </div>
  );
}