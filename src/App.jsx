import { ThemeProvider } from './context/ThemeContext';
import { FinanceProvider } from './context/FinanceContext';
import { ModalProvider } from './context/ModalContext';
import Dashboard from './pages/Dashboard';
import PwaUpdater from './components/PwaUpdater';

function App() {
  return (
    <ThemeProvider>
      {/* 👇 A ORDEM FOI INVERTIDA AQUI 👇 */}
      <ModalProvider>
        <FinanceProvider>
          <PwaUpdater />
          <Dashboard />
        </FinanceProvider>
      </ModalProvider>
    </ThemeProvider>
  );
}

export default App;