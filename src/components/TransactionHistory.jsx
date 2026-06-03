import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db.js';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Tambahkan prop onEdit di sini
export default function TransactionHistory({ onBack, onEdit }) {
  const [filterType, setFilterType] = useState('all');
  const [timeRange, setTimeRange] = useState('week'); 
  const [downloadFilter, setDownloadFilter] = useState('all');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  const transactions = useLiveQuery(() => db.transactions.orderBy('date').reverse().toArray()) || [];

  const formatIDR = (number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number || 0);
  };

  const formatDateUI = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
  };

  const filteredTransactions = transactions?.filter(t => {
    const txDate = new Date(t.date);
    const now = new Date();
    
    let isWithinTimeRange = true;
    if (timeRange === 'week') {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(now.getDate() - 7);
      isWithinTimeRange = txDate >= oneWeekAgo;
    } else if (timeRange === 'month') {
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(now.getMonth() - 1);
      isWithinTimeRange = txDate >= oneMonthAgo;
    }

    const isRightType = filterType === 'all' || t.type === filterType;
    return isWithinTimeRange && isRightType;
  });

  const totalTransactions = filteredTransactions?.length || 0;
  const totalAmount = filteredTransactions?.reduce((sum, t) => {
    return t.type === 'income' ? sum + t.amount : sum - t.amount;
  }, 0) || 0;

  const groupedTransactions = {};
  filteredTransactions?.forEach(trx => {
    const date = formatDateUI(trx.date);
    if (!groupedTransactions[date]) {
      groupedTransactions[date] = [];
    }
    groupedTransactions[date].push(trx);
  });

  const handleDownloadStatement = () => {
    if (!transactions || transactions.length === 0) {
      alert("Belum ada data transaksi.");
      return;
    }

    let dataToDownload = [...transactions];
    const now = new Date();

    if (downloadFilter === '1month') {
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(now.getMonth() - 1);
      dataToDownload = dataToDownload.filter(t => new Date(t.date) >= oneMonthAgo);
    } 
    else if (downloadFilter === '1year') {
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(now.getFullYear() - 1);
      dataToDownload = dataToDownload.filter(t => new Date(t.date) >= oneYearAgo);
    } 
    else if (downloadFilter === 'custom') {
      if (!customStart || !customEnd) {
        alert("Harap pilih tanggal awal dan tanggal akhir terlebih dahulu!");
        return;
      }
      const start = new Date(customStart);
      start.setHours(0, 0, 0, 0);
      const end = new Date(customEnd);
      end.setHours(23, 59, 59, 999);

      dataToDownload = dataToDownload.filter(t => {
        const d = new Date(t.date);
        return d >= start && d <= end;
      });
    }

    if (dataToDownload.length === 0) {
      alert("Tidak ada transaksi pada rentang waktu yang Anda pilih.");
      return;
    }

    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('Statement Keuangan', 14, 22);
    
    doc.setFontSize(11);
    doc.setTextColor(100);
    const currentDateUI = new Date().toLocaleDateString('id-ID', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
    doc.text(`Dicetak pada: ${currentDateUI}`, 14, 30);

    let periodText = "Periode: Semua Waktu";
    if(downloadFilter === '1month') periodText = "Periode: 1 Bulan Terakhir";
    if(downloadFilter === '1year') periodText = "Periode: 1 Tahun Terakhir";
    if(downloadFilter === 'custom') periodText = `Periode: ${formatDateUI(customStart)} - ${formatDateUI(customEnd)}`;
    doc.text(periodText, 14, 36);

    const tableColumn = ["Tanggal", "Kategori", "Tipe", "Jumlah (Rp)", "Dompet", "Catatan"];
    const tableRows = [];

    dataToDownload.forEach(t => {
      const date = new Date(t.date).toLocaleDateString('id-ID');
      const type = t.type === 'income' ? 'Pemasukan' : 'Pengeluaran';
      const amount = new Intl.NumberFormat('id-ID').format(t.amount); 
      const note = t.note ? t.note : "-";
      tableRows.push([date, t.category, type, amount, t.wallet, note]);
    });

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 46,
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 4, overflow: 'linebreak', valign: 'middle' },
      headStyles: { fillColor: [30, 58, 138], textColor: 255, fontStyle: 'bold' },
      columnStyles: { 3: { halign: 'right' }, 1: { cellWidth: 35 }, 5: { cellWidth: 55 } },
      didParseCell: function(data) {
        if (data.section === 'body' && data.column.index === 2) {
            if (data.cell.raw === 'Pemasukan') {
                data.cell.styles.textColor = [5, 150, 105];
                data.cell.styles.fontStyle = 'bold';
            } else {
                data.cell.styles.textColor = [225, 29, 72];
                data.cell.styles.fontStyle = 'bold';
            }
        }
      }
    });

    const safeDateString = new Date().toISOString().split('T')[0];
    doc.save(`Statement_Keuangan_${safeDateString}.pdf`);
  };

  return (
    <div className="w-full bg-gradient-to-b from-slate-100 to-slate-500 min-h-screen text-slate-900 pb-32 relative max-w-md mx-auto shadow-xl overflow-hidden font-inter">
      
      {/* HEADER */}
      <header className="app-header text-white pt-1 pb-8 px-6 rounded-b-3xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-blue-500 rounded-full -mr-20 -mt-20 opacity-30"></div>
        
        <div className="relative z-10 flex items-center justify-between mb-6">
          <button onClick={onBack} className="w-6 h-6 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/30 transition-colors border border-white/30">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
          </button>
          <h1 className="flex-1 text-center text-xl font-bold">Riwayat Transaksi</h1>
          <div className="w-8"></div>
        </div>

      
        {/* STATS CARD */}
        <div className="app-card backdrop-blur-xl rounded-2xl p-4 border border-white/20 mb-2">
          <p className=" text-l mb-20 font-base">Ringkasan Transaksi</p>
          <div className="grid grid-cols-2 mt-8 gap-2">
            <div>
              <p className="app-text text-[12px] font-medium mb-1">Total Transaksi</p>
              <p className="text-[16px] font-bold app-text">{totalTransactions}</p>
            </div>
            <div>
              <p className="app-text text-[12px] font-medium mb-1">Total Perubahan</p>
              <p className={`text-[14px] font-bold ${totalAmount >= 0 ? 'text-green-400' : 'text-rose-500'}`}>
                {totalAmount >= 0 ? '+' : ''}{formatIDR(totalAmount)}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* FILTER TAMPILAN SECTION */}
      <section className="px-6 mt-6">
        <label className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-wider">Filter Tampilan</label>
        <div className="flex gap-2 bg-white rounded-xl p-2 shadow-sm border border-slate-200">
          <button onClick={() => setFilterType('all')} className={`flex-1 py-2 px-2 rounded-lg text-xs font-bold transition-all ${filterType === 'all' ? 'app-btn text-white shadow-md' : 'text-slate-600 hover:text-slate-900'}`}>Semua</button>
          <button onClick={() => setFilterType('income')} className={`flex-1 py-2 px-2 rounded-lg text-xs font-bold transition-all ${filterType === 'income' ? 'bg-emerald-400 text-white shadow-md' : 'text-slate-600 hover:text-slate-900'}`}>Masuk</button>
          <button onClick={() => setFilterType('expense')} className={`flex-1 py-2 px-2 rounded-lg text-xs font-bold transition-all ${filterType === 'expense' ? 'bg-rose-400 text-white shadow-md' : 'text-slate-600 hover:text-slate-900'}`}>Keluar</button>
        </div>

        <div className="flex gap-2 bg-white rounded-xl p-2 shadow-sm border border-slate-200 mt-2">
          <button onClick={() => setTimeRange('week')} className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all ${timeRange === 'week' ? 'app-btn text-white shadow-md' : 'text-slate-600 hover:text-slate-900'}`}>1 Minggu</button>
          <button onClick={() => setTimeRange('month')} className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all ${timeRange === 'month' ? 'app-btn text-white shadow-md' : 'text-slate-600 hover:text-slate-900'}`}>1 Bulan</button>
        </div>
      </section>

      {/* DOWNLOAD SECTION BISA CUSTOM WAKTU */}
      <section className="px-6 mt-6">
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200">
          <label className="block text-xs font-bold text-slate-600 mb-3 uppercase tracking-wider">Unduh Statement</label>
          
          <select 
            value={downloadFilter} 
            onChange={(e) => setDownloadFilter(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 text-sm font-medium rounded-xl p-3 mb-3 outline-none focus:border-blue-500"
          >
            <option value="all">Semua Waktu</option>
            <option value="1month">1 Bulan Terakhir</option>
            <option value="1year">1 Tahun Terakhir</option>
            <option value="custom">Pilih Tanggal Kustom...</option>
          </select>

          {/* Menampilkan input kalender jika mode 'custom' dipilih */}
          {downloadFilter === 'custom' && (
            <div className="flex gap-2 mb-3 items-center">
              <div className="flex-1">
                <p className="text-[10px] text-slate-500 mb-1">Dari Tanggal</p>
                <input 
                  type="date" 
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-xs rounded-xl p-2 outline-none focus:border-blue-500"
                />
              </div>
              <span className="text-slate-400 text-xs mt-4">-</span>
              <div className="flex-1">
                <p className="text-[10px] text-slate-500 mb-1">Sampai Tanggal</p>
                <input 
                  type="date" 
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-xs rounded-xl p-2 outline-none focus:border-blue-500"
                />
              </div>
            </div>
          )}

          <button 
            onClick={handleDownloadStatement}
            className="w-full flex items-center justify-center gap-2 bg-slate-800 text-white py-3 rounded-xl text-sm font-bold shadow-sm hover:bg-slate-700 active:bg-slate-900 transition-all"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
            Unduh Statement
          </button>
        </div>
      </section>

      {/* TRANSACTION LIST */}
      <section className="px-6 mt-6 flex-1 overflow-y-auto">
        {filteredTransactions?.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            </div>
            <p className="text-slate-400 text-sm font-medium">Tidak ada transaksi</p>
            <p className="text-slate-300 text-xs mt-1">Belum ada aktivitas pada periode ini</p>
          </div>
        ) : (
          <div  className="space-y-4">
            {Object.entries(groupedTransactions).map(([date, dateTransactions]) => (
              <div key={date}>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 px-3">{date}</p>
                <div className="space-y-2">
                  {dateTransactions.map((trx) => (
                    <div 
                      key={trx.id} 
                      onClick={() => onEdit && onEdit(trx)}
                      className="bg-white rounded-xl p-4 mt-2 shadow-sm border border-slate-200 hover:shadow-md hover:bg-slate-50 transition-all flex flex-col gap-1.5 cursor-pointer active:bg-slate-100"
                    >
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
                        
                        {/* Kiri Bawah: Catatan & Waktu */}
                        <div className="flex flex-col gap-0.5">
                          <p className="text-xs text-slate-500 truncate max-w-[100px]">{trx.note || '-'}</p>
                          <p className="text-[10px] text-left text-slate-400">
                            {new Date(trx.date).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                        
                         {/* Kanan Bawah: Nominal */}
                      <div className="text-right mb-1">
                        <p className={`font-bold text-sm ${trx.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {trx.type === 'income' ? '+' : '-'}{formatIDR(trx.amount)}
                        </p>
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