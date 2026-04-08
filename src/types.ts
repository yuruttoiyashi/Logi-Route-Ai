export type UserRole = 'admin' | 'driver' | 'manager';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  photoURL?: string;
  phoneNumber?: string;
  assignedVehicle?: string;
  createdAt?: any;
  updatedAt?: any;
}

export type DeliveryStatus = 'pending' | 'delivering' | 'completed' | 'failed' | 'redelivery' | 'absent';
export type Priority = 'low' | 'medium' | 'high';

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

export interface Delivery {
  id: string;
  customerName: string;
  address: string;
  lat: number;
  lng: number;
  status: DeliveryStatus;
  priority: Priority;
  packageId: string;
  timeWindowStart: string;
  timeWindowEnd: string;
  notes?: string;
  driverId?: string;
  driverName?: string;
  redeliveryCount: number;
  createdAt: any;
  updatedAt: any;
}

export interface RouteInfo {
  distance: string;
  duration: string;
}

export interface RiskReport {
  riskLevel: 'low' | 'medium' | 'high';
  reason: string;
  suggestions: string;
}
