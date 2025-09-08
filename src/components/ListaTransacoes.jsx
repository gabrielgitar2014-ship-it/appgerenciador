import React, { useMemo } from 'react';
import { useFinance } from '../context/FinanceContext'; 
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Edit, Trash2 } from 'lucide-react';
import { useModal } from '../context/ModalContext';

// ✅ RECEBE 'selectedMonth' COMO PROP
export const ListaTransacoes = ({ bancoNome, selectedMonth, onEdit, onDelete }) => {
  const { transactions, allParcelas } = useFinance();
  const { showModal } = useModal();

  const despesasDoMes = useMemo(() => {
    if (!bancoNome || !selectedMonth) return [];

    // Filtra despesas fixas
    const despesasFixas = transactions.filter(t => 
      t.metodo_pagamento?.toLowerCase() === bancoNome.toLowerCase() &&
      t.is_fixed &&
      t.date?.startsWith(selectedMonth)
    );

    // Filtra despesas variáveis (baseado nas parcelas)
    const despesasPrincipaisDoBanco = transactions.filter(t => t.metodo_pagamento?.toLowerCase() === bancoNome.toLowerCase() && !t.is_fixed);
    const idsDespesasVariaveis = despesasPrincipaisDoBanco.map(d => d.id);
    
    const parcelasVariaveis = allParcelas
        .filter(p => idsDespesasVariaveis.includes(p.despesa_id) && p.data_parcela?.startsWith(selectedMonth))
        .map(p => {
            const despesaPrincipal = despesasPrincipaisDoBanco.find(d => d.id === p.despesa_id);
            return { ...despesaPrincipal, ...p, id: p.id }; // Sobrescreve o ID para ser o da parcela
        });

    const todasAsDespesas = [...despesasFixas, ...parcelasVariaveis];
    return todasAsDespesas.sort((a, b) => new Date(b.data || b.data_parcela) - new Date(a.data || a.data_parcela));

  }, [bancoNome, selectedMonth, transactions, allParcelas]);

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString + 'T03:00:00Z').toLocaleDateString('pt-BR', { timeZone: 'UTC' });
  };
  
  const handleShowDetails = (despesa) => {
    showModal('despesaDetalhes', { despesa });
  };

  if (despesasDoMes.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-12">
        <p>Nenhuma despesa registrada para este cartão neste mês.</p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Descrição</TableHead>
          <TableHead>Data</TableHead>
          <TableHead className="text-right">Valor</TableHead>
          <TableHead className="w-[50px]"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {despesasDoMes.map((despesa) => (
          <TableRow 
            key={despesa.id} 
            onClick={() => handleShowDetails(despesa)}
            className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            <TableCell className="font-medium">{despesa.description || despesa.descricao}</TableCell>
            <TableCell>{formatDate(despesa.data_parcela || despesa.date)}</TableCell>
            <TableCell className="text-right font-mono text-red-600">
              - R$ {(despesa.amount || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </TableCell>
            <TableCell>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={(e) => e.stopPropagation()}><MoreHorizontal className="h-4 w-4" /></Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(despesa); }} className="gap-2">
                    <Edit className="h-4 w-4" /> Editar
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDelete(despesa); }} className="gap-2 text-destructive focus:text-destructive">
                    <Trash2 className="h-4 w-4" /> Excluir
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};
