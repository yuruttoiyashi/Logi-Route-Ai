import React, { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  GoogleMap,
  Marker,
  InfoWindow,
  DirectionsRenderer,
  useJsApiLoader,
} from '@react-google-maps/api';
import { Search } from 'lucide-react';

type Delivery = {
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

type Props = {
  deliveries: Delivery[];
};

type DriverDirections = {
  driverName: string;
  directions: google.maps.DirectionsResult;
};

const containerStyle = {
  width: '100%',
  height: '700px',
};

const DRIVER_COLORS: Record<string, string> = {
  佐藤: '#2563eb',
  田中: '#16a34a',
  山本: '#dc2626',
  鈴木: '#ca8a04',
};

export default function MapView({ deliveries }: Props) {
  const location = useLocation();
  const focusDelivery = (location.state as { focusDelivery?: Delivery })?.focusDelivery;

  const [selectedDelivery, setSelectedDelivery] = useState<Delivery | null>(
    focusDelivery ?? null
  );
  const [driverDirections, setDriverDirections] = useState<DriverDirections[]>([]);
  const [selectedDriver, setSelectedDriver] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchText, setSearchText] = useState('');
  const [mapRef, setMapRef] = useState<google.maps.Map | null>(null);

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
  });

  const driverNames = useMemo(() => {
    return Array.from(
      new Set(
        deliveries
          .map((delivery) => delivery.driverName)
          .filter((name): name is string => Boolean(name))
      )
    );
  }, [deliveries]);

  const statusOptions = useMemo(() => {
    return Array.from(new Set(deliveries.map((delivery) => delivery.status)));
  }, [deliveries]);

  const filteredDeliveries = useMemo(() => {
    const keyword = searchText.trim().toLowerCase();

    return deliveries.filter((delivery) => {
      const matchesDriver =
        selectedDriver === 'all' || delivery.driverName === selectedDriver;

      const matchesStatus =
        selectedStatus === 'all' || delivery.status === selectedStatus;

      const matchesSearch =
        keyword === '' ||
        delivery.customerName.toLowerCase().includes(keyword) ||
        delivery.address.toLowerCase().includes(keyword) ||
        delivery.id.toLowerCase().includes(keyword);

      return matchesDriver && matchesStatus && matchesSearch;
    });
  }, [deliveries, selectedDriver, selectedStatus, searchText]);

  const summary = useMemo(() => {
    return {
      total: filteredDeliveries.length,
      pending: filteredDeliveries.filter((d) => d.status === '未対応').length,
      inProgress: filteredDeliveries.filter((d) => d.status === '配送中').length,
      completed: filteredDeliveries.filter((d) => d.status === '完了').length,
      redelivery: filteredDeliveries.filter((d) => d.status === '再配達').length,
    };
  }, [filteredDeliveries]);

  const center = useMemo(() => {
    if (
      focusDelivery &&
      (selectedDriver === 'all' || focusDelivery.driverName === selectedDriver) &&
      (selectedStatus === 'all' || focusDelivery.status === selectedStatus)
    ) {
      const keyword = searchText.trim().toLowerCase();
      const matchesSearch =
        keyword === '' ||
        focusDelivery.customerName.toLowerCase().includes(keyword) ||
        focusDelivery.address.toLowerCase().includes(keyword) ||
        focusDelivery.id.toLowerCase().includes(keyword);

      if (matchesSearch) {
        return { lat: focusDelivery.lat, lng: focusDelivery.lng };
      }
    }

    if (filteredDeliveries.length > 0) {
      return { lat: filteredDeliveries[0].lat, lng: filteredDeliveries[0].lng };
    }

    return { lat: 35.599, lng: 139.611 };
  }, [focusDelivery, filteredDeliveries, selectedDriver, selectedStatus, searchText]);

  const groupedByDriver = useMemo(() => {
    const groups: Record<string, Delivery[]> = {};

    filteredDeliveries.forEach((delivery) => {
      const driverName = delivery.driverName || '未割当';
      if (!groups[driverName]) {
        groups[driverName] = [];
      }
      groups[driverName].push(delivery);
    });

    Object.keys(groups).forEach((driverName) => {
      groups[driverName].sort((a, b) => {
        const orderA = a.routeOrder ?? Number.MAX_SAFE_INTEGER;
        const orderB = b.routeOrder ?? Number.MAX_SAFE_INTEGER;
        return orderA - orderB;
      });
    });

    return groups;
  }, [filteredDeliveries]);

  useEffect(() => {
    if (!isLoaded || !window.google) return;

    const directionsService = new window.google.maps.DirectionsService();
    const currentDriverNames = Object.keys(groupedByDriver);

    if (currentDriverNames.length === 0) {
      setDriverDirections([]);
      return;
    }

    const fetchAllRoutes = async () => {
      const results: DriverDirections[] = [];

      for (const driverName of currentDriverNames) {
        const driverDeliveries = groupedByDriver[driverName];

        if (driverDeliveries.length < 2) {
          continue;
        }

        const origin = {
          lat: driverDeliveries[0].lat,
          lng: driverDeliveries[0].lng,
        };

        const destination = {
          lat: driverDeliveries[driverDeliveries.length - 1].lat,
          lng: driverDeliveries[driverDeliveries.length - 1].lng,
        };

        const waypoints = driverDeliveries.slice(1, -1).map((delivery) => ({
          location: {
            lat: delivery.lat,
            lng: delivery.lng,
          },
          stopover: true,
        }));

        const result = await new Promise<google.maps.DirectionsResult | null>((resolve) => {
          directionsService.route(
            {
              origin,
              destination,
              waypoints,
              travelMode: window.google.maps.TravelMode.DRIVING,
              optimizeWaypoints: false,
            },
            (response, status) => {
              if (status === 'OK' && response) {
                resolve(response);
              } else {
                console.error(`Directions request failed for ${driverName}:`, status);
                resolve(null);
              }
            }
          );
        });

        if (result) {
          results.push({
            driverName,
            directions: result,
          });
        }
      }

      setDriverDirections(results);
    };

    fetchAllRoutes();
  }, [isLoaded, groupedByDriver]);

  useEffect(() => {
    if (!selectedDelivery) return;

    const existsInFiltered = filteredDeliveries.some(
      (delivery) => delivery.id === selectedDelivery.id
    );

    if (!existsInFiltered) {
      setSelectedDelivery(null);
    }
  }, [filteredDeliveries, selectedDelivery]);

  const handleSelectDelivery = (delivery: Delivery) => {
    setSelectedDelivery(delivery);

    if (mapRef) {
      mapRef.panTo({ lat: delivery.lat, lng: delivery.lng });
      mapRef.setZoom(16);
    }
  };

  if (loadError) {
    return (
      <div className="rounded-2xl border border-red-200 bg-white p-4 shadow-sm">
        <h2 className="mb-4 text-xl font-bold text-slate-800">配送マップ</h2>
        <div className="rounded-xl bg-red-50 p-4 text-red-600">
          地図の読み込みに失敗しました。APIキーや Google Maps の設定を確認してください。
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="mb-4 text-xl font-bold text-slate-800">配送マップ</h2>
        <div className="flex h-[650px] items-center justify-center rounded-2xl bg-slate-50 text-slate-500">
          地図を読み込み中...
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-4">
          <h2 className="text-xl font-bold text-slate-800">配送マップ</h2>

          <div className="flex flex-wrap gap-3 text-sm">
            {Object.keys(groupedByDriver).map((driverName) => (
              <div key={driverName} className="flex items-center gap-2">
                <span
                  className="inline-block h-3 w-3 rounded-full"
                  style={{
                    backgroundColor: DRIVER_COLORS[driverName] || '#6b7280',
                  }}
                />
                <span className="text-slate-600">{driverName}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <label htmlFor="driverFilter" className="text-sm font-medium text-slate-700">
              ドライバー
            </label>
            <select
              id="driverFilter"
              value={selectedDriver}
              onChange={(e) => setSelectedDriver(e.target.value)}
              className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-blue-500 focus:outline-none"
            >
              <option value="all">全員表示</option>
              {driverNames.map((driverName) => (
                <option key={driverName} value={driverName}>
                  {driverName}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label htmlFor="statusFilter" className="text-sm font-medium text-slate-700">
              ステータス
            </label>
            <select
              id="statusFilter"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-blue-500 focus:outline-none"
            >
              <option value="all">全ステータス</option>
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-5">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
          <div className="text-xs text-slate-500">表示件数</div>
          <div className="mt-1 text-2xl font-bold text-slate-800">{summary.total}</div>
        </div>

        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3">
          <div className="text-xs text-amber-700">未対応</div>
          <div className="mt-1 text-2xl font-bold text-amber-800">
            {summary.pending}
          </div>
        </div>

        <div className="rounded-2xl border border-blue-200 bg-blue-50 p-3">
          <div className="text-xs text-blue-700">配送中</div>
          <div className="mt-1 text-2xl font-bold text-blue-800">
            {summary.inProgress}
          </div>
        </div>

        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3">
          <div className="text-xs text-emerald-700">完了</div>
          <div className="mt-1 text-2xl font-bold text-emerald-800">
            {summary.completed}
          </div>
        </div>

        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-3">
          <div className="text-xs text-rose-700">再配達</div>
          <div className="mt-1 text-2xl font-bold text-rose-800">
            {summary.redelivery}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[320px_1fr]">
        <div className="max-h-[700px] overflow-y-auto rounded-2xl border border-slate-200 bg-slate-50 p-3">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-800">配送一覧</h3>
            <span className="rounded-full bg-white px-3 py-1 text-xs text-slate-500 shadow-sm">
              {filteredDeliveries.length}件
            </span>
          </div>

          <div className="mb-3 flex gap-2">
  
  <div className="relative flex-1">
    {/* 虫眼鏡アイコン */}
    <Search
      size={18}
      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
    />

    {/* 入力欄 */}
    <input
      type="text"
      value={searchText}
      onChange={(e) => setSearchText(e.target.value)}
      placeholder="顧客名・住所・IDで検索"
      className="w-full rounded-xl border border-slate-300 bg-white pl-10 pr-3 py-2 text-sm text-slate-700 shadow-sm placeholder:text-slate-400 focus:border-blue-500 focus:outline-none"
    />
  </div>

  {/* クリアボタン */}
  <button
    type="button"
    onClick={() => setSearchText('')}
    disabled={!searchText.trim()}
    className={`rounded-xl border px-4 py-2 text-sm font-medium shadow-sm transition ${
      searchText.trim()
        ? 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
        : 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400'
    }`}
  >
    クリア
  </button>

</div>

          <div className="space-y-3">
            {filteredDeliveries.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-500">
                条件に一致する配送先がありません。
              </div>
            ) : (
              filteredDeliveries.map((delivery) => {
                const isSelected = selectedDelivery?.id === delivery.id;

                return (
                  <button
                    key={delivery.id}
                    type="button"
                    onClick={() => handleSelectDelivery(delivery)}
                    className={`w-full rounded-2xl border p-4 text-left transition ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50 shadow'
                        : 'border-slate-200 bg-white hover:border-blue-300 hover:shadow-sm'
                    }`}
                  >
                    <div className="mb-2 flex items-start justify-between gap-2">
                      <div>
                        <div className="text-sm font-bold text-slate-800">
                          {delivery.customerName}
                        </div>
                        <div className="mt-1 text-xs text-slate-500">
                          ID: {delivery.id}
                        </div>
                      </div>

                      <span
                        className={`rounded-full px-2 py-1 text-[11px] font-medium ${
                          delivery.status === '完了'
                            ? 'bg-emerald-100 text-emerald-700'
                            : delivery.status === '配送中'
                            ? 'bg-blue-100 text-blue-700'
                            : delivery.status === '再配達'
                            ? 'bg-rose-100 text-rose-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        {delivery.status}
                      </span>
                    </div>

                    <div className="space-y-1 text-xs text-slate-600">
                      <div>住所: {delivery.address}</div>
                      <div>予定時刻: {delivery.scheduledTime || '-'}</div>
                      <div>担当: {delivery.driverName || '-'}</div>
                      <div>配送順: {delivery.routeOrder ?? '-'}</div>
                      <div>優先度: {delivery.priority || '-'}</div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200">
          <GoogleMap
            mapContainerStyle={containerStyle}
            center={center}
            zoom={focusDelivery ? 16 : 13}
            onLoad={(map) => setMapRef(map)}
            options={{
              mapTypeControl: false,
              streetViewControl: false,
              fullscreenControl: false,
            }}
          >
            {driverDirections.map((item) => (
              <DirectionsRenderer
                key={item.driverName}
                directions={item.directions}
                options={{
                  suppressMarkers: true,
                  polylineOptions: {
                    strokeColor: DRIVER_COLORS[item.driverName] || '#6b7280',
                    strokeOpacity: 0.85,
                    strokeWeight: 5,
                  },
                }}
              />
            ))}

            {filteredDeliveries.map((delivery) => (
              <Marker
                key={delivery.id}
                position={{ lat: delivery.lat, lng: delivery.lng }}
                title={delivery.customerName}
                onClick={() => setSelectedDelivery(delivery)}
                icon={{
                  url:
                    selectedDelivery?.id === delivery.id
                      ? 'http://maps.google.com/mapfiles/ms/icons/purple-dot.png'
                      : delivery.priority === '高'
                      ? 'http://maps.google.com/mapfiles/ms/icons/red-dot.png'
                      : delivery.priority === '中'
                      ? 'http://maps.google.com/mapfiles/ms/icons/yellow-dot.png'
                      : 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png',
                }}
                label={{
                  text: String(delivery.routeOrder ?? ''),
                  color: '#ffffff',
                  fontSize: '12px',
                  fontWeight: 'bold',
                }}
              />
            ))}

            {selectedDelivery && (
              <InfoWindow
                position={{
                  lat: selectedDelivery.lat,
                  lng: selectedDelivery.lng,
                }}
                onCloseClick={() => setSelectedDelivery(null)}
              >
                <div className="min-w-[220px] text-sm">
                  <div className="mb-1 font-bold text-slate-800">
                    {selectedDelivery.customerName}
                  </div>
                  <div className="mb-1 text-slate-600">
                    {selectedDelivery.address}
                  </div>
                  <div className="text-slate-500">ID: {selectedDelivery.id}</div>
                  <div className="text-slate-500">
                    ステータス: {selectedDelivery.status}
                  </div>
                  <div className="text-slate-500">
                    予定時刻: {selectedDelivery.scheduledTime || '-'}
                  </div>
                  <div className="text-slate-500">
                    優先度: {selectedDelivery.priority || '-'}
                  </div>
                  <div className="text-slate-500">
                    配送順: {selectedDelivery.routeOrder ?? '-'}
                  </div>
                  <div className="text-slate-500">
                    担当: {selectedDelivery.driverName || '-'}
                  </div>
                </div>
              </InfoWindow>
            )}
          </GoogleMap>
        </div>
      </div>
    </div>
  );
}