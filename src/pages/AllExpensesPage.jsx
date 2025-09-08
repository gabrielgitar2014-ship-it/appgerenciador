import React, { useState, useMemo } from 'react';
import { useFinance } from '../context/FinanceContext';
import { ListaTransacoes } from '../components/ListaTransacoes';
import { useModal } from '../context/ModalContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import SearchBar from '../components/SearchBar';

const AllExpensesPage = ({ onBack, selectedMonth }) => {
  const { fetchData, deleteDespesa, transactions, allParcelas } = useFinance();
  const { showModal, hideModal } = useModal();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortOrder, setSortOrder] = useState('recentes');

  const itemsPerPage = 15; // Aumentado para mostrar mais itens

  const despesasDoMes = useMemo(() => {
    if (!selectedMonth) return [];

    // Pega todas as despesas fixas do mês
    const despesasFixas = transactions.filter(t => t.is_fixed && t.type === 'expense' && t.date?.startsWith(selectedMonth));
    
    // Pega todas as despesas principais para encontrar as parcelas
    const despesasPrincipais = transactions.filter(t => !t.is_fixed);
    const idsDespesasVariaveis = despesasPrincipais.map(d => d.id);

    // Pega todas as parcelas do mês
    const parcelasVariaveis = allParcelas
      .filter(p => idsDespesasVariaveis.includes(p.despesa_id) && p.data_parcela?.startsWith(selectedMonth))
      .map(p => {
        const despesaPrincipal = despesasPrincipais.find(d => d.id === p.despesa_id);
        const parcelaInfo = despesaPrincipal ? `Parcela ${p.numero_parcela}/${despesaPrincipal.qtd_parcelas}` : '';
        return { ...despesaPrincipal, ...p, id: p.id, parcelaInfo: parcelaInfo };
      });

    const todasAsDespesas = [...despesasFixas, ...parcelasVariaveis];
    
    const filtered = searchTerm
      ? todasAsDespesas.filter(d => {
          const searchTermLower = searchTerm.toLowerCase();
          const normalizedSearchTermForValue = searchTerm.replace(',', '.');
          return (
            d.description?.toLowerCase().includes(searchTermLower) ||
            d.id.toString().includes(searchTerm) ||
            d.despesa_id?.toString().includes(searchTerm) ||
            d.amount?.toString().includes(normalizedSearchTermForValue)
          );
        })
      : todasAsDespesas;
    
    const sorted = filtered.sort((a, b) => {
      const dateA = new Date(a.data_compra || a.date);
      const dateB = new Date(b.data_compra || b.date);
      const descA = a.description?.toLowerCase() || '';
      const descB = b.description?.toLowerCase() || '';
      switch (sortOrder) {
        case 'antigas': return dateA - dateB;
        case 'a-z': return descA.localeCompare(descB);
        case 'z-a': return descB.localeCompare(descA);
        default: return dateB - dateA;
      }
    });

    setCurrentPage(1); 
    return sorted;
  }, [selectedMonth, transactions, allParcelas, searchTerm, sortOrder]);

  const totalPages = Math.ceil(despesasDoMes.length / itemsPerPage);
  const currentData = despesasDoMes.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const nextPage = () => setCurrentPage((c) => Math.min(c + 1, totalPages));
  const prevPage = () => setCurrentPage((c) => Math.max(c - 1, 1));
  
  const handleSaveDespesa = () => { hideModal(); fetchData(); };
  const handleEditDespesa = (despesa) => {
      if (despesa.is_fixed) {
          showModal('newFixedExpense', { transactionToEdit: despesa, onSave: handleSaveDespesa });
      } else {
          showModal('novaDespesa', { despesaParaEditar: despesa, onSave: handleSaveDespesa });
      }
  };
  const handleDeleteDespesa = (despesa) => {
    showModal('confirmation', {
      title: 'Confirmar Exclusão',
      description: `Tem certeza que deseja excluir a despesa "${despesa.description || despesa.descricao}"?`,
      onConfirm: async () => { await deleteDespesa(despesa); fetchData(); }
    });
  };

  return (
    <div className="p-4 md:p-6 space-y-4 flex flex-col h-full overflow-hidden"> 
      <Button variant="ghost" onClick={onBack} className="mb-4 gap-2 self-start"> 
        <ArrowLeft className="h-4 w-4" /> Voltar 
      </Button>
      <Card className="flex-grow flex flex-col min-h-0">
        <CardHeader className="flex-shrink-0">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <CardTitle>Todas as Despesas do Mês</CardTitle>
            <div className="flex items-center gap-2 w-full md:w-auto">
              <SearchBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} placeholder="Buscar despesa..." />
              <Select value={sortOrder} onValueChange={setSortOrder}>
                <SelectTrigger className="w-[180px]"><SelectValue placeholder="Ordenar por" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="recentes">Mais Recentes</SelectItem>
                  <SelectItem value="antigas">Mais Antigas</SelectItem>
                  <SelectItem value="a-z">Ordem A-Z</SelectItem>
                  <SelectItem value="z-a">Ordem Z-A</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex-grow flex flex-col min-h-0 p-0">
          <div className="flex-grow overflow-y-auto px-6">
            <ListaTransacoes transactions={currentData} onEdit={handleEditDespesa} onDelete={handleDeleteDespesa} />
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-end space-x-2 pt-4 pb-4 px-6 flex-shrink-0">
              <span className="text-sm text-muted-foreground"> Página {currentPage} de {totalPages} </span>
              <Button variant="outline" size="sm" onClick={prevPage} disabled={currentPage === 1}><ChevronLeft className="h-4 w-4" /> Anterior</Button>
              <Button variant="outline" size="sm" onClick={nextPage} disabled={currentPage === totalPages}>Próximo <ChevronRight className="h-4 w-4" /></Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AllExpensesPage;