import { useEffect, useState } from 'react';
import { useMap, useMapsLibrary } from '@vis.gl/react-google-maps';
import { Delivery } from '../../types.ts';

interface RouteDirectionsProps {
  deliveries: Delivery[];
  onRouteInfoUpdate: (info: { distance: string; duration: string }) => void;
}

const RouteDirections = ({ deliveries, onRouteInfoUpdate }: RouteDirectionsProps) => {
  const map = useMap();
  const routesLibrary = useMapsLibrary('routes');
  const [directionsService, setDirectionsService] = useState<google.maps.DirectionsService>();
  const [directionsRenderer, setDirectionsRenderer] = useState<google.maps.DirectionsRenderer>();

  // ライブラリの初期化
  useEffect(() => {
    if (!routesLibrary || !map) return;
    setDirectionsService(new routesLibrary.DirectionsService());
    setDirectionsRenderer(new routesLibrary.DirectionsRenderer({ 
      map, 
      suppressMarkers: true, // デフォルトのマーカーは非表示にして自前で表示
      polylineOptions: {
        strokeColor: '#2563eb', // ブランドブルー
        strokeWeight: 5,
        strokeOpacity: 0.7
      }
    }));
  }, [routesLibrary, map]);

  // ルート計算と描画
  useEffect(() => {
    if (!directionsService || !directionsRenderer || deliveries.length < 2) return;

    // 配送順にソート（MVPでは配列の順序通り）
    const origin = { lat: deliveries[0].lat, lng: deliveries[0].lng };
    const destination = { lat: deliveries[deliveries.length - 1].lat, lng: deliveries[deliveries.length - 1].lng };
    
    // 経由地（出発地と目的地以外）
    const waypoints = deliveries.slice(1, -1).map(d => ({
      location: { lat: d.lat, lng: d.lng },
      stopover: true
    }));

    directionsService.route({
      origin,
      destination,
      waypoints,
      optimizeWaypoints: false, // 既に最適化されている前提、または手動順序を優先
      travelMode: google.maps.TravelMode.DRIVING,
    }, (result, status) => {
      if (status === google.maps.DirectionsStatus.OK && result) {
        directionsRenderer.setDirections(result);
        
        // 総距離と時間を集計
        const route = result.routes[0];
        let totalDistance = 0;
        let totalDuration = 0;
        
        route.legs.forEach(leg => {
          totalDistance += leg.distance?.value || 0;
          totalDuration += leg.duration?.value || 0;
        });

        onRouteInfoUpdate({
          distance: (totalDistance / 1000).toFixed(1) + ' km',
          duration: Math.round(totalDuration / 60) + ' 分'
        });
      }
    });
  }, [directionsService, directionsRenderer, deliveries]);

  return null;
};

export default RouteDirections;
