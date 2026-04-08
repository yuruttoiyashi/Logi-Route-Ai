import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';

import { AuthProvider } from './contexts/AuthContext';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import Deliveries from './pages/Deliveries';
import MapView from './pages/MapView';
import DriverStats from './pages/DriverStats';
import { db } from './lib/firebase';

type Delivery = {
  id: string;
  customerName?: string;
  address?: string;
  lat: number;
  lng: number;
  status: string;
  priority?: '高' | '中' | '低';
  scheduledTime?: string;
  routeOrder?: number;
  driverName?: string;
  createdAt?: any;
};

export default function App() {
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'deliveries'), orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(
        (doc) =>
          ({
            id: doc.id,
            ...doc.data(),
          }) as Delivery
      );

      setDeliveries(list);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  if (loading) {
    return <div className="p-6">読み込み中...</div>;
  }

  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          <Route path="/" element={<Layout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage deliveries={deliveries} />} />
            <Route path="/deliveries" element={<Deliveries deliveries={deliveries} />} />
            <Route path="/map" element={<MapView deliveries={deliveries} />} />
            <Route path="/drivers" element={<DriverStats deliveries={deliveries} />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}