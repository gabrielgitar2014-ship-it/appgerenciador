import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';

const FinanceContext = createContext();

export const useFinance = () => useContext(FinanceContext);

export const FinanceProvider = ({ children }) => {
  const [transactions, setTransactions] = useState([]);
  const [allParcelas, setAllParcelas] = useState([]);
  const [bancos, setBancos] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { data: bancosData, error: bancosError } = await supabase.from('bancos').select('*');
      if (bancosError) throw bancosError;
      setBancos(bancosData || []);

      const { data: transactionsData, error: transactionsError } = await supabase.from('transactions').select('*');
      if (transactionsError) throw transactionsError;

      const { data: despesasData, error: despesasError } = await supabase.from('despesas').select('*');
      if (despesasError) throw despesasError;
      
      setTransactions([...(transactionsData || []), ...(despesasData || [])]);

      const { data: parcelasData, error: parcelasError } = await supabase.from('parcelas').select('*');
      if (parcelasError) throw parcelasError;
      setAllParcelas(parcelasData || []);

    } catch (error) {
      console.error("Erro ao buscar dados financeiros:", error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const getSaldoPorBanco = (banco, selectedMonth) => {
    if (!banco || !selectedMonth) return 0;

    const bancoNomeLowerCase = banco.nome.toLowerCase();

    const despesasFixas = transactions.filter(t =>
      t.is_fixed &&
      t.metodo_pagamento?.toLowerCase() === bancoNomeLowerCase &&
      t.date?.startsWith(selectedMonth)
    );

    const despesasPrincipaisDoBanco = transactions.filter(t => 
      !t.is_fixed &&
      t.metodo_pagamento?.toLowerCase() === bancoNomeLowerCase
    );
    const idsDespesasVariaveis = despesasPrincipaisDoBanco.map(d => d.id);
    
    const parcelasVariaveisDoMes = allParcelas.filter(p => 
      idsDespesasVariaveis.includes(p.despesa_id) && 
      p.data_parcela?.startsWith(selectedMonth)
    );

    const totalFixo = despesasFixas.reduce((acc, t) => acc + t.amount, 0);
    const totalVariavel = parcelasVariaveisDoMes.reduce((acc, p) => acc + p.amount, 0);

    return totalFixo + totalVariavel;
  };
  
  const addDespesa = async (despesaData) => {
    // Implemente a lógica para adicionar nova despesa se necessário
    console.log("Adicionando despesa:", despesaData);
    // Exemplo: await supabase.from('despesas').insert([despesaData]);
    await fetchData();
  };
  
  const deleteDespesa = async (despesa) => {
    try {
        if (despesa.is_fixed) {
            const { error } = await supabase.from('transactions').delete().eq('id', despesa.id);
            if (error) throw error;
        } else {
            const { error: parcelaError } = await supabase.from('parcelas').delete().eq('id', despesa.id);
            if (parcelaError) throw parcelaError;
            // Opcional: verificar se era a última parcela para apagar a despesa "mãe"
        }
        await fetchData();
    } catch (error) {
        console.error("Erro ao deletar despesa:", error.message);
    }
  };
  
  const updateDespesa = async (despesaId, updatedData, isParcelada = false) => {
    setLoading(true);
    try {
      if (!isParcelada) {
        const { error } = await supabase
          .from('transactions')
          .update(updatedData)
          .eq('id', despesaId);
        if (error) throw error;
      } else {
        const { data: despesaAtualizada, error: updateError } = await supabase
          .from('despesas')
          .update({
            description: updatedData.description,
            amount: updatedData.amount,
            metodo_pagamento: updatedData.metodo_pagamento,
            qtd_parcelas: updatedData.qtd_parcelas,
            mes_inicio_cobranca: updatedData.mes_inicio_cobranca
          })
          .eq('id', despesaId)
          .select()
          .single();
          
        if (updateError) throw updateError;
        if (!despesaAtualizada) throw new Error("Despesa não encontrada para atualizar.");

        const { error: deleteError } = await supabase.from('parcelas').delete().eq('despesa_id', despesaId);
        if (deleteError) throw deleteError;

        const valorParcela = despesaAtualizada.amount / despesaAtualizada.qtd_parcelas;
        const parcelasParaInserir = [];
        const [anoInicio, mesInicio] = despesaAtualizada.mes_inicio_cobranca.split('-').map(Number);
        
        for (let i = 1; i <= despesaAtualizada.qtd_parcelas; i++) {
          const dataParcela = new Date(anoInicio, mesInicio - 1, 1);
          dataParcela.setMonth(dataParcela.getMonth() + (i - 1));
          parcelasParaInserir.push({
            despesa_id: despesaAtualizada.id,
            numero_parcela: i,
            amount: valorParcela,
            data_parcela: dataParcela.toISOString().split('T')[0],
            paga: false
          });
        }

        const { error: insertError } = await supabase.from('parcelas').insert(parcelasParaInserir);
        if (insertError) throw insertError;
      }
      await fetchData();
    } catch (error) {
      console.error("Erro ao atualizar despesa:", error.message);
    } finally {
      setLoading(false);
    }
  };

  const value = {
    transactions,
    allParcelas,
    bancos,
    loading,
    fetchData,
    getSaldoPorBanco,
    addDespesa,
    updateDespesa,
    deleteDespesa,
  };

  return (
    <FinanceContext.Provider value={value}>
      {children}
    </FinanceContext.Provider>
  );
};
