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
    // ... (sua função fetchData atual, sem alterações)
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ✅ CORREÇÃO APLICADA AQUI
  const clearAllData = () => {
    showModal('confirmation', {
      title: 'Limpar Todos os Dados?',
      description: 'Esta ação é irreversível e apagará TODAS as despesas e rendas. Você tem certeza absoluta?',
      confirmText: 'Sim, Limpar Tudo',
      onConfirm: async () => {
        setLoading(true);
        try {
          console.log("Iniciando a limpeza de dados...");

          // 1. Deleta os registros das tabelas no Supabase
          // Usamos Promise.all para executar as exclusões em paralelo
          const [parcelasError, despesasError, transactionsError] = await Promise.all([
            supabase.from('parcelas').delete().neq('id', 0),
            supabase.from('despesas').delete().neq('id', 0),
            supabase.from('transactions').delete().neq('id', 0)
          ]);

          // Verifica se houve erro em alguma das operações
          if (parcelasError.error) throw parcelasError.error;
          if (despesasError.error) throw despesasError.error;
          if (transactionsError.error) throw transactionsError.error;
          
          console.log("Dados do Supabase limpos com sucesso.");
          
          // 2. Limpa o estado local e busca os dados novamente (que agora estarão vazios)
          setTransactions([]);
          setAllParcelas([]);
          await fetchData();

        } catch (err) {
          setError('Falha ao limpar os dados.');
          console.error("Erro ao limpar dados:", err);
          alert("Ocorreu um erro ao limpar os dados. Verifique o console.");
        } finally {
          setLoading(false);
        }
      }
    });
  };

  const getDespesasPorBanco = (nomeDoBanco) => {
    // ... (sua função getDespesasPorBanco atual, sem alterações)
  };

  const getSaldoPorBanco = (banco) => {
    // ... (sua função getSaldoPorBanco atual, sem alterações)
  };

  const value = {
    loading,
    error,
    setError,
    fetchData,
    transactions,
    allParcelas,
    bancos,
    getDespesasPorBanco,
    getSaldoPorBanco,
    clearAllData, // A função agora está correta
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
