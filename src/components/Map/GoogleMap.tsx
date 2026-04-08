import { GoogleMap, Marker, InfoWindow, useJsApiLoader } from '@react-google-maps/api';
import React, { useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';

export default function MapView({ deliveries }: Props) {
  const location = useLocation();
  const focusDelivery = (location.state as { focusDelivery?: Delivery })?.focusDelivery;

  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
  });

  const center = useMemo(() => {
    if (focusDelivery) {
      return { lat: focusDelivery.lat, lng: focusDelivery.lng };
    }
    return { lat: 35.599, lng: 139.611 };
  }, [focusDelivery]);

  if (!isLoaded) return <div>読み込み中...</div>;

  return (
    <GoogleMap
      mapContainerStyle={{ width: '100%', height: '650px' }}
      center={center}
      zoom={focusDelivery ? 16 : 13}  // ←ここ！！
    >
      {deliveries.map((delivery) => (
        <Marker
          key={delivery.id}
          position={{ lat: delivery.lat, lng: delivery.lng }}
          onClick={() => setSelectedId(delivery.id)}
        >
          {selectedId === delivery.id && (
            <InfoWindow
              position={{ lat: delivery.lat, lng: delivery.lng }}
              onCloseClick={() => setSelectedId(null)}
            >
              <div>
                <p>{delivery.customerName}</p>
                <p>{delivery.address}</p>
              </div>
            </InfoWindow>
          )}
        </Marker>
      ))}
    </GoogleMap>
  );
}