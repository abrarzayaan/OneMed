import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Sparkles,
  Plus,
  Trash2,
  Edit3,
  Check,
  Eye,
  ArrowRight,
  Zap,
  ChevronRight,
  Palette,
  Layout,
  Globe,
  UploadCloud,
  Loader2,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { adminCmsApi } from '../api/adminCms.api';
import type {
  HeroBannerSlide,
  AnnouncementBarConfig,
} from '../api/adminCms.api';

export const CmsBannerPage: React.FC = () => {
  const [heroSlides, setHeroSlides] = useState<HeroBannerSlide[]>([]);
  const [announcement, setAnnouncement] = useState<AnnouncementBarConfig>({
    id: 1,
    text: 'Due to high medicine demand, orders are processed with priority express delivery across Bangladesh.',
    bg_theme: 'midnight',
    is_active: true,
  });

  const [loading, setLoading] = useState(true);
  const [selectedSlideId, setSelectedSlideId] = useState<number | null>(null);
  const [isEditingModalOpen, setIsEditingModalOpen] = useState(false);

  // Slide Form State
  const [formBadgeTag, setFormBadgeTag] = useState('');
  const [formHeadline, setFormHeadline] = useState('');
  const [formSubheadline, setFormSubheadline] = useState('');
  const [formCtaText, setFormCtaText] = useState('');
  const [formTargetUrl, setFormTargetUrl] = useState('');
  const [formImageUrl, setFormImageUrl] = useState('');
  const [formType, setFormType] = useState<HeroBannerSlide['type']>('main_hero');
  const [formSortOrder, setFormSortOrder] = useState(1);
  const [formIsActive, setFormIsActive] = useState(true);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const handleImgBBFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingImage(true);
    const toastId = toast.loading('Uploading image to ImgBB Cloud CDN...');

    try {
      const formData = new FormData();
      formData.append('image', file);
      const res = await axios.post('https://api.imgbb.com/1/upload?key=6ae6f2084f448bf93ad41c4b2c0a2053', formData);

      const imageUrl = res.data?.data?.url;
      if (imageUrl) {
        setFormImageUrl(imageUrl);
        toast.success('Image uploaded to ImgBB successfully!', { id: toastId });
      } else {
        toast.error('Failed to receive image URL from ImgBB', { id: toastId });
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.error?.message || err?.message || 'ImgBB upload failed', { id: toastId });
    } finally {
      setIsUploadingImage(false);
    }
  };

  // Load Data
  const loadCmsData = async () => {
    setLoading(true);
    const [slides, ann] = await Promise.all([
      adminCmsApi.getHeroBanners(),
      adminCmsApi.getAnnouncementBar(),
    ]);
    setHeroSlides(slides);
    setAnnouncement(ann);
    setLoading(false);
  };

  useEffect(() => {
    loadCmsData();
  }, []);

  const openCreateModal = () => {
    setSelectedSlideId(null);
    setFormBadgeTag('⚡ LIMITED TIME OFFER');
    setFormHeadline('New Essential Medicine Stock');
    setFormSubheadline('Authentic pharmaceutical items direct from verified manufacturers.');
    setFormCtaText('Shop Collection');
    setFormTargetUrl('/products');
    setFormImageUrl('https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800&auto=format&fit=crop&q=80');
    setFormType('main_hero');
    setFormSortOrder(heroSlides.length + 1);
    setFormIsActive(true);
    setIsEditingModalOpen(true);
  };

  const openEditModal = (slide: HeroBannerSlide) => {
    setSelectedSlideId(slide.id);
    setFormBadgeTag(slide.badge_tag);
    setFormHeadline(slide.headline);
    setFormSubheadline(slide.subheadline);
    setFormCtaText(slide.cta_text);
    setFormTargetUrl(slide.target_url);
    setFormImageUrl(slide.image_url);
    setFormType(slide.type);
    setFormSortOrder(slide.sort_order);
    setFormIsActive(slide.is_active);
    setIsEditingModalOpen(true);
  };

  const handleSaveSlide = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formHeadline.trim() || !formBadgeTag.trim()) {
      toast.error('Please enter Headline and Badge Tag');
      return;
    }

    const payload = {
      badge_tag: formBadgeTag,
      headline: formHeadline,
      subheadline: formSubheadline,
      cta_text: formCtaText,
      target_url: formTargetUrl,
      image_url: formImageUrl,
      type: formType,
      sort_order: Number(formSortOrder),
      is_active: formIsActive,
    };

    if (selectedSlideId) {
      await adminCmsApi.updateHeroBanner(selectedSlideId, payload);
      toast.success('Hero slide updated successfully!');
    } else {
      await adminCmsApi.createHeroBanner(payload);
      toast.success('New hero slide added successfully!');
    }

    setIsEditingModalOpen(false);
    loadCmsData();
  };

  const handleDeleteSlide = async (id: number) => {
    if (confirm('Are you sure you want to delete this hero slide?')) {
      await adminCmsApi.deleteHeroBanner(id);
      toast.success('Slide removed');
      loadCmsData();
    }
  };

  const handleToggleSlideActive = async (slide: HeroBannerSlide) => {
    await adminCmsApi.updateHeroBanner(slide.id, { is_active: !slide.is_active });
    toast.success(slide.is_active ? 'Slide unpublished' : 'Slide published live');
    loadCmsData();
  };

  const handleSaveAnnouncement = async () => {
    await adminCmsApi.updateAnnouncementBar(announcement);
    toast.success('Top announcement bar saved!');
  };

  // Color theme mapper for Announcement Bar
  const themeClasses: Record<AnnouncementBarConfig['bg_theme'], string> = {
    midnight: 'bg-primary-950/90 border-primary-900/50 text-primary-200',
    emerald: 'bg-emerald-950/90 border-emerald-900/50 text-emerald-200',
    indigo: 'bg-indigo-950/90 border-indigo-900/50 text-indigo-200',
    rose: 'bg-rose-950/90 border-rose-900/50 text-rose-200',
    amber: 'bg-amber-950/90 border-amber-900/50 text-amber-200',
  };

  const safeHeroSlides = Array.isArray(heroSlides) ? heroSlides : [];
  const mainHeroSlide = safeHeroSlides.find((s) => s && s.type === 'main_hero' && s.is_active) || safeHeroSlides[0];

  return (
    <div className="space-y-8 pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-primary-900/40 via-bg-card to-bg-card p-6 rounded-3xl border border-primary-500/30 shadow-xl">
        <div className="space-y-1">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-mono font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Section 05 — Dynamic CMS & Banner Control</span>
          </div>
          <h1 className="text-2xl font-head font-bold text-content-primary">
            Consumer Homepage Hero & Marquee Editor
          </h1>
          <p className="text-xs text-content-muted">
            Update hero banners, promotional headlines, CTA action links, and top announcement text in real-time.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="px-4 py-2.5 rounded-xl bg-primary-500 hover:bg-primary-600 text-white font-bold text-xs shadow-glow transition-all flex items-center space-x-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Hero Slide</span>
        </button>
      </div>

      {/* ── 1. TOP MARQUEE ANNOUNCEMENT BAR EDITOR ── */}
      <div className="p-6 rounded-3xl bg-bg-card border border-bg-border shadow-card space-y-6">
        <div className="flex items-center justify-between border-b border-bg-border pb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-head font-bold text-content-primary">
                Top Announcement Bar Editor
              </h2>
              <p className="text-xs text-content-muted">Displayed at the top of every consumer portal page</p>
            </div>
          </div>

          <button
            onClick={handleSaveAnnouncement}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-sm transition-all flex items-center space-x-1.5"
          >
            <Check className="w-4 h-4" />
            <span>Save Announcement</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Controls */}
          <div className="md:col-span-2 space-y-4">
            <div>
              <label className="block text-xs font-mono font-bold text-content-muted mb-1">
                Announcement Marquee Text
              </label>
              <textarea
                rows={2}
                value={announcement.text}
                onChange={(e) => setAnnouncement({ ...announcement, text: e.target.value })}
                placeholder="Enter notice message..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-bg-surface border border-bg-border text-xs text-content-primary focus:border-primary-500 focus:outline-none"
              />
            </div>

            <div className="flex flex-wrap items-center gap-6">
              <div>
                <label className="block text-xs font-mono font-bold text-content-muted mb-1.5">
                  Background Color Theme
                </label>
                <div className="flex items-center space-x-2">
                  {(['midnight', 'emerald', 'indigo', 'rose', 'amber'] as const).map((th) => (
                    <button
                      key={th}
                      type="button"
                      onClick={() => setAnnouncement({ ...announcement, bg_theme: th })}
                      className={`px-3 py-1 rounded-lg text-xs font-mono capitalize border transition-all ${
                        announcement.bg_theme === th
                          ? 'border-primary-500 bg-primary-500/20 text-content-primary font-bold'
                          : 'border-bg-border text-content-muted hover:text-content-primary'
                      }`}
                    >
                      {th}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono font-bold text-content-muted mb-1.5">
                  Banner Status
                </label>
                <button
                  type="button"
                  onClick={() => setAnnouncement({ ...announcement, is_active: !announcement.is_active })}
                  className="flex items-center space-x-2 text-xs font-bold"
                >
                  {announcement.is_active ? (
                    <ToggleRight className="w-7 h-7 text-emerald-400" />
                  ) : (
                    <ToggleLeft className="w-7 h-7 text-content-muted" />
                  )}
                  <span className={announcement.is_active ? 'text-emerald-400' : 'text-content-muted'}>
                    {announcement.is_active ? 'Active & Published' : 'Disabled (Hidden)'}
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* Live Preview Box */}
          <div className="space-y-2">
            <label className="block text-xs font-mono font-bold text-content-muted">
              Consumer Live Bar Preview
            </label>
            <div className="p-4 rounded-2xl bg-bg-base border border-bg-border space-y-3">
              {announcement.is_active ? (
                <div className={`p-2.5 rounded-xl border text-[11px] font-medium flex items-center justify-between ${themeClasses[announcement.bg_theme]}`}>
                  <p className="truncate">{announcement.text}</p>
                  <span className="font-bold text-accent-400 text-[10px] shrink-0 ml-2">Track</span>
                </div>
              ) : (
                <div className="p-3 rounded-xl border border-dashed border-bg-border text-center text-xs text-content-muted">
                  Banner Disabled
                </div>
              )}
              <div className="text-[10px] text-content-muted text-center font-mono">
                Updates dynamically on all consumer portal pages
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── 2. HERO SLIDES MANAGER & LIVE PREVIEW GRID ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Slides List Table (Left 7 Cols) */}
        <div className="lg:col-span-7 p-6 rounded-3xl bg-bg-card border border-bg-border shadow-card space-y-5">
          <div className="flex items-center justify-between border-b border-bg-border pb-3">
            <div className="flex items-center space-x-2">
              <Layout className="w-5 h-5 text-primary-400" />
              <div>
                <h2 className="text-base font-head font-bold text-content-primary">
                  Active Hero Banners ({heroSlides.length})
                </h2>
                <p className="text-xs text-content-muted">Manage homepage main hero slide & offer cards</p>
              </div>
            </div>

            <button
              onClick={openCreateModal}
              className="px-3 py-1.5 rounded-lg bg-primary-500/20 text-primary-400 hover:bg-primary-500/30 text-xs font-semibold border border-primary-500/30 flex items-center space-x-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Slide</span>
            </button>
          </div>

          <div className="space-y-3">
            {heroSlides.map((slide) => (
              <div
                key={slide.id}
                className={`p-4 rounded-2xl bg-bg-surface border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  slide.is_active ? 'border-bg-border hover:border-primary-500/40' : 'border-rose-500/30 bg-rose-950/10'
                }`}
              >
                <div className="flex items-center space-x-3 truncate">
                  <div className="w-16 h-12 rounded-xl bg-bg-base border border-bg-border overflow-hidden shrink-0 relative">
                    {slide.image_url ? (
                      <img src={slide.image_url} alt={slide.headline} className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon className="w-6 h-6 m-auto text-content-muted mt-3" />
                    )}
                    <span className="absolute top-0.5 left-0.5 px-1 rounded bg-black/70 text-[9px] font-mono text-white font-bold">
                      #{slide.sort_order}
                    </span>
                  </div>

                  <div className="truncate space-y-0.5">
                    <div className="flex items-center space-x-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-accent-500/10 text-accent-400 border border-accent-500/20 truncate max-w-[120px]">
                        {slide.badge_tag}
                      </span>
                      <span className="text-[10px] font-mono text-content-muted uppercase">
                        {(slide?.type || 'main_hero').replace(/_/g, ' ')}
                      </span>
                    </div>
                    <div className="text-xs font-bold text-content-primary truncate max-w-xs">
                      {slide.headline}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2 shrink-0 self-end sm:self-center">
                  <button
                    type="button"
                    onClick={() => handleToggleSlideActive(slide)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-semibold border ${
                      slide.is_active
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                    }`}
                  >
                    {slide.is_active ? 'Active' : 'Draft'}
                  </button>

                  <button
                    onClick={() => openEditModal(slide)}
                    className="p-2 rounded-lg bg-bg-card border border-bg-border hover:border-primary-500/40 text-primary-400 transition-colors"
                    title="Edit Slide"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => handleDeleteSlide(slide.id)}
                    className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/20 hover:border-rose-500 text-rose-400 transition-colors"
                    title="Delete Slide"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Live Consumer Portal Interactive Preview (Right 5 Cols) */}
        <div className="lg:col-span-5 p-6 rounded-3xl bg-bg-card border border-bg-border shadow-card space-y-4">
          <div className="flex items-center space-x-2 border-b border-bg-border pb-3">
            <Eye className="w-5 h-5 text-accent-400" />
            <div>
              <h2 className="text-base font-head font-bold text-content-primary">
                Consumer Portal Preview
              </h2>
              <p className="text-xs text-content-muted">How the main hero slide will look to customers</p>
            </div>
          </div>

          {mainHeroSlide ? (
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-primary-950 via-primary-900 to-bg-card border border-primary-500/30 p-6 flex flex-col justify-between min-h-[280px] shadow-2xl space-y-4 group">
              {mainHeroSlide.image_url && (
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                  <img
                    src={mainHeroSlide.image_url}
                    alt={mainHeroSlide.headline}
                    className="w-full h-full object-cover object-right opacity-90 group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-primary-950 via-primary-900/80 via-45% to-transparent" />
                </div>
              )}
              <div className="space-y-3 max-w-sm relative z-10">
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-accent-400 bg-accent-500/10 px-2.5 py-1 rounded-full uppercase tracking-wider">
                  <Zap className="w-3.5 h-3.5" /> {mainHeroSlide.badge_tag}
                </span>

                <h1 className="font-head font-extrabold text-xl sm:text-2xl text-content-primary leading-tight">
                  {mainHeroSlide.headline}
                </h1>

                <p className="text-content-secondary text-xs">
                  {mainHeroSlide.subheadline}
                </p>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  className="px-5 py-2.5 rounded-full bg-primary-500 text-white font-bold text-xs flex items-center space-x-2 shadow-glow"
                >
                  <span>{mainHeroSlide.cta_text || 'Get Yours Today'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-content-muted">No active hero slide</div>
          )}
        </div>
      </div>

      {/* ── 3. EDIT / CREATE SLIDE MODAL ── */}
      {isEditingModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-bg-card border border-bg-border rounded-3xl max-w-xl w-full p-6 space-y-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-bg-border pb-3">
              <h2 className="text-lg font-head font-bold text-content-primary">
                {selectedSlideId ? 'Edit Hero Banner Slide' : 'Create New Hero Slide'}
              </h2>
              <button
                onClick={() => setIsEditingModalOpen(false)}
                className="text-content-muted hover:text-content-primary text-xs font-mono font-bold"
              >
                ✕ ESC
              </button>
            </div>

            <form onSubmit={handleSaveSlide} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono font-bold text-content-muted mb-1">
                    Badge Tag Line *
                  </label>
                  <input
                    type="text"
                    required
                    value={formBadgeTag}
                    onChange={(e) => setFormBadgeTag(e.target.value)}
                    placeholder="e.g. ⚡ BUY 1 GET 1 FREE"
                    className="w-full px-3.5 py-2 rounded-xl bg-bg-surface border border-bg-border text-xs text-content-primary focus:border-primary-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono font-bold text-content-muted mb-1">
                    Slide Type *
                  </label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value as HeroBannerSlide['type'])}
                    className="w-full px-3.5 py-2 rounded-xl bg-bg-surface border border-bg-border text-xs text-content-primary focus:border-primary-500 focus:outline-none"
                  >
                    <option value="main_hero">Main Hero Banner (Large Left)</option>
                    <option value="side_top">Side Stack Banner (Top Right)</option>
                    <option value="side_bottom_left">Side Stack (Bottom Left)</option>
                    <option value="side_bottom_right">Side Stack (Bottom Right)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono font-bold text-content-muted mb-1">
                  Headline Title *
                </label>
                <input
                  type="text"
                  required
                  value={formHeadline}
                  onChange={(e) => setFormHeadline(e.target.value)}
                  placeholder="e.g. Multivitamin & Essential Supplements"
                  className="w-full px-3.5 py-2 rounded-xl bg-bg-surface border border-bg-border text-xs text-content-primary focus:border-primary-500 focus:outline-none font-bold text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-mono font-bold text-content-muted mb-1">
                  Subheadline Description
                </label>
                <textarea
                  rows={2}
                  value={formSubheadline}
                  onChange={(e) => setFormSubheadline(e.target.value)}
                  placeholder="Short description snippet..."
                  className="w-full px-3.5 py-2 rounded-xl bg-bg-surface border border-bg-border text-xs text-content-primary focus:border-primary-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono font-bold text-content-muted mb-1">
                    CTA Button Text
                  </label>
                  <input
                    type="text"
                    value={formCtaText}
                    onChange={(e) => setFormCtaText(e.target.value)}
                    placeholder="e.g. Get Yours Today"
                    className="w-full px-3.5 py-2 rounded-xl bg-bg-surface border border-bg-border text-xs text-content-primary focus:border-primary-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono font-bold text-content-muted mb-1">
                    Target Link URL
                  </label>
                  <input
                    type="text"
                    value={formTargetUrl}
                    onChange={(e) => setFormTargetUrl(e.target.value)}
                    placeholder="e.g. /products?category=1"
                    className="w-full px-3.5 py-2 rounded-xl bg-bg-surface border border-bg-border text-xs text-content-primary focus:border-primary-500 focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-mono font-bold text-content-muted">
                    Image Background URL (ImgBB CDN / WebP) *
                  </label>
                  <label className="cursor-pointer inline-flex items-center space-x-1.5 text-xs font-bold text-accent-400 hover:text-accent-300 transition-colors bg-accent-500/10 px-2.5 py-1 rounded-lg border border-accent-500/20">
                    {isUploadingImage ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <UploadCloud className="w-3.5 h-3.5" />
                    )}
                    <span>{isUploadingImage ? 'Uploading...' : '📁 Upload File to ImgBB'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImgBBFileUpload}
                      disabled={isUploadingImage}
                      className="hidden"
                    />
                  </label>
                </div>
                <input
                  type="text"
                  value={formImageUrl}
                  onChange={(e) => setFormImageUrl(e.target.value)}
                  placeholder="https://i.ibb.co/... or https://images.unsplash.com/..."
                  className="w-full px-3.5 py-2 rounded-xl bg-bg-surface border border-bg-border text-xs text-content-primary focus:border-primary-500 focus:outline-none font-mono"
                />
                {formImageUrl && (
                  <div className="flex items-center space-x-2 pt-1">
                    <span className="text-[10px] font-mono text-emerald-400 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Image URL Active
                    </span>
                    <a
                      href={formImageUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] font-mono text-primary-400 hover:underline truncate max-w-xs"
                    >
                      {formImageUrl}
                    </a>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-mono font-bold text-content-muted mb-1">
                    Sort Order #
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={formSortOrder}
                    onChange={(e) => setFormSortOrder(Number(e.target.value))}
                    className="w-full px-3.5 py-2 rounded-xl bg-bg-surface border border-bg-border text-xs text-content-primary focus:border-primary-500 focus:outline-none font-mono"
                  />
                </div>

                <div className="flex items-center space-x-2 pt-6">
                  <input
                    type="checkbox"
                    id="is_active_cb"
                    checked={formIsActive}
                    onChange={(e) => setFormIsActive(e.target.checked)}
                    className="w-4 h-4 rounded text-primary-500 border-bg-border focus:ring-primary-500"
                  />
                  <label htmlFor="is_active_cb" className="text-xs font-bold text-content-primary">
                    Publish Live Immediately
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-bg-border">
                <button
                  type="button"
                  onClick={() => setIsEditingModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-bg-surface border border-bg-border text-xs font-semibold text-content-muted hover:text-content-primary"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-primary-500 hover:bg-primary-600 text-white font-bold text-xs shadow-glow"
                >
                  {selectedSlideId ? 'Save Changes' : 'Create Slide'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
