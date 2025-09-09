// src/components/modals/NewIncomeModal.jsx
import { useState, useEffect } from "react";
import { supabase } from "../../supabaseClient";

function toLocalISODate(value = new Date()) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  // Compensa o fuso p/ produzir YYYY-MM-DD local (evita “virar” o dia em UTC)
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
}

export default function NewIncomeModal({ isOpen, onClose, onSave, incomeToEdit }) {
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(toLocalISODate());
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    if (incomeToEdit) {
      setDescription(incomeToEdit.description ?? "");
      setAmount(String(incomeToEdit.amount ?? ""));
      setDate(
        typeof incomeToEdit.date === "string"
          ? incomeToEdit.date.slice(0, 10)
          : toLocalISODate(incomeToEdit.date)
      );
    } else {
      setDescription("");
      setAmount("");
      setDate(toLocalISODate());
    }
  }, [incomeToEdit, isOpen]);

  // Fechar com ESC
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e) => {
      if (e.key === "Escape" && !isSaving) onClose?.();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, isSaving, onClose]);

  const handleSave = async () => {
    const value = Number(String(amount).replace(",", "."));
    if (!description.trim() || !Number.isFinite(value) || value <= 0) {
      alert("Por favor, preencha a descrição e um valor maior que zero.");
      return;
    }

    setIsSaving(true);
    const payload = {
      description: description.trim(),
      amount: value,
      date, // YYYY-MM-DD
      type: "income",
    };

    try {
      let row;
      if (incomeToEdit?.id) {
        const { data, error } = await supabase
          .from("transactions")
          .update(payload)
          .eq("id", incomeToEdit.id)
          .select()
          .single();
        if (error) throw error;
        row = data;
      } else {
        const { data, error } = await supabase
          .from("transactions")
          .insert(payload)
          .select()
          .single();
        if (error) throw error;
        row = data;
      }

      onSave?.(row);
      onClose?.();
    } catch (err) {
      console.error("Erro ao salvar renda:", err);
      alert("Não foi possível salvar a renda.");
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="income-modal-title"
      onClick={() => !isSaving && onClose?.()}
    >
      {/* Painel do modal */}
      <div
        className="income-modal w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-2xl ring-1 ring-black/5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <h2 id="income-modal-title" className="mb-4 text-2xl font-bold">
            {incomeToEdit ? "Editar Renda" : "Nova Renda"}
          </h2>

          <div className="max-h-[70vh] space-y-4 overflow-y-auto pr-2">
            <div>
              <label htmlFor="desc" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Descrição
              </label>
              <input
                id="desc"
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="mt-1 block w-full rounded-md border border-slate-200 dark:border-slate-700 p-2
                           !bg-white dark:!bg-slate-800 !text-slate-900 dark:!text-slate-100
                           placeholder-slate-400 dark:placeholder-slate-500
                           focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
                autoFocus
              />
            </div>

            <div>
              <label htmlFor="amount" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Valor da Renda (R$)
              </label>
              <input
                id="amount"
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="mt-1 block w-full rounded-md border border-slate-200 dark:border-slate-700 p-2
                           !bg-white dark:!bg-slate-800 !text-slate-900 dark:!text-slate-100
                           placeholder-slate-400 dark:placeholder-slate-500
                           focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
              />
            </div>

            <div>
              <label htmlFor="date" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Data
              </label>
              <div className="relative">
                <input
                  id="date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-slate-200 dark:border-slate-700 p-2
                             !bg-white dark:!bg-slate-800 !text-slate-900 dark:!text-slate-100
                             focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
                />
                {/* ícone opcional poderia ir aqui se você usar algum set de ícones */}
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-4">
            <button
              onClick={onClose}
              disabled={isSaving}
              className="rounded-md bg-gray-200 dark:bg-slate-700 text-slate-900 dark:text-slate-100 py-2 px-4 disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="rounded-md bg-blue-600 text-white py-2 px-4 disabled:bg-blue-400"
            >
              {isSaving ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
