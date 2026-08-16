import React, { useState, useEffect } from 'react';
import { X, ShieldAlert, CheckCircle2, Bike, CreditCard, FileText, Phone, User, Loader2 } from 'lucide-react';
import { riderApi } from '@/api/rider.api';
import type { RiderProfile, VehicleType } from '@/api/rider.api';
import toast from 'react-hot-toast';

interface RiderProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: RiderProfile | null;
  onProfileUpdated: () => void;
}

export const RiderProfileModal: React.FC<RiderProfileModalProps> = ({
  isOpen,
  onClose,
  profile,
  onProfileUpdated,
}) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [vehicleType, setVehicleType] = useState<VehicleType>('bike');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [nidNo, setNidNo] = useState('');
  const [licenseNo, setLicenseNo] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (profile) {
      setFirstName(profile.first_name || '');
      setLastName(profile.last_name || '');
      setPhone(profile.phone || '');
      setVehicleType(profile.vehicle_type || 'bike');
      setVehicleNumber(profile.vehicle_number || '');
      setNidNo(profile.nid_no || '');
      setLicenseNo(profile.license_no || '');
    }
  }, [profile, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await riderApi.updateProfile({
        first_name: firstName,
        last_name: lastName,
        phone: phone,
        vehicle_type: vehicleType,
        vehicle_number: vehicleNumber,
        nid_no: nidNo,
        license_no: licenseNo,
      });

      toast.success('Rider profile updated successfully!');
      onProfileUpdated();
      onClose();
    } catch (err: any) {
      const errMsg = err.response?.data?.error || 'Failed to update rider profile';
      toast.error(errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isComplete = profile?.is_profile_complete ?? false;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-xl bg-surface-card border border-border-default rounded-2xl shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border-default bg-surface-subtle/50">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/15 flex items-center justify-center text-cyan-400 border border-cyan-500/20">
              <Bike className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-head font-bold text-lg text-content-primary">
                Express Rider Profile
              </h3>
              <p className="text-xs text-content-muted">
                Complete your details to unlock order assignment and delivery actions
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-content-muted hover:text-content-primary hover:bg-surface-subtle rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Warning Banner if Incomplete */}
        {!isComplete && (
          <div className="mx-5 mt-4 p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-start space-x-3 text-amber-300 text-xs">
            <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-300">Mandatory Profile Completion Required!</p>
              <p className="mt-0.5 text-amber-300/80">
                You cannot perform actions on any order until your NID number, Vehicle details, and Phone number are completed below.
              </p>
            </div>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          
          {/* Name Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-content-secondary mb-1">
                First Name <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 w-4 h-4 text-content-muted" />
                <input
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="e.g. Tanvir"
                  className="w-full pl-9 pr-3 py-2 bg-surface-base border border-border-default rounded-lg text-sm text-content-primary focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-content-secondary mb-1">
                Last Name
              </label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="e.g. Hossain"
                className="w-full px-3 py-2 bg-surface-base border border-border-default rounded-lg text-sm text-content-primary focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          {/* Contact Phone & Vehicle Type */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-content-secondary mb-1">
                Phone Number <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-2.5 w-4 h-4 text-content-muted" />
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="017XXXXXXXX"
                  className="w-full pl-9 pr-3 py-2 bg-surface-base border border-border-default rounded-lg text-sm text-content-primary focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-content-secondary mb-1">
                Vehicle Type <span className="text-rose-400">*</span>
              </label>
              <select
                value={vehicleType}
                onChange={(e) => setVehicleType(e.target.value as VehicleType)}
                className="w-full px-3 py-2 bg-surface-base border border-border-default rounded-lg text-sm text-content-primary focus:outline-none focus:border-cyan-500"
              >
                <option value="bike">Motorbike</option>
                <option value="cycle">Bicycle</option>
                <option value="car">Delivery Car / Van</option>
              </select>
            </div>
          </div>

          {/* Vehicle Reg No & License No */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-content-secondary mb-1">
                Vehicle Registration # {vehicleType !== 'cycle' && <span className="text-rose-400">*</span>}
              </label>
              <input
                type="text"
                required={vehicleType !== 'cycle'}
                value={vehicleNumber}
                onChange={(e) => setVehicleNumber(e.target.value)}
                placeholder="e.g. DHAKA METRO-HA-1234"
                className="w-full px-3 py-2 bg-surface-base border border-border-default rounded-lg text-sm text-content-primary focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-content-secondary mb-1">
                Driving License # {vehicleType !== 'cycle' && <span className="text-rose-400">*</span>}
              </label>
              <div className="relative">
                <FileText className="absolute left-3 top-2.5 w-4 h-4 text-content-muted" />
                <input
                  type="text"
                  required={vehicleType !== 'cycle'}
                  value={licenseNo}
                  onChange={(e) => setLicenseNo(e.target.value)}
                  placeholder="DL-9876543210"
                  className="w-full pl-9 pr-3 py-2 bg-surface-base border border-border-default rounded-lg text-sm text-content-primary focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>
          </div>

          {/* NID Card Number */}
          <div>
            <label className="block text-xs font-medium text-content-secondary mb-1">
              National ID (NID) No <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <CreditCard className="absolute left-3 top-2.5 w-4 h-4 text-content-muted" />
              <input
                type="text"
                required
                value={nidNo}
                onChange={(e) => setNidNo(e.target.value)}
                placeholder="NID 199XXXXXXXXXXXXXX"
                className="w-full pl-9 pr-3 py-2 bg-surface-base border border-border-default rounded-lg text-sm text-content-primary focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          {/* Footer Submit */}
          <div className="pt-4 border-t border-border-default flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-content-secondary hover:bg-surface-subtle rounded-lg transition-colors"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center space-x-2 px-5 py-2 bg-gradient-to-r from-cyan-600 to-emerald-500 hover:from-cyan-500 hover:to-emerald-400 text-white font-medium text-sm rounded-lg shadow-lg shadow-cyan-500/20 transition-all disabled:opacity-50"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}
              <span>Save & Complete Profile</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
