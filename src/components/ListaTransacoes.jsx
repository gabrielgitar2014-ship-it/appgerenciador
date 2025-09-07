// src/components/ListaTransacoes.jsx

import React, { useMemo } from 'react';
import { useFinance } from '../context/FinanceContext'; 
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Edit, Trash2 } from 'lucide-react';
import { useModal } from '../context/ModalContext'; // Importar o useModal

export const ListaTransacoes = ({ nomeDoBanco, onEdit, onDelete }) => {
  const { getDespesasPorBanco, transactions } = useFinance();
  const { showModal } = useModal(); // Obter a função showModal

  const despesas = useMemo(() => {
    if (!nomeDoBanco) return [];

    // ✅ CORREÇÃO APLICADA AQUI: Adicionado '|| []'
    // Isso garante que 'despesasDoBanco' seja sempre uma lista, mesmo que a função falhe.
    const despesasDoBanco = getDespesasPorBanco(nomeDoBanco) || [];
    
    // Ordena as despesas pela data mais recente
    return despesasDoBanco.sort((a, b) => new Date(b.data || b.data_compra) - new Date(a.data || a.data_compra));
  }, [nomeDoBanco, transactions]);

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString + 'T03:00:00Z').toLocaleDateString('pt-BR', { timeZone: 'UTC' });
  };
  
  const handleShowDetails = (despesa) => {
    showModal('despesaDetalhes', { despesa });
  };

  // Esta linha agora é segura porque 'despesas' será sempre uma lista.
  if (despesas.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-12">
        <p>Nenhuma despesa registrada para este cartão ainda.</p>
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
        {despesas.map((despesa) => (
          <TableRow 
            key={despesa.id} 
            onClick={() => handleShowDetails(despesa)}
            className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            <TableCell className="font-medium">{despesa.description || despesa.descricao}</TableCell>
            <TableCell>{formatDate(despesa.data || despesa.data_compra)}</TableCell>
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