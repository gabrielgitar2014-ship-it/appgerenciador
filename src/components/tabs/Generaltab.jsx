import React, { useMemo } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { useModal } from '../../context/ModalContext';
import SummaryCard from '../SummaryCard'; 
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowUp, ArrowDown, Wallet } from 'lucide-react'; 

const getFinancialHealth = (income, expense) => {
  // ... (a função getFinancialHealth continua igual)
  if (income === 0 && expense > 0) return { status: "Crítico", style: "bg-gradient-to-br from-slate-800 to-black", message: "Você tem despesas mas nenhuma renda registrada para este mês." };
  if (income === 0) return { status: "Indefinido", style: "bg-slate-500", message: "Nenhuma renda registrada para este mês." };
  const percentage = (expense / income) * 100;
  if (percentage <= 65) return { status: "Saudável", style: "bg-gradient-to-br from-green-500 to-emerald-600", message: "Seus gastos estão sob controle. Ótimo trabalho!" };
  if (percentage <= 75) return { status: "Cuidado", style: "bg-gradient-to-br from-orange-500 to-amber-600", message: "Seus gastos estão aumentando. Fique atento!" };
  if (percentage <= 95) return { status: "Ruim", style: "bg-gradient-to-br from-red-500 to-rose-600", message: "Gastos elevados. É hora de revisar o orçamento." };
  return { status: "Crítico", style: "bg-gradient-to-br from-slate-800 to-black", message: "Alerta! Seus gastos superaram sua renda." };
};

// ✅ 1. RECEBA 'onHealthCardClick' COMO PROP
export default function GeneralTab({ selectedMonth, parcelasDoMes, onHealthCardClick }) {
  const { transactions, loading, fetchData } = useFinance();
  const { showModal, hideModal } = useModal();

  const handleSaveDespesa = () => {
    hideModal();
    fetchData();
  };

  const financialSummary = useMemo(() => {
    if (!transactions) return { income: 0, totalExpense: 0, balance: 0 };
    const income = transactions
      .filter(t => t.date?.startsWith(selectedMonth) && t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const fixedExpenses = transactions.filter(t => t.date?.startsWith(selectedMonth) && t.is_fixed && t.type === 'expense');
    const totalFixedExpense = fixedExpenses.reduce((sum, t) => sum + t.amount, 0);

    const totalVariableExpense = (parcelasDoMes || []).reduce((sum, p) => sum + p.amount, 0);

    const totalExpense = totalFixedExpense + totalVariableExpense;
    const balance = income - totalExpense;

    return { income, totalExpense, balance };
  }, [selectedMonth, transactions, parcelasDoMes]);

  const monthlyIncomes = useMemo(() => {
    if (!transactions) return [];
    return transactions.filter(t => t.type === 'income' && t.date.startsWith(selectedMonth));
  }, [selectedMonth, transactions]);
  
  const health = getFinancialHealth(financialSummary.income, financialSummary.totalExpense);

  const handleEditIncome = (income) => showModal('novaRenda', { incomeToEdit: income, onSave: handleSaveDespesa });
  const handleAddNewIncome = () => showModal('novaRenda', { onSave: handleSaveDespesa }); 
  
  return (
    <div className="space-y-6 animate-fade-in-down">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <SummaryCard
          title="Renda do Mês"
          value={financialSummary.income}
          icon={ArrowUp}
          colorClass="text-green-500"
          loading={loading}
          onClick={() => showModal('listaRendas', { 
              incomes: monthlyIncomes, 
              onEdit: handleEditIncome,
              onAddNew: handleAddNewIncome
          })}
        />
        <SummaryCard
          title="Despesas do Mês"
          value={financialSummary.totalExpense}
          icon={ArrowDown}
          colorClass="text-red-500"
          loading={loading}
          onClick={() => showModal('novaDespesa', { onSave: handleSaveDespesa })}
          isClickable={true} 
        />
        <SummaryCard
          title="Saldo"
          value={financialSummary.balance}
          icon={Wallet}
          colorClass={financialSummary.balance >= 0 ? 'text-blue-500' : 'text-orange-500'}
          loading={loading}
        />
      </div>
      
      {loading ? (
        <Skeleton className="h-20 rounded-2xl" />
      ) : (
        // ✅ 2. FAÇA O CARD SER CLICÁVEL
        <div 
          onClick={onHealthCardClick} // Chama a função recebida por prop
          className={`p-5 rounded-2xl shadow-lg text-white ${health.style} cursor-pointer transition-transform hover:scale-[1.02] active:scale-[0.99]`}
        >
          <h3 className="font-bold text-lg">{health.status}</h3>
          <p className="text-sm opacity-90">{health.message}</p>
        </div>
      )}
    </div>
  );
}
