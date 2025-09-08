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
        { id: 2, nome: 'Itaú', bandeira: 'visa', cor: 'bg-blue-950', ultimos_digitos: ['2600', '5598'], tipo: 'Crédito' },
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

  const deleteDespesa = async (despesaObject) => {
    // Verifica se é uma despesa fixa (da tabela 'transactions')
    if (despesaObject.is_fixed) {
      console.log("Deletando despesa fixa com ID:", despesaObject.id);
      const { error } = await supabase.from('transactions').delete().eq('id', despesaObject.id);
      if (error) {
        console.error("Erro ao deletar despesa fixa:", error);
        alert(`Erro: ${error.message}`);
      }
    } else {
      // É uma despesa variável (da tabela 'despesas' e 'parcelas')
      // O ID principal da compra está em 'despesa_id'
      const despesaId = despesaObject.despesa_id;
      if (!despesaId) {
        console.error("Objeto da despesa não contém 'despesa_id'", despesaObject);
        alert("Erro: Não foi possível identificar a despesa principal para excluir.");
        return;
      }
      
      console.log(`Deletando despesa variável e suas parcelas (ID principal: ${despesaId})`);
      
      // 1. Deleta todas as parcelas associadas
      const { error: parcelasError } = await supabase.from('parcelas').delete().eq('despesa_id', despesaId);
      if (parcelasError) {
        console.error("Erro ao deletar parcelas:", parcelasError);
        alert(`Erro: ${parcelasError.message}`);
        return;
      }

      // 2. Deleta a despesa principal
      const { error: despesaError } = await supabase.from('despesas').delete().eq('id', despesaId);
      if (despesaError) {
        console.error("Erro ao deletar despesa principal:", despesaError);
        alert(`Erro: ${despesaError.message}`);
      }
    }
  };

  const getSaldoPorBanco = (banco, selectedMonth) => {
    const despesasFixasDoMes = transactions.filter(t => 
      t.metodo_pagamento?.toLowerCase() === banco.nome?.toLowerCase() &&
      t.type === 'expense' &&
      t.is_fixed === true &&
      t.date?.startsWith(selectedMonth)
    );

    const despesasPrincipaisDoBanco = transactions.filter(t => 
      t.metodo_pagamento?.toLowerCase() === banco.nome?.toLowerCase() &&
      !t.is_fixed 
    );
    const idsDespesasVariaveis = despesasPrincipaisDoBanco.map(d => d.id);

    const parcelasVariaveisDoMes = allParcelas.filter(p => 
      idsDespesasVariaveis.includes(p.despesa_id) &&
      p.data_parcela?.startsWith(selectedMonth)
    );

    const totalFixo = despesasFixasDoMes.reduce((acc, despesa) => acc - despesa.amount, 0);
    const totalVariavel = parcelasVariaveisDoMes.reduce((acc, parcela) => acc - parcela.amount, 0);

    return totalFixo + totalVariavel;
  };
  
  const value = {
    loading,
    error,
    setError,
    fetchData,
    transactions,
    allParcelas,
    bancos,
    getSaldoPorBanco,
    deleteDespesa, // Exportando a nova função
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
