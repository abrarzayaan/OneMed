import React, { useState, useEffect } from 'react';
import { 
  UserCheck, 
  Bike, 
  Phone, 
  Mail, 
  CreditCard, 
  FileText, 
  ShieldAlert, 
  CheckCircle2, 
  User, 
  Save, 
  Loader2,
  Sparkles,
  ShieldCheck
} from 'lucide-react';
import { RiderHeader } from '../components/RiderHeader';
import { riderApi } from '@/api/rider.api';
import type { RiderProfile, VehicleType, AvailabilityStatus } from '@/api/rider.api';
import toast from 'react-hot-toast';

export const RiderProfilePage: React.FC = () => {
  const [profile, setProfile] = useState<RiderProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form Fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [vehicleType, setVehicleType] = useState<VehicleType>('bike');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [nidNo, setNidNo] = useState('');
  const [licenseNo, setLicenseNo] = useState('');

  const fetchProfileData = async () => {
    setIsLoading(true);
    try {
      const data = await riderApi.getProfile();
      setProfile(data);
      setFirstName(data.first_name || '');
      setLastName(data.last_name || '');
      setPhone(data.phone || '');
      setEmail(data.email || '');
      setVehicleType(data.vehicle_type || 'bike');
      setVehicleNumber(data.vehicle_number || '');
      setNidNo(data.nid_no || '');
      setLicenseNo(data.license_no || '');
    } catch (err: any) {
      toast.error('Failed to load rider profile');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileData();
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const updated = await riderApi.updateProfile({
        first_name: firstName,
        last_name: lastName,
        phone: phone,
        email: email,
        vehicle_type: vehicleType,
        vehicle_number: vehicleNumber,
        nid_no: nidNo,
        license_no: licenseNo,
      });

      setProfile(updated);
      toast.success('Express Rider Profile updated successfully!');
    } catch (err: any) {
      const errMsg = err.response?.data?.error || 'Failed to update profile';
      toast.error(errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isProfileComplete = profile?.is_profile_complete ?? false;

  return (
    <div className="min-h-screen bg-surface-base text-content-primary flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      
      {/* Header */}
      <RiderHeader
        profile={profile}
        onRefreshProfile={fetchProfileData}
      />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8 pb-24 md:pb-8">
        
        {/* Page Title */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-500/15 text-cyan-300 text-xs font-bold border border-cyan-500/30 mb-2">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>LOGISTICS FLEET CREDENTIALS</span>
            </div>
            <h1 className="font-head font-black text-xl sm:text-3xl text-content-primary flex items-center space-x-2">
              <span>Rider Credentials & Verification</span>
            </h1>
            <p className="text-xs sm:text-sm text-content-muted mt-1">
              Update your NID, Driving License, Vehicle Details, and Contact Info
            </p>
          </div>

          <div className="flex items-center space-x-2 self-start sm:self-auto shrink-0">
            <span className={`px-3.5 py-2 rounded-2xl text-xs font-black border flex items-center space-x-2 shadow-md ${
              isProfileComplete
                ? 'bg-gradient-to-r from-cyan-500/20 to-emerald-500/20 text-cyan-300 border-cyan-500/40'
                : 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-300 border-amber-500/40 animate-pulse'
            }`}>
              {isProfileComplete ? (
                <>
                  <ShieldCheck className="w-4 h-4 text-cyan-400" />
                  <span>Profile Verified & Complete</span>
                </>
              ) : (
                <>
                  <ShieldAlert className="w-4 h-4 text-amber-400" />
                  <span>Incomplete Credentials</span>
                </>
              )}
            </span>
          </div>
        </div>

        {/* Profile Card */}
        <div className="bg-surface-card/90 border border-border-default/80 rounded-3xl shadow-2xl p-4 sm:p-10">
          {isLoading ? (
            <div className="p-12 text-center text-content-muted space-y-3">
              <Loader2 className="w-9 h-9 animate-spin mx-auto text-cyan-400" />
              <p className="text-xs font-semibold">Loading rider profile from server...</p>
            </div>
          ) : (
            <form onSubmit={handleSaveProfile} className="space-y-6 sm:space-y-8">
              
              {/* Personal Avatar Banner */}
              <div className="p-4 sm:p-6 bg-gradient-to-r from-cyan-950/40 via-surface-base/80 to-emerald-950/30 border border-border-default/80 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
                <div className="flex items-center space-x-3 sm:space-x-4 min-w-0">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-tr from-cyan-500 to-emerald-500 p-[1px] shadow-lg shadow-cyan-500/20 shrink-0">
                    <div className="w-full h-full bg-surface-card rounded-[15px] flex items-center justify-center text-cyan-300 font-head font-black text-lg sm:text-2xl">
                      {firstName ? firstName[0].toUpperCase() : 'R'}
                    </div>
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-head font-black text-base sm:text-xl text-content-primary truncate">
                      {firstName} {lastName}
                    </h3>
                    <p className="text-[11px] sm:text-xs text-content-muted font-mono mt-0.5 truncate">
                      Rider ID: #{profile?.id} • Fleet Vehicle: <span className="capitalize text-cyan-300 font-bold">{profile?.vehicle_type || 'bike'}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2 self-start sm:self-auto shrink-0">
                  <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-xs font-bold uppercase">
                    Status: {profile?.verification_status || 'Verified'}
                  </span>
                </div>
              </div>

              {/* Form Grid */}
              <div className="space-y-6">
                
                {/* Section 1: Personal Info */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center space-x-2">
                    <User className="w-4 h-4" />
                    <span>Personal Identity Details</span>
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-content-secondary mb-1.5">
                        First Name <span className="text-rose-400">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="w-full px-4 py-2.5 bg-surface-base/80 border border-border-default/80 rounded-2xl text-xs text-content-primary focus:outline-none focus:border-cyan-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-content-secondary mb-1.5">
                        Last Name
                      </label>
                      <input
                        type="text"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className="w-full px-4 py-2.5 bg-surface-base/80 border border-border-default/80 rounded-2xl text-xs text-content-primary focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-content-secondary mb-1.5">
                        Phone Number <span className="text-rose-400">*</span>
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-3.5 top-3 w-4 h-4 text-content-muted" />
                        <input
                          type="text"
                          required
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="w-full pl-10 pr-4 py-2.5 bg-surface-base/80 border border-border-default/80 rounded-2xl text-xs text-content-primary focus:outline-none focus:border-cyan-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-content-secondary mb-1.5">
                        Email Address
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3.5 top-3 w-4 h-4 text-content-muted" />
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full pl-10 pr-4 py-2.5 bg-surface-base/80 border border-border-default/80 rounded-2xl text-xs text-content-primary focus:outline-none focus:border-cyan-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section 2: Vehicle & Credentials */}
                <div className="space-y-4 pt-4 border-t border-border-default/60">
                  <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center space-x-2">
                    <Bike className="w-4 h-4" />
                    <span>Vehicle & License Documentation</span>
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-content-secondary mb-1.5">
                        Vehicle Type <span className="text-rose-400">*</span>
                      </label>
                      <select
                        value={vehicleType}
                        onChange={(e) => setVehicleType(e.target.value as VehicleType)}
                        className="w-full px-4 py-2.5 bg-surface-base/80 border border-border-default/80 rounded-2xl text-xs text-content-primary focus:outline-none focus:border-cyan-500"
                      >
                        <option value="bike">Motorbike</option>
                        <option value="cycle">Bicycle</option>
                        <option value="car">Delivery Car / Van</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-content-secondary mb-1.5">
                        Vehicle Reg Number {vehicleType !== 'cycle' && <span className="text-rose-400">*</span>}
                      </label>
                      <input
                        type="text"
                        required={vehicleType !== 'cycle'}
                        value={vehicleNumber}
                        onChange={(e) => setVehicleNumber(e.target.value)}
                        placeholder="e.g. DHAKA METRO-HA-1234"
                        className="w-full px-4 py-2.5 bg-surface-base/80 border border-border-default/80 rounded-2xl text-xs text-content-primary focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-content-secondary mb-1.5">
                        National ID (NID) Number <span className="text-rose-400">*</span>
                      </label>
                      <div className="relative">
                        <CreditCard className="absolute left-3.5 top-3 w-4 h-4 text-content-muted" />
                        <input
                          type="text"
                          required
                          value={nidNo}
                          onChange={(e) => setNidNo(e.target.value)}
                          placeholder="NID 199XXXXXXXXXXXXXX"
                          className="w-full pl-10 pr-4 py-2.5 bg-surface-base/80 border border-border-default/80 rounded-2xl text-xs text-content-primary focus:outline-none focus:border-cyan-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-content-secondary mb-1.5">
                        Driving License Number {vehicleType !== 'cycle' && <span className="text-rose-400">*</span>}
                      </label>
                      <div className="relative">
                        <FileText className="absolute left-3.5 top-3 w-4 h-4 text-content-muted" />
                        <input
                          type="text"
                          required={vehicleType !== 'cycle'}
                          value={licenseNo}
                          onChange={(e) => setLicenseNo(e.target.value)}
                          placeholder="Driving License #"
                          className="w-full pl-10 pr-4 py-2.5 bg-surface-base/80 border border-border-default/80 rounded-2xl text-xs text-content-primary focus:outline-none focus:border-cyan-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>

              </div>

              {/* Submit Button */}
              <div className="pt-6 border-t border-border-default/80 flex justify-end">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full sm:w-auto flex items-center justify-center space-x-2 px-8 py-3.5 bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-2xl shadow-xl shadow-cyan-500/25 transition-transform hover:scale-105 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  <span>Save Profile & Verify Credentials</span>
                </button>
              </div>

            </form>
          )}
        </div>

      </main>
    </div>
  );
};
