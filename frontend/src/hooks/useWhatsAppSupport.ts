import { useQuery } from '@tanstack/react-query';
import { settingsApi, type WhatsAppSetting } from '@/api/settings.api';

export const DEFAULT_WHATSAPP_NUMBER = '+880 1334-317864';
export const DEFAULT_WHATSAPP_LINK =
  'https://wa.me/8801334317864?text=Hello%20OneMed%20Support%2C%20I%20need%20assistance%20with%20an%20order.';

export function useWhatsAppSupport() {
  const query = useQuery<WhatsAppSetting>({
    queryKey: ['system-settings', 'whatsapp'],
    queryFn: () => settingsApi.getWhatsAppSetting(),
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  const number = query.data?.whatsapp_support_number || DEFAULT_WHATSAPP_NUMBER;
  const isEnabled = query.data?.is_whatsapp_enabled ?? true;

  const fallbackLink = (() => {
    const cleaned = number.replace(/[^0-9]/g, '');
    const msg = encodeURIComponent(
      query.data?.whatsapp_default_message ||
        'Hello OneMed Support, I need assistance with an order.'
    );
    return cleaned ? `https://wa.me/${cleaned}?text=${msg}` : DEFAULT_WHATSAPP_LINK;
  })();

  const link = query.data?.whatsapp_link || fallbackLink;

  return {
    ...query,
    number,
    isEnabled,
    link,
  };
}
