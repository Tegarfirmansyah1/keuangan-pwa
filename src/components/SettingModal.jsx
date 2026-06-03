import { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext'; 

export default function SettingsModal({ 
  isOpen, onClose, currentName, onSaveName, isFirstTime 
}) {
  const [inputName, setInputName] = useState(currentName || '');
  
  // Panggil state dan fungsi pengubah tema langsung dari Context!
  const { theme, setTheme } = useTheme(); 

  useEffect(() => {
    setInputName(currentName || '');
  }, [currentName]);

  if (!isOpen) return null;

  const handleSave = () => {
    if (inputName.trim() !== '') {
      onSaveName(inputName.trim());
      if (onClose) onClose();
    } else if (isFirstTime) {
      alert('Nama panggilan tidak boleh kosong!');
    }
  };

  return (
   <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 px-4">
      <div className="app-card rounded-xl p-6 w-full max-w-sm">       
        <h2 className="text-xl font-bold mb-6 app-text">
          {isFirstTime ? 'Selamat Datang! 👋' : 'Pengaturan ⚙️'}
        </h2>
        
        {/* Menu 1: Nama Panggilan */}
        <div className="mb-5">
          <label className="block text-sm font-medium app-text-muted mb-2">
            Nama Panggilan
          </label>
          <input
            type="text"
            value={inputName}
            onChange={(e) => setInputName(e.target.value)}
            placeholder="Masukkan nama..."
            className="w-full rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-pink-400 app-bg app-text app-border"
            autoFocus={isFirstTime}
          />
        </div>

        {/* Menu 2: Pilihan Tema Aplikasi (3 Menu Warna) */}
        <div className="mb-6">
          <label className="block text-sm font-medium app-text-muted mb-2">Tema Aplikasi</label>
          <div className="grid grid-cols-3 gap-2">
            
            <button
              onClick={() => setTheme('light')}
              className={`py-2 rounded-lg text-xs font-semibold border ${
                theme === 'light' ? 'bg-blue-600 text-white' : 'app-text'
              }`}
            >
              ☀️ Terang
            </button>
            
            <button
              onClick={() => setTheme('dark')}
              className={`py-2 rounded-lg text-xs font-semibold border ${
                theme === 'dark' ? 'bg-slate-700 text-white' : 'app-text'
              }`}
            >
              🌙 Gelap
            </button>

            <button
              onClick={() => setTheme('pink')}
              className={`py-2 rounded-lg text-xs font-semibold border ${
                theme === 'pink' ? 'bg-pink-600 text-white' : 'app-text'
              }`}
            >
              🌸 Pink
            </button>
          </div>
        </div>
        
        <button
          type="button"
          onClick={handleSave}
          className="w-full app-btn font-semibold py-3 rounded-lg hover:opacity-90 transition shadow-md"
        >
          {isFirstTime ? 'Mulai Gunakan Aplikasi' : 'Simpan & Tutup'}
        </button>

      </div>
    </div>
  );
}