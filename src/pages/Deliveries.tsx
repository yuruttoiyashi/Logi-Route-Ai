import React, { useMemo, useState } from 'react';
import type { Delivery } from '../types/delivery';

type DeliveriesProps = {
  deliveries: Delivery[];
  loading?: boolean;
};

export default function Deliveries({
  deliveries,
  loading = false,
}: DeliveriesProps) {
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState('all');

  const filteredDeliveries = useMemo(() => {
    return deliveries.filter((delivery) => {
      const matchesKeyword =
        !keyword ||
        [delivery.customerName, delivery.address, delivery.driverName]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
          .includes(keyword.toLowerCase());

      const matchesStatus = status === 'all' || delivery.status === status;

      return matchesKeyword && matchesStatus;
    });
  }, [deliveries, keyword, status]);

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">配送一覧</h1>
        <p className="mt-1 text-sm text-slate-500">登録済み配送データを確認できます。</p>
      </div>

      <div className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-3">
        <input
          type="text"
          placeholder="顧客名・住所・担当者で検索"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          className="rounded-xl border border-slate-300 px-4 py-2 outline-none"
        />

        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded-xl border border-slate-300 px-4 py-2 outline-none"
        >
          <option value="all">すべて</option>
          <option value="pending">未対応</option>
          <option value="scheduled">予定済み</option>
          <option value="in_transit">配送中</option>
          <option value="delivered">配達完了</option>
          <option value="redelivery">再配達</option>
          <option value="cancelled">キャンセル</option>
        </select>

        <div className="flex items-center justify-end text-sm text-slate-500">
          件数: {filteredDeliveries.length}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        {loading ? (
          <div className="py-10 text-center text-slate-500">読み込み中...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-slate-500">
                  <th className="px-3 py-3">顧客名</th>
                  <th className="px-3 py-3">住所</th>
                  <th className="px-3 py-3">緯度</th>
                  <th className="px-3 py-3">経度</th>
                  <th className="px-3 py-3">状態</th>
                  <th className="px-3 py-3">担当者</th>
                  <th className="px-3 py-3">予定時刻</th>
                  <th className="px-3 py-3">順番</th>
                  <th className="px-3 py-3">優先度</th>
                </tr>
              </thead>
              <tbody>
                {filteredDeliveries.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-3 py-8 text-center text-slate-400">
                      表示できる配送データがありません
                    </td>
                  </tr>
                ) : (
                  filteredDeliveries.map((delivery) => (
                    <tr key={delivery.id} className="border-b border-slate-100">
                      <td className="px-3 py-3">{delivery.customerName ?? '-'}</td>
                      <td className="px-3 py-3">{delivery.address ?? '-'}</td>
                      <td className="px-3 py-3">{delivery.lat}</td>
                      <td className="px-3 py-3">{delivery.lng}</td>
                      <td className="px-3 py-3">{delivery.status}</td>
                      <td className="px-3 py-3">{delivery.driverName ?? '-'}</td>
                      <td className="px-3 py-3">{delivery.scheduledTime ?? '-'}</td>
                      <td className="px-3 py-3">{delivery.routeOrder ?? '-'}</td>
                      <td className="px-3 py-3">{delivery.priority ?? '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}