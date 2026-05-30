export default function BalanceCard({ balance, income, expense }) {
  // Fungsi kecil untuk format Rupiah
  const formatIDR = (amount) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(amount);
  };

  return (
    <div className="bg-blue-600 rounded-2xl p-6 text-white shadow-lg mb-6">
      <p className="text-blue-100 text-sm font-medium mb-1">Total Saldo</p>
      <h2 className="text-3xl font-bold mb-6">{formatIDR(balance)}</h2>
      
      <div className="flex justify-between border-t border-blue-500 pt-4">
        <div>
          <p className="text-blue-200 text-xs mb-1">Pemasukan</p>
          <p className="font-semibold">{formatIDR(income)}</p>
        </div>
        <div className="text-right">
          <p className="text-blue-200 text-xs mb-1">Pengeluaran</p>
          <p className="font-semibold">{formatIDR(expense)}</p>
        </div>
      </div>
    </div>
  );
}