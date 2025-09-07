// src/context/FinanceContext.jsx

import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { useModal } from './ModalContext';
import { supabase } from '../supabaseClient'; 

const FinanceContext = createContext();

export function FinanceProvider({ children }) {
  const { showModal } = useModal();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [bancos, setBancos] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [allParcelas, setAllParcelas] = useState([]);

  const fetchData = useCallback(async () => {
    // ... sua função fetchData, sem alterações
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ✅ LÓGICA DE onConfirm DENTRO DE clearAllData FOI REESCRITA
  const clearAllData = () => {
    showModal('confirmation', {
      title: 'Limpar Todos os Dados?',
      description: 'Esta ação é irreversível e apagará TODAS as despesas e rendas. Você tem certeza absoluta?',
      confirmText: 'Sim, Limpar Tudo',
      onConfirm: async () => {
        setLoading(true);
        console.log("--- PROCESSO DE LIMPEZA INICIADO ---");
        try {
          console.log("1. Deletando da tabela 'parcelas'...");
          const { error: parcelasError } = await supabase.from('parcelas').delete().neq('id', 0);
          if (parcelasError) throw parcelasError;
          console.log("   -> 'parcelas' limpa com sucesso.");

          console.log("2. Deletando da tabela 'despesas'...");
          const { error: despesasError } = await supabase.from('despesas').delete().neq('id', 0);
          if (despesasError) throw despesasError;
          console.log("   -> 'despesas' limpa com sucesso.");

          console.log("3. Deletando da tabela 'transactions'...");
          const { error: transactionsError } = await supabase.from('transactions').delete().neq('id', 0);
          if (transactionsError) throw transactionsError;
          console.log("   -> 'transactions' limpa com sucesso.");
          
          console.log("4. Banco de dados limpo. Buscando dados novamente...");
          await fetchData();
          console.log("5. Dados atualizados (devem estar vazios).");

        } catch (err) {
          setError('Falha ao limpar os dados.');
          console.error("ERRO DETALHADO AO LIMPAR DADOS:", err);
          alert(`Ocorreu um erro ao limpar os dados: ${err.message}`);
        } finally {
          setLoading(false);
          console.log("--- PROCESSO DE LIMPEZA FINALIZADO (loading: false) ---");
        }
      }
    });
  };

  // ... (resto das suas funções, como getDespesasPorBanco, getSaldoPorBanco, etc.)

  const value = {
    loading,
    error,
    setError,
    fetchData,
    transactions,
    allParcelas,
    bancos,
    // ...
    clearAllData,
  };

  return (
    <FinanceContext.Provider value={value}>
      {children}
    </FinanceContext.Provider>
  );
}

export const useFinance = () => {
    const context = useContext(FinanceContext);
    if (context === undefined) {
      throw new Error('useFinance deve ser usado dentro de um FinanceProvider');
    }
    return context;
};
