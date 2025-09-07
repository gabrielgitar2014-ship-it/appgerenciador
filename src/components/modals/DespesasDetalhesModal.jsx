// src/components/modals/DespesasDetalhesModal.jsx

import React, { useState, useMemo } from 'react';
import ParcelamentoDetalhesModal from './ParcelamentoDetalhesModal';

// --- Funções Auxiliares ---
const formatCurrency = (value) => {
    if (typeof value !== 'number') return 'R$ --';
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString + 'T00:00:00Z');
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC'
    });
};

// --- Componente Auxiliar para Itens de Detalhe ---
const DetailItem = ({ icon, label, children, isButton = false, onClick = () => {} }) => (
    <div 
      className={`flex items-center py-2 text-slate-800 dark:text-slate-200 ${isButton ? 'cursor-pointer hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg -mx-2 px-2' : ''}`}
      onClick={onClick}
    >
      <span className="material-symbols-outlined text-slate-600 dark:text-slate-400 mr-3 self-center">{icon}</span>
      <div className="flex-1">
        <p className="font-semibold text-sm text-slate-700 dark:text-slate-300">{label}</p>
        <div className={`${isButton ? 'text-blue-600 dark:text-blue-400 font-semibold' : 'text-slate-900 dark:text-white'}`}>{children}</div>
      </div>
      {isButton && <span className="material-symbols-outlined text-slate-500 self-center">chevron_right</span>}
    </div>
);

// A prop principal agora é 'despesa' e removemos onEdit/onDelete
export default function DespesasDetalhesModal({ isOpen, onClose, despesa }) {
    const [isParcelamentoModalOpen, setIsParcelamentoModalOpen] = useState(false);

    // Prepara os dados da despesa para serem exibidos
    const displayData = useMemo(() => {
        if (!despesa) return null;
        
        const isParcelada = despesa.qtd_parcelas > 1;

        return {
            ...despesa,
            isParcelada,
            // O valor total da compra é sempre o 'amount' da despesa principal
            valorTotalCompra: despesa.amount,
            // Unifica a data, pegando de 'data_compra' ou 'date'
            displayDate: despesa.data_compra || despesa.date,
        };
    }, [despesa]);

    if (!isOpen || !displayData) return null;

    return (
        <>
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex justify-center items-center p-4 transition-opacity duration-300">
                <div className="relative transform overflow-hidden w-full max-w-md p-6
                  bg-white dark:bg-slate-800 rounded-2xl
                  shadow-2xl transition-all animate-fade-in-up">
                    
                    <div className="flex justify-between items-center pb-3 border-b border-gray-200 dark:border-slate-700 mb-4">
                        <h2 className="text-xl font-bold text-slate-800 dark:text-white text-left flex-1 truncate" title={displayData.description || displayData.descricao}>
                            {displayData.description || displayData.descricao}
                        </h2>
                        <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-slate-700">
                            <span className="material-symbols-outlined text-slate-700 dark:text-slate-300">close</span>
                        </button>
                    </div>

                    <div className="space-y-1">
                        <DetailItem icon="shopping_cart" label="Valor Total">
                            <span className="font-bold text-lg text-red-600 dark:text-red-400">
                                {formatCurrency(displayData.valorTotalCompra)}
                            </span>
                        </DetailItem>
                        
                        <DetailItem icon="calendar_today" label="Data da Compra">
                           {formatDate(displayData.displayDate)}
                        </DetailItem>
                        
                        <DetailItem icon="credit_card" label="Método de Pagamento">
                            {displayData.metodo_pagamento}
                        </DetailItem>

                        {displayData.isParcelada && (
                            <div className="pt-3 mt-3 border-t border-gray-200 dark:border-slate-700">
                                <DetailItem
                                    isButton={true}
                                    onClick={() => setIsParcelamentoModalOpen(true)}
                                    icon="receipt_long"
                                    label="Parcelamento"
                                >
                                    Exibir Detalhes
                                </DetailItem>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <ParcelamentoDetalhesModal 
                isOpen={isParcelamentoModalOpen}
                onClose={() => setIsParcelamentoModalOpen(false)}
                despesa={displayData}
            />
        </>
    );
}