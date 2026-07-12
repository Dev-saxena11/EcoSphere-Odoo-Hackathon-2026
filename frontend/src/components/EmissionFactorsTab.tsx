import React, { useEffect, useState } from "react";
import { Plus, Pencil, Power, PowerOff, Trash2, Zap } from "lucide-react";
import { emissionFactorsApi, EmissionFactorPayload } from "../api/emissionFactors";
import { ActivityType, EmissionFactor, FactorStatus } from "../types";

const ACTIVITY_TYPES: ActivityType[] = [
  "fuel",
  "electricity",
  "travel",
  "purchase",
  "waste",
  "water",
  "other",
];

const EMPTY_FORM: EmissionFactorPayload = {
  factor_code: "",
  name: "",
  activity_type: "fuel",
  unit: "",
  co2e_per_unit: 0,
  source: "",
  effective_start: new Date().toISOString().split("T")[0],
};

export default function EmissionFactorsTab() {
  const [factors, setFactors] = useState<EmissionFactor[]>([]);
  const [loading, setLoading] = useState(true);
  const [activityFilter, setActivityFilter] = useState<ActivityType | "">("");
  const [statusFilter, setStatusFilter] = useState<FactorStatus | "">("");

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<EmissionFactorPayload>(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);

  const loadFactors = async () => {
    setLoading(true);
    try {
      const data = await emissionFactorsApi.list({
        activity_type: activityFilter || undefined,
        status: statusFilter || undefined,
      });
      setFactors(data);
    } catch (err) {
      console.error("Failed to load emission factors", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFactors();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activityFilter, statusFilter]);

  const openCreateForm = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormError(null);
    setShowForm(true);
  };

  const openEditForm = (factor: EmissionFactor) => {
    setEditingId(factor.id);
    setForm({
      factor_code: factor.factor_code,
      name: factor.name,
      activity_type: factor.activity_type,
      unit: factor.unit,
      co2e_per_unit: factor.co2e_per_unit,
      source: factor.source || "",
      effective_start: factor.effective_start,
    });
    setFormError(null);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    try {
      if (editingId !== null) {
        await emissionFactorsApi.update(editingId, {
          name: form.name,
          activity_type: form.activity_type,
          unit: form.unit,
          co2e_per_unit: Number(form.co2e_per_unit),
          source: form.source || undefined,
        });
      } else {
        await emissionFactorsApi.create({
          ...form,
          co2e_per_unit: Number(form.co2e_per_unit),
        });
      }
      setShowForm(false);
      loadFactors();
    } catch (err: any) {
      setFormError(err.message || "Failed to save emission factor");
    }
  };

  const handleToggleStatus = async (factor: EmissionFactor) => {
    try {
      if (factor.status === "active") {
        await emissionFactorsApi.deactivate(factor.id);
      } else {
        await emissionFactorsApi.reactivate(factor.id);
      }
      loadFactors();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleDelete = async (factor: EmissionFactor) => {
    if (!window.confirm(`Delete emission factor "${factor.name}"?`)) return;
    try {
      await emissionFactorsApi.remove(factor.id);
      loadFactors();
    } catch (err: any) {
      if (
        window.confirm(
          `${err.message}\n\nDeactivate it instead so it's hidden from new transactions but kept for history?`
        )
      ) {
        try {
          await emissionFactorsApi.deactivate(factor.id);
          loadFactors();
        } catch (deactivateErr: any) {
          alert(`Error: ${deactivateErr.message}`);
        }
      }
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Emission Factors</h2>
          <p className="text-gray-400 text-sm mt-0.5">
            Manage the carbon conversion factors used to calculate CO2e across the org.
          </p>
        </div>
        <button
          onClick={openCreateForm}
          className="bg-gradient-emerald hover:shadow-emerald-950/20 hover:shadow-lg transition-all px-4 py-2 rounded-xl text-sm font-semibold text-white flex items-center gap-2 shadow-md hover:-translate-y-0.5 active:translate-y-0 duration-300"
        >
          <Plus className="w-4 h-4" />
          <span>New Factor</span>
        </button>
      </div>

      {/* Filters */}
      <div className="glass-card p-4 rounded-2xl flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
            Activity Type
          </label>
          <select
            value={activityFilter}
            onChange={(e) => setActivityFilter(e.target.value as ActivityType | "")}
            className="bg-slate-900 border border-brand-border px-3 py-1.5 rounded-lg text-sm focus:outline-none focus:border-emerald-500/50"
          >
            <option value="">All</option>
            {ACTIVITY_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
            Status
          </label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as FactorStatus | "")}
            className="bg-slate-900 border border-brand-border px-3 py-1.5 rounded-lg text-sm focus:outline-none focus:border-emerald-500/50"
          >
            <option value="">All</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* List */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-950 text-gray-400 text-xs font-bold uppercase">
              <tr>
                <th className="p-4">Code</th>
                <th className="p-4">Name</th>
                <th className="p-4">Activity</th>
                <th className="p-4">kgCO2e / Unit</th>
                <th className="p-4">Effective From</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border">
              {loading && (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-gray-500">
                    Loading emission factors...
                  </td>
                </tr>
              )}
              {!loading && factors.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-gray-500">
                    No emission factors found.
                  </td>
                </tr>
              )}
              {factors.map((f) => (
                <tr key={f.id} className="hover:bg-slate-900/30 transition-colors">
                  <td className="p-4 font-mono text-xs text-gray-400">{f.factor_code}</td>
                  <td className="p-4 font-semibold flex items-center gap-2">
                    <Zap className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    {f.name}
                  </td>
                  <td className="p-4 capitalize text-gray-300">{f.activity_type}</td>
                  <td className="p-4 text-gray-300">
                    {f.co2e_per_unit} / {f.unit}
                  </td>
                  <td className="p-4 text-gray-400">{f.effective_start}</td>
                  <td className="p-4">
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                        f.status === "active"
                          ? "bg-emerald-950/40 text-emerald-400 border-emerald-500/20"
                          : "bg-slate-900 text-gray-500 border-brand-border"
                      }`}
                    >
                      {f.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEditForm(f)}
                        title="Edit"
                        className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-slate-800 transition-colors"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleToggleStatus(f)}
                        title={f.status === "active" ? "Deactivate" : "Reactivate"}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-slate-800 transition-colors"
                      >
                        {f.status === "active" ? (
                          <PowerOff className="w-4 h-4" />
                        ) : (
                          <Power className="w-4 h-4" />
                        )}
                      </button>
                      <button
                        onClick={() => handleDelete(f)}
                        title="Delete"
                        className="p-1.5 rounded-lg text-gray-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card w-full max-w-md rounded-2xl overflow-hidden shadow-2xl animate-scale-up">
            <div className="p-6 border-b border-brand-border flex justify-between items-center bg-slate-950/60">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <Zap className="w-5 h-5 text-emerald-400" />
                <span>{editingId !== null ? "Edit Emission Factor" : "New Emission Factor"}</span>
              </h3>
              <button
                onClick={() => setShowForm(false)}
                className="text-gray-400 hover:text-white text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="text-xs text-rose-400 bg-rose-950/30 border border-rose-500/30 rounded-lg px-3 py-2">
                  {formError}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
                  Factor Code
                </label>
                <input
                  type="text"
                  value={form.factor_code}
                  onChange={(e) => setForm({ ...form, factor_code: e.target.value })}
                  disabled={editingId !== null}
                  placeholder="e.g. fuel.diesel"
                  className="w-full bg-slate-900 border border-brand-border px-3.5 py-2.5 rounded-xl text-sm focus:outline-none focus:border-emerald-500/50 disabled:opacity-50"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
                  Name
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full bg-slate-900 border border-brand-border px-3.5 py-2.5 rounded-xl text-sm focus:outline-none focus:border-emerald-500/50"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
                    Activity Type
                  </label>
                  <select
                    value={form.activity_type}
                    onChange={(e) =>
                      setForm({ ...form, activity_type: e.target.value as ActivityType })
                    }
                    className="w-full bg-slate-900 border border-brand-border px-3.5 py-2.5 rounded-xl text-sm focus:outline-none focus:border-emerald-500/50"
                  >
                    {ACTIVITY_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
                    Unit
                  </label>
                  <input
                    type="text"
                    value={form.unit}
                    onChange={(e) => setForm({ ...form, unit: e.target.value })}
                    placeholder="e.g. litre, kWh, km"
                    className="w-full bg-slate-900 border border-brand-border px-3.5 py-2.5 rounded-xl text-sm focus:outline-none focus:border-emerald-500/50"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
                    kg CO2e / Unit
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    min="0"
                    value={form.co2e_per_unit}
                    onChange={(e) =>
                      setForm({ ...form, co2e_per_unit: Number(e.target.value) })
                    }
                    className="w-full bg-slate-900 border border-brand-border px-3.5 py-2.5 rounded-xl text-sm focus:outline-none focus:border-emerald-500/50"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
                    Effective From
                  </label>
                  <input
                    type="date"
                    value={form.effective_start}
                    onChange={(e) => setForm({ ...form, effective_start: e.target.value })}
                    disabled={editingId !== null}
                    className="w-full bg-slate-900 border border-brand-border px-3.5 py-2.5 rounded-xl text-sm focus:outline-none focus:border-emerald-500/50 disabled:opacity-50"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
                  Source (optional)
                </label>
                <input
                  type="text"
                  value={form.source}
                  onChange={(e) => setForm({ ...form, source: e.target.value })}
                  placeholder="e.g. DEFRA 2026"
                  className="w-full bg-slate-900 border border-brand-border px-3.5 py-2.5 rounded-xl text-sm focus:outline-none focus:border-emerald-500/50"
                />
              </div>

              <div className="pt-4 flex gap-4">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 bg-slate-900 border border-brand-border text-gray-400 py-2.5 rounded-xl text-sm font-semibold hover:text-white hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-gradient-emerald text-white py-2.5 rounded-xl text-sm font-semibold hover:shadow-emerald-950/20 hover:shadow-lg transition-all"
                >
                  {editingId !== null ? "Save Changes" : "Create Factor"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
