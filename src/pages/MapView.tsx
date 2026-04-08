import React, { useEffect, useMemo, useRef } from 'react';
import type { Delivery } from '../types/delivery';

type MapViewProps = {
  deliveries: Delivery[];
  loading?: boolean;
};

export default function MapView({ deliveries, loading = false }: MapViewProps) {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const initializedRef = useRef(false);

  const sortedDeliveries = useMemo(() => {
    return [...deliveries].sort((a, b) => {
      const aOrder = a.routeOrder ?? 9999;
      const bOrder = b.routeOrder ?? 9999;
      return aOrder - bOrder;
    });
  }, [deliveries]);

  useEffect(() => {
    if (!mapRef.current) return;
    if (!window.google?.maps) return;
    if (sortedDeliveries.length === 0) return;

    const googleMaps = window.google.maps;
    const first = sortedDeliveries[0];

    const map = new googleMaps.Map(mapRef.current, {
      center: { lat: first.lat, lng: first.lng },
      zoom: 12,
    });

    const bounds = new googleMaps.LatLngBounds();
    const path: Array<{ lat: number; lng: number }> = [];

    sortedDeliveries.forEach((delivery, index) => {
      const position = { lat: delivery.lat, lng: delivery.lng };
      path.push(position);

      new googleMaps.Marker({
        position,
        map,
        label: String(index + 1),
        title: delivery.customerName ?? `配送先 ${index + 1}`,
      });

      bounds.extend(position);
    });

    if (path.length > 1) {
      new googleMaps.Polyline({
        path,
        geodesic: true,
        strokeOpacity: 0.8,
        strokeWeight: 4,
        map,
      });
    }

    map.fitBounds(bounds);
    initializedRef.current = true;
  }, [sortedDeliveries]);

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">地図表示</h1>
        <p className="mt-1 text-sm text-slate-500">配送先のピンと簡易ルートを表示します。</p>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          読み込み中...
        </div>
      ) : sortedDeliveries.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          配送データがありません
        </div>
      ) : !window.google?.maps ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 shadow-sm text-amber-800">
          Google Maps が読み込まれていません。APIキーや script 読み込みを確認してください。
        </div>
      ) : (
        <>
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div ref={mapRef} className="h-[520px] w-full" />
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="mb-3 text-lg font-semibold text-slate-800">配送順</h2>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {sortedDeliveries.map((delivery, index) => (
                <div
                  key={delivery.id}
                  className="rounded-xl border border-slate-200 p-4"
                >
                  <p className="text-sm text-slate-500">#{index + 1}</p>
                  <p className="mt-1 font-semibold text-slate-800">
                    {delivery.customerName ?? '名称未設定'}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">{delivery.address ?? '-'}</p>
                  <p className="mt-2 text-xs text-slate-400">
                    {delivery.lat}, {delivery.lng}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}