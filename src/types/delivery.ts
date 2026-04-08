export type DeliveryStatus =
  | 'pending'
  | 'in_progress'
  | 'completed'
  | 'redelivery';

export interface Delivery {
  id: string;
  customerName: string;
  address: string;
  lat: number;
  lng: number;
  status: DeliveryStatus;
  driverName: string;
  scheduledTime: string;
  routeOrder: number;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface DeliveryInput {
  customerName: string;
  address: string;
  lat: number;
  lng: number;
  status: DeliveryStatus;
  driverName: string;
  scheduledTime: string;
  routeOrder: number;
}