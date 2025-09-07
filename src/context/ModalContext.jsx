// src/context/ModalContext.jsx

import React, { createContext, useContext, useState } from 'react';

// Importe AQUI todos os modais que sua aplicação usará
import NovaDespesaModal from '../components/modals/NovaDespesaModal';
import NewIncomeModal from '../components/modals/NewIncomeModal';
import IncomeListModal from '../components/modals/IncomeListModal';
import NewFixedExpenseModal from '../components/modals/NewFixedExpenseModal';
import DespesasDetalhesModal from '../components/modals/DespesasDetalhesModal';
// ✅ 1. Importe o TransactionDetailModal
import TransactionDetailModal from '../components/modals/TransactionDetailModal';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';


const modalMap = {
  novaDespesa: NovaDespesaModal,
  novaRenda: NewIncomeModal,
  listaRendas: IncomeListModal,
  newFixedExpense: NewFixedExpenseModal,
  despesaDetalhes: DespesasDetalhesModal,
  // ✅ 2. Adicione a referência para o novo modal aqui
  transactionDetail: TransactionDetailModal,
};

const ModalContext = createContext();

export function ModalProvider({ children }) {
  const [modal, setModal] = useState({ type: null, props: {} });

  const showModal = (type, props = {}) => setModal({ type, props });
  const hideModal = () => setModal({ type: null, props: {} });

  const renderModal = () => {
    const ModalComponent = modalMap[modal.type];
    
    if (modal.type === 'confirmation') {
        // ... (lógica do confirmation modal)
    }

    if (!ModalComponent) return null;
    
    return <ModalComponent isOpen={true} onClose={hideModal} {...modal.props} />;
  };

  return (
    <ModalContext.Provider value={{ showModal, hideModal }}>
      {children}
      {renderModal()}
    </ModalContext.Provider>
  );
}

export const useModal = () => useContext(ModalContext);