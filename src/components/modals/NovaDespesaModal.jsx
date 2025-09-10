import { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import CalculadoraModal from './CalculadoraModal';
import { METODOS_DE_PAGAMENTO } from '../../constants/paymentMethods';

/* ========================= Helpers ========================= */

// Data local (YYYY-MM-DD) sem problemas de fuso
const getTodayLocalISO = () => {
  const today = new Date();
  const y = today.getFullYear();
  const m = String(today.getMonth() + 1).padStart(2, '0');
  const d = String(today.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

// Para <input type="month">
const getCurrentMonthISO = () => {
  const today = new Date();
  const y = today.getFullYear();
  const m = String(today.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
};

// Converte "YYYY-MM" -> "YYYY-MM-01"
const toFirstDay = (ym) => (ym && ym.length === 7 ? `${ym}-01` : ym);

// Extrai "YYYY-MM" de uma data ISO completa p/ preencher o <input type="month">
const toMonthInput = (d) => (d ? String(d).slice(0, 7) : getCurrentMonthISO());

// Compara as “jan/2025” dos dois lados para definir inicia_proximo_mes
const isStartAfterPurchaseMonth = (mesInicioYYYYMMDD, dataCompraYYYYMMDD) => {
  if (!mesInicioYYYYMMDD || !dataCompraYYYYMMDD) return false;
  const a = new Date(`${String(mesInicioYYYYMMDD).slice(0,7)}-01`);
  const b = new Date(`${String(dataCompraYYYYMMDD).slice(0,7)}-01`);
  return a > b;
};

// Arredonda 2 casas
const round2 = (x) => Math.round((x + Number.EPSILON) * 100) / 100;

// Cria array de parcelas a partir do total, n e data inicial (YYYY-MM-01)
const buildParcelas = ({ despesaId, total, n, startDateYYYYMMDD }) => {
  const parcelas = [];
  const per = round2(total / n);
  const partial = round2(per * (n - 1));
  const last = round2(total - partial);

  const start = new Date(startDateYYYYMMDD);
  for (let k = 1; k <= n; k++) {
    const d = new Date(start);
    d.setMonth(d.getMonth() + (k - 1));
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = '01';
    parcelas.push({
      despesa_id: despesaId,
      numero_parcela: k,
      amount: k < n ? per : last,
      data_parcela: `${yyyy}-${mm}-${dd}`,
      paga: false,
    });
  }
  return parcelas;
};

/* ============== Estado inicial (novo/edição) ============== */

const getInitialState = (despesaParaEditar = null) => {
  if (despesaParaEditar) {
    const parcelado = !!despesaParaEditar.is_parcelado || (despesaParaEditar.qtd_parcelas || 1) > 1;
    return {
      amount: despesaParaEditar.amount ?? '',
      description: despesaParaEditar.description ?? '',
      metodo_pagamento: despesaParaEditar.metodo_pagamento ?? METODOS_DE_PAGAMENTO?.[0] ?? 'Itaú',
      data_compra: despesaParaEditar.data_compra ?? getTodayLocalISO(),
      isParcelado: parcelado,
      qtd_parcelas: parcelado ? (despesaParaEditar.qtd_parcelas ?? 2) : '',
      mes_inicio_cobranca: toMonthInput(despesaParaEditar.mes_inicio_cobranca),
      user_phone: despesaParaEditar.user_phone ?? '',
      category: despesaParaEditar.category ?? '',
    };
  }
  return {
    amount: '',
    description: '',
    metodo_pagamento: METODOS_DE_PAGAMENTO?.[0] ?? 'Itaú',
    data_compra: getTodayLocalISO(),
    isParcelado: false,
    qtd_parcelas: '',
    mes_inicio_cobranca: getCurrentMonthISO(),
    user_phone: '',
    category: '',
  };
};

/* ====================== Componente ========================= */

export default function NovaDespesaModal({ onClose, onSave, despesaParaEditar }) {
  const [formData, setFormData] = useState(() => getInitialState(despesaParaEditar));
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const isEdit = !!despesaParaEditar?.id;

  useEffect(() => {
    setFormData(getInitialState(despesaParaEditar));
  }, [despesaParaEditar]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleCalculatorResult = (valorCalculado, parcelas) => {
    // valorCalculado = total; se quiser usar "parcela x qtd", faça aqui.
    setFormData((prev) => ({
      ...prev,
      amount: String(valorCalculado ?? prev.amount),
      isParcelado: parcelas > 1,
      qtd_parcelas: parcelas > 1 ? String(parcelas) : '',
    }));
    setIsCalculatorOpen(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSaving) return;

    try {
      setIsSaving(true);

      const is_parcelado = !!formData.isParcelado;
      const qtd_parcelas = is_parcelado
        ? Math.max(2, parseInt(formData.qtd_parcelas || '2', 10))
        : 1;

      const mes_inicio_db = toFirstDay(formData.mes_inicio_cobranca);
      const amountNumber = round2(parseFloat(String(formData.amount).replace(',', '.')) || 0);

      if (!amountNumber || amountNumber <= 0) {
        alert('Informe um valor (amount) válido.');
        setIsSaving(false);
        return;
      }

      if (is_parcelado && (!qtd_parcelas || qtd_parcelas < 2)) {
        alert('Informe a quantidade de parcelas (>= 2) para despesas parceladas.');
        setIsSaving(false);
        return;
      }

      const inicia_proximo_mes = isStartAfterPurchaseMonth(mes_inicio_db, formData.data_compra);

      // Monte o payload exatamente como o schema espera (snake_case)
      const dadosParaSalvar = {
        amount: amountNumber,                      // numeric(10,2)
        description: formData.description?.trim(),// text
        metodo_pagamento: formData.metodo_pagamento, // text
        data_compra: formData.data_compra,        // DATE (YYYY-MM-DD)
        is_parcelado,                              // boolean
        qtd_parcelas,                              // integer
        mes_inicio_cobranca: mes_inicio_db,        // DATE (YYYY-MM-01)
        inicia_proximo_mes,                        // boolean
        user_phone: formData.user_phone || null,   // se existir no schema
        category: formData.category || null,       // se existir no schema
      };

      // ===== Persistência =====
      let despesaId = despesaParaEditar?.id ?? null;

      if (onSave) {
        // Se o pai quiser salvar por conta própria:
        const payload = { ...dadosParaSalvar, id: despesaId || undefined };
        await onSave(payload);
        // supondo que onSave atualize/retorne id; se não tiver, busque ou ignore
        // aqui vamos seguir gerando parcelas só se o pai não cuidar disso
      } else {
        if (isEdit) {
          const { data, error } = await supabase
            .from('despesas') // ajuste o nome da tabela se for diferente
            .update(dadosParaSalvar)
            .eq('id', despesaId)
            .select('id')
            .single();
          if (error) throw error;
          despesaId = data.id;
        } else {
          const { data, error } = await supabase
            .from('despesas')
            .insert(dadosParaSalvar)
            .select('id')
            .single();
          if (error) throw error;
          despesaId = data.id;
        }
      }

      // Sempre (re)gerar parcelas locais a partir do que foi salvo
      const parcelas = buildParcelas({
        despesaId,
        total: amountNumber,
        n: qtd_parcelas,
        startDateYYYYMMDD: mes_inicio_db,
      });

      if (!onSave) {
        // Se persistimos via supabase aqui, sincronize a tabela "parcelas"
        // Na edição, apaga as antigas e recria:
        if (isEdit) {
          const { error: delErr } = await supabase
            .from('parcelas')
            .delete()
            .eq('despesa_id', despesaId);
          if (delErr) throw delErr;
        }
        const { error: insErr } = await supabase.from('parcelas').insert(parcelas);
        if (insErr) throw insErr;
      }

      alert(isEdit ? 'Despesa atualizada com sucesso.' : 'Despesa criada com sucesso.');
      setIsSaving(false);
      onClose?.();

    } catch (err) {
      console.error('Erro ao salvar despesa:', err);
      alert(`Erro ao salvar: ${err?.message || err}`);
      setIsSaving(false);
    }
  };

  const submitButtonText = isEdit ? 'Salvar alterações' : 'Adicionar despesa';

  return (
    <>
      {/* Modal de calculadora opcional */}
      {isCalculatorOpen && (
        <CalculadoraModal
          onClose={() => setIsCalculatorOpen(false)}
          onConfirm={handleCalculatorResult}
        />
      )}

      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className="bg-white w-full max-w-xl rounded-2xl shadow-xl p-6">
          <h2 className="text-xl font-semibold mb-4">
            {isEdit ? 'Editar despesa' : 'Nova despesa'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Descrição</label>
              <input
                type="text"
                name="description"
                className="w-full border rounded-lg px-3 py-2"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="ex.: Mercado / Assinatura / Serviço"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Valor (total)</label>
                <input
                  type="number"
                  step="0.01"
                  inputMode="decimal"
                  name="amount"
                  className="w-full border rounded-lg px-3 py-2"
                  value={formData.amount}
                  onChange={handleInputChange}
                  placeholder="0.00"
                  required
                />
                <button
                  type="button"
                  onClick={() => setIsCalculatorOpen(true)}
                  className="mt-2 text-sm underline text-blue-600"
                >
                  Abrir calculadora (parcela × qtd)
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Método de pagamento</label>
                <select
                  name="metodo_pagamento"
                  className="w-full border rounded-lg px-3 py-2"
                  value={formData.metodo_pagamento}
                  onChange={handleInputChange}
                >
                  {(METODOS_DE_PAGAMENTO || ['Itaú', 'Bradesco']).map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Data da compra</label>
                <input
                  type="date"
                  name="data_compra"
                  className="w-full border rounded-lg px-3 py-2"
                  value={formData.data_compra}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Mês de cobrança</label>
                <input
                  type="month"
                  name="mes_inicio_cobranca"
                  className="w-full border rounded-lg px-3 py-2"
                  value={formData.mes_inicio_cobranca}
                  onChange={handleInputChange}
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Será salvo como primeiro dia do mês (YYYY-MM-01).
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 items-start">
              <div className="flex items-center space-x-2">
                <input
                  id="isParcelado"
                  type="checkbox"
                  name="isParcelado"
                  checked={!!formData.isParcelado}
                  onChange={handleInputChange}
                />
                <label htmlFor="isParcelado" className="text-sm font-medium">
                  Parcelado?
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Qtd. parcelas</label>
                <input
                  type="number"
                  name="qtd_parcelas"
                  className="w-full border rounded-lg px-3 py-2"
                  min={formData.isParcelado ? 2 : 1}
                  step="1"
                  value={formData.isParcelado ? (formData.qtd_parcelas || '') : ''}
                  onChange={handleInputChange}
                  disabled={!formData.isParcelado}
                  placeholder={formData.isParcelado ? 'ex.: 6' : '1'}
                />
              </div>
            </div>

            {/* Campos opcionais, caso existam no schema */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Categoria (opcional)</label>
                <input
                  type="text"
                  name="category"
                  className="w-full border rounded-lg px-3 py-2"
                  value={formData.category}
                  onChange={handleInputChange}
                  placeholder=""
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Telefone (opcional)</label>
                <input
                  type="text"
                  name="user_phone"
                  className="w-full border rounded-lg px-3 py-2"
                  value={formData.user_phone}
                  onChange={handleInputChange}
                  placeholder=""
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="bg-gray-200 text-gray-800 font-medium py-2 px-4 rounded-lg hover:bg-gray-300"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-blue-400"
              >
                {isEdit ? 'Salvar alterações' : 'Adicionar despesa'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
