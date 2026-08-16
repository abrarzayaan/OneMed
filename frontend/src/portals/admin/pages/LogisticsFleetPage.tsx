import React, { useState, useEffect, useMemo } from 'react';
import {
  Truck,
  MapPin,
  Navigation,
  Clock,
  Star,
  Phone,
  Plus,
  Search,
  RefreshCw,
  Edit3,
  Trash2,
  Bike,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Radio,
  Compass,
  UserCheck,
  Zap,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { adminLogisticsApi } from '../api/adminLogistics.api';
import type { DeliveryRider } from '../api/adminLogistics.api';
import { adminRiderVerificationApi, type AdminRiderItem } from '../api/adminRiderVerification.api';

export const LogisticsFleetPage: React.FC = () => {
  const [riders, setRiders] = useState<DeliveryRider[]>([]);
  const [dbRiders, setDbRiders] = useState<AdminRiderItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'IN_TRANSIT' | 'ON_DUTY' | 'OFF_DUTY'>('ALL');
  const [selectedRider, setSelectedRider] = useState<DeliveryRider | null>(null);

  // Add/Edit Rider Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formVehicle, setFormVehicle] = useState<DeliveryRider['vehicle_type']>('Motorcycle');
  const [formZone, setFormZone] = useState('');

  const loadRiders = async () => {
    setLoading(true);
    try {
      const [fleetData, pendingList] = await Promise.all([
        adminLogisticsApi.getRiders(),
        adminRiderVerificationApi.getRiders(),
      ]);
      setRiders(fleetData);
      setDbRiders(pendingList);
      if (fleetData.length > 0 && !selectedRider) {
        setSelectedRider(fleetData[0]);
      }
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRiders();
  }, []);

  const handleVerifyRider = async (riderId: number, name: string) => {
    try {
      await adminRiderVerificationApi.updateRiderVerification(riderId, {
        verification_status: 'verified',
        availability_status: 'online',
      });
      toast.success(`Rider ${name} verified successfully! Account is now active.`);
      loadRiders();
    } catch {
      toast.error('Failed to verify rider profile');
    }
  };

  // Filtered List
  const filteredRiders = useMemo(() => {
    return riders.filter((r) => {
      const matchesSearch =
        r.rider_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.phone_number.includes(searchQuery) ||
        r.assigned_zone.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (r.current_active_order_id && r.current_active_order_id.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesStatus = statusFilter === 'ALL' ? true : r.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [riders, searchQuery, statusFilter]);

  // Operational Metrics
  const activeCount = useMemo(() => riders.filter((r) => r.status !== 'OFF_DUTY').length, [riders]);
  const inTransitCount = useMemo(() => riders.filter((r) => r.status === 'IN_TRANSIT').length, [riders]);
  const avgTime = useMemo(() => {
    if (riders.length === 0) return 0;
    const sum = riders.reduce((acc, r) => acc + r.avg_delivery_time_mins, 0);
    return Math.round(sum / riders.length);
  }, [riders]);
  const avgRating = useMemo(() => {
    if (riders.length === 0) return '0.0';
    const sum = riders.reduce((acc, r) => acc + r.rating, 0);
    return (sum / riders.length).toFixed(2);
  }, [riders]);

  // Toggle Status
  const handleStatusToggle = async (rider: DeliveryRider, newStatus: DeliveryRider['status']) => {
    await adminLogisticsApi.updateRiderStatus(rider.id, newStatus);
    toast.success(`${rider.rider_name} status updated to ${newStatus}`);
    loadRiders();
  };

  // Create Rider Form
  const handleSaveRider = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formPhone.trim()) {
      toast.error('Name and phone number are required');
      return;
    }

    await adminLogisticsApi.createRider({
      rider_name: formName,
      phone_number: formPhone,
      vehicle_type: formVehicle,
      assigned_zone: formZone || 'Central Dhaka Hub',
      status: 'ON_DUTY',
      current_location: 'Central Dhaka Hub',
      lat: 23.76,
      lng: 90.38,
      total_deliveries_completed: 0,
      avg_delivery_time_mins: 25,
      rating: 5.0,
      joined_date: new Date().toISOString().split('T')[0],
    });

    toast.success(`Rider ${formName} onboarded successfully!`);
    setIsModalOpen(false);
    setFormName('');
    setFormPhone('');
    setFormZone('');
    loadRiders();
  };

  // Delete Rider
  const handleDeleteRider = async (rider: DeliveryRider) => {
    if (confirm(`Remove rider ${rider.rider_name} from logistics fleet?`)) {
      await adminLogisticsApi.deleteRider(rider.id);
      toast.success('Rider removed');
      if (selectedRider?.id === rider.id) setSelectedRider(null);
      loadRiders();
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-primary-950 via-bg-card to-bg-card p-6 rounded-3xl border border-primary-500/30 shadow-xl">
        <div className="space-y-1">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-primary-500/10 text-primary-400 border border-primary-500/20 text-xs font-mono font-semibold">
            <Truck className="w-3.5 h-3.5" />
            <span>Section 11 — Logistics Fleet & Real-Time Rider Tracking</span>
          </div>
          <h1 className="text-2xl font-head font-bold text-content-primary">
            Delivery Rider Fleet & Live GPS Radar
          </h1>
          <p className="text-xs text-content-muted">
            Monitor real-time GPS locations of active delivery riders, track fulfillment speeds, and manage dispatch workloads.
          </p>
        </div>

        <button
          onClick={() => {
            setFormName('');
            setFormPhone('');
            setFormZone('Dhanmondi & Gulshan');
            setIsModalOpen(true);
          }}
          className="px-4 py-2 rounded-xl bg-primary-500 hover:bg-primary-600 text-white font-bold text-xs shadow-glow transition-all flex items-center space-x-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Onboard New Rider</span>
        </button>
      </div>

      {/* Operational Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-bg-card border border-bg-border shadow-card space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-content-muted">Active Fleet Riders</span>
            <UserCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-head font-extrabold text-content-primary">{activeCount}</div>
          <div className="text-[10px] text-emerald-400 font-mono">On-duty & available</div>
        </div>

        <div className="p-5 rounded-2xl bg-bg-card border border-bg-border shadow-card space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-content-muted">In-Transit Packages</span>
            <Zap className="w-4 h-4 text-primary-400" />
          </div>
          <div className="text-2xl font-head font-extrabold text-primary-400">{inTransitCount}</div>
          <div className="text-[10px] text-content-muted font-mono">Out for delivery right now</div>
        </div>

        <div className="p-5 rounded-2xl bg-bg-card border border-bg-border shadow-card space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-content-muted">Avg Delivery Speed</span>
            <Clock className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-head font-extrabold text-indigo-400">{avgTime} mins</div>
          <div className="text-[10px] text-content-muted font-mono">Doorstep delivery average</div>
        </div>

        <div className="p-5 rounded-2xl bg-bg-card border border-bg-border shadow-card space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-content-muted">Fleet Rating</span>
            <Star className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-head font-extrabold text-amber-400">★ {avgRating}</div>
          <div className="text-[10px] text-amber-400 font-mono">Customer satisfaction average</div>
        </div>
      </div>

      {/* ── LIVE GPS RADAR & MAP VISUALIZER ── */}
      <div className="p-6 rounded-3xl bg-bg-card border border-bg-border shadow-card space-y-4">
        <div className="flex items-center justify-between border-b border-bg-border pb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-primary-500/10 border border-primary-500/20 text-primary-400">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-base font-head font-bold text-content-primary">
                Live GPS Radar — Dhaka City Fleet Distribution
              </h2>
              <p className="text-xs text-content-muted">
                Real-time spatial telemetry of active riders and live medicine order dispatches.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 text-xs font-mono">
            <span className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>LIVE TRACKING</span>
            </span>
          </div>
        </div>

        {/* Visual Map Grid Canvas */}
        <div className="relative h-72 rounded-2xl bg-gradient-to-br from-gray-950 via-slate-900 to-gray-900 border border-bg-border/60 overflow-hidden flex items-center justify-center">
          {/* Grid lines background */}
          <div className="absolute inset-0 opacity-20 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />

          {/* Dhaka Hub Landmarks */}
          <div className="absolute top-6 left-12 text-[10px] font-mono text-gray-500 border border-gray-800 px-2 py-0.5 rounded bg-gray-950/80">
            📍 UTTARA HUB (Sector 3)
          </div>
          <div className="absolute top-16 right-16 text-[10px] font-mono text-gray-500 border border-gray-800 px-2 py-0.5 rounded bg-gray-950/80">
            📍 GULSHAN 2 HUB
          </div>
          <div className="absolute bottom-8 left-16 text-[10px] font-mono text-gray-500 border border-gray-800 px-2 py-0.5 rounded bg-gray-950/80">
            📍 DHANMONDI HUB (Rd 27)
          </div>
          <div className="absolute bottom-12 right-24 text-[10px] font-mono text-gray-500 border border-gray-800 px-2 py-0.5 rounded bg-gray-950/80">
            📍 SHAHBAGH CORNER
          </div>

          {/* Rider Live Radar Pins */}
          {riders.map((r, i) => {
            const positions = [
              { top: '65%', left: '28%' }, // Dhanmondi
              { top: '35%', left: '72%' }, // Gulshan
              { top: '20%', left: '25%' }, // Uttara
              { top: '45%', left: '42%' }, // Mirpur
              { top: '80%', left: '68%' }, // Shahbagh
            ];
            const pos = positions[i % positions.length];
            const isSelected = selectedRider?.id === r.id;

            return (
              <button
                key={r.id}
                onClick={() => setSelectedRider(r)}
                style={{ top: pos.top, left: pos.left }}
                className={`absolute transform -translate-x-1/2 -translate-y-1/2 group transition-all ${
                  isSelected ? 'z-30 scale-125' : 'z-10 hover:scale-110'
                }`}
              >
                {r.status === 'IN_TRANSIT' && (
                  <span className="absolute -inset-2 rounded-full bg-primary-500/30 animate-ping" />
                )}

                <div
                  className={`p-2 rounded-xl flex items-center space-x-1.5 shadow-xl border text-xs font-mono font-bold transition-all ${
                    r.status === 'IN_TRANSIT'
                      ? 'bg-primary-500 text-white border-primary-300'
                      : r.status === 'ON_DUTY'
                      ? 'bg-emerald-500 text-white border-emerald-300'
                      : r.status === 'IDLE'
                      ? 'bg-amber-500 text-white border-amber-300'
                      : 'bg-gray-800 text-gray-400 border-gray-700'
                  }`}
                >
                  <Navigation className="w-3.5 h-3.5 shrink-0" />
                  <span>{r.rider_name.split(' ')[0]}</span>
                  {r.current_active_order_id && (
                    <span className="px-1.5 py-0.5 rounded bg-black/40 text-[9px]">
                      {r.current_active_order_id}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Selected Rider Quick Telemetry Card */}
        {selectedRider && (
          <div className="p-4 rounded-2xl bg-bg-surface border border-bg-border flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-xl bg-primary-500/10 border border-primary-500/20 text-primary-400 font-bold">
                🏍️
              </div>
              <div>
                <div className="font-bold text-content-primary text-sm flex items-center space-x-2">
                  <span>{selectedRider.rider_name}</span>
                  <span className="text-[11px] font-mono text-content-muted">({selectedRider.vehicle_type})</span>
                </div>
                <div className="text-content-muted font-mono text-[11px]">
                  📍 {selectedRider.current_location}
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-4 font-mono text-xs">
              <div>
                <div className="text-[10px] text-content-muted">Fulfilled</div>
                <div className="font-bold text-content-primary">{selectedRider.total_deliveries_completed} orders</div>
              </div>

              <div>
                <div className="text-[10px] text-content-muted">Avg Speed</div>
                <div className="font-bold text-indigo-400">{selectedRider.avg_delivery_time_mins} mins</div>
              </div>

              <div>
                <div className="text-[10px] text-content-muted">Rating</div>
                <div className="font-bold text-amber-400">★ {selectedRider.rating}</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── PENDING RIDER APPROVALS BANNER ── */}
      {dbRiders.some((r) => r.verification_status === 'pending') && (
        <div className="p-5 rounded-3xl bg-amber-500/10 border border-amber-500/30 space-y-3 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Clock className="w-5 h-5 text-amber-400 animate-pulse" />
              <h3 className="text-sm font-head font-bold text-amber-300">
                Pending Rider Partner Applications ({dbRiders.filter((r) => r.verification_status === 'pending').length})
              </h3>
            </div>
            <span className="text-[11px] font-mono text-amber-400/80">Action Required</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {dbRiders
              .filter((r) => r.verification_status === 'pending')
              .map((rider) => (
                <div
                  key={rider.id}
                  className="p-4 rounded-2xl bg-bg-card border border-amber-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1 text-xs">
                    <div className="font-bold text-content-primary flex items-center space-x-2">
                      <span>{rider.rider_name}</span>
                      <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 font-mono text-[10px] uppercase font-bold">
                        {rider.vehicle_type}
                      </span>
                    </div>
                    <div className="text-content-muted font-mono text-[11px]">📱 Phone: {rider.phone_number}</div>
                    {rider.nid_no && (
                      <div className="text-content-muted font-mono text-[11px]">🪪 NID: {rider.nid_no}</div>
                    )}
                  </div>

                  <button
                    onClick={() => handleVerifyRider(rider.id, rider.rider_name)}
                    className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs shadow-glow transition-all flex items-center justify-center space-x-1.5 self-start sm:self-auto"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Approve & Verify</span>
                  </button>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Rider Roster Directory */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-bg-card border border-bg-border">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-content-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search rider by name, phone, zone, or active order..."
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-bg-surface border border-bg-border text-xs text-content-primary focus:border-primary-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-xs font-mono font-bold text-content-muted">Filter:</span>
            <div className="flex rounded-xl bg-bg-surface border border-bg-border p-1">
              {(
                [
                  { key: 'ALL', label: 'All Riders' },
                  { key: 'IN_TRANSIT', label: '🛵 In-Transit' },
                  { key: 'ON_DUTY', label: '🟢 Available' },
                  { key: 'OFF_DUTY', label: '🔴 Off-Duty' },
                ] as const
              ).map((st) => (
                <button
                  key={st.key}
                  onClick={() => setStatusFilter(st.key)}
                  className={`px-3 py-1 rounded-lg text-xs font-mono transition-all ${
                    statusFilter === st.key
                      ? 'bg-primary-500/20 text-primary-400 font-bold border border-primary-500/30'
                      : 'text-content-muted hover:text-content-primary'
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>

            <button
              onClick={loadRiders}
              className="p-2 rounded-xl bg-bg-surface border border-bg-border text-content-muted hover:text-content-primary transition-all"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="rounded-3xl bg-bg-card border border-bg-border shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-bg-border bg-bg-surface text-[10px] font-mono uppercase text-content-muted">
                  <th className="p-4">Delivery Rider & Contact</th>
                  <th className="p-4">Vehicle & Zone</th>
                  <th className="p-4">Current Duty Status</th>
                  <th className="p-4">Active Order</th>
                  <th className="p-4">Deliveries</th>
                  <th className="p-4">Rating</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-bg-border text-xs">
                {filteredRiders.map((rider) => (
                  <tr key={rider.id} className="hover:bg-bg-surface/50 transition-colors">
                    <td className="p-4">
                      <div className="font-bold text-content-primary">{rider.rider_name}</div>
                      <div className="text-[11px] font-mono text-content-muted flex items-center space-x-1">
                        <Phone className="w-3 h-3" />
                        <span>{rider.phone_number}</span>
                      </div>
                    </td>

                    <td className="p-4 space-y-0.5">
                      <div className="font-bold text-content-primary flex items-center space-x-1.5">
                        <Bike className="w-3.5 h-3.5 text-primary-400" />
                        <span>{rider.vehicle_type}</span>
                      </div>
                      <div className="text-[11px] text-content-muted font-mono">{rider.assigned_zone}</div>
                    </td>

                    <td className="p-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold border ${
                          rider.status === 'IN_TRANSIT'
                            ? 'bg-primary-500/10 text-primary-400 border-primary-500/20'
                            : rider.status === 'ON_DUTY'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : rider.status === 'IDLE'
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                            : 'bg-gray-500/10 text-gray-400 border-gray-500/20'
                        }`}
                      >
                        {rider.status === 'IN_TRANSIT'
                          ? '🛵 In-Transit'
                          : rider.status === 'ON_DUTY'
                          ? '🟢 On Duty'
                          : rider.status === 'IDLE'
                          ? '⏳ Idle'
                          : '🔴 Off Duty'}
                      </span>
                    </td>

                    <td className="p-4 font-mono">
                      {rider.current_active_order_id ? (
                        <span className="font-bold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-lg">
                          {rider.current_active_order_id}
                        </span>
                      ) : (
                        <span className="text-content-muted text-[11px]">None</span>
                      )}
                    </td>

                    <td className="p-4 font-mono font-bold text-content-primary">
                      {rider.total_deliveries_completed} <span className="text-[10px] font-normal text-content-muted">delivered</span>
                    </td>

                    <td className="p-4 font-mono font-bold text-amber-400">
                      ★ {rider.rating}
                    </td>

                    <td className="p-4 text-right space-x-1.5 shrink-0">
                      {rider.status === 'OFF_DUTY' ? (
                        <button
                          onClick={() => handleStatusToggle(rider, 'ON_DUTY')}
                          className="px-2.5 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 hover:border-emerald-500 text-emerald-400 font-mono text-[11px] font-bold"
                        >
                          Set On Duty
                        </button>
                      ) : (
                        <button
                          onClick={() => handleStatusToggle(rider, 'OFF_DUTY')}
                          className="px-2.5 py-1.5 rounded-xl bg-gray-500/10 border border-gray-500/20 hover:border-gray-500 text-gray-400 font-mono text-[11px] font-bold"
                        >
                          Set Off Duty
                        </button>
                      )}

                      <button
                        onClick={() => handleDeleteRider(rider)}
                        className="p-1.5 rounded-xl bg-rose-500/10 border border-rose-500/20 hover:border-rose-500 text-rose-400 transition-colors"
                        title="Remove Rider"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── MODAL: ONBOARD NEW RIDER ── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-bg-card border border-bg-border rounded-3xl max-w-md w-full p-6 space-y-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-bg-border pb-3">
              <h3 className="text-sm font-head font-bold text-content-primary">Onboard Delivery Rider</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-content-muted hover:text-content-primary text-xs font-mono font-bold"
              >
                ✕ ESC
              </button>
            </div>

            <form onSubmit={handleSaveRider} className="space-y-4">
              <div>
                <label className="block text-xs font-mono font-bold text-content-muted mb-1">
                  Rider Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Rafiqul Islam"
                  className="w-full px-3.5 py-2 rounded-xl bg-bg-surface border border-bg-border text-xs text-content-primary focus:border-primary-500 focus:outline-none font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-mono font-bold text-content-muted mb-1">
                  Mobile Phone Number *
                </label>
                <input
                  type="text"
                  required
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  placeholder="e.g. 01711000111"
                  className="w-full px-3.5 py-2 rounded-xl bg-bg-surface border border-bg-border text-xs text-content-primary font-mono focus:border-primary-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-mono font-bold text-content-muted mb-1">
                  Vehicle Type
                </label>
                <select
                  value={formVehicle}
                  onChange={(e) => setFormVehicle(e.target.value as any)}
                  className="w-full px-3.5 py-2 rounded-xl bg-bg-surface border border-bg-border text-xs text-content-primary focus:border-primary-500 focus:outline-none"
                >
                  <option value="Motorcycle">Motorcycle 🏍️</option>
                  <option value="Scooter">Scooter 🛵</option>
                  <option value="Electric Bike">Electric Bike ⚡</option>
                  <option value="Bicycle">Bicycle 🚲</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono font-bold text-content-muted mb-1">
                  Assigned Delivery Zone / Area
                </label>
                <input
                  type="text"
                  value={formZone}
                  onChange={(e) => setFormZone(e.target.value)}
                  placeholder="e.g. Dhanmondi & Mohammadpur"
                  className="w-full px-3.5 py-2 rounded-xl bg-bg-surface border border-bg-border text-xs text-content-primary focus:border-primary-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-bg-border">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-bg-surface border border-bg-border text-xs font-semibold text-content-muted hover:text-content-primary"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-primary-500 hover:bg-primary-600 text-white font-bold text-xs shadow-glow"
                >
                  Onboard Rider
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
