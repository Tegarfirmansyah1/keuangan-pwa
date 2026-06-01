import Dexie from 'dexie';
import gopayIcon from './assets/gopay.png';
import shopeeIcon from './assets/shopee.png';
import seaIcon from './assets/sea.png';
import tunaiIcon from './assets/tunai.png';

export const db = new Dexie('KeuanganDB');

db.version(1).stores({
  transactions: '++id, type, amount, category, wallet, date',
  categories: '++id, type, name',
  wallets: '++id, name'
});

db.version(2).stores({
  transactions: '++id, type, amount, category, wallet, date',
  categories: '++id, name, type, icon',
  wallets: '++id, name, icon',
  budgets: '++id, category, amount'
});

db.on('populate', async () => {
  await db.wallets.bulkAdd([
    { name: 'Tunai', icon: tunaiIcon },
    { name: 'Seabank', icon: seaIcon },
    { name: 'ShopeePay', icon: shopeeIcon },
    { name: 'Gopay', icon: gopayIcon }
  ]);
  await db.categories.bulkAdd([
    { name: 'Makanan', type: 'expense', icon: '🍔' },
    { name: 'Date', type: 'expense', icon: '🍴' },
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