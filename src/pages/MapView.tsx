import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { Delivery } from '../types/delivery';

type MapViewProps = {
  deliveries: Delivery[];
  loading?: boolean;
};

declare global {
  interface Window {
    google?: any;
  }
}

let googleMapsScriptPromise: Promise<void> | null = null;

function loadGoogleMapsScript(): Promise<void> {
  if (window.google?.maps) {
    return Promise.resolve();
  }

  if (googleMapsScriptPromise) {
    return googleMapsScriptPromise;
  }

  googleMapsScriptPromise = new Promise((resolve, reject) => {
    const existingScript = document.querySelector(
      'script[data-google-maps="true"]'
    ) as HTMLScriptElement | null;

    if (existingScript) {
      existingScript.addEventListener('load', () => resolve());
      existingScript.addEventListener('error', () =>
        reject(new Error('Google Maps script failed to load'))
      );
      return;
    }

    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

    if (!apiKey) {
      reject(new Error('VITE_GOOGLE_MAPS_API_KEY is missing'));
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}`;
    script.async = true;
    script.defer = true;
    script.setAttribute('data-google-maps', 'true');

    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Google Maps script failed to load'));

    document.head.appendChild(script);
  });

  return googleMapsScriptPromise;
}

export default function MapView({ deliveries, loading = false }: MapViewProps) {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [mapError, setMapError] = useState('');

  const sortedDeliveries = useMemo(() => {
    return [...deliveries].sort((a, b) => {
      const aOrder = a.routeOrder ?? 9999;
      const bOrder = b.routeOrder ?? 9999;
      return aOrder - bOrder;
    });
  }, [deliveries]);

  useEffect(() => {
    console.log('MAP KEY:', import.meta.env.VITE_GOOGLE_MAPS_API_KEY);

    loadGoogleMapsScript()
      .then(() => {
        console.log('Google Maps script loaded');
        setMapReady(true);
        setMapError('');
      })
      .catch((error) => {
        console.error('Google Maps load error:', error);
        setMapError('Google Maps の読み込みに失敗しました。APIキーや script 読み込みを確認してください。');
      });
  }, []);

  useEffect(() => {
    if (!mapReady) return;
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

    map.fitBounds(bounds);
  }, [mapReady, sortedDeliveries]);

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
      ) : mapError ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-amber-800 shadow-sm">
          {mapError}
        </div>
      ) : !mapReady ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          Google Maps を読み込み中...
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
                <div key={delivery.id} className="rounded-xl border border-slate-200 p-4">
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