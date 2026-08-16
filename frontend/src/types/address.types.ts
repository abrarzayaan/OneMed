export type AddressLabel = 'home' | 'office' | 'pharmacy' | 'other';
export type AddressStatus = 'active' | 'hidden';

export interface Address {
  id: number;
  label: AddressLabel;
  receiver_name?: string | null;
  receiver_phone?: string | null;
  full_address: string;
  landmark?: string | null;
  area: string;
  city: string;
  postal_code?: string | null;
  latitude?: number | string | null;
  longitude?: number | string | null;
  is_default: boolean;
  status: AddressStatus;
  created_at?: string;
  updated_at?: string;
}

export interface AddressFormData {
  label: AddressLabel;
  receiver_name: string;
  receiver_phone: string;
  full_address: string;
  landmark?: string;
  area: string;
  city: string;
  postal_code?: string;
  is_default: boolean;
}

export type CreateAddressPayload = AddressFormData;

