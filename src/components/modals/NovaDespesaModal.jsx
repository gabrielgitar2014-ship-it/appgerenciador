import { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import CalculadoraModal from './CalculadoraModal';
import { METODOS_DE_PAGAMENTO } from '../../constants/paymentMethods';

// Função corrigida para pegar a data local em formato ISO sem erros de fuso horário
const getTodayLocalISO = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

// Função para pegar o mês atual em formato ISO
const getCurrentMonthISO = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
};

const getInitialState = (despesaParaEditar = null) => {
  if (despesaParaEditar) {
    const mesInicio = despesaParaEditar.mes_inicio_cobranca || getCurrentMonthISO(new Date(despesaParaEditar.data_compra + 'T00:00:00'));
    return {
      amount: despesaParaEditar.amount || '',
      description: despesaParaEditar.description || '',
      metodo_pagamento: despesaParaEditar.metodo_pagamento || METODOS_DE_PAGAMENTO[0],
      data_compra: despesaParaEditar.data_compra || '',
      isParcelado: despesaParaEditar.qtd_parcelas > 1,
      qtd_parcelas: despesaParaEditar.qtd_parcelas > 1 ? despesaParaEditar.qtd_parcelas : '',
      mes_inicio_cobranca: mesInicio,
    };
  }
  
  return {
    amount: '',
    description: '',
    metodo_pagamento: METODOS_DE_PAGAMENTO[0],
    data_compra: getTodayLocalISO(),
    isParcelado: false,
    qtd_parcelas: '',
    mes_inicio_cobranca: getCurrentMonthISO(),
  };
};

export default function NovaDespesaModal({ onClose, onSave, despesaParaEditar }) {
  const [formData, setFormData] = useState(() => getInitialState(despesaParaEditar));
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const isEditMode = Boolean(despesaParaEditar);

  useEffect(() => {
    setFormData(getInitialState(despesaParaEditar));
  }, [despesaParaEditar]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleCalculatorConfirm = (calculatedValue) => {
    setFormData(prev => ({ ...prev, amount: calculatedValue }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);

    const dadosParaSalvar = {
        amount: parseFloat(formData.amount),
        description: formData.description,
        metodo_pagamento: formData.metodo_pagamento,
        data_compra: formData.data_compra,
        qtd_parcelas: formData.isParcelado ? parseInt(formData.qtd_parcelas) : 1,
        mes_inicio_cobranca: formData.mes_inicio_cobranca,
    };

    try {
      if (isEditMode) {
        // ... (sua lógica de edição aqui)
      }

      const { data: despesaCriada, error } = await supabase.from('despesas').insert([dadosParaSalvar]).select().single();
      if (error) throw error;

      const parcelasArray = [];
      const totalAmount = parseFloat(formData.amount);
      const totalParcelas = dadosParaSalvar.qtd_parcelas;
      
      const [anoCobranca, mesCobranca] = formData.mes_inicio_cobranca.split('-');
      const diaDaCompra = new Date(formData.data_compra + 'T00:00:00').getDate();
      
      const ultimoDiaDoMesDestino = new Date(anoCobranca, parseInt(mesCobranca), 0).getDate();
      const diaParaUsar = Math.min(diaDaCompra, ultimoDiaDoMesDestino);
      
      let dataBaseParaParcela = new Date(Date.UTC(anoCobranca, parseInt(mesCobranca) - 1, diaParaUsar));

      let somaDasParcelasAcumulada = 0;
      for (let i = 0; i < totalParcelas; i++) {
        const dataParcelaAtual = new Date(dataBaseParaParcela);
        dataParcelaAtual.setUTCMonth(dataBaseParaParcela.getUTCMonth() + i);
        
        let valorParcelaAtual;
        if (i === totalParcelas - 1) {
          valorParcelaAtual = (totalAmount - somaDasParcelasAcumulada).toFixed(2);
        } else {
          valorParcelaAtual = Math.floor((totalAmount / totalParcelas) * 100) / 100;
          somaDasParcelasAcumulada += valorParcelaAtual;
        }

        parcelasArray.push({
          despesa_id: despesaCriada.id,
          numero_parcela: i + 1,
          amount: parseFloat(valorParcelaAtual),
          data_parcela: dataParcelaAtual.toISOString().split('T')[0],
          paga: false,
        });
      }
      
      const { error: errorParcelas } = await supabase.from('parcelas').insert(parcelasArray);
      if (errorParcelas) throw errorParcelas;
      
      onSave(despesaCriada, formData.mes_inicio_cobranca);

    } catch (err) {
      console.error('Erro detalhado ao salvar despesa:', err);
      alert('Não foi possível salvar a despesa.');
    } finally {
        setIsSaving(false);
    }
  };

  const modalTitle = isEditMode ? 'Editar Despesa' : 'Nova Despesa';
  const submitButtonText = isSaving ? 'A salvar...' : (isEditMode ? 'Salvar Alterações' : 'Salvar Despesa');

  return (
    <>
      <CalculadoraModal isOpen={isCalculatorOpen} onClose={() => setIsCalculatorOpen(false)} onConfirm={handleCalculatorConfirm} />
      <div className="fixed inset-0 bg-transparent flex justify-center items-center z-50 p-4">
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-2xl w-11/12 md:w-1/2 lg:w-1/3 flex flex-col max-h-[90vh] animate-fade-in-down">
          <h2 className="text-2xl font-bold text-gray-800 p-6 pb-4">{modalTitle}</h2>
          <div className="flex-1 overflow-y-auto px-6">
            <div className="space-y-4">
              <div>
                <label htmlFor="amount" className="block text-sm font-medium text-gray-700">Valor (R$)</label>
                <div className="mt-1 flex items-center gap-2">
                    <input type="number" name="amount" id="amount" value={formData.amount} onChange={handleInputChange} className="block w-full border rounded-md py-2 px-3" placeholder="0.00" step="0.01" required />
                    <button type="button" onClick={() => setIsCalculatorOpen(true)} className="p-2 bg-gray-200 rounded-md hover:bg-gray-300" title="Usar calculadora">
                        <span className="material-symbols-outlined">calculate</span>
                    </button>
                </div>
              </div>
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">Descrição</label>
                <input type="text" name="description" id="description" value={formData.description} onChange={handleInputChange} className="mt-1 block w-full border rounded-md py-2 px-3" placeholder="Ex: Almoço" required />
              </div>
              <div>
                <label htmlFor="metodo_pagamento" className="block text-sm font-medium text-gray-700">Método de Pagamento</label>
                <select name="metodo_pagamento" id="metodo_pagamento" value={formData.metodo_pagamento} onChange={handleInputChange} className="mt-1 block w-full border rounded-md py-2 px-3">
                  {METODOS_DE_PAGAMENTO.map(metodo => <option key={metodo} value={metodo}>{metodo}</option>)}
                </select>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="data_compra" className="block text-sm font-medium text-gray-700">Data da Compra</label>
                  <input type="date" name="data_compra" id="data_compra" value={formData.data_compra} onChange={handleInputChange} className="mt-1 block w-full border rounded-md py-2 px-3" required />
                </div>
                <div>
                  <label htmlFor="mes_inicio_cobranca" className="block text-sm font-medium text-gray-700">Mês da Cobrança</label>
                  <input type="month" name="mes_inicio_cobranca" id="mes_inicio_cobranca" value={formData.mes_inicio_cobranca} onChange={handleInputChange} className="mt-1 block w-full border rounded-md py-2 px-3" required />
                </div>
              </div>

              <div className="flex items-center pt-2">
                <input id="isParcelado" name="isParcelado" type="checkbox" checked={formData.isParcelado} onChange={handleInputChange} className="h-4 w-4 text-blue-600 border-gray-300 rounded" />
                <label htmlFor="isParcelado" className="ml-2 block text-sm text-gray-900">Compra parcelada</label>
              </div>
              
              {formData.isParcelado && (
                <div className="animate-fade-in">
                  <label htmlFor="qtd_parcelas" className="block text-sm font-medium text-gray-700">Quantidade de Parcelas</label>
                  <input type="number" name="qtd_parcelas" id="qtd_parcelas" value={formData.qtd_parcelas} onChange={handleInputChange} className="mt-1 block w-full border rounded-md py-2 px-3" placeholder="Ex: 12" min="2" step="1" required />
                </div>
              )}
            </div>
          </div>
          <div className="mt-4 p-6 pt-4 border-t">
            <div className="flex justify-end space-x-3">
                <button type="button" onClick={onClose} className="bg-gray-200 text-gray-700 font-bold py-2 px-4 rounded-lg hover:bg-gray-300">
                  Cancelar
                </button>
                <button onClick={handleSubmit} disabled={isSaving} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg disabled:bg-blue-400">
                  {submitButtonText}
                </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
