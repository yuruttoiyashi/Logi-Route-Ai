import React, { useEffect, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import Deliveries from './pages/Deliveries';
import MapView from './pages/MapView';
import DriverStats from './pages/DriverStats';
import { subscribeDeliveries } from './services/deliveryService';
import type { Delivery } from './types/delivery';

export default function App() {
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeDeliveries((items) => {
      setDeliveries(items);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route
              path="dashboard"
              element={<DashboardPage deliveries={deliveries} loading={loading} />}
            />
            <Route
              path="deliveries"
              element={<Deliveries deliveries={deliveries} loading={loading} />}
            />
            <Route path="map" element={<MapView deliveries={deliveries} loading={loading} />} />
            <Route
              path="driver-stats"
              element={<DriverStats deliveries={deliveries} loading={loading} />}
            />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}