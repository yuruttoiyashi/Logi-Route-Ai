import React, { useEffect, useState } from 'react';
import { APIProvider, Map, Marker, InfoWindow, useMap, useMapsLibrary } from '@vis.gl/react-google-maps';
import { Delivery } from '../types';
import { cn } from '../lib/utils';
import { MapPin, Package, Clock, User } from 'lucide-react';
import { useLocation } from 'react-router-dom';

interface MapViewProps {
  deliveries: Delivery[];
  selectedDelivery?: Delivery;
  onSelectDelivery: (delivery: Delivery) => void;
}

const Directions = ({ deliveries }: { deliveries: Delivery[] }) => {
  const map = useMap();
  const routesLibrary = useMapsLibrary('routes');
  const [directionsService, setDirectionsService] = useState<google.maps.DirectionsService>();
  const [directionsRenderer, setDirectionsRenderer] = useState<google.maps.DirectionsRenderer>();

  useEffect(() => {
    if (!routesLibrary || !map) return;
    setDirectionsService(new routesLibrary.DirectionsService());
    setDirectionsRenderer(new routesLibrary.DirectionsRenderer({ map, suppressMarkers: true }));
  }, [routesLibrary, map]);

  useEffect(() => {
    if (!directionsService || !directionsRenderer || deliveries.length < 2) return;

    // Sort deliveries by priority and then by some logic (MVP: just as they are)
    const sorted = [...deliveries].sort((a, b) => {
      const priorityMap = { high: 0, medium: 1, low: 2 };
      return priorityMap[a.priority] - priorityMap[b.priority];
    });

    const waypoints = sorted.slice(1, -1).map(d => ({
      location: { lat: d.lat, lng: d.lng },
      stopover: true
    }));

    directionsService.route({
      origin: { lat: sorted[0].lat, lng: sorted[0].lng },
      destination: { lat: sorted[sorted.length - 1].lat, lng: sorted[sorted.length - 1].lng },
      waypoints,
      optimizeWaypoints: true,
      travelMode: google.maps.TravelMode.DRIVING,
    }).then(response => {
      directionsRenderer.setDirections(response);
    });
  }, [directionsService, directionsRenderer, deliveries]);

  return null;
};

const GoogleMapComponent: React.FC<MapViewProps> = ({ deliveries, selectedDelivery, onSelectDelivery }) => {
  const apiKey = (import.meta as any).env.VITE_GOOGLE_MAPS_API_KEY || '';
  const [infoWindowOpen, setInfoWindowOpen] = useState(false);
  const [activeDelivery, setActiveDelivery] = useState<Delivery | null>(null);

  if (!apiKey) {
    return (
      <div className="w-full h-full bg-slate-100 flex flex-col items-center justify-center p-8 text-center space-y-4 rounded-2xl border-2 border-dashed border-slate-200">
        <div className="p-4 bg-white rounded-full shadow-sm text-slate-300">
          <MapPin size={48} />
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-bold text-slate-700">Google Maps APIキーが設定されていません</h3>
          <p className="text-sm text-slate-500 max-w-md">
            地図を表示するには、Google Cloud ConsoleでAPIキーを取得し、.envファイルのVITE_GOOGLE_MAPS_API_KEYに設定してください。
          </p>
        </div>
      </div>
    );
  }

  return (
    <APIProvider apiKey={apiKey}>
      <div className="w-full h-full rounded-2xl overflow-hidden shadow-inner border border-slate-200">
        <Map
          defaultCenter={{ lat: 35.681236, lng: 139.767125 }}
          defaultZoom={12}
          mapId="LOGIROUTE_MAP_ID"
          fullscreenControl={false}
          streetViewControl={false}
          mapTypeControl={false}
        >
          {deliveries.map((delivery) => (
            <Marker
              key={delivery.id}
              position={{ lat: delivery.lat, lng: delivery.lng }}
              onClick={() => {
                setActiveDelivery(delivery);
                setInfoWindowOpen(true);
                onSelectDelivery(delivery);
              }}
              label={{
                text: delivery.priority === 'high' ? '!' : '',
                color: 'white',
                fontWeight: 'bold'
              }}
            />
          ))}

          {infoWindowOpen && activeDelivery && (
            <InfoWindow
              position={{ lat: activeDelivery.lat, lng: activeDelivery.lng }}
              onCloseClick={() => setInfoWindowOpen(false)}
            >
              <div className="p-2 min-w-[200px] space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-900">{activeDelivery.customerName}</h4>
                  <span className={cn(
                    "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
                    activeDelivery.priority === 'high' ? "bg-rose-500 text-white" : "bg-slate-100 text-slate-600"
                  )}>
                    {activeDelivery.priority}
                  </span>
                </div>
                <p className="text-xs text-slate-500 flex items-center gap-1">
                  <MapPin size={12} />
                  {activeDelivery.address}
                </p>
                <div className="flex items-center gap-3 text-[10px] text-slate-400">
                  <span className="flex items-center gap-1">
                    <Package size={10} />
                    {activeDelivery.packageId}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock size={10} />
                    {activeDelivery.timeWindowStart} - {activeDelivery.timeWindowEnd}
                  </span>
                </div>
              </div>
            </InfoWindow>
          )}

          <Directions deliveries={deliveries} />
        </Map>
      </div>
    </APIProvider>
  );
};

export default GoogleMapComponent;
