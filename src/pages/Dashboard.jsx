// src/pages/Dashboard.jsx

import { useState, useEffect, useMemo } from "react";
import { useFinance } from "../context/FinanceContext"; 

// Componentes
import Header from "../components/Header";
import Sidebar from "../components/Sidebar"; 
import WelcomeScreen from "../components/WelcomeScreen"; 

// Abas e a nova Página de Detalhes
import GeneralTab from "../components/tabs/Generaltab.jsx";
import FixasTab from "../components/tabs/FixasTab.jsx";
import BancosTab from "../components/tabs/BancosTab.jsx";
import CardDetailPage from "./CardDetailPage"; // Importa a nova página

const getCurrentMonth = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
};

const ErrorNotification = ({ message, onClose }) => (
  <div className="container mx-auto mt-4 p-4 bg-red-500 text-white rounded-xl shadow-lg flex justify-between items-center">
    <span>{message}</span>
    <button onClick={onClose} className="font-bold text-xl">×</button>
  </div>
);

export default function Dashboard({ onLogout, userRole }) {
  const { allParcelas, loading, error, setError, fetchData, clearAllData } = useFinance();
  
  // Estado para controlar a visualização: 'tabs' (padrão) ou 'cardDetail'
  const [view, setView] = useState({ name: 'tabs', data: null });
  
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  const [activeTab, setActiveTab] = useState(() => localStorage.getItem('activeTab') || 'geral');
  const [showWelcome, setShowWelcome] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const welcomeTimer = setTimeout(() => setShowWelcome(false), 3000);
    return () => clearTimeout(welcomeTimer);
  }, []); 

  useEffect(() => {
    localStorage.setItem('activeTab', activeTab);
  }, [activeTab]);

  // Funções para navegar entre as visualizações
  const handleNavigateToCard = (banco) => {
    setView({ name: 'cardDetail', data: banco });
  };
  const handleBackToTabs = () => {
    setView({ name: 'tabs', data: null });
  };

  const parcelasDoMesSelecionado = useMemo(() => {
    return (allParcelas || []).filter(p => p.data_parcela?.startsWith(selectedMonth));
  }, [selectedMonth, allParcelas]);
  
  const tabComponents = {
    geral: <GeneralTab selectedMonth={selectedMonth} parcelasDoMes={parcelasDoMesSelecionado} />,
    fixas: <FixasTab selectedMonth={selectedMonth} />,
    // A BancosTab agora recebe a função de navegação como propriedade
    bancos: <BancosTab onCardClick={handleNavigateToCard} />,
  };

  // Função para decidir qual componente renderizar
  const renderCurrentView = () => {
    if (view.name === 'cardDetail') {
      return <CardDetailPage banco={view.data} onBack={handleBackToTabs} />;
    }
    // O padrão é renderizar a aba ativa
    return tabComponents[activeTab];
  };

  if (showWelcome) {
    return <WelcomeScreen />;
  }

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-slate-900">
      <Sidebar
        isMenuOpen={isMenuOpen}
        setIsMenuOpen={setIsMenuOpen}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onSync={fetchData}
        onClearData={clearAllData}
        loading={loading}
        onLogout={onLogout}
        userRole={userRole}
      />
      {isMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/40 z-40 md:hidden"
          onClick={() => setIsMenuOpen(false)}
        ></div>
      )}
      
      <div className="flex-1 flex flex-col">
        <Header
          selectedMonth={selectedMonth}
          setSelectedMonth={setSelectedMonth}
          isMenuOpen={isMenuOpen}
          setIsMenuOpen={setIsMenuOpen}
        />
        
        <main className="container mx-auto p-4 pb-28 flex-1">
          {error && <ErrorNotification message={error} onClose={() => setError(null)} />}
          
          {loading ? (
            <div className="text-center mt-8"><p className="font-semibold text-lg dark:text-gray-200">Carregando dados...</p></div>
          ) : (
            <div className="mt-4">
              {renderCurrentView()}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}