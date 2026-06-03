import { createContext, useContext, useState, useEffect } from 'react';

// 1. Buat Context
const ThemeContext = createContext();

// 2. Buat Provider yang akan membungkus seluruh aplikasi
export function ThemeProvider({ children }) {
  // Ambil data dari localStorage saat pertama kali dimuat
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('appTheme') || 'light';
  });

  // Logika pergantian class HTML yang tadinya ada di App.jsx dipindah ke sini
  useEffect(() => {
    const htmlElement = document.documentElement;
    
    // Hapus semua tema lama
    htmlElement.classList.remove('light', 'dark', 'pink');
    
    // Terapkan tema baru
    htmlElement.classList.add(theme);
    
    // Simpan ke localStorage
    localStorage.setItem('appTheme', theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

// 3. Buat custom hook agar lebih mudah dipanggil di komponen lain
export function useTheme() {
  return useContext(ThemeContext);
}