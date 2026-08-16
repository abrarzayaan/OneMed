import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  User,
  Mail,
  Phone,
  Calendar,
  Camera,
  Save,
  CheckCircle2,
  ShieldAlert,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { profileApi } from '@/api/profile.api';
import { useAuthStore } from '@/store/auth.store';
import AccountSidebar from '@/portals/consumer/components/account/AccountSidebar';
import Button from '@/components/ui/Button';
import Skeleton from '@/components/ui/Skeleton';

export default function ProfilePage() {
  const queryClient = useQueryClient();
  const { user, updateUser } = useAuthStore();

  const [firstName, setFirstName] = useState<string>('');
  const [lastName, setLastName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [gender, setGender] = useState<string>('');
  const [dateOfBirth, setDateOfBirth] = useState<string>('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Fetch current profile
  const { data: profile, isLoading } = useQuery({
    queryKey: ['consumer-profile'],
    queryFn: async () => {
      const res = await profileApi.getConsumerProfile();
      return res.data;
    },
  });

  useEffect(() => {
    if (profile) {
      if (profile.first_name) setFirstName(profile.first_name);
      else if (user?.first_name) setFirstName(user.first_name);

      if (profile.last_name) setLastName(profile.last_name);
      else if (user?.last_name) setLastName(user.last_name);

      if (profile.email) setEmail(profile.email);
      else if (user?.email) setEmail(user.email);

      if (profile.gender) setGender(profile.gender);
      if (profile.date_of_birth) setDateOfBirth(profile.date_of_birth);

      if (profile.profile_image) {
        const fullUrl = profile.profile_image.startsWith('http')
          ? profile.profile_image
          : `http://localhost:8000${profile.profile_image}`;
        setImagePreview(fullUrl);
      }
    }
  }, [profile, user]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const updateMutation = useMutation({
    mutationFn: async () => {
      const formData = new FormData();
      formData.append('first_name', firstName);
      formData.append('last_name', lastName);
      formData.append('email', email);
      if (gender) formData.append('gender', gender);
      if (dateOfBirth) formData.append('date_of_birth', dateOfBirth);
      if (imageFile) formData.append('profile_image', imageFile);

      const res = await profileApi.updateConsumerProfile(formData);
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['consumer-profile'] });
      updateUser({
        first_name: data.first_name,
        last_name: data.last_name,
        email: data.email,
      });
      toast.success('Profile updated successfully! 🎉');
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.detail || 'Failed to update profile details.';
      toast.error(msg);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* Account Sidebar */}
        <AccountSidebar />

        {/* Main Content Area */}
        <div className="flex-1 w-full space-y-6">
          {/* Header */}
          <div className="border-b border-bg-border pb-4">
            <h1 className="font-head text-2xl sm:text-3xl font-extrabold text-content-primary flex items-center gap-2.5">
              <User className="w-7 h-7 text-primary-400" /> Account Profile
            </h1>
            <p className="text-xs text-content-secondary mt-1">
              Update your full name, profile photo, and personal account details.
            </p>
          </div>

          {isLoading ? (
            <Skeleton className="h-96 rounded-3xl w-full" />
          ) : (
            <motion.form
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              onSubmit={handleSubmit}
              className="bg-bg-card border border-bg-border rounded-3xl p-6 sm:p-8 space-y-8 shadow-card"
            >
              {/* Avatar Upload Section */}
              <div className="flex flex-col sm:flex-row items-center gap-6 pb-6 border-b border-bg-border">
                <div className="relative group">
                  <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-bg-surface border-2 border-primary-500/40 overflow-hidden flex items-center justify-center shadow-lg">
                    {imagePreview ? (
                      <img
                        src={imagePreview}
                        alt="Profile Avatar"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-12 h-12 text-content-muted" />
                    )}
                  </div>
                  <label
                    htmlFor="avatar-upload"
                    className="absolute bottom-0 right-0 p-2.5 rounded-full bg-primary-600 hover:bg-primary-500 text-white shadow-md cursor-pointer transition-transform hover:scale-110"
                    title="Change picture"
                  >
                    <Camera className="w-4 h-4" />
                  </label>
                  <input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </div>

                <div className="space-y-1 text-center sm:text-left">
                  <h3 className="font-head font-bold text-base text-content-primary">
                    Profile Picture
                  </h3>
                  <p className="text-xs text-content-secondary max-w-xs">
                    Upload a high resolution avatar (JPG, PNG or WebP). Recommended size: 400x400.
                  </p>
                  {imageFile && (
                    <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-semibold pt-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> New image ready to save
                    </span>
                  )}
                </div>
              </div>

              {/* Editable Name & Basic Info */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-head font-bold text-sm text-content-primary uppercase tracking-wider">
                    Full Name & Account Info
                  </h3>
                  <span className="text-[10px] bg-bg-surface text-content-muted px-2 py-0.5 rounded border border-bg-border">
                    Verified Account
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-content-secondary uppercase tracking-wider flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-primary-400" /> First Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Abrar"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="w-full rounded-2xl bg-bg-surface border border-bg-border p-3 text-content-primary text-xs focus:outline-none focus:border-primary-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-content-secondary uppercase tracking-wider flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-primary-400" /> Last Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Zayaan"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="w-full rounded-2xl bg-bg-surface border border-bg-border p-3 text-content-primary text-xs focus:outline-none focus:border-primary-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-content-secondary uppercase tracking-wider flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-primary-400" /> Phone Number (Primary ID)
                    </label>
                    <input
                      type="text"
                      readOnly
                      value={user?.phone || profile?.phone || 'N/A'}
                      className="w-full rounded-2xl bg-bg-surface/60 border border-bg-border/60 p-3 text-content-muted text-xs font-mono cursor-not-allowed"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-content-secondary uppercase tracking-wider flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-primary-400" /> Email Address
                    </label>
                    <input
                      type="email"
                      placeholder="e.g. abrar@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full rounded-2xl bg-bg-surface border border-bg-border p-3 text-content-primary text-xs focus:outline-none focus:border-primary-500"
                    />
                  </div>
                </div>
              </div>

              {/* Personal Details (DOB & Gender) */}
              <div className="space-y-4 pt-2">
                <h3 className="font-head font-bold text-sm text-content-primary uppercase tracking-wider">
                  Demographic Details
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Date of Birth Input */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-content-secondary uppercase tracking-wider flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-primary-400" /> Date of Birth
                    </label>
                    <input
                      type="date"
                      value={dateOfBirth}
                      onChange={(e) => setDateOfBirth(e.target.value)}
                      className="w-full rounded-2xl bg-bg-surface border border-bg-border p-3 text-content-primary text-xs focus:outline-none focus:border-primary-500"
                    />
                  </div>

                  {/* Gender Selector */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-content-secondary uppercase tracking-wider flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-primary-400" /> Gender
                    </label>
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                      className="w-full rounded-2xl bg-bg-surface border border-bg-border p-3 text-content-primary text-xs focus:outline-none focus:border-primary-500 capitalize"
                    >
                      <option value="">Select Gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Submit Action */}
              <div className="pt-4 border-t border-bg-border flex items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-content-muted text-[11px]">
                  <ShieldAlert className="w-4 h-4 text-primary-400 shrink-0" />
                  <span>Your medical privacy is protected by OneMed.</span>
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  loading={updateMutation.isPending}
                  className="rounded-full px-8 font-bold shadow-glow gap-2 text-xs"
                >
                  <Save className="w-4 h-4" /> Save Profile
                </Button>
              </div>
            </motion.form>
          )}
        </div>
      </div>
    </div>
  );
}
