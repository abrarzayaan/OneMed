export type OrderStatus =
  | 'PLACED' | 'CONFIRMED' | 'PROCESSING'
  | 'PACKED' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'CANCELLED';

const STATUS_MAP: Record<OrderStatus, { color: string; bg: string; label: string }> = {
  PLACED:           { color: 'text-blue-400',   bg: 'bg-blue-500/20',   label: 'Placed'            },
  CONFIRMED:        { color: 'text-indigo-400', bg: 'bg-indigo-500/20', label: 'Confirmed'         },
  PROCESSING:       { color: 'text-yellow-400', bg: 'bg-yellow-500/20', label: 'Processing'        },
  PACKED:           { color: 'text-orange-400', bg: 'bg-orange-500/20', label: 'Packed'            },
  OUT_FOR_DELIVERY: { color: 'text-teal-400',   bg: 'bg-teal-500/20',   label: 'Out for Delivery'  },
  DELIVERED:        { color: 'text-green-400',  bg: 'bg-green-500/20',  label: 'Delivered'         },
  CANCELLED:        { color: 'text-red-400',    bg: 'bg-red-500/20',    label: 'Cancelled'         },
};

export function getOrderStatusStyle(status: string) {
  return STATUS_MAP[status as OrderStatus] ?? {
    color: 'text-content-muted', bg: 'bg-bg-card', label: status,
  };
}
