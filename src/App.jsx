import { Toaster } from "@/components/ui/toaster"
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import ScrollToTop from './components/ScrollToTop';
import AppShell from '@/components/layout/AppShell';
import ErrorBoundary from '@/components/ErrorBoundary';
import { useAppInit } from '@/hooks/useAppInit';
import Home from '@/pages/Home';
import Programs from '@/pages/Programs';
import Workout from '@/pages/Workout';
import History from '@/pages/History';
import Settings from '@/pages/Settings';
import ProgramCreate from '@/pages/ProgramCreate';
import ProgramPreview from '@/pages/ProgramPreview';

/**
 * Yerel başlatma kapısı: internet/backend/auth beklemez.
 * Yalnızca yerel DB hazırlanır; hata olursa kontrollü ekran gösterilir.
 */
const AppInitGate = ({ children }) => {
  const { status, retry } = useAppInit();

  if (status === 'loading') {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
        <p className="text-sm text-muted-foreground">Uygulama hazırlanıyor...</p>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-sm text-foreground">Yerel veriler hazırlanırken bir sorun oluştu.</p>
        <button
          onClick={retry}
          className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium"
        >
          Tekrar Dene
        </button>
      </div>
    );
  }

  return children;
};

const LocalApp = () => (
  <ErrorBoundary>
    <AppInitGate>
      <Routes>
        <Route element={<AppShell />}>
          <Route path="/" element={<Home />} />
          <Route path="/program-create" element={<ProgramCreate />} />
          <Route path="/program-preview/:programId" element={<ProgramPreview />} />
          <Route path="/programs" element={<Programs />} />
          <Route path="/workout" element={<Workout />} />
          <Route path="/history" element={<History />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
        <Route path="*" element={<PageNotFound />} />
      </Routes>
    </AppInitGate>
  </ErrorBoundary>
);

function App() {
  return (
    <>
      <Router>
        <ScrollToTop />
        <LocalApp />
      </Router>
      <Toaster />
    </>
  );
}

export default App
