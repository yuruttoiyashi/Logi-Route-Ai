import type { Delivery } from '../types/delivery';

export const mockDeliveries: Delivery[] = [
  {
    id: 'D-001',
    customerName: '田中商店',
    address: '東京都渋谷区渋谷2-21-1',
    lat: 35.6595,
    lng: 139.7038,
    status: 'pending',
    driverName: '佐藤',
    scheduledTime: '09:00',
  },
  {
    id: 'D-002',
    customerName: '鈴木物流',
    address: '東京都新宿区西新宿1-1-1',
    lat: 35.6896,
    lng: 139.6917,
    status: 'in_progress',
    driverName: '高橋',
    scheduledTime: '10:30',
  },
  {
    id: 'D-003',
    customerName: '青木フーズ',
    address: '東京都品川区西五反田1-1-1',
    lat: 35.6264,
    lng: 139.723,
    status: 'redelivery',
    driverName: '佐藤',
    scheduledTime: '13:00',
  },
];