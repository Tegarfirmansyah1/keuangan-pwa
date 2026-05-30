import { useState } from 'react';

export function useTransactions() {
  // Data dummy sementara
  const [transactions, setTransactions] = useState([
    { id: 1, type: 'income', amount: 5000000, category: 'Gaji', note: 'Gaji Bulanan', date: '2026-05-28' },
    { id: 2, type: 'expense', amount: 150000, category: 'Makan', note: 'Makan Siang', date: '2026-05-29' },
    { id: 3, type: 'expense', amount: 300000, category: 'Transport', note: 'Bensin', date: '2026-05-30' },
  ]);

  // Logika kalkulasi (otomatis menghitung ulang jika transactions berubah)
  const totalIncome = transactions
    .filter((t) => t.type === 'income')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const totalExpense = transactions
    .filter((t) => t.type === 'expense')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const currentBalance = totalIncome - totalExpense;

  // Tambah transaksi baru
  const addTransaction = (newTransaction) => {
    const id = Math.max(...transactions.map(t => t.id), 0) + 1;
    setTransactions([...transactions, { id, ...newTransaction }]);
  };

  // Hapus transaksi berdasarkan id
  const deleteTransaction = (id) => {
    setTransactions(transactions.filter(t => t.id !== id));
  };

  // Edit transaksi berdasarkan id
  const editTransaction = (id, updatedData) => {
    setTransactions(transactions.map(t => 
      t.id === id ? { ...t, ...updatedData } : t
    ));
  };

  return {
    transactions,
    totalIncome,
    totalExpense,
    currentBalance,
    addTransaction,
    deleteTransaction,
    editTransaction
  };
}