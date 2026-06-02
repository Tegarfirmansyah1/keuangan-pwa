import { useState, useEffect, useCallback } from 'react';

export function useRouter(initialView = 'home') {
  const [currentView, setCurrentView] = useState(initialView);
  const [history, setHistory] = useState([initialView]);

  // Navigate ke halaman baru dengan logika Push & Replace
  const navigate = useCallback((view) => {
    // Abaikan jika menavigasi ke halaman yang sedang aktif
    if (view === currentView) return;

    setCurrentView(view);

    if (view === 'home') {
      // 1. Jika kembali ke home, timpa (replace) riwayat dan reset array history
      window.history.replaceState({ view: 'home' }, '', `/home`);
      setHistory(['home']);
    } 
    else if (currentView !== 'home') {
      // 2. Jika pindah antar menu (Misal: Pinjaman -> Budget)
      // REPLACE state browser agar riwayat tidak menumpuk. Back button HP akan mengarah ke Home.
      window.history.replaceState({ view }, '', `/${view}`);
      
      // Update history internal dengan menimpa item terakhir
      setHistory(prev => {
        const newHistory = [...prev];
        newHistory[newHistory.length - 1] = view;
        return newHistory;
      });
    } 
    else {
      // 3. Jika dari Home masuk ke menu baru (Misal: Home -> Pinjaman)
      // PUSH state browser (menambah jejak baru secara normal)
      window.history.pushState({ view }, '', `/${view}`);
      setHistory(prev => [...prev, view]);
    }
  }, [currentView]); // Membutuhkan currentView untuk pengecekan kondisi

  // Go back dengan memicu history bawaan browser
  const goBack = useCallback(() => {
    // Daripada memotong array state secara manual, jauh lebih aman mendelegasikan 
    // tugas ini ke browser. Ini akan otomatis memicu event 'popstate' di bawah.
    window.history.back();
  }, []);

  // Handle browser back button (hardware back button di mobile)
  useEffect(() => {
    // Daftarkan halaman pertama ke riwayat browser agar event.state tidak null
    window.history.replaceState({ view: initialView }, '', `/${initialView}`);

    const handlePopState = (event) => {
      const view = event.state?.view || 'home';
      setCurrentView(view);
      
      // Update history state tanpa menambah entry baru
      setHistory(prev => {
        const index = prev.lastIndexOf(view);
        if (index !== -1) {
          return prev.slice(0, index + 1);
        }
        // Fallback jika tidak ketemu di array
        return ['home']; 
      });
    };

    // Dengarkan popstate event (triggered ketika user click back button)
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [initialView]);

  return {
    currentView,
    navigate,
    goBack,
    historyLength: history.length
  };
}