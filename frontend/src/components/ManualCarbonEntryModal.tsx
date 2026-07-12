import React, { useEffect, useState } from "react";
import { Leaf } from "lucide-react";
import { carbonTransactionsApi } from "../api/carbonTransactions";
import { departmentsApi } from "../api/departments";
import { emissionFactorsApi } from "../api/emissionFactors";
import { CarbonTransaction, Department, EmissionFactor, SourceType } from "../types";

const SOURCE_TYPES: SourceType[] = ["fleet", "manufacturing", "purchase", "expense"];

interface ManualCarbonEntryModalProps {
  onClose: () => void;
  onCreated: (transaction: CarbonTransaction) => void;
}

export default function ManualCarbonEntryModal({ onClose, onCreated }: ManualCarbonEntryModalProps) {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [factors, setFactors] = useState<EmissionFactor[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [departmentId, setDepartmentId] = useState<string>("");
  const [sourceType, setSourceType] = useState<SourceType>("fleet");
  const [emissionFactorId, setEmissionFactorId] = useState<string>("");
  const [quantity, setQuantity] = useState("");
  const [transactionDate, setTransactionDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [notes, setNotes] = useState("");

  useEffect(() => {
    Promise.all([departmentsApi.list(), emissionFactorsApi.list({ status: "active" })])
      .then(([departmentsData, factorsData]) => {
        setDepartments(departmentsData);
        setFactors(factorsData);
        if (factorsData.length > 0) setEmissionFactorId(String(factorsData[0].id));
      })
      .catch((err) => setError(err.message || "Failed to load form options"))
      .finally(() => setLoadingOptions(false));
  }, []);

  const selectedFactor = factors.find((f) => f.id === Number(emissionFactorId));
  const quantityNumber = Number(quantity);
  const estimatedCo2e =
    selectedFactor && quantityNumber > 0
      ? (quantityNumber * selectedFactor.co2e_per_unit).toFixed(2)
      : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!emissionFactorId) {
      setError("Select an emission factor");
      return;
    }
    if (!quantity || quantityNumber <= 0) {
      setError("Quantity must be a positive number");
      return;
    }

    setSubmitting(true);
    try {
      const transaction = await carbonTransactionsApi.createManual({
        department_id: departmentId ? Number(departmentId) : undefined,
        source_type: sourceType,
        emission_factor_id: Number(emissionFactorId),
        quantity: quantityNumber,
        transaction_date: transactionDate,
        notes: notes || undefined,
      });
      onCreated(transaction);
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to log carbon transaction");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="glass-card w-full max-w-md rounded-2xl overflow-hidden shadow-2xl animate-scale-up">
        <div className="p-6 border-b border-brand-border flex justify-between items-center bg-slate-950/60">
          <h3 className="font-bold text-lg flex items-center gap-2">
            <Leaf className="w-5 h-5 text-emerald-400" />
            <span>Log Carbon Transaction</span>
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-lg font-bold">
            &times;
          </button>
        </div>

        {loadingOptions ? (
          <div className="p-6 text-sm text-gray-400 text-center animate-pulse">
            Loading departments and emission factors...
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {error && (
              <div className="text-xs text-rose-400 bg-rose-950/30 border border-rose-500/30 rounded-lg px-3 py-2">
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
                Department
              </label>
              <select
                value={departmentId}
                onChange={(e) => setDepartmentId(e.target.value)}
                className="w-full bg-slate-900 border border-brand-border px-3.5 py-2.5 rounded-xl text-sm focus:outline-none focus:border-emerald-500/50"
              >
                <option value="">Unassigned</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
                Source Type
              </label>
              <select
                value={sourceType}
                onChange={(e) => setSourceType(e.target.value as SourceType)}
                className="w-full bg-slate-900 border border-brand-border px-3.5 py-2.5 rounded-xl text-sm focus:outline-none focus:border-emerald-500/50"
              >
                {SOURCE_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
                Emission Factor
              </label>
              {factors.length === 0 ? (
                <p className="text-xs text-rose-400">
                  No active emission factors available. Add one before logging a transaction.
                </p>
              ) : (
                <select
                  value={emissionFactorId}
                  onChange={(e) => setEmissionFactorId(e.target.value)}
                  className="w-full bg-slate-900 border border-brand-border px-3.5 py-2.5 rounded-xl text-sm focus:outline-none focus:border-emerald-500/50"
                  required
                >
                  {factors.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name} ({f.co2e_per_unit} kgCO2e/{f.unit})
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
                  Quantity
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="e.g. 150"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="w-full bg-slate-900 border border-brand-border px-3.5 py-2.5 rounded-xl text-sm focus:outline-none focus:border-emerald-500/50"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
                  Date
                </label>
                <input
                  type="date"
                  value={transactionDate}
                  onChange={(e) => setTransactionDate(e.target.value)}
                  className="w-full bg-slate-900 border border-brand-border px-3.5 py-2.5 rounded-xl text-sm focus:outline-none focus:border-emerald-500/50"
                  required
                />
              </div>
            </div>

            {estimatedCo2e && (
              <div className="text-xs text-emerald-400 bg-emerald-950/30 border border-emerald-500/20 rounded-lg px-3 py-2">
                Estimated emissions: <span className="font-bold">{estimatedCo2e} kg CO2e</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
                Notes / Reference
              </label>
              <textarea
                placeholder="e.g. Fleet logistics record code or description"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full bg-slate-900 border border-brand-border px-3.5 py-2.5 rounded-xl text-sm focus:outline-none focus:border-emerald-500/50 resize-none"
              />
            </div>

            <div className="pt-4 flex gap-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 bg-slate-900 border border-brand-border text-gray-400 py-2.5 rounded-xl text-sm font-semibold hover:text-white hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || factors.length === 0}
                className="flex-1 bg-gradient-emerald disabled:opacity-50 text-white py-2.5 rounded-xl text-sm font-semibold hover:shadow-emerald-950/20 hover:shadow-lg transition-all"
              >
                {submitting ? "Submitting..." : "Submit Log"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
