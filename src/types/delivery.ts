export type DeliveryStatus =
  | 'pending'
  | 'scheduled'
  | 'in_transit'
  | 'delivered'
  | 'redelivery'
  | 'cancelled';

export type DeliveryPriority = 'low' | 'medium' | 'high';

export interface Delivery {
  id: string;
  customerName?: string;
  address?: string;
  lat: number;
  lng: number;
  status: DeliveryStatus | string;
  driverName?: string;
  scheduledTime?: string;
  routeOrder?: number;
  priority?: DeliveryPriority | string;
  createdAt?: string;
  updatedAt?: string;
}