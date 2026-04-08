import React from 'react';
import { useNavigate } from 'react-router-dom';
import type { Delivery } from '../services/deliveryService';

type Props = {
  deliveries: Delivery[];
};

export default function Deliveries({ deliveries }: Props) {
  const navigate = useNavigate();

  const handleFocusMap = (delivery: Delivery) => {
    navigate('/map', {
      state: {
        focusDelivery: delivery,
      },
    });
  };

  return (
    <div className="space-y-4">
      {deliveries.map((delivery) => (
        <div
          key={delivery.id}
          onClick={() => handleFocusMap(delivery)}
          className="cursor-pointer rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md hover:border-blue-300"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h3 className="text-xl font-bold text-slate-800">
                  {delivery.customerName}
                </h3>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-600">
                  {delivery.status}
                </span>
              </div>

              <p className="mt-2 text-slate-600">{delivery.address}</p>

              <div className="mt-2 flex flex-wrap gap-4 text-sm text-slate-500">
                <span>ID: {delivery.id}</span>
                <span>予定: {delivery.scheduledTime || '-'}</span>
                <span>優先度: {delivery.priority || '-'}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleFocusMap(delivery);
              }}
              className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              地図で見る
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}