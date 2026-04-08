export type Priority = 'high' | 'medium' | 'low';
export type DeliveryStatus = 'pending' | 'delivering' | 'completed' | 'absent' | 'redelivery';
export type UserRole = 'admin' | 'driver';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  photoURL?: string;
}

export interface Delivery {
  id: string;
  customerName: string;
  address: string;
  lat: number;
  lng: number;
  packageId: string;
  priority: Priority;
  timeWindowStart: string;
  timeWindowEnd: string;
  status: DeliveryStatus;
  driverId?: string;
  driverName?: string;
  notes?: string;
  redeliveryCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface RiskReport {
  id: string;
  date: string;
  riskLevel: 'high' | 'medium' | 'low';
  reason: string;
  suggestions: string;
  createdAt: string;
}

export interface DriverStats {
  driverId: string;
  driverName: string;
  completed: number;
  pending: number;
  redelivery: number;
  total: number;
  completionRate: number;
  score: number;
}
