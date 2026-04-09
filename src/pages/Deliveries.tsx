import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Delivery } from '../types/delivery';

type DeliveriesProps = {
  deliveries: Delivery[];
  loading?: boolean;
};

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
    case 'cancelled':
      return 'キャンセル';
    default:
      return status || '未設定';
  }
}

function statusBadgeClass(status?: string) {
  switch (status) {
    case 'pending':
    case 'scheduled':
      return 'bg-amber-100 text-amber-700';
    case 'in_transit':
      return 'bg-blue-100 text-blue-700';
    case 'delivered':
      return 'bg-emerald-100 text-emerald-700';
    case 'redelivery':
      return 'bg-rose-100 text-rose-700';
    default:
      return 'bg-slate-100 text-slate-600';
  }
}

function priorityLabel(priority?: string) {
  if (priority === 'high') return '高';
  if (priority === 'medium') return 'medium';
  if (priority === 'low') return '低';
  return priority || '-';
}

export default function Deliveries({
  deliveries,
  loading = false,
}: DeliveriesProps) {
  const navigate = useNavigate();
  const [keyword, setKeyword] = useState('');

  const filteredDeliveries = useMemo(() => {
    const q = keyword.trim().toLowerCase();
    if (!q) return deliveries;

    return deliveries.filter((delivery) => {
      const text = [
        delivery.customerName,
        delivery.address,
        delivery.id,
        delivery.driverName,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return text.includes(q);
    });
  }, [deliveries, keyword]);

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">配送先一覧</h1>
        <p className="mt-2 text-slate-500">
          登録済みの配送先を一覧で確認できます。
        </p>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
        <input
          type="text"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="顧客名・住所・IDで検索"
          className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500"
        />
      </div>

      {loading ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          読み込み中...
        </div>
      ) : filteredDeliveries.length === 0 ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-8 text-slate-400 shadow-sm">
          配送データがありません
        </div>
      ) : (
        <div className="space-y-4">
          {filteredDeliveries.map((delivery) => (
            <div
              key={delivery.id}
              className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="text-4xl font-bold text-slate-900">
                      {delivery.customerName ?? '名称未設定'}
                    </h2>
                    <span
                      className={`rounded-full px-4 py-1 text-sm font-semibold ${statusBadgeClass(
                        delivery.status
                      )}`}
                    >
                      {statusLabel(delivery.status)}
                    </span>
                  </div>

                  <p className="mt-4 text-3xl text-slate-700">
                    {delivery.address ?? '-'}
                  </p>

                  <div className="mt-4 flex flex-wrap gap-x-8 gap-y-2 text-xl text-slate-500">
                    <span>ID: {delivery.id}</span>
                    <span>予定: {delivery.scheduledTime ?? '-'}</span>
                    <span>優先度: {priorityLabel(delivery.priority)}</span>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() =>
                      navigate('/map', { state: { focusDelivery: delivery } })
                    }
                    className="rounded-2xl bg-blue-600 px-6 py-4 text-lg font-semibold text-white transition hover:bg-blue-700"
                  >
                    地図で見る
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}