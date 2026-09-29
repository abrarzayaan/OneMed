import api from './axios';

export interface WhatsAppSetting {
  id?: number;
  whatsapp_support_number: string;
  whatsapp_default_message: string;
  is_whatsapp_enabled: boolean;
  whatsapp_link?: string;
  updated_at?: string;
}

export const settingsApi = {
  getWhatsAppSetting: async (): Promise<WhatsAppSetting> => {
    const res = await api.get<WhatsAppSetting>('/settings/whatsapp/');
    return res.data;
  },

  updateWhatsAppSetting: async (
    data: Partial<WhatsAppSetting>
  ): Promise<WhatsAppSetting> => {
    const res = await api.patch<WhatsAppSetting>('/settings/whatsapp/', data);
    return res.data;
  },
};
