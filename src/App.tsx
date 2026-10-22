import React, { useState, useEffect, useCallback } from 'react';
import {
  Santri,
  Peraturan,
  Pelanggaran,
  Perizinan,
  PortalWaliData,
  UserAdmin,
  KelasSantri
} from './types';
import { dataService } from './services/dataService';
import { ToastProvider, useToast } from './components/Toast';
import { AdminLayout } from './components/AdminLayout';
import { LandingPage } from './pages/LandingPage';
import { PortalWaliPage } from './pages/PortalWaliPage';
import { DashboardPage } from './pages/DashboardPage';
import { SantriPage } from './pages/SantriPage';
import { PerizinanPage } from './pages/PerizinanPage';
import { PelanggaranPage } from './pages/PelanggaranPage';
import { PeraturanPage } from './pages/PeraturanPage';
import { PengaturanPage } from './pages/PengaturanPage';
import { StudentAccessCardModal } from './components/StudentAccessCardModal';
import { ImportSantriModal } from './components/ImportSantriModal';
import { AiAssistantDrawer } from './components/AiAssistantDrawer';

function MainApp() {
  const { showToast } = useToast();

  // Authentication & Mode State
  const [currentUser, setCurrentUser] = useState<UserAdmin | null>(() => {
    // Jika URL dibuka dengan kode wali (?k=...), jangan muat sesi admin demi keamanan
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('k')) {
        return null;
      }
    }
    return dataService.getCurrentPengurus();
  });
  const [activeAdminTab, setActiveAdminTab] = useState<string>('dashboard');

  // URL query parameter for Wali Portal (?k=CODE)
  const [waliCode, setWaliCode] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('k');
    }
    return null;
  });

  const [portalData, setPortalData] = useState<PortalWaliData | null>(null);
  const [isLoadingPortal, setIsLoadingPortal] = useState<boolean>(false);
  const [isInvalidPortalCode, setIsInvalidPortalCode] = useState<boolean>(false);

  // Admin Data Collections
  const [santriList, setSantriList] = useState<Santri[]>([]);
  const [peraturanList, setPeraturanList] = useState<Peraturan[]>([]);
  const [pelanggaranList, setPelanggaranList] = useState<Pelanggaran[]>([]);
  const [perizinanList, setPerizinanList] = useState<Perizinan[]>([]);

  // Modals
  const [cardModalSantri, setCardModalSantri] = useState<Santri | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState<boolean>(false);
  const [isAiAssistantOpen, setIsAiAssistantOpen] = useState<boolean>(false);

  // Refresh admin dataset
  const refreshAdminData = useCallback(async () => {
    try {
      const [santri, peraturan, pelanggaran, perizinan] = await Promise.all([
        dataService.getSantriList(),
        dataService.getPeraturanList(),
        dataService.getPelanggaranList(),
        dataService.getPerizinanList()
      ]);
      setSantriList(santri);
      setPeraturanList(peraturan);
      setPelanggaranList(pelanggaran);
      setPerizinanList(perizinan);
    } catch (err) {
      console.error('Error fetching admin data:', err);
    }
  }, []);

  // Listen to auth changes and data updates
  useEffect(() => {
    const unsubAuth = dataService.onAuthChanged((user) => {
      setCurrentUser(user);
    });

    const unsubData = dataService.subscribe(() => {
      refreshAdminData();
      if (waliCode) {
        loadPortalData(waliCode);
      }
    });

    refreshAdminData();

    return () => {
      unsubAuth();
      unsubData();
    };
  }, [refreshAdminData, waliCode]);

  // Load Wali Portal data when waliCode changes
  const loadPortalData = useCallback(async (code: string) => {
    setIsLoadingPortal(true);
    setIsInvalidPortalCode(false);
    try {
      const data = await dataService.getPortalWaliByKode(code);
      if (data) {
        setPortalData(data);
      } else {
        setPortalData(null);
        setIsInvalidPortalCode(true);
      }
    } catch (err) {
      console.error('Error loading portal data:', err);
      setIsInvalidPortalCode(true);
    } finally {
      setIsLoadingPortal(false);
    }
  }, []);

  useEffect(() => {
    if (waliCode) {
      loadPortalData(waliCode);
    } else {
      setPortalData(null);
    }
  }, [waliCode, loadPortalData]);

  // Browser popstate listener
  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      setWaliCode(params.get('k'));
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Handlers for navigation
  const handleEnterWaliCode = async (code: string) => {
    // Pastikan sesi admin bersih agar mode wali privat
    await dataService.logoutPengurus();
    setCurrentUser(null);
    const clean = code.trim().toUpperCase();
    const url = new URL(window.location.href);
    url.searchParams.set('k', clean);
    window.history.pushState({}, '', url.toString());
    setWaliCode(clean);
  };

  const handleBackToLanding = async () => {
    // PENTING: Bersihkan sesi pengurus saat keluar dari portal wali
    // Ini menjamin pengguna SELALU kembali ke LandingPage (Halaman Utama publik)
    // dan tidak akan pernah bocor/langsung membuka Dashboard Admin
    await dataService.logoutPengurus();
    setCurrentUser(null);
    const url = new URL(window.location.href);
    url.searchParams.delete('k');
    window.history.pushState({}, '', url.pathname);
    setWaliCode(null);
    setPortalData(null);
    setIsInvalidPortalCode(false);
  };

  const handleLogout = async () => {
    await dataService.logoutPengurus();
    setCurrentUser(null);
    showToast('Berhasil keluar sesi pengurus', 'info');
  };

  const handleResetKodeAkses = async (santriId: string) => {
    await dataService.resetKodeAksesSantri(santriId);
    await refreshAdminData();
    const updated = await dataService.getSantriById(santriId);
    if (updated) {
      setCardModalSantri(updated);
    }
  };

  // 1. Wali Portal View
  if (waliCode) {
    return (
      <PortalWaliPage
        portalData={portalData}
        isLoading={isLoadingPortal}
        isInvalidCode={isInvalidPortalCode}
        onBackToLanding={handleBackToLanding}
      />
    );
  }

  // 2. Landing View (Unauthenticated)
  if (!currentUser) {
    return (
      <LandingPage
        onEnterKode={handleEnterWaliCode}
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          setActiveAdminTab('dashboard');
          refreshAdminData();
        }}
      />
    );
  }

  // 3. Admin Panel (Authenticated Pengurus)
  return (
    <AdminLayout
      activeTab={activeAdminTab}
      onSelectTab={(tab) => setActiveAdminTab(tab)}
      currentUser={currentUser}
      onLogout={handleLogout}
      onOpenAiAssistant={() => setIsAiAssistantOpen(true)}
    >
      {/* Tab: Dashboard */}
      {activeAdminTab === 'dashboard' && (
        <DashboardPage
          santriList={santriList}
          perizinanList={perizinanList}
          pelanggaranList={pelanggaranList}
          peraturanList={peraturanList}
          onNavigate={(tab) => setActiveAdminTab(tab)}
          onOpenAddSantri={() => setActiveAdminTab('santri')}
          onOpenAddPerizinan={() => setActiveAdminTab('perizinan')}
          onOpenAddPelanggaran={() => setActiveAdminTab('pelanggaran')}
        />
      )}

      {/* Tab: Data Santri (Grouped by Kelas 1-6 & Salaf + Naik Kelas Massal) */}
      {activeAdminTab === 'santri' && (
        <SantriPage
          santriList={santriList}
          onAddSantri={async (data) => {
            const res = await dataService.createSantri(data);
            await refreshAdminData();
            return res;
          }}
          onEditSantri={async (id, data) => {
            const res = await dataService.updateSantri(id, data);
            await refreshAdminData();
            return res;
          }}
          onDeleteSantri={async (id) => {
            setSantriList(prev => prev.filter(s => s.id !== id));
            setPelanggaranList(prev => prev.filter(p => p.santriId !== id));
            setPerizinanList(prev => prev.filter(p => p.santriId !== id));
            await dataService.deleteSantri(id);
          }}
          onNaikKelasMassal={async (promotions) => {
            const count = await dataService.naikKelasMassal(promotions);
            await refreshAdminData();
            return count;
          }}
          onOpenCardModal={(s) => setCardModalSantri(s)}
          onOpenImportModal={() => setIsImportModalOpen(true)}
        />
      )}

      {/* Tab: Perizinan */}
      {activeAdminTab === 'perizinan' && (
        <PerizinanPage
          perizinanList={perizinanList}
          santriList={santriList}
          onAddPerizinan={async (data) => {
            const res = await dataService.createPerizinan(data);
            await refreshAdminData();
            return res;
          }}
          onEditPerizinan={async (id, data) => {
            await dataService.updatePerizinan(id, data);
            await refreshAdminData();
          }}
          onDeletePerizinan={async (id) => {
            setPerizinanList(prev => prev.filter(p => p.id !== id));
            await dataService.deletePerizinan(id);
          }}
        />
      )}

      {/* Tab: Catatan Pelanggaran */}
      {activeAdminTab === 'pelanggaran' && (
        <PelanggaranPage
          pelanggaranList={pelanggaranList}
          santriList={santriList}
          peraturanList={peraturanList}
          onAddPelanggaran={async (data) => {
            const res = await dataService.createPelanggaran(data);
            await refreshAdminData();
            return res;
          }}
          onEditPelanggaran={async (id, data) => {
            await dataService.updatePelanggaran(id, data);
            await refreshAdminData();
          }}
          onDeletePelanggaran={async (id) => {
            setPelanggaranList(prev => prev.filter(p => p.id !== id));
            await dataService.deletePelanggaran(id);
          }}
        />
      )}

      {/* Tab: Tata Tertib & Sanksi (Unified) */}
      {activeAdminTab === 'peraturan' && (
        <PeraturanPage
          peraturanList={peraturanList}
          onAddPeraturan={async (data) => {
            const res = await dataService.createPeraturan(data);
            await refreshAdminData();
            return res;
          }}
          onEditPeraturan={async (id, data) => {
            await dataService.updatePeraturan(id, data);
            await refreshAdminData();
          }}
          onDeletePeraturan={async (id) => {
            setPeraturanList(prev => prev.filter(p => p.id !== id));
            await dataService.deletePeraturan(id);
          }}
        />
      )}

      {/* Tab: Pengaturan */}
      {activeAdminTab === 'pengaturan' && (
        <PengaturanPage
          santriList={santriList}
          pelanggaranList={pelanggaranList}
          onOpenImportModal={() => setIsImportModalOpen(true)}
          onLogout={handleLogout}
          userEmail={currentUser?.email}
        />
      )}

      {/* Global Modals for Admin */}
      <StudentAccessCardModal
        santri={cardModalSantri}
        isOpen={Boolean(cardModalSantri)}
        onClose={() => setCardModalSantri(null)}
        onResetCode={handleResetKodeAkses}
      />

      <ImportSantriModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImportDone={async (items) => {
          const res = await dataService.importBulkSantri(items);
          await refreshAdminData();
          return res;
        }}
      />

      {/* Asisten AI SiPontren (Chatbot & Input Cerdas Santri/Pelanggaran) */}
      <AiAssistantDrawer
        isOpen={isAiAssistantOpen}
        onClose={() => setIsAiAssistantOpen(false)}
        santriList={santriList}
        peraturanList={peraturanList}
        pelanggaranList={pelanggaranList}
        perizinanList={perizinanList}
        onSaveSantri={async (data) => {
          const res = await dataService.createSantri(data);
          await refreshAdminData();
          return res;
        }}
        onSavePelanggaran={async (data) => {
          const res = await dataService.createPelanggaran(data);
          await refreshAdminData();
          return res;
        }}
      />
    </AdminLayout>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <MainApp />
    </ToastProvider>
  );
}
