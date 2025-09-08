import React, { useState, useMemo } from 'react';
import { useFinance } from '../context/FinanceContext';
import CartaoPersonalizado from '../components/CartaoPersonalizado';
import { ListaTransacoes } from '../components/ListaTransacoes';
import { useModal } from '../context/ModalContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import SearchBar from '../components/SearchBar';

const CardDetailPage = ({ banco, onBack, selectedMonth }) => {
  const { getSaldoPorBanco, fetchData, deleteDespesa, transactions, allParcelas } = useFinance();
  const { showModal, hideModal } = useModal();
  const [searchTerm, setSearchTerm] = useState('');

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const despesasDoMes = useMemo(() => {
    if (!banco || !selectedMonth) return [];
    const bancoNomeLowerCase = banco.nome.toLowerCase();

    const despesasFixas = transactions.filter(t => t.metodo_pagamento?.toLowerCase() === bancoNomeLowerCase && t.is_fixed && t.date?.startsWith(selectedMonth));
    const despesasPrincipaisDoBanco = transactions.filter(t => t.metodo_pagamento?.toLowerCase() === bancoNomeLowerCase && !t.is_fixed);
    const idsDespesasVariaveis = despesasPrincipaisDoBanco.map(d => d.id);

    const parcelasVariaveis = allParcelas
      .filter(p => idsDespesasVariaveis.includes(p.despesa_id) && p.data_parcela?.startsWith(selectedMonth))
      .map(p => {
        const despesaPrincipal = despesasPrincipaisDoBanco.find(d => d.id === p.despesa_id);
        return { ...despesaPrincipal, ...p, id: p.id };
      });

    const todasAsDespesas = [...despesasFixas, ...parcelasVariaveis];
    
    const filtered = searchTerm
      ? todasAsDespesas.filter(d => d.description?.toLowerCase().includes(searchTerm.toLowerCase()))
      : todasAsDespesas;

    // Ao mudar os filtros, resetamos para a primeira página para evitar páginas vazias
    setCurrentPage(1); 
    return filtered.sort((a, b) => new Date(b.data_parcela || b.date) - new Date(a.data_parcela || a.date));
  }, [banco, selectedMonth, transactions, allParcelas, searchTerm]);

  const totalPages = Math.ceil(despesasDoMes.length / itemsPerPage);
  const currentData = despesasDoMes.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const nextPage = () => {
    setCurrentPage((current) => Math.min(current + 1, totalPages));
  };

  const prevPage = () => {
    setCurrentPage((current) => Math.max(current - 1, 1));
  };

  const handleSaveDespesa = () => { hideModal(); fetchData(); };
  const handleEditDespesa = (despesa) => { showModal('novaDespesa', { despesaParaEditar: despesa, onSave: handleSaveDespesa }); };
  const handleDeleteDespesa = (despesa) => {
    showModal('confirmation', {
      title: 'Confirmar Exclusão',
      description: `Tem certeza que deseja excluir a despesa "${despesa.description || despesa.descricao}"?`,
      onConfirm: async () => { await deleteDespesa(despesa); fetchData(); }
    });
  };

  return (
    // Adiciona classes para ocupar a tela verticalmente e usar flexbox
    <div className="p-4 md:p-6 space-y-4 flex flex-col h-full overflow-hidden"> 
      <Button variant="ghost" onClick={onBack} className="mb-4 gap-2 self-start"> 
        <ArrowLeft className="h-4 w-4" /> Voltar 
      </Button>

      <div className="flex justify-center flex-shrink-0"> {/* flex-shrink-0 para não diminuir o cartão */}
        <CartaoPersonalizado banco={banco} saldo={getSaldoPorBanco(banco, selectedMonth)} isSelected={true} />
      </div>

      <Card className="flex-grow flex flex-col min-h-0"> {/* flex-grow para o card ocupar o espaço restante */}
        <CardHeader className="flex-shrink-0"> {/* Mantém o cabeçalho fixo */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <CardTitle>Transações de {banco.nome}</CardTitle>
            <div className="flex items-center gap-2 w-full md:w-auto">
              <SearchBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} placeholder="Buscar transação..." />
              <Button onClick={() => showModal('novaDespesa', { onSave: handleSaveDespesa })} className="gap-2">
                <Plus className="h-4 w-4" /> <span className="hidden sm:inline">Nova Despesa</span>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex-grow flex flex-col min-h-0 p-0"> {/* flex-grow e p-0 para controlar padding */}
          {/* O container abaixo gerencia a rolagem da tabela */}
          <div className="flex-grow overflow-y-auto px-6"> {/* Adicionado px-6 para padding horizontal da tabela */}
            <ListaTransacoes transactions={currentData} onEdit={handleEditDespesa} onDelete={handleDeleteDespesa} />
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-end space-x-2 pt-4 pb-4 px-6 flex-shrink-0"> {/* Mantém a paginação fixa */}
              <span className="text-sm text-muted-foreground"> Página {currentPage} de {totalPages} </span>
              <Button variant="outline" size="sm" onClick={prevPage} disabled={currentPage === 1}>
                <ChevronLeft className="h-4 w-4" /> Anterior
              </Button>
              <Button variant="outline" size="sm" onClick={nextPage} disabled={currentPage === totalPages}>
                Próximo <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CardDetailPage;
