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
    setLoading(true);
    setError(null);
    try {
      const [despesasRes, parcelasRes, transactionsRes] = await Promise.all([
        supabase.from('despesas').select('*'),
        supabase.from('parcelas').select('*'),
        supabase.from('transactions').select('*')
      ]);

      if (despesasRes.error) throw despesasRes.error;
      if (parcelasRes.error) throw parcelasRes.error;
      if (transactionsRes.error) throw transactionsRes.error;

      const bancosData = [
        { id: 1, nome: 'Nubank', bandeira: 'mastercard', cor: 'bg-purple-800', ultimos_digitos: '4293', tipo: 'Crédito' },
        { id: 2, nome: 'Itaú', bandeira: 'visa', cor: 'bg-blue-950', ultimos_digitos: ['2600', '2195'], tipo: 'Crédito' },
        { id: 3, nome: 'Bradesco', bandeira: 'visa', cor: 'bg-black', ultimos_digitos: '1687', tipo: 'Crédito' },
        { id: 4, nome: 'PIX', bandeira: 'pix', cor: 'bg-emerald-500', ultimos_digitos: '', tipo: 'Transferência' },
      ];
      
      const todasTransacoes = [
        ...(transactionsRes.data || []), 
        ...(despesasRes.data || [])
      ];

      setBancos(bancosData);
      setTransactions(todasTransacoes);
      setAllParcelas(parcelasRes.data || []);

    } catch (err) {
      setError(err.message);
      console.error("Erro ao buscar dados do Supabase:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const getDespesasPorBanco = (nomeDoBanco) => {
    return transactions.filter(t => 
      t.metodo_pagamento?.toLowerCase() === nomeDoBanco?.toLowerCase() && 
      t.type !== 'income'
    );
  };

  const getSaldoPorBanco = (banco) => {
    const despesasDoBanco = getDespesasPorBanco(banco.nome);
    return despesasDoBanco.reduce((acc, despesa) => acc - despesa.amount, 0);
  };

  // ... (outras funções como clearAllData, etc.)

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
  };

  return (
    <FinanceContext.Provider value={value}>
      {children}
    </FinanceContext.Provider>
  );
}

// ✅ O PONTO CHAVE DA CORREÇÃO ESTÁ AQUI
// A palavra 'export' deve estar presente antes de 'const useFinance'
export const useFinance = () => {
    const context = useContext(FinanceContext);
    if (context === undefined) {
      throw new Error('useFinance deve ser usado dentro de um FinanceProvider');
    }
    return context;
};
