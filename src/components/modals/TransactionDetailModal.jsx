// ARQUIVO: src/components/modals/TransactionDetailModal.jsx (VERSÃO MELHORADA)

import React from 'react';

// --- Funções Auxiliares (fora do componente para melhor performance) ---
const formatCurrency = (value) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value || 0);

const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("pt-BR", {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      timeZone: 'UTC',
    });
};

// --- Componente Auxiliar para Itens de Detalhe (melhora o layout) ---
const DetailItem = ({ icon, label, children }) => (
  <div className="flex items-center text-gray-700 py-2">
    <span className="material-symbols-outlined text-gray-500 mr-3">{icon}</span>
    <span className="font-semibold w-2/5">{label}:</span>
    <span className="w-3/5">{children}</span>
  </div>
);

export default function TransactionDetailModal({
  isOpen,
  onClose,
  onBack,
  transaction,
  onDelete,
  onEdit,
}) {
  if (!isOpen || !transaction) return null;

  const isIncome = transaction.type === "income";

  const handleDelete = () => {
    onDelete(transaction.id);
  };

  return (
    <div className="fixed inset-0 bg-black bg-transparent z-50 flex justify-center items-center p-4 transition-opacity duration-300">
      <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-lg animate-fade-in-up">
        
        {/* CABEÇALHO */}
        <div className="flex justify-between items-center pb-3 border-b mb-4">
          {onBack && (
            <button onClick={onBack} className="p-2 rounded-full hover:bg-gray-100">
              <span className="material-symbols-outlined text-gray-600">arrow_back</span>
            </button>
          )}
          <h2 className="text-xl font-bold text-gray-800 text-center flex-1 mx-4 truncate" title={transaction.description}>
            {transaction.description}
          </h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100">
            <span className="material-symbols-outlined text-gray-600">close</span>
          </button>
        </div>

        {/* CORPO COM DETALHES */}
        <div className="space-y-1">
          <DetailItem icon="paid" label={isIncome ? "Valor Recebido" : "Valor da Parcela"}>
            <span className={`font-bold text-lg ${isIncome ? "text-green-600" : "text-red-600"}`}>
              {formatCurrency(transaction.amount)}
            </span>
          </DetailItem>

          <DetailItem icon="calendar_month" label="Data de Vencimento">
            {formatDate(transaction.date)}
          </DetailItem>
          
          {transaction.metodo_pagamento && (
            <DetailItem icon="credit_card" label="Método">
              {transaction.metodo_pagamento}
            </DetailItem>
          )}

          {/* Exibe o status de 'pago' se disponível */}
          {typeof transaction.paid === 'boolean' && (
             <DetailItem icon="task_alt" label="Status">
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${transaction.paid ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                    {transaction.paid ? 'Pago' : 'Pendente'}
                </span>
            </DetailItem>
          )}

          {/* Seção de Parcelamento (se aplicável) */}
          {transaction.isParcelada && (
            <div className="pt-3 mt-3 border-t">
              <h3 className="text-md font-bold text-blue-700 mb-2">Detalhes da Compra</h3>
              <DetailItem icon="shopping_cart" label="Valor Total">
                <span className="font-semibold">{formatCurrency(transaction.valorTotalCompra)}</span>
              </DetailItem>
              <DetailItem icon="calendar_today" label="Data da Compra">
                {formatDate(transaction.data_compra)}
              </DetailItem>
              <DetailItem icon="receipt_long" label="Parcelamento">
                {transaction.parcelaInfo}
              </DetailItem>
              <DetailItem icon="event_repeat" label="Previsão de Término">
                {transaction.endDate}
              </DetailItem>
            </div>
          )}
        </div>

        {/* RODAPÉ COM AÇÕES */}
        <div className="mt-6 flex justify-end gap-4 border-t pt-4">
          <button
            onClick={handleDelete}
            className="flex items-center gap-2 py-2 px-4 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <span className="material-symbols-outlined">delete</span>
            Excluir
          </button>
          <button
            onClick={() => onEdit(transaction)}
            className="flex items-center gap-2 py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <span className="material-symbols-outlined">edit</span>
            Editar
          </button>
        </div>
      </div>
    </div>
  );
}