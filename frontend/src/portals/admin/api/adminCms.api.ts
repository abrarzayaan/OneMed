import api from '../../../api/axios';

export interface HeroBannerSlide {
  id: number;
  badge_tag: string;
  headline: string;
  subheadline: string;
  cta_text: string;
  target_url: string;
  image_url: string;
  sort_order: number;
  is_active: boolean;
  type: 'main_hero' | 'side_top' | 'side_bottom_left' | 'side_bottom_right';
}

export interface AnnouncementBarConfig {
  id: number;
  text: string;
  bg_theme: 'emerald' | 'indigo' | 'rose' | 'amber' | 'midnight';
  is_active: boolean;
  cta_text?: string;
  cta_url?: string;
}

const defaultHeroBanners: HeroBannerSlide[] = [
  {
    id: 1,
    type: 'main_hero',
    badge_tag: '⚡ BUY 1 GET 1 FREE',
    headline: 'Multivitamin & Essential Supplements',
    subheadline: 'Authentic medicines and healthcare essentials delivered directly to your doorstep.',
    cta_text: 'Get Yours Today',
    target_url: '/products',
    image_url: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800&auto=format&fit=crop&q=80',
    sort_order: 1,
    is_active: true,
  },
  {
    id: 2,
    type: 'side_top',
    badge_tag: 'Up to 45% OFF',
    headline: 'Get Healthy With Exclusive Medical Product Deals!',
    subheadline: 'Verified prescription and OTC deals',
    cta_text: 'View Offers',
    target_url: '/products?filter=hot_deals',
    image_url: 'https://images.unsplash.com/photo-1576602976047-174e57a47881?w=400&auto=format&fit=crop&q=80',
    sort_order: 2,
    is_active: true,
  },
  {
    id: 3,
    type: 'side_bottom_left',
    badge_tag: '15% OFF',
    headline: "Women's Wellness Gummies",
    subheadline: 'Daily essential nutrition',
    cta_text: 'Shop',
    target_url: '/products',
    image_url: 'https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=400&auto=format&fit=crop&q=80',
    sort_order: 3,
    is_active: true,
  },
  {
    id: 4,
    type: 'side_bottom_right',
    badge_tag: 'FLAT 20% OFF',
    headline: 'Premium Skincare Essentials',
    subheadline: 'Dermatologist tested care',
    cta_text: 'Explore',
    target_url: '/products',
    image_url: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400&auto=format&fit=crop&q=80',
    sort_order: 4,
    is_active: true,
  },
];

const defaultAnnouncement: AnnouncementBarConfig = {
  id: 1,
  text: 'Due to high medicine demand, orders are processed with priority express delivery across Bangladesh.',
  bg_theme: 'midnight',
  is_active: true,
  cta_text: 'Track Order',
  cta_url: '/account/orders',
};

const sanitizeSlide = (slide: any, index: number): HeroBannerSlide => ({
  id: Number(slide?.id) || index + 1,
  type: ['main_hero', 'side_top', 'side_bottom_left', 'side_bottom_right'].includes(slide?.type)
    ? slide.type
    : index === 0
    ? 'main_hero'
    : index === 1
    ? 'side_top'
    : index === 2
    ? 'side_bottom_left'
    : 'side_bottom_right',
  badge_tag: String(slide?.badge || slide?.badge_tag || '⚡ SPECIAL OFFER'),
  headline: String(slide?.title || slide?.headline || 'Essential Pharmacy Stock'),
  subheadline: String(slide?.subtitle || slide?.subheadline || 'Authentic medicines delivered to your doorstep.'),
  cta_text: String(slide?.cta_text || 'Shop Now'),
  target_url: String(slide?.cta_link || slide?.target_url || '/products'),
  image_url: String(slide?.image_url || 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800&auto=format&fit=crop&q=80'),
  sort_order: Number(slide?.order || slide?.sort_order) || index + 1,
  is_active: slide?.is_published !== false && slide?.is_active !== false,
});

export const adminCmsApi = {
  getHeroBanners: async (): Promise<HeroBannerSlide[]> => {
    try {
      const res = await api.get('/api/products/cms/hero-slides/');
      const data = res.data;
      if (Array.isArray(data) && data.length > 0) {
        return data.map(sanitizeSlide);
      }
    } catch {}

    return defaultHeroBanners;
  },

  createHeroBanner: async (payload: Omit<HeroBannerSlide, 'id'>): Promise<HeroBannerSlide> => {
    try {
      const res = await api.post('/api/products/cms/hero-slides/', {
        title: payload.headline,
        subtitle: payload.subheadline,
        badge: payload.badge_tag,
        cta_text: payload.cta_text,
        cta_link: payload.target_url,
        image_url: payload.image_url,
        is_published: payload.is_active,
        order: payload.sort_order,
      });
      if (res.data && res.data.id) return sanitizeSlide(res.data, 0);
    } catch {}
    return { ...payload, id: Date.now() };
  },

  updateHeroBanner: async (id: number, payload: Partial<HeroBannerSlide>): Promise<HeroBannerSlide> => {
    try {
      const res = await api.patch(`/api/products/cms/hero-slides/${id}/`, {
        title: payload.headline,
        subtitle: payload.subheadline,
        badge: payload.badge_tag,
        cta_text: payload.cta_text,
        cta_link: payload.target_url,
        image_url: payload.image_url,
        is_published: payload.is_active,
        order: payload.sort_order,
      });
      if (res.data) return sanitizeSlide(res.data, 0);
    } catch {}
    return { ...defaultHeroBanners[0], ...payload, id };
  },

  deleteHeroBanner: async (id: number): Promise<boolean> => {
    try {
      await api.delete(`/api/products/cms/hero-slides/${id}/`);
      return true;
    } catch {}
    return true;
  },

  getAnnouncementBar: async (): Promise<AnnouncementBarConfig> => {
    try {
      const res = await api.get('/api/products/cms/announcement-bar/');
      if (res.data && res.data.text) {
        return {
          id: res.data.id,
          text: res.data.text,
          bg_theme: (res.data.bg_theme || 'midnight').toLowerCase() as any,
          is_active: res.data.is_visible !== false,
          cta_text: 'Track Order',
          cta_url: '/account/orders',
        };
      }
    } catch {}
    return defaultAnnouncement;
  },

  updateAnnouncementBar: async (payload: Partial<AnnouncementBarConfig>): Promise<AnnouncementBarConfig> => {
    try {
      const res = await api.patch('/api/products/cms/announcement-bar/', {
        text: payload.text,
        bg_theme: payload.bg_theme,
        is_visible: payload.is_active,
      });
      if (res.data && res.data.text) {
        return {
          id: res.data.id,
          text: res.data.text,
          bg_theme: (res.data.bg_theme || 'midnight').toLowerCase() as any,
          is_active: res.data.is_visible !== false,
        };
      }
    } catch {}
    return { ...defaultAnnouncement, ...payload };
  },
};
