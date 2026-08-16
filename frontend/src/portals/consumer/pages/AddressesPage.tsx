import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  Building,
  Home,
  Store,
  Compass,
  X,
  AlertCircle,
  Phone,
  User,
  Navigation,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { profileApi } from '@/api/profile.api';
import type { Address, AddressFormData, AddressLabel } from '@/types/address.types';
import AccountSidebar from '@/portals/consumer/components/account/AccountSidebar';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Badge from '@/components/ui/Badge';
import Skeleton from '@/components/ui/Skeleton';

const LABEL_ICONS: Record<AddressLabel, React.ReactNode> = {
  home: <Home className="w-4 h-4" />,
  office: <Building className="w-4 h-4" />,
  pharmacy: <Store className="w-4 h-4" />,
  other: <Compass className="w-4 h-4" />,
};

const INITIAL_FORM: AddressFormData = {
  label: 'home',
  receiver_name: '',
  receiver_phone: '',
  full_address: '',
  landmark: '',
  area: '',
  city: 'Dhaka',
  postal_code: '',
  is_default: false,
};

export default function AddressesPage() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [deletingAddress, setDeletingAddress] = useState<Address | null>(null);
  const [formData, setFormData] = useState<AddressFormData>(INITIAL_FORM);

  // 1. Fetch Addresses
  const { data: addresses = [], isLoading } = useQuery<Address[]>({
    queryKey: ['addresses'],
    queryFn: async () => {
      const res = await profileApi.getAddresses();
      const raw = res.data;
      const list = Array.isArray(raw) ? raw : (raw as any).results || [];
      return list.filter((a: Address) => a.status !== 'hidden');
    },
  });

  // 2. Create Address Mutation
  const createMutation = useMutation({
    mutationFn: (data: AddressFormData) => profileApi.createAddress(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
      toast.success('Address saved successfully! 📍');
      closeModal();
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.detail || 'Failed to save address.';
      toast.error(msg);
    },
  });

  // 3. Update Address Mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<AddressFormData> }) =>
      profileApi.updateAddress(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
      toast.success('Address updated successfully!');
      closeModal();
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.detail || 'Failed to update address.';
      toast.error(msg);
    },
  });

  // 4. Delete Address Mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => profileApi.deleteAddress(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
      toast.success('Address removed.');
      setDeletingAddress(null);
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.detail || 'Failed to delete address.';
      toast.error(msg);
    },
  });

  // Open modal for new address
  const openNewModal = () => {
    setEditingAddress(null);
    setFormData({
      ...INITIAL_FORM,
      is_default: addresses.length === 0, // Auto-check default if it's the first address
    });
    setIsModalOpen(true);
  };

  // Open modal for editing
  const openEditModal = (addr: Address) => {
    setEditingAddress(addr);
    setFormData({
      label: addr.label,
      receiver_name: addr.receiver_name || '',
      receiver_phone: addr.receiver_phone || '',
      full_address: addr.full_address || '',
      landmark: addr.landmark || '',
      area: addr.area || '',
      city: addr.city || 'Dhaka',
      postal_code: addr.postal_code || '',
      is_default: addr.is_default,
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingAddress(null);
    setFormData(INITIAL_FORM);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.full_address.trim() || !formData.area.trim() || !formData.city.trim()) {
      toast.error('Please fill in area, city, and full address details.');
      return;
    }

    if (editingAddress) {
      updateMutation.mutate({ id: editingAddress.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleSetDefault = (addr: Address) => {
    if (addr.is_default) return;
    updateMutation.mutate({ id: addr.id, data: { is_default: true } });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col lg:flex-row gap-8 items-start">
        <AccountSidebar />
        <div className="flex-1 w-full space-y-8">
          {/* ── HEADER BANNER ── */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-bg-border pb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-head text-2xl sm:text-3xl font-extrabold text-content-primary flex items-center gap-2.5">
              <MapPin className="w-7 h-7 text-primary-400" /> Delivery Addresses
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-primary-600/20 text-primary-400 text-xs font-bold border border-primary-500/30">
              {addresses.length} {addresses.length === 1 ? 'Address' : 'Addresses'}
            </span>
          </div>
          <p className="text-xs text-content-secondary mt-1">
            Manage your delivery locations for fast, accurate medicine dispatch.
          </p>
        </div>

        <Button
          onClick={openNewModal}
          variant="primary"
          size="md"
          className="rounded-full px-6 font-bold shadow-glow gap-2 text-xs"
        >
          <Plus className="w-4 h-4" /> Add New Address
        </Button>
      </div>

      {/* ── NO ADDRESS ALERT BANNER (If zero addresses) ── */}
      {!isLoading && addresses.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl bg-amber-500/10 border border-amber-500/30 p-5 flex items-start gap-4 text-amber-200"
        >
          <AlertCircle className="w-6 h-6 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1 text-xs">
            <h4 className="font-bold text-amber-300 text-sm">Action Required: Initial Address Needed</h4>
            <p className="leading-relaxed text-amber-200/90">
              You haven't saved a delivery address yet. Please click <strong>"Add New Address"</strong> below to enter your initial shipping details. Saved addresses are required to add items to your cart and proceed with orders.
            </p>
          </div>
        </motion.div>
      )}

      {/* ── ADDRESS CARDS GRID ── */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-48 rounded-3xl w-full" />
          <Skeleton className="h-48 rounded-3xl w-full" />
        </div>
      ) : addresses.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="py-16 text-center space-y-4 bg-bg-card border border-bg-border rounded-3xl p-8 max-w-md mx-auto"
        >
          <div className="w-16 h-16 rounded-3xl bg-bg-surface border border-bg-border flex items-center justify-center text-content-muted mx-auto">
            <Navigation className="w-8 h-8 stroke-1 text-primary-400" />
          </div>
          <div className="space-y-1">
            <h3 className="font-head font-bold text-lg text-content-primary">No Saved Addresses</h3>
            <p className="text-xs text-content-secondary">
              Add your home or office address to start ordering medicines with express delivery.
            </p>
          </div>
          <Button onClick={openNewModal} variant="primary" size="md" className="rounded-full px-6 gap-2">
            <Plus className="w-4 h-4" /> Create Address
          </Button>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <AnimatePresence mode="popLayout">
            {addresses.map((addr) => (
              <motion.div
                key={addr.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className={`relative rounded-3xl bg-bg-card border p-6 flex flex-col justify-between space-y-4 shadow-card transition-all ${
                  addr.is_default
                    ? 'border-primary-500 ring-2 ring-primary-500/20'
                    : 'border-bg-border hover:border-content-muted'
                }`}
              >
                <div className="space-y-3">
                  {/* Top Badges */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="p-2 rounded-xl bg-primary-600/10 text-primary-400 border border-primary-500/20 flex items-center gap-1.5 text-xs font-bold capitalize">
                        {LABEL_ICONS[addr.label]}
                        {addr.label}
                      </span>
                      {addr.is_default && (
                        <Badge variant="success" className="gap-1 text-[10px] px-2.5">
                          <CheckCircle2 className="w-3 h-3" /> Default Address
                        </Badge>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => openEditModal(addr)}
                        className="p-2 rounded-xl text-content-secondary hover:text-primary-400 hover:bg-bg-surface transition-colors"
                        title="Edit address"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeletingAddress(addr)}
                        className="p-2 rounded-xl text-content-secondary hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        title="Delete address"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Receiver details */}
                  <div className="space-y-1 pt-1">
                    {addr.receiver_name && (
                      <p className="font-head font-bold text-sm text-content-primary flex items-center gap-2">
                        <User className="w-3.5 h-3.5 text-content-muted" /> {addr.receiver_name}
                      </p>
                    )}
                    {addr.receiver_phone && (
                      <p className="text-xs text-content-secondary font-mono flex items-center gap-2">
                        <Phone className="w-3 h-3 text-content-muted" /> {addr.receiver_phone}
                      </p>
                    )}
                  </div>

                  {/* Address Body */}
                  <div className="text-xs text-content-secondary leading-relaxed bg-bg-surface/50 p-3.5 rounded-2xl border border-bg-border/50 space-y-1">
                    <p className="font-semibold text-content-primary">{addr.full_address}</p>
                    <p>
                      {addr.area}, {addr.city} {addr.postal_code ? `- ${addr.postal_code}` : ''}
                    </p>
                    {addr.landmark && (
                      <p className="text-[11px] text-content-muted italic">
                        Landmark: {addr.landmark}
                      </p>
                    )}
                  </div>
                </div>

                {/* Footer Action */}
                {!addr.is_default && (
                  <div className="pt-2 border-t border-bg-border/60">
                    <button
                      type="button"
                      onClick={() => handleSetDefault(addr)}
                      className="text-xs font-semibold text-primary-400 hover:text-primary-300 transition-colors"
                    >
                      Set as Default Delivery Address
                    </button>
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* ── CREATE / EDIT ADDRESS MODAL ── */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeModal}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm"
            />

            {/* Dialog Content */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-bg-card border border-bg-border rounded-3xl shadow-2xl p-6 sm:p-8 z-10 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-bg-border pb-4 mb-6">
                <h3 className="font-head font-bold text-lg text-content-primary flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-primary-400" />
                  {editingAddress ? 'Edit Address' : 'Add New Delivery Address'}
                </h3>
                <button
                  type="button"
                  onClick={closeModal}
                  className="w-8 h-8 rounded-full bg-bg-surface hover:bg-bg-border text-content-secondary hover:text-content-primary flex items-center justify-center transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                {/* Address Label Selector */}
                <div className="space-y-1.5">
                  <label className="font-bold text-content-secondary uppercase tracking-wider text-[10px]">
                    Address Type / Label
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {(['home', 'office', 'pharmacy', 'other'] as AddressLabel[]).map((lbl) => (
                      <button
                        key={lbl}
                        type="button"
                        onClick={() => setFormData((prev) => ({ ...prev, label: lbl }))}
                        className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 font-bold capitalize transition-all ${
                          formData.label === lbl
                            ? 'bg-primary-600/20 border-primary-500 text-primary-400'
                            : 'bg-bg-surface border-bg-border text-content-muted hover:text-content-secondary'
                        }`}
                      >
                        {LABEL_ICONS[lbl]}
                        <span className="text-[11px]">{lbl}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Receiver Name & Phone */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input
                    label="Receiver Name"
                    placeholder="e.g. John Doe"
                    value={formData.receiver_name}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, receiver_name: e.target.value }))
                    }
                  />
                  <Input
                    label="Receiver Phone"
                    placeholder="e.g. 017XXXXXXXX"
                    value={formData.receiver_phone}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, receiver_phone: e.target.value }))
                    }
                  />
                </div>

                {/* City & Area */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input
                    label="City / District *"
                    placeholder="e.g. Dhaka"
                    value={formData.city}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, city: e.target.value }))
                    }
                    required
                  />
                  <Input
                    label="Area / Thana *"
                    placeholder="e.g. Dhanmondi, Uttara"
                    value={formData.area}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, area: e.target.value }))
                    }
                    required
                  />
                </div>

                {/* Full Address */}
                <div className="space-y-1.5">
                  <label className="font-bold text-content-secondary uppercase tracking-wider text-[10px]">
                    Full Street Address / House & Road *
                  </label>
                  <textarea
                    rows={3}
                    placeholder="House #, Road #, Sector/Block, Apartment name..."
                    value={formData.full_address}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, full_address: e.target.value }))
                    }
                    required
                    className="w-full rounded-2xl bg-bg-surface border border-bg-border p-3 text-content-primary placeholder:text-content-muted focus:outline-none focus:border-primary-500 text-xs leading-relaxed"
                  />
                </div>

                {/* Landmark & Postal Code */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input
                    label="Landmark (Optional)"
                    placeholder="e.g. Near City Bank"
                    value={formData.landmark}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, landmark: e.target.value }))
                    }
                  />
                  <Input
                    label="Postal Code (Optional)"
                    placeholder="e.g. 1209"
                    value={formData.postal_code}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, postal_code: e.target.value }))
                    }
                  />
                </div>

                {/* Is Default Checkbox */}
                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="is_default_checkbox"
                    checked={formData.is_default}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, is_default: e.target.checked }))
                    }
                    className="w-4 h-4 rounded border-bg-border text-primary-500 focus:ring-primary-500/20 bg-bg-surface cursor-pointer"
                  />
                  <label
                    htmlFor="is_default_checkbox"
                    className="text-xs font-semibold text-content-secondary cursor-pointer select-none"
                  >
                    Set as default delivery address
                  </label>
                </div>

                {/* Form Actions */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-bg-border">
                  <Button type="button" onClick={closeModal} variant="ghost" size="sm">
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    loading={createMutation.isPending || updateMutation.isPending}
                    className="rounded-full px-6 font-bold shadow-glow"
                  >
                    {editingAddress ? 'Update Address' : 'Save Address'}
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* ── DELETE CONFIRMATION MODAL ── */}
      <AnimatePresence>
        {deletingAddress && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDeletingAddress(null)}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-sm bg-bg-card border border-bg-border rounded-3xl shadow-2xl p-6 z-10 text-center space-y-4"
            >
              <div className="w-12 h-12 rounded-2xl bg-red-500/10 text-red-400 border border-red-500/20 flex items-center justify-center mx-auto">
                <Trash2 className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h4 className="font-head font-bold text-base text-content-primary">Delete Address?</h4>
                <p className="text-xs text-content-secondary">
                  Are you sure you want to remove <strong>"{deletingAddress.full_address}"</strong>?
                </p>
              </div>
              <div className="flex items-center justify-center gap-3 pt-2">
                <Button
                  onClick={() => setDeletingAddress(null)}
                  variant="ghost"
                  size="sm"
                  className="rounded-full px-5 text-xs"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => deleteMutation.mutate(deletingAddress.id)}
                  loading={deleteMutation.isPending}
                  variant="primary"
                  size="sm"
                  className="rounded-full px-5 text-xs bg-red-600 hover:bg-red-500 border-none font-bold"
                >
                  Yes, Remove
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
