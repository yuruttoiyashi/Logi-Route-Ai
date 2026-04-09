import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
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
    script.onerror = () =>
      reject(new Error('Google Maps script failed to load'));

    document.head.appendChild(script);
  });

  return googleMapsScriptPromise;
}

function statusLabel(status?: string) {
  switch (status) {
    case 'pending':
      return '未対応';
    case 'scheduled':
      return '予定済み';
    case 'in_transit':
      return '配送中';
    case 'delivered':
      return '完了';
    case 'redelivery':
      return '再配達';
    default:
      return status || '未設定';
  }
}

function priorityLabel(priority?: string) {
  if (priority === 'high') return '高';
  if (priority === 'medium') return 'medium';
  if (priority === 'low') return '低';
  return priority || '-';
}

function normalizeDriver(driverName?: string) {
  return driverName?.trim() || '未割当';
}

function markerColorForDriver(driverName?: string) {
  const name = normalizeDriver(driverName);
  if (name === '未割当') return '#64748b';
  if (name === '山本') return '#ef4444';
  if (name === '佐藤') return '#2563eb';
  if (name === '田中') return '#16a34a';
  return '#7c3aed';
}

function statusTextColor(status?: string) {
  switch (status) {
    case 'pending':
    case 'scheduled':
      return 'text-amber-700';
    case 'in_transit':
      return 'text-blue-700';
    case 'delivered':
      return 'text-emerald-700';
    case 'redelivery':
      return 'text-rose-700';
    default:
      return 'text-slate-600';
  }
}

export default function MapView({
  deliveries,
  loading = false,
}: MapViewProps) {
  const location = useLocation();
  const mapRef = useRef<HTMLDivElement | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [mapError, setMapError] = useState('');
  const [driverFilter, setDriverFilter] = useState('全員表示');
  const [statusFilter, setStatusFilter] = useState('全ステータス');
  const [keyword, setKeyword] = useState('');

  const focusDelivery = (
    location.state as { focusDelivery?: Delivery } | null
  )?.focusDelivery;

  useEffect(() => {
    loadGoogleMapsScript()
      .then(() => {
        setMapReady(true);
        setMapError('');
      })
      .catch((error) => {
        console.error('Google Maps load error:', error);
        setMapError(
          'Google Maps の読み込みに失敗しました。APIキーや script 読み込みを確認してください。'
        );
      });
  }, []);

  const sortedDeliveries = useMemo(() => {
    const list = [...deliveries].sort((a, b) => {
      const aOrder = a.routeOrder ?? 9999;
      const bOrder = b.routeOrder ?? 9999;
      return aOrder - bOrder;
    });

    if (!focusDelivery) return list;

    return list.sort((a, b) => {
      if (a.id === focusDelivery.id) return -1;
      if (b.id === focusDelivery.id) return 1;
      return 0;
    });
  }, [deliveries, focusDelivery]);

  const uniqueDrivers = useMemo(() => {
    const names = Array.from(
      new Set(sortedDeliveries.map((d) => normalizeDriver(d.driverName)))
    );
    return ['全員表示', ...names];
  }, [sortedDeliveries]);

  const filteredDeliveries = useMemo(() => {
    return sortedDeliveries.filter((delivery) => {
      const matchesDriver =
        driverFilter === '全員表示' ||
        normalizeDriver(delivery.driverName) === driverFilter;

      const matchesStatus =
        statusFilter === '全ステータス' || statusLabel(delivery.status) === statusFilter;

      const text = [
        delivery.customerName,
        delivery.address,
        delivery.id,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      const matchesKeyword =
        !keyword.trim() || text.includes(keyword.trim().toLowerCase());

      return matchesDriver && matchesStatus && matchesKeyword;
    });
  }, [sortedDeliveries, driverFilter, statusFilter, keyword]);

  const summary = useMemo(() => {
    return {
      total: filteredDeliveries.length,
      pending: filteredDeliveries.filter(
        (d) => statusLabel(d.status) === '未対応'
      ).length,
      inTransit: filteredDeliveries.filter(
        (d) => statusLabel(d.status) === '配送中'
      ).length,
      delivered: filteredDeliveries.filter(
        (d) => statusLabel(d.status) === '完了'
      ).length,
      redelivery: filteredDeliveries.filter(
        (d) => statusLabel(d.status) === '再配達'
      ).length,
    };
  }, [filteredDeliveries]);

  useEffect(() => {
    if (!mapReady) return;
    if (!mapRef.current) return;
    if (!window.google?.maps) return;
    if (filteredDeliveries.length === 0) return;

    const googleMaps = window.google.maps;
    const first = focusDelivery ?? filteredDeliveries[0];

    const map = new googleMaps.Map(mapRef.current, {
      center: { lat: first.lat, lng: first.lng },
      zoom: 12,
      mapTypeControl: true,
      streetViewControl: false,
      fullscreenControl: true,
    });

    const bounds = new googleMaps.LatLngBounds();
    const polylineByDriver = new Map<string, Array<{ lat: number; lng: number }>>();

    filteredDeliveries.forEach((delivery, index) => {
      const position = { lat: delivery.lat, lng: delivery.lng };
      const driverName = normalizeDriver(delivery.driverName);

      if (!polylineByDriver.has(driverName)) {
        polylineByDriver.set(driverName, []);
      }
      polylineByDriver.get(driverName)!.push(position);

      const marker = new googleMaps.Marker({
        position,
        map,
        label: {
          text: String(index + 1),
          color: '#ffffff',
          fontWeight: '700',
        },
        icon: {
          path: googleMaps.SymbolPath.CIRCLE,
          fillColor: markerColorForDriver(delivery.driverName),
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2,
          scale: 16,
        },
        title: delivery.customerName ?? `配送先 ${index + 1}`,
      });

      const infoWindow = new googleMaps.InfoWindow({
        content: `
          <div style="min-width:220px;padding:4px 6px;">
            <div style="font-weight:700;font-size:14px;margin-bottom:4px;">
              ${delivery.customerName ?? '名称未設定'}
            </div>
            <div style="font-size:12px;color:#475569;line-height:1.7;">
              住所: ${delivery.address ?? '-'}<br/>
              状態: ${statusLabel(delivery.status)}<br/>
              担当: ${normalizeDriver(delivery.driverName)}<br/>
              予定: ${delivery.scheduledTime ?? '-'}
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

    Array.from(polylineByDriver.entries()).forEach(([driverName, path]) => {
      if (path.length < 2) return;

      new googleMaps.Polyline({
        path,
        geodesic: true,
        strokeColor: markerColorForDriver(driverName),
        strokeOpacity: 0.9,
        strokeWeight: 5,
        map,
      });
    });

    if (focusDelivery) {
      map.setCenter({ lat: focusDelivery.lat, lng: focusDelivery.lng });
      map.setZoom(14);
    } else {
      map.fitBounds(bounds);
    }
  }, [mapReady, filteredDeliveries, focusDelivery]);

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">地図ビュー</h1>
        <p className="mt-2 text-slate-500">
          配送先のピンと簡易ルートを表示します。
        </p>
      </div>

      {loading ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          読み込み中...
        </div>
      ) : mapError ? (
        <div className="rounded-3xl border border-amber-200 bg-amber-50 p-8 text-amber-800 shadow-sm">
          {mapError}
        </div>
      ) : (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex flex-wrap items-center gap-4">
              <h2 className="text-4xl font-bold text-slate-900">配送マップ</h2>

              <LegendDot color="#64748b" label="未割当" />
              <LegendDot color="#ef4444" label="山本" />
              <LegendDot color="#2563eb" label="佐藤" />
              <LegendDot color="#16a34a" label="田中" />
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-3">
                <span className="text-lg font-semibold text-slate-700">
                  ドライバー
                </span>
                <select
                  value={driverFilter}
                  onChange={(e) => setDriverFilter(e.target.value)}
                  className="rounded-2xl border border-slate-200 px-4 py-3 outline-none"
                >
                  {uniqueDrivers.map((driver) => (
                    <option key={driver} value={driver}>
                      {driver}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-lg font-semibold text-slate-700">
                  ステータス
                </span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="rounded-2xl border border-slate-200 px-4 py-3 outline-none"
                >
                  <option value="全ステータス">全ステータス</option>
                  <option value="未対応">未対応</option>
                  <option value="配送中">配送中</option>
                  <option value="完了">完了</option>
                  <option value="再配達">再配達</option>
                </select>
              </div>
            </div>
          </div>

          <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <SummaryCard title="表示件数" value={summary.total} tone="slate" />
            <SummaryCard title="未対応" value={summary.pending} tone="amber" />
            <SummaryCard title="配送中" value={summary.inTransit} tone="blue" />
            <SummaryCard title="完了" value={summary.delivered} tone="green" />
            <SummaryCard title="再配達" value={summary.redelivery} tone="rose" />
          </div>

          <div className="grid gap-6 xl:grid-cols-[320px_1fr]">
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-2xl font-bold text-slate-900">配送一覧</h3>
                <span className="rounded-full bg-white px-4 py-1 text-sm font-semibold text-slate-500">
                  {filteredDeliveries.length}件
                </span>
              </div>

              <div className="mb-4 flex gap-3">
                <input
                  type="text"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder="顧客名・住所・IDで検索"
                  className="flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none"
                />
                <button
                  type="button"
                  onClick={() => setKeyword('')}
                  className="rounded-2xl bg-slate-200 px-4 py-3 font-semibold text-slate-600"
                >
                  クリア
                </button>
              </div>

              <div className="max-h-[620px] space-y-4 overflow-y-auto pr-1">
                {filteredDeliveries.map((delivery) => (
                  <div
                    key={delivery.id}
                    className={`rounded-3xl border bg-white p-4 shadow-sm ${
                      focusDelivery?.id === delivery.id
                        ? 'border-blue-400 ring-2 ring-blue-100'
                        : 'border-slate-200'
                    }`}
                  >
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <h4 className="text-2xl font-bold text-slate-900">
                        {delivery.customerName ?? '名称未設定'}
                      </h4>
                      <span className="rounded-full bg-amber-100 px-3 py-1 text-sm font-semibold text-amber-700">
                        {delivery.status ?? 'pending'}
                      </span>
                    </div>

                    <div className="space-y-1 text-sm leading-7 text-slate-600">
                      <p>ID: {delivery.id}</p>
                      <p>住所: {delivery.address ?? '-'}</p>
                      <p>予定時刻: {delivery.scheduledTime ?? '-'}</p>
                      <p>担当: {normalizeDriver(delivery.driverName)}</p>
                      <p className={statusTextColor(delivery.status)}>
                        配送順: {delivery.routeOrder ?? '-'}
                      </p>
                      <p>優先度: {priorityLabel(delivery.priority)}</p>
                    </div>
                  </div>
                ))}

                {filteredDeliveries.length === 0 && (
                  <div className="rounded-3xl border border-slate-200 bg-white p-6 text-slate-400">
                    条件に一致する配送がありません
                  </div>
                )}
              </div>
            </div>

            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
              {filteredDeliveries.length === 0 ? (
                <div className="flex h-[760px] items-center justify-center text-slate-400">
                  表示できる配送先がありません
                </div>
              ) : !mapReady ? (
                <div className="flex h-[760px] items-center justify-center text-slate-500">
                  Google Maps を読み込み中...
                </div>
              ) : (
                <div ref={mapRef} className="h-[760px] w-full" />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2 text-lg text-slate-600">
      <span
        className="inline-block h-4 w-4 rounded-full"
        style={{ backgroundColor: color }}
      />
      <span>{label}</span>
    </div>
  );
}

function SummaryCard({
  title,
  value,
  tone,
}: {
  title: string;
  value: number;
  tone: 'slate' | 'amber' | 'blue' | 'green' | 'rose';
}) {
  const toneMap: Record<string, string> = {
    slate: 'border-slate-200 bg-slate-50 text-slate-900',
    amber: 'border-amber-200 bg-amber-50 text-amber-700',
    blue: 'border-blue-200 bg-blue-50 text-blue-700',
    green: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    rose: 'border-rose-200 bg-rose-50 text-rose-700',
  };

  return (
    <div className={`rounded-3xl border p-5 ${toneMap[tone]}`}>
      <p className="text-sm font-medium">{title}</p>
      <p className="mt-3 text-5xl font-bold">{value}</p>
    </div>
  );
}