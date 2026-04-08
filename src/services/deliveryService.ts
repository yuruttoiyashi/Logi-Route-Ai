import {
  collection,
  onSnapshot,
  orderBy,
  query,
  type QuerySnapshot,
  type DocumentData,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { Delivery } from '../types/delivery';

const DELIVERY_COLLECTION = 'deliveries';

function toNumber(value: unknown, fallback = 0): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '' && !Number.isNaN(Number(value))) {
    return Number(value);
  }
  return fallback;
}

function toStringOrUndefined(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() !== '' ? value : undefined;
}

export function normalizeDelivery(id: string, data: Record<string, unknown>): Delivery {
  return {
    id,
    customerName: toStringOrUndefined(data.customerName),
    address: toStringOrUndefined(data.address),
    lat: toNumber(data.lat, 0),
    lng: toNumber(data.lng, 0),
    status: typeof data.status === 'string' ? data.status : 'pending',
    driverName: toStringOrUndefined(data.driverName),
    scheduledTime: toStringOrUndefined(data.scheduledTime),
    routeOrder:
      typeof data.routeOrder === 'number'
        ? data.routeOrder
        : typeof data.routeOrder === 'string' && data.routeOrder !== ''
        ? Number(data.routeOrder)
        : undefined,
    priority: typeof data.priority === 'string' ? data.priority : undefined,
    createdAt: toStringOrUndefined(data.createdAt),
    updatedAt: toStringOrUndefined(data.updatedAt),
  };
}

export function mapSnapshotToDeliveries(snapshot: QuerySnapshot<DocumentData>): Delivery[] {
  return snapshot.docs.map((doc) =>
    normalizeDelivery(doc.id, (doc.data() ?? {}) as Record<string, unknown>)
  );
}

export function subscribeDeliveries(callback: (items: Delivery[]) => void): () => void {
  const q = query(collection(db, DELIVERY_COLLECTION), orderBy('scheduledTime', 'asc'));
  return onSnapshot(q, (snapshot) => {
    callback(mapSnapshotToDeliveries(snapshot));
  });
}