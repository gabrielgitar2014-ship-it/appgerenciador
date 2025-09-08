import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Edit, Trash2 } from 'lucide-react';
import { useModal } from '../context/ModalContext';

// ✅ ESTA É A VERSÃO CORRETA E SIMPLIFICADA
// Note que ela não tem mais o 'useMemo' para calcular as despesas.
// Ela apenas recebe e exibe a lista da prop 'transactions'.

export const ListaTransacoes = ({ transactions, onEdit, onDelete }) => {
  const { showModal } = useModal();

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    // Adicionado T00:00:00 para evitar problemas de fuso horário
    return new Date(dateString + 'T00:00:00').toLocaleDateString('pt-BR');
  };
  
  const handleShowDetails = (despesa) => {
    showModal('despesaDetalhes', { despesa });
  };

  if (!transactions || transactions.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-12">
        <p>Nenhuma despesa encontrada.</p>
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
        {transactions.map((despesa) => (
          <TableRow 
            key={despesa.id} 
            onClick={() => handleShowDetails(despesa)}
            className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            <TableCell className="font-medium">{despesa.description || despesa.descricao}</TableCell>
            <TableCell>{formatDate(despesa.data_parcela || despesa.date)}</TableCell>
            <TableCell className={`text-right font-mono ${despesa.amount < 0 ? 'text-green-500' : 'text-red-600'}`}>
              {despesa.amount < 0 ? '+ ' : '- '}
              R$ {Math.abs(despesa.amount || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
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
