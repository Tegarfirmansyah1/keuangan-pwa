import Dexie from 'dexie';

export const db = new Dexie('KeuanganDB');

db.version(1).stores({
  transactions: '++id, type, amount, category, wallet, date',
  categories: '++id, type, name',
  wallets: '++id, name'
});

db.on('populate', async () => {
  await db.wallets.bulkAdd([
    { name: 'Dompet Tunai', icon: '💵' },
    { name: 'Seabank', icon: '💳' },
    { name: 'ShopeePay', icon: '📱' }
  ]);
  await db.categories.bulkAdd([
    { name: 'Makanan', type: 'expense', icon: '🍔' },
    { name: 'Transport', type: 'expense', icon: '🚗' },
    { name: 'Tagihan', type: 'expense', icon: '📄' },
    { name: 'Hiburan', type: 'expense', icon: '🎬' },
    { name: 'Gaji', type: 'income', icon: '💰' },
    { name: 'Bonus', type: 'income', icon: '🎁' }
  ]);
});

// Helper Functions
export const formatIDR = (number) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number || 0);
};

export const formatDate = (isoString) => {
  const date = new Date(isoString);
  return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};