// src/components/modals/ParcelamentoDetalhesModal.jsx

import React, { useMemo } from 'react';

// --- Funções Auxiliares ---
const formatCurrency = (value) => {
    if (typeof value !== 'number') return 'R$ --';
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

const formatEndDate = (dateString) => {
    if (!dateString) return 'Data não informada';
    const date = new Date(dateString + 'T00:00:00Z');
    return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric', timeZone: 'UTC' });
};

// --- Componente Auxiliar para Itens de Detalhe ---
const DetailItem = ({ icon, label, children }) => (
  <div className="flex items-start py-2 text-slate-800 dark:text-slate-200">
    <span className="material-symbols-outlined text-slate-600 dark:text-slate-400 mr-3 mt-1">{icon}</span>
    <div className="flex-1">
      <p className="font-semibold text-sm text-slate-700 dark:text-slate-300">{label}</p>
      <p className="text-slate-900 dark:text-white">{children}</p>
    </div>
  </div>
);

// A prop principal agora é 'despesa'
export default function ParcelamentoDetalhesModal({ isOpen, onClose, despesa }) {
    
    const progressData = useMemo(() => {
        if (!despesa || !despesa.isParcelada) {
            return { percentage: 0, paid: 0, total: 0, parcelaInfo: 'N/A', endDate: 'N/A', valorDaParcela: 0 };
        }

        const { valorTotalCompra, qtd_parcelas, mes_inicio_cobranca } = despesa;
        const valorDaParcela = valorTotalCompra / qtd_parcelas;

        // Calcula a data de início e a data de término
        const [startYear, startMonth] = mes_inicio_cobranca.split('-').map(Number);
        const startDate = new Date(startYear, startMonth - 1);
        const endDate = new Date(startYear, startMonth - 1);
        endDate.setMonth(endDate.getMonth() + qtd_parcelas - 1);
        
        // Calcula quantas parcelas já passaram
        const today = new Date();
        const monthsPassed = (today.getFullYear() - startDate.getFullYear()) * 12 + (today.getMonth() - startDate.getMonth());
        const parcelasPagas = Math.max(0, Math.min(monthsPassed + 1, qtd_parcelas));

        const valorPago = parcelasPagas * valorDaParcela;
        const percentage = valorTotalCompra > 0 ? Math.min(100, (valorPago / valorTotalCompra) * 100) : 0;
        
        return {
            percentage: Math.round(percentage),
            paid: valorPago,
            total: valorTotalCompra,
            parcelaInfo: `${parcelasPagas} de ${qtd_parcelas}`,
            endDate: endDate.toISOString().split('T')[0],
            valorDaParcela: valorDaParcela,
        };
    }, [despesa]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex justify-center items-center p-4">
            <div className="relative transform overflow-hidden w-full max-w-lg p-6
              bg-white dark:bg-slate-800 rounded-2xl border border-white/20
              shadow-2xl animate-fade-in-up">
                
                <div className="flex justify-between items-center pb-3 border-b border-gray-200 dark:border-slate-700 mb-4">
                    <h2 className="text-lg font-bold text-slate-800 dark:text-white">
                        Detalhes do Parcelamento
                    </h2>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-slate-700">
                        <span className="material-symbols-outlined text-slate-700 dark:text-slate-300">close</span>
                    </button>
                </div>
                
                <div className="mb-4">
                    <div className="flex justify-between items-end mb-1">
                       <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Progresso do Pagamento</span>
                       <span className="text-lg font-bold text-purple-600 dark:text-purple-400">{progressData.percentage}%</span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-4">
                        <div
                            className="bg-gradient-to-r from-purple-500 to-indigo-600 h-4 rounded-full transition-all duration-500"
                            style={{ width: `${progressData.percentage}%` }}
                        ></div>
                    </div>
                    <div className="text-right mt-1 text-sm text-slate-500 dark:text-slate-400">
                        {formatCurrency(progressData.paid)} de {formatCurrency(progressData.total)}
                    </div>
                </div>

                <div className="space-y-1 border-t border-gray-200 dark:border-slate-700 pt-2">
                    <DetailItem icon="receipt_long" label="Parcela Atual">
                        {progressData.parcelaInfo}
                    </DetailItem>
                    <DetailItem icon="payments" label="Valor da Parcela">
                        <span className="font-semibold">{formatCurrency(progressData.valorDaParcela)}</span>
                    </DetailItem>
                    <DetailItem icon="event_repeat" label="Previsão de Término">
                        {formatEndDate(progressData.endDate)}
                    </DetailItem>
                </div>
            </div>
        </div>
    );
}