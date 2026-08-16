import React, { useState, useEffect, useMemo } from 'react';
import {
  Database,
  Search,
  Plus,
  Trash2,
  Edit3,
  Download,
  FileCode,
  FileSpreadsheet,
  CheckSquare,
  Square,
  RefreshCw,
  SlidersHorizontal,
  Layers,
  Code,
  CheckCircle2,
  AlertCircle,
  Eye,
  Info,
  ChevronRight,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { adminExplorerApi, registeredModelsMeta } from '../api/adminExplorer.api';
import type { ModelMeta, ModelRecord, ModelFieldMeta } from '../api/adminExplorer.api';

export const ModelExplorerPage: React.FC = () => {
  const [selectedModelKey, setSelectedModelKey] = useState<string>(registeredModelsMeta[0].key);
  const [records, setRecords] = useState<ModelRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Selection State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<number | string>>(new Set());

  // Form Modal State
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingRecordId, setEditingRecordId] = useState<number | string | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [jsonInputError, setJsonInputError] = useState<Record<string, string>>({});

  // JSON Viewer Modal State
  const [viewingJsonData, setViewingJsonData] = useState<{ title: string; json: any } | null>(null);

  // Active Model Meta
  const activeModelMeta = useMemo(() => {
    return registeredModelsMeta.find((m) => m.key === selectedModelKey) || registeredModelsMeta[0];
  }, [selectedModelKey]);

  // Grouped Models by App
  const groupedModels = useMemo(() => {
    const map: Record<string, ModelMeta[]> = {};
    registeredModelsMeta.forEach((m) => {
      if (!map[m.app]) map[m.app] = [];
      map[m.app].push(m);
    });
    return map;
  }, []);

  // Load Model Records
  const loadRecords = async () => {
    setLoading(true);
    setSelectedIds(new Set());
    const data = await adminExplorerApi.getModelRecords(selectedModelKey);
    setRecords(data);
    setLoading(false);
  };

  useEffect(() => {
    loadRecords();
  }, [selectedModelKey]);

  // Filtered Records
  const filteredRecords = useMemo(() => {
    if (!searchQuery.trim()) return records;
    const query = searchQuery.toLowerCase();
    return records.filter((r) =>
      Object.values(r).some((val) => {
        if (val === null || val === undefined) return false;
        if (typeof val === 'object') return JSON.stringify(val).toLowerCase().includes(query);
        return String(val).toLowerCase().includes(query);
      })
    );
  }, [records, searchQuery]);

  // Handle Selection
  const toggleSelectAll = () => {
    if (selectedIds.size === filteredRecords.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredRecords.map((r) => r.id)));
    }
  };

  const toggleSelectRecord = (id: number | string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  // Handle Bulk Delete
  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (confirm(`Are you sure you want to delete ${selectedIds.size} selected records?`)) {
      await adminExplorerApi.bulkDeleteRecords(selectedModelKey, Array.from(selectedIds));
      toast.success(`${selectedIds.size} records deleted`);
      loadRecords();
    }
  };

  // Handle Single Delete
  const handleDeleteRecord = async (id: number | string) => {
    if (confirm(`Are you sure you want to delete record #${id}?`)) {
      await adminExplorerApi.deleteRecord(selectedModelKey, id);
      toast.success('Record deleted');
      loadRecords();
    }
  };

  // Open Create Modal
  const openCreateModal = () => {
    setEditingRecordId(null);
    const initial: Record<string, any> = {};
    activeModelMeta.fields.forEach((f) => {
      if (f.readOnly) return;
      if (f.type === 'boolean') initial[f.name] = false;
      else if (f.type === 'number' || f.type === 'foreign_key') initial[f.name] = 0;
      else if (f.type === 'json') initial[f.name] = '{}';
      else initial[f.name] = '';
    });
    setFormData(initial);
    setJsonInputError({});
    setIsFormModalOpen(true);
  };

  // Open Edit Modal
  const openEditModal = (record: ModelRecord) => {
    setEditingRecordId(record.id);
    const initial: Record<string, any> = {};
    activeModelMeta.fields.forEach((f) => {
      if (f.readOnly) return;
      const val = record[f.name];
      if (f.type === 'json') {
        initial[f.name] = typeof val === 'object' ? JSON.stringify(val, null, 2) : val || '{}';
      } else {
        initial[f.name] = val !== undefined ? val : '';
      }
    });
    setFormData(initial);
    setJsonInputError({});
    setIsFormModalOpen(true);
  };

  // Save Record Form
  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate JSON fields
    const parsedPayload: Record<string, any> = { ...formData };
    let hasJsonErr = false;
    const errors: Record<string, string> = {};

    activeModelMeta.fields.forEach((f) => {
      if (f.type === 'json' && !f.readOnly) {
        const strVal = formData[f.name];
        if (typeof strVal === 'string' && strVal.trim()) {
          try {
            parsedPayload[f.name] = JSON.parse(strVal);
          } catch (err: any) {
            errors[f.name] = 'Invalid JSON syntax. Please check quotes and brackets.';
            hasJsonErr = true;
          }
        } else {
          parsedPayload[f.name] = {};
        }
      }
    });

    if (hasJsonErr) {
      setJsonInputError(errors);
      toast.error('Please fix JSON syntax errors before saving.');
      return;
    }

    if (editingRecordId) {
      await adminExplorerApi.updateRecord(selectedModelKey, editingRecordId, parsedPayload);
      toast.success(`Record #${editingRecordId} updated`);
    } else {
      await adminExplorerApi.createRecord(selectedModelKey, parsedPayload);
      toast.success('New record created successfully');
    }

    setIsFormModalOpen(false);
    loadRecords();
  };

  // Render Table Cell Content
  const renderCellContent = (record: ModelRecord, field: ModelFieldMeta) => {
    const val = record[field.name];

    if (val === null || val === undefined) {
      return <span className="text-content-muted font-mono italic text-[10px]">null</span>;
    }

    if (field.type === 'boolean') {
      return (
        <span
          className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
            val
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
              : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
          }`}
        >
          {val ? 'TRUE' : 'FALSE'}
        </span>
      );
    }

    if (field.type === 'json') {
      return (
        <button
          onClick={() =>
            setViewingJsonData({
              title: `${activeModelMeta.name} -> ${field.name} (ID #${record.id})`,
              json: val,
            })
          }
          className="px-2.5 py-1 rounded-lg bg-bg-surface border border-bg-border hover:border-primary-500/40 text-primary-400 font-mono text-[11px] font-bold inline-flex items-center space-x-1"
        >
          <Code className="w-3 h-3" />
          <span>{'{ JSON }'}</span>
        </button>
      );
    }

    if (field.type === 'foreign_key') {
      return (
        <span className="px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-mono font-bold text-[10px]">
          FK #{val}
        </span>
      );
    }

    if (field.type === 'date') {
      return <span className="font-mono text-content-muted text-[11px]">{new Date(val).toLocaleString()}</span>;
    }

    return <span className="truncate max-w-[200px] block">{String(val)}</span>;
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-primary-950 via-bg-card to-bg-card p-6 rounded-3xl border border-primary-500/30 shadow-xl">
        <div className="space-y-1">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-primary-500/10 text-primary-400 border border-primary-500/20 text-xs font-mono font-semibold">
            <Database className="w-3.5 h-3.5" />
            <span>Section 07 — Generic Model Explorer & Dynamic CRUD Engine</span>
          </div>
          <h1 className="text-2xl font-head font-bold text-content-primary">
            Database Model Explorer & Data Manager
          </h1>
          <p className="text-xs text-content-muted">
            Direct access to inspect, edit, query, and bulk export 100% of Django database models.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => adminExplorerApi.exportToCSV(selectedModelKey, filteredRecords)}
            className="px-3 py-2 rounded-xl bg-bg-surface border border-bg-border hover:border-primary-500/40 text-content-primary font-bold text-xs shadow-sm flex items-center space-x-1.5"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>CSV Export</span>
          </button>

          <button
            onClick={() => adminExplorerApi.exportToJSON(selectedModelKey, filteredRecords)}
            className="px-3 py-2 rounded-xl bg-bg-surface border border-bg-border hover:border-primary-500/40 text-content-primary font-bold text-xs shadow-sm flex items-center space-x-1.5"
          >
            <FileCode className="w-4 h-4 text-indigo-400" />
            <span>JSON Export</span>
          </button>

          <button
            onClick={openCreateModal}
            className="px-4 py-2 rounded-xl bg-primary-500 hover:bg-primary-600 text-white font-bold text-xs shadow-glow flex items-center space-x-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Create Record</span>
          </button>
        </div>
      </div>

      {/* Main Layout: Left App Navigation Drawer + Right Table Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 3 Cols: Registered App Models Drawer */}
        <div className="lg:col-span-3 space-y-4">
          <div className="p-4 rounded-3xl bg-bg-card border border-bg-border shadow-card space-y-4">
            <div className="flex items-center space-x-2 border-b border-bg-border pb-3">
              <Layers className="w-4 h-4 text-primary-400" />
              <h3 className="font-head font-bold text-sm text-content-primary">Django App Models</h3>
            </div>

            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
              {Object.keys(groupedModels).map((appName) => (
                <div key={appName} className="space-y-1.5">
                  <div className="text-[10px] font-mono font-bold uppercase text-content-muted px-2">
                    {appName}
                  </div>
                  <div className="space-y-1">
                    {groupedModels[appName].map((m) => (
                      <button
                        key={m.key}
                        onClick={() => setSelectedModelKey(m.key)}
                        className={`w-full p-2.5 rounded-2xl text-left text-xs font-semibold transition-all flex items-center justify-between ${
                          selectedModelKey === m.key
                            ? 'bg-primary-500/15 text-primary-400 border border-primary-500/30 shadow-sm'
                            : 'bg-bg-surface/50 hover:bg-bg-surface text-content-secondary border border-transparent'
                        }`}
                      >
                        <div className="flex items-center space-x-2 truncate">
                          <span>{m.icon}</span>
                          <span className="truncate">{m.name}</span>
                        </div>
                        <ChevronRight
                          className={`w-3.5 h-3.5 shrink-0 ${
                            selectedModelKey === m.key ? 'text-primary-400' : 'text-content-muted opacity-40'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right 9 Cols: Active Model Inspector Table */}
        <div className="lg:col-span-9 space-y-4">
          {/* Active Model Title Banner */}
          <div className="p-5 rounded-3xl bg-bg-card border border-bg-border shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-3">
              <span className="text-3xl">{activeModelMeta.icon}</span>
              <div>
                <div className="flex items-center space-x-2">
                  <h2 className="text-lg font-head font-bold text-content-primary">{activeModelMeta.name}</h2>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-primary-500/10 text-primary-400 border border-primary-500/20">
                    {activeModelMeta.key}
                  </span>
                </div>
                <p className="text-xs text-content-muted">{activeModelMeta.description}</p>
              </div>
            </div>

            <div className="flex items-center space-x-3 text-xs font-mono font-bold text-content-muted">
              <span>Endpoint: <strong className="text-content-primary">{activeModelMeta.endpoint}</strong></span>
              <span>•</span>
              <span>Total: <strong className="text-primary-400">{records.length} Records</strong></span>
            </div>
          </div>

          {/* Table Controls Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-bg-card border border-bg-border">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-content-muted" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={`Search records in ${activeModelMeta.name}...`}
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-bg-surface border border-bg-border text-xs text-content-primary focus:border-primary-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center space-x-3">
              {selectedIds.size > 0 && (
                <button
                  onClick={handleBulkDelete}
                  className="px-3.5 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/20 hover:border-rose-500 text-rose-400 text-xs font-bold transition-all flex items-center space-x-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Selected ({selectedIds.size})</span>
                </button>
              )}

              <button
                onClick={loadRecords}
                className="p-2 rounded-xl bg-bg-surface border border-bg-border hover:border-primary-500/40 text-content-muted hover:text-content-primary transition-all"
                title="Refresh Records"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Dynamic Data Table */}
          <div className="rounded-3xl bg-bg-card border border-bg-border shadow-card overflow-hidden">
            {loading ? (
              <div className="p-12 text-center text-xs font-mono text-content-muted space-y-2">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto text-primary-400" />
                <div>Fetching Django model records...</div>
              </div>
            ) : filteredRecords.length === 0 ? (
              <div className="p-12 text-center text-xs font-mono text-content-muted space-y-2">
                <Info className="w-6 h-6 mx-auto text-content-muted opacity-50" />
                <div>No records found matching query in {activeModelMeta.name}.</div>
              </div>
            ) : (
              <div className="overflow-x-auto max-h-[60vh] overflow-y-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-bg-border bg-bg-surface text-[10px] font-mono uppercase text-content-muted sticky top-0 z-10 backdrop-blur-md">
                      <th className="p-3.5 w-10 text-center">
                        <button onClick={toggleSelectAll}>
                          {selectedIds.size === filteredRecords.length && filteredRecords.length > 0 ? (
                            <CheckSquare className="w-4 h-4 text-primary-400" />
                          ) : (
                            <Square className="w-4 h-4 text-content-muted" />
                          )}
                        </button>
                      </th>
                      {activeModelMeta.fields.map((f) => (
                        <th key={f.name} className="p-3.5 font-bold">
                          {f.name}
                        </th>
                      ))}
                      <th className="p-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-bg-border text-xs">
                    {filteredRecords.map((record) => {
                      const isSelected = selectedIds.has(record.id);
                      return (
                        <tr
                          key={record.id}
                          className={`transition-colors ${
                            isSelected ? 'bg-primary-500/10' : 'hover:bg-bg-surface/50'
                          }`}
                        >
                          <td className="p-3.5 text-center">
                            <button onClick={() => toggleSelectRecord(record.id)}>
                              {isSelected ? (
                                <CheckSquare className="w-4 h-4 text-primary-400" />
                              ) : (
                                <Square className="w-4 h-4 text-content-muted" />
                              )}
                            </button>
                          </td>

                          {activeModelMeta.fields.map((field) => (
                            <td key={field.name} className="p-3.5 font-mono text-content-primary">
                              {renderCellContent(record, field)}
                            </td>
                          ))}

                          <td className="p-3.5 text-right space-x-1 shrink-0">
                            <button
                              onClick={() => openEditModal(record)}
                              className="p-1.5 rounded-lg bg-bg-surface border border-bg-border hover:border-primary-500/40 text-primary-400 transition-colors"
                              title="Edit Record"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteRecord(record.id)}
                              className="p-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20 hover:border-rose-500 text-rose-400 transition-colors"
                              title="Delete Record"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── MODAL 1: CREATE / EDIT RECORD ── */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-bg-card border border-bg-border rounded-3xl max-w-xl w-full p-6 space-y-6 shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-bg-border pb-3">
              <h2 className="text-lg font-head font-bold text-content-primary">
                {editingRecordId
                  ? `Edit Record #${editingRecordId} (${activeModelMeta.name})`
                  : `Create New Record (${activeModelMeta.name})`}
              </h2>
              <button
                onClick={() => setIsFormModalOpen(false)}
                className="text-content-muted hover:text-content-primary text-xs font-mono font-bold"
              >
                ✕ ESC
              </button>
            </div>

            <form onSubmit={handleSaveForm} className="space-y-4">
              {activeModelMeta.fields.map((field: ModelFieldMeta) => {
                if (field.readOnly) return null;
                const err = jsonInputError[field.name];

                return (
                  <div key={field.name} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-mono font-bold text-content-muted">
                        {field.name} {field.required && <span className="text-rose-400">*</span>}
                      </label>
                      <span className="text-[10px] font-mono text-content-muted uppercase">Type: {field.type}</span>
                    </div>

                    {field.type === 'boolean' ? (
                      <label className="inline-flex items-center space-x-2 cursor-pointer pt-1">
                        <input
                          type="checkbox"
                          checked={Boolean(formData[field.name])}
                          onChange={(e) => setFormData({ ...formData, [field.name]: e.target.checked })}
                          className="rounded bg-bg-surface border-bg-border text-primary-500 focus:ring-primary-500"
                        />
                        <span className="text-xs text-content-primary font-mono font-bold">
                          {formData[field.name] ? 'TRUE' : 'FALSE'}
                        </span>
                      </label>
                    ) : field.type === 'json' ? (
                      <div>
                        <textarea
                          rows={4}
                          value={formData[field.name]}
                          onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                          placeholder='{"key": "value"}'
                          className={`w-full px-3 py-2 rounded-xl bg-bg-surface border text-xs font-mono text-content-primary focus:outline-none ${
                            err ? 'border-rose-500' : 'border-bg-border focus:border-primary-500'
                          }`}
                        />
                        {err && <div className="text-[10px] text-rose-400 font-mono pt-0.5">{err}</div>}
                      </div>
                    ) : (
                      <input
                        type={field.type === 'number' || field.type === 'foreign_key' ? 'number' : 'text'}
                        required={field.required}
                        value={formData[field.name] !== undefined ? formData[field.name] : ''}
                        onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                        className="w-full px-3.5 py-2 rounded-xl bg-bg-surface border border-bg-border text-xs text-content-primary focus:border-primary-500 focus:outline-none font-mono"
                      />
                    )}
                  </div>
                );
              })}

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-bg-border">
                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-bg-surface border border-bg-border text-xs font-semibold text-content-muted hover:text-content-primary"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-primary-500 hover:bg-primary-600 text-white font-bold text-xs shadow-glow"
                >
                  Save Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL 2: JSON VIEWER MODAL ── */}
      {viewingJsonData && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-bg-card border border-bg-border rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-bg-border pb-3">
              <h3 className="text-sm font-head font-bold text-content-primary truncate max-w-xs">
                {viewingJsonData.title}
              </h3>
              <button
                onClick={() => setViewingJsonData(null)}
                className="text-content-muted hover:text-content-primary text-xs font-mono font-bold"
              >
                ✕ ESC
              </button>
            </div>

            <pre className="p-4 rounded-2xl bg-bg-surface border border-bg-border text-xs font-mono text-emerald-400 overflow-x-auto max-h-[60vh]">
              {JSON.stringify(viewingJsonData.json, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};
