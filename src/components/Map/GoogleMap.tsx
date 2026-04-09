import React, { useEffect, useMemo, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import type { Delivery } from '../../types/delivery';

console.log('MAP KEY:', import.meta.env.VITE_GOOGLE_MAPS_API_KEY);

type Props = {
  deliveries: Delivery[];
};

export default function GoogleMap({ deliveries }: Props) {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const location = useLocation();

  const focusDelivery = (location.state as { focusDelivery?: Delivery } | null)?.focusDelivery;

  const sortedDeliveries = useMemo(() => {
    const list = [...deliveries];

    if (focusDelivery) {
      list.sort((a, b) => {
        if (a.id === focusDelivery.id) return -1;
        if (b.id === focusDelivery.id) return 1;

        const aOrder = a.routeOrder ?? 9999;
        const bOrder = b.routeOrder ?? 9999;
        return aOrder - bOrder;
      });
      return list;
    }

    return list.sort((a, b) => {
      const aOrder = a.routeOrder ?? 9999;
      const bOrder = b.routeOrder ?? 9999;
      return aOrder - bOrder;
    });
  }, [deliveries, focusDelivery]);

  useEffect(() => {
    if (!mapRef.current) return;
    if (!window.google?.maps) return;
    if (sortedDeliveries.length === 0) return;

    const googleMaps = window.google.maps;
    const first = focusDelivery ?? sortedDeliveries[0];

    const map = new googleMaps.Map(mapRef.current, {
      center: { lat: first.lat, lng: first.lng },
      zoom: focusDelivery ? 15 : 12,
    });

    const bounds = new googleMaps.LatLngBounds();
    const path: Array<{ lat: number; lng: number }> = [];

    sortedDeliveries.forEach((delivery, index) => {
      const position = { lat: delivery.lat, lng: delivery.lng };
      path.push(position);

      const marker = new googleMaps.Marker({
        position,
        map,
        label: String(index + 1),
        title: delivery.customerName ?? `配送先 ${index + 1}`,
      });

      const infoWindow = new googleMaps.InfoWindow({
        content: `
          <div style="min-width:200px;padding:4px 6px;">
            <div style="font-weight:bold;margin-bottom:4px;">
              ${delivery.customerName ?? '名称未設定'}
            </div>
            <div style="font-size:12px;color:#555;">
              住所: ${delivery.address ?? '-'}<br/>
              状態: ${delivery.status ?? '-'}<br/>
              担当: ${delivery.driverName ?? '-'}<br/>
              時間: ${delivery.scheduledTime ?? '-'}
            </div>
          </div>
        `,
      });

      marker.addListener('click', () => {
        infoWindow.open({
          anchor: marker,
          map,
        });
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

    if (focusDelivery) {
      map.setCenter({ lat: focusDelivery.lat, lng: focusDelivery.lng });
      map.setZoom(15);
    } else {
      map.fitBounds(bounds);
    }
  }, [sortedDeliveries, focusDelivery]);

  if (!window.google?.maps) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-amber-800">
        Google Maps が読み込まれていません。APIキーまたは script 読み込みを確認してください。
      </div>
    );
  }

  if (sortedDeliveries.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 text-slate-500 shadow-sm">
        配送データがありません
      </div>
    );
  }

  return <div ref={mapRef} className="h-[520px] w-full rounded-2xl" />;
}