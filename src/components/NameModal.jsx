import { useState } from 'react';

export default function NameModal({ onSave }) {
  const [inputName, setInputName] = useState('');

  const handleSave = () => {
    if (inputName.trim() !== '') {
      onSave(inputName.trim());
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm px-4">
      <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-sm">
        <h2 className="text-xl font-bold text-gray-800 mb-2">
          Selamat Datang! 👋
        </h2>
        <p className="text-sm text-gray-600 mb-4">
          Siapa nama panggilanmu?
        </p>
        
        <input
          type="text"
          value={inputName}
          onChange={(e) => setInputName(e.target.value)}
          placeholder="Masukkan nama..."
          className="w-full border border-gray-300 rounded-lg p-3 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
          autoFocus
        />
        
        <button
          onClick={handleSave}
          className="w-full bg-blue-600 text-white font-semibold py-3 rounded-lg hover:bg-blue-700 transition"
        >
          Simpan Nama
        </button>
      </div>
    </div>
  );
}