import React, { useState, useEffect } from 'react';
import {
  Store,
  Building2,
  Phone,
  Mail,
  FileText,
  MapPin,
  Save,
  RefreshCw,
  CheckCircle2,
  Image as ImageIcon,
  Clock,
} from 'lucide-react';
import { vendorApi, type VendorProfile, type VendorProfileUpdatePayload } from '@/api/vendor.api';
import toast from 'react-hot-toast';

export const VendorProfilePage: React.FC = () => {
  const [profile, setProfile] = useState<VendorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState('');
  const [type, setType] = useState('pharmacy');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [tradeLicense, setTradeLicense] = useState('');
  const [taxNumber, setTaxNumber] = useState('');
  const [logo, setLogo] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [city, setCity] = useState('');
  const [area, setArea] = useState('');
  const [fullAddress, setFullAddress] = useState('');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const data = await vendorApi.getProfile();
      setProfile(data);

      setName(data.name || '');
      setType(data.type || 'pharmacy');
      setPhone(data.phone || '');
      setEmail(data.email || '');
      setTradeLicense(data.trade_license_no || '');
      setTaxNumber(data.tax_number || '');
      setLogo(data.logo || '');
      setCoverImage(data.cover_image || '');
      setCity(data.address?.city || 'Dhaka');
      setArea(data.address?.area || '');
      setFullAddress(data.address?.full_address || '');
    } catch (err) {
      console.error('Failed to load vendor profile:', err);
      toast.error('Failed to load store profile details.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) {
      toast.error('Pharmacy / Store Name is required');
      return;
    }

    try {
      setSaving(true);
      const payload: VendorProfileUpdatePayload = {
        name,
        type,
        phone,
        email,
        trade_license_no: tradeLicense,
        tax_number: taxNumber,
        logo,
        cover_image: coverImage,
        address: {
          city,
          area,
          full_address: fullAddress,
        },
      };

      const updated = await vendorApi.updateProfile(payload);
      setProfile(updated);
      toast.success('Pharmacy store profile details updated successfully!');
    } catch (err: any) {
      console.error('Failed to update profile:', err);
      const errMsg =
        err.response?.data?.error ||
        err.response?.data?.detail ||
        (typeof err.response?.data === 'object' ? JSON.stringify(err.response.data) : null) ||
        'Failed to save profile modifications.';
      toast.error(errMsg);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center text-gray-400">
        <RefreshCw size={28} className="animate-spin text-emerald-500 mx-auto mb-3" />
        <p className="text-sm font-medium">Loading store profile settings...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Store className="text-emerald-400 shrink-0" size={24} />
            <span>Store Profile & Settings</span>
          </h1>
          <p className="text-xs sm:text-sm text-gray-400">
            Manage store branding, contact info, trade license details & physical location.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {profile?.updated_at && (
            <span className="px-2.5 py-1 rounded-full bg-[#171a26] text-gray-300 border border-[#2a2e42] text-[11px] font-medium flex items-center gap-1.5">
              <Clock size={12} className="text-emerald-400" />
              <span>Updated: {new Date(profile.updated_at).toLocaleDateString()}</span>
            </span>
          )}

          <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[11px] font-semibold uppercase flex items-center gap-1.5">
            <CheckCircle2 size={13} />
            <span>{profile?.status || 'Active'}</span>
          </span>
        </div>
      </div>

      {/* Main Settings Form Card */}
      <div className="bg-[#12141c]/90 backdrop-blur-xl rounded-2xl border border-[#1e2230] p-4 sm:p-6 shadow-xl">
        <form onSubmit={handleSaveProfile} className="space-y-6">
          {/* Store Info Group */}
          <div>
            <h2 className="text-sm font-bold text-emerald-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Building2 size={18} />
              <span>General Pharmacy Information</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
                  Pharmacy / Store Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#1a1d2b] border border-[#2a2e42] rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
                  Business Category
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#1a1d2b] border border-[#2a2e42] rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                >
                  <option value="pharmacy">Pharmacy / Medicine Counter</option>
                  <option value="health_store">Healthcare Accessories</option>
                  <option value="mart">Mart / General Medical Supplies</option>
                  <option value="cosmetics">Cosmetics & Baby Care</option>
                  <option value="grocery">Grocery & Wellness</option>
                </select>
              </div>
            </div>
          </div>

          {/* Contact & License Group */}
          <div className="pt-4 border-t border-[#1e2230]">
            <h2 className="text-sm font-bold text-emerald-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <FileText size={18} />
              <span>Contact Credentials & Trade License</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
                  Store Contact Phone
                </label>
                <div className="relative">
                  <Phone size={16} className="absolute left-3 top-3 text-gray-400" />
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2.5 bg-[#1a1d2b] border border-[#2a2e42] rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 font-mono"
                    placeholder="01700000000"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
                  Store Official Email
                </label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-3 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2.5 bg-[#1a1d2b] border border-[#2a2e42] rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                    placeholder="info@pharmacy.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
                  Trade License Number
                </label>
                <input
                  type="text"
                  value={tradeLicense}
                  onChange={(e) => setTradeLicense(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#1a1d2b] border border-[#2a2e42] rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 font-mono"
                  placeholder="TL-987654"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
                  Tax Identification Number (TIN)
                </label>
                <input
                  type="text"
                  value={taxNumber}
                  onChange={(e) => setTaxNumber(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#1a1d2b] border border-[#2a2e42] rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 font-mono"
                  placeholder="TIN-12345678"
                />
              </div>
            </div>
          </div>

          {/* Physical Address Group */}
          <div className="pt-4 border-t border-[#1e2230]">
            <h2 className="text-sm font-bold text-emerald-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <MapPin size={18} />
              <span>Physical Location & Address</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
                  City / District
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#1a1d2b] border border-[#2a2e42] rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  placeholder="Dhaka"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
                  Area / Thana Zone
                </label>
                <input
                  type="text"
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#1a1d2b] border border-[#2a2e42] rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  placeholder="Dhanmondi / Mirpur / Gulshan"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
                Full Physical Address
              </label>
              <textarea
                rows={2}
                value={fullAddress}
                onChange={(e) => setFullAddress(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#1a1d2b] border border-[#2a2e42] rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                placeholder="House #12, Road #4, Dhanmondi, Dhaka"
              />
            </div>
          </div>

          {/* Branding Assets Group */}
          <div className="pt-4 border-t border-[#1e2230]">
            <h2 className="text-sm font-bold text-emerald-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <ImageIcon size={18} />
              <span>Branding & Logo URL</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
                  Pharmacy Logo URL
                </label>
                <input
                  type="text"
                  value={logo}
                  onChange={(e) => setLogo(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#1a1d2b] border border-[#2a2e42] rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  placeholder="https://i.ibb.co/logo.png"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
                  Cover Image URL
                </label>
                <input
                  type="text"
                  value={coverImage}
                  onChange={(e) => setCoverImage(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#1a1d2b] border border-[#2a2e42] rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  placeholder="https://i.ibb.co/cover.jpg"
                />
              </div>
            </div>
          </div>

          {/* Submit Actions */}
          <div className="pt-6 border-t border-[#1e2230] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {profile?.updated_at ? (
              <span className="text-xs text-gray-400">
                Last modified on <span className="text-gray-300 font-semibold">{new Date(profile.updated_at).toLocaleString()}</span>
              </span>
            ) : <div />}
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold text-sm shadow-lg shadow-emerald-600/20 transition-all disabled:opacity-50 w-full sm:w-auto"
            >
              <Save size={18} />
              <span>{saving ? 'Saving Modifications...' : 'Save Profile Changes'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
