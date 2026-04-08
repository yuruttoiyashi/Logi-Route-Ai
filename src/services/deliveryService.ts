export type Delivery = {
  id: string;
  customerName: string;
  address: string;
  lat: number;
  lng: number;
  status: string;
  priority?: '高' | '中' | '低';
  scheduledTime?: string;
  routeOrder?: number;
  driverName?: string;
};

export const deliveries: Delivery[] = [
  {
    id: 'PKG-1234',
    customerName: '佐々木様',
    address: '神奈川県川崎市高津区二子5-3-10',
    lat: 35.6021,
    lng: 139.6192,
    status: '未対応',
    priority: '中',
    scheduledTime: '09:30',
    routeOrder: 1,
    driverName: '佐藤',
  },
  {
    id: 'PKG-1235',
    customerName: '山田商店',
    address: '神奈川県川崎市高津区溝口1-1-1',
    lat: 35.5995,
    lng: 139.6113,
    status: '未対応',
    priority: '低',
    scheduledTime: '10:00',
    routeOrder: 2,
    driverName: '佐藤',
  },
  {
    id: 'PKG-1236',
    customerName: '高津ストア',
    address: '神奈川県川崎市高津区久本1-2-3',
    lat: 35.5948,
    lng: 139.6172,
    status: '未対応',
    priority: '高',
    scheduledTime: '10:30',
    routeOrder: 3,
    driverName: '佐藤',
  },
  {
    id: 'PKG-2234',
    customerName: '鈴木様',
    address: '神奈川県川崎市高津区梶ヶ谷4-1-8',
    lat: 35.6115,
    lng: 139.6402,
    status: '未対応',
    priority: '高',
    scheduledTime: '09:00',
    routeOrder: 1,
    driverName: '田中',
  },
  {
    id: 'PKG-2235',
    customerName: '田村商会',
    address: '神奈川県川崎市高津区下作延2-35-1',
    lat: 35.5915,
    lng: 139.6108,
    status: '配送中',
    priority: '中',
    scheduledTime: '11:00',
    routeOrder: 2,
    driverName: '田中',
  },
  {
    id: 'PKG-3234',
    customerName: '久本オフィス',
    address: '神奈川県川崎市高津区久本3-3-14',
    lat: 35.5878,
    lng: 139.6262,
    status: '完了',
    priority: '低',
    scheduledTime: '13:00',
    routeOrder: 1,
    driverName: '山本',
  },
  {
    id: 'PKG-3235',
    customerName: '末長ハウス',
    address: '神奈川県川崎市高津区末長1-52-10',
    lat: 35.5789,
    lng: 139.6298,
    status: '未対応',
    priority: '中',
    scheduledTime: '14:00',
    routeOrder: 2,
    driverName: '山本',
  },
];