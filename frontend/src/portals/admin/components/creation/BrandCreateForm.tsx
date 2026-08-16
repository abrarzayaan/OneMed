import React, { useState } from 'react';
import { Building2, CheckCircle2, Loader2, Sparkles, Award } from 'lucide-react';
import toast from 'react-hot-toast';
import { adminCatalogApi } from '../../api/adminCatalog.api';

interface BrandCreateFormProps {
  onSuccess?: () => void;
}

export const BrandCreateForm: React.FC<BrandCreateFormProps> = ({ onSuccess }) => {
  const [name, setName] = useState<string>('');
  const [status, setStatus] = useState<'active' | 'hidden'>('active');
  const [country, setCountry] = useState<string>('Bangladesh');
  const [licenseNo, setLicenseNo] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Brand / Manufacturer Name is required');
      return;
    }

    setIsSubmitting(true);
    try {
      await adminCatalogApi.createBrand({
        name,
        status,
        metadata: {
          country,
          license_no: licenseNo,
          verified: true,
        },
      });

      toast.success(`Pharmaceutical Brand "${name}" saved to Database!`);
      setName('');
      setLicenseNo('');
      if (onSuccess) onSuccess();
    } catch {
      toast.error('Failed to create brand');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 rounded-3xl bg-bg-card border border-bg-border shadow-card space-y-6">
      <div className="flex items-center space-x-3 border-b border-bg-border pb-4">
        <div className="p-2.5 rounded-xl bg-purple-500/15 text-purple-400 border border-purple-500/30">
          <Building2 className="w-5 h-5" />
        </div>
        <div>
          <h2 className="font-head font-bold text-lg text-content-primary">Create Brand / Manufacturer</h2>
          <p className="text-xs text-content-muted">Add pharmaceutical companies (e.g. Beximco, Square, Incepta)</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Brand Name */}
        <div>
          <label className="block text-xs font-mono font-bold text-content-muted mb-1.5">
            Brand / Company Name *
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Beximco Pharmaceuticals Ltd."
            className="w-full px-4 py-2.5 rounded-xl bg-bg-surface border border-bg-border text-content-primary text-xs font-medium outline-none focus:border-primary-500"
          />
        </div>

        {/* Status */}
        <div>
          <label className="block text-xs font-mono font-bold text-content-muted mb-1.5">
            Status
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as 'active' | 'hidden')}
            className="w-full px-4 py-2.5 rounded-xl bg-bg-surface border border-bg-border text-content-primary text-xs font-medium outline-none focus:border-primary-500"
          >
            <option value="active">Active (Visible)</option>
            <option value="hidden">Hidden (Draft)</option>
          </select>
        </div>
      </div>

      {/* Metadata Box */}
      <div className="p-4 rounded-2xl bg-bg-surface border border-bg-border space-y-3">
        <div className="flex items-center space-x-2 text-xs font-mono font-bold text-content-muted uppercase">
          <Award className="w-4 h-4 text-purple-400" />
          <span>Manufacturer Info & License (`metadata` JSON)</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[11px] font-mono text-content-muted mb-1">Country of Origin</label>
            <input
              type="text"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-bg-card border border-bg-border text-content-primary text-xs outline-none focus:border-purple-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-mono text-content-muted mb-1">DGDA Manufacturing License No</label>
            <input
              type="text"
              value={licenseNo}
              onChange={(e) => setLicenseNo(e.target.value)}
              placeholder="e.g. DGDA-LIC-9842"
              className="w-full px-3.5 py-2 rounded-xl bg-bg-card border border-bg-border text-content-primary text-xs outline-none focus:border-purple-500"
            />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end pt-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-6 py-2.5 rounded-xl bg-purple-500 hover:bg-purple-600 disabled:opacity-50 text-white font-bold text-xs shadow-glow transition-all flex items-center space-x-2"
        >
          {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
          <span>Save Brand to Database</span>
        </button>
      </div>
    </form>
  );
};
