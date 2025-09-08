import React from 'react';
import { useFinance } from '../context/FinanceContext';
import CartaoPersonalizado from '../components/CartaoPersonalizado';
import { ListaTransacoes } from '../components/ListaTransacoes';
import { useModal } from '../context/ModalContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Plus } from 'lucide-react';

const CardDetailPage = ({ banco, onBack, selectedMonth }) => {
  const { getSaldoPorBanco, fetchData, deleteDespesa } = useFinance();
  const { showModal, hideModal } = useModal();

  const handleSaveDespesa = () => {
    hideModal();
    fetchData();
  };

  const handleEditDespesa = (despesa) => {
    showModal('novaDespesa', { despesaParaEditar: despesa, onSave: handleSaveDespesa });
  };

  const handleDeleteDespesa = (despesa) => {
    // 1. Primeiro log: Verifica se a função foi chamada e qual despesa recebeu.
    console.log('handleDeleteDespesa foi chamada com:', despesa);

    showModal('confirmation', {
      title: 'Confirmar Exclusão',
      description: `Tem certeza que deseja excluir a despesa "${despesa.description || despesa.descricao}"? Esta ação não pode ser desfeita.`,
      confirmText: 'Sim, Excluir',
      onConfirm: async () => {
        // 2. Segundo log: Confirma que o callback onConfirm foi ativado.
        console.log('Confirmação de exclusão recebida para a despesa:', despesa);
        
        try {
          // 3. Tentativa de exclusão.
          await deleteDespesa(despesa); // Chama a função de exclusão do contexto
          
          // 4. Log de sucesso antes de atualizar os dados.
          console.log('Despesa excluída com sucesso! Atualizando a lista...');
          fetchData();                   // Atualiza a interface
        } catch (error) {
          // 5. Log de erro: Se algo der errado na função deleteDespesa, será capturado aqui.
          console.error('Ocorreu um erro ao tentar excluir a despesa:', error);
        }
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
          saldo={getSaldoPorBanco(banco, selectedMonth)}
          isSelected={true}
        />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Transações de {banco.nome}</CardTitle>
          <Button onClick={() => showModal('novaDespesa', { onSave: handleSaveDespesa })} className="gap-2">
            <Plus className="h-4 w-4" />
            Nova Despesa
          </Button>
        </CardHeader>
        <CardContent>
          <ListaTransacoes 
            bancoNome={banco.nome}
            selectedMonth={selectedMonth}
            onEdit={handleEditDespesa}
            onDelete={handleDeleteDespesa}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default CardDetailPage;
