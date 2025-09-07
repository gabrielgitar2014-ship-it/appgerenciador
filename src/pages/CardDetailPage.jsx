import React from 'react';
import { useFinance } from '../context/FinanceContext';
import CartaoPersonalizado from '../components/CartaoPersonalizado';
import { ListaTransacoes } from '../components/ListaTransacoes';
import { useModal } from '../context/ModalContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Plus } from 'lucide-react';

const CardDetailPage = ({ banco, onBack }) => {
  const { getSaldoPorBanco, deleteDespesa, fetchData } = useFinance();
  const { showModal, hideModal } = useModal();

  const handleSaveDespesa = () => {
    hideModal();
    fetchData();
  };

  const handleEditDespesa = (despesa) => {
    showModal('novaDespesa', {
      despesaParaEditar: despesa,
      bancoId: banco.id,
      onSave: handleSaveDespesa 
    });
  };

  const handleDeleteDespesa = (despesa) => {
    showModal('confirmation', {
      title: 'Confirmar Exclusão',
      description: `Tem certeza que deseja excluir a despesa "${despesa.description}"?`,
      onConfirm: async () => { 
        // A lógica de exclusão deve ser implementada no FinanceContext
        // await deleteDespesa(despesa.id);
        fetchData();
      }
    });
  };

  return (
    <div className="p-4 md:p-6 space-y-6 animate-fade-in-down">
      <Button variant="ghost" onClick={onBack} className="mb-4 gap-2">
        <ArrowLeft className="h-4 w-4" />
        Voltar
      </Button>

      <div className="flex justify-center">
        <CartaoPersonalizado
          banco={banco}
          saldo={getSaldoPorBanco(banco)}
          isSelected={true}
        />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Transações de {banco.nome}</CardTitle>
          <Button onClick={() => showModal('novaDespesa', { bancoId: banco.id, onSave: handleSaveDespesa })} className="gap-2">
            <Plus className="h-4 w-4" />
            Nova Despesa
          </Button>
        </CardHeader>
        <CardContent>
          <ListaTransacoes 
            nomeDoBanco={banco.nome} // <-- Alteração principal aqui
            onEdit={handleEditDespesa}
            onDelete={handleDeleteDespesa}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default CardDetailPage;