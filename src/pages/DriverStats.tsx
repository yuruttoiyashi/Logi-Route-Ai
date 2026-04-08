import React, { useMemo } from 'react';
import type { Delivery } from '../types/delivery';

type DriverStatsProps = {
  deliveries: Delivery[];
  loading?: boolean;
};

type DriverSummary = {
  driverName: string;
  total: number;
  delivered: number;
  inTransit: number;
  redelivery: number;
  completionRate: number;
};

export default function DriverStats({
  deliveries,
  loading = false,
}: DriverStatsProps) {
  const stats = useMemo<DriverSummary[]>(() => {
    const map = new Map<string, DriverSummary>();

    deliveries.forEach((delivery) => {
      const driverName = delivery.driverName?.trim() || '未割当';

      if (!map.has(driverName)) {
        map.set(driverName, {
          driverName,
          total: 0,
          delivered: 0,
          inTransit: 0,
          redelivery: 0,
          completionRate: 0,
        });
      }

      const item = map.get(driverName)!;
      item.total += 1;

      if (delivery.status === 'delivered') item.delivered += 1;
      if (delivery.status === 'in_transit') item.inTransit += 1;
      if (delivery.status === 'redelivery') item.redelivery += 1;
    });

    return Array.from(map.values())
      .map((item) => ({
        ...item,
        completionRate:
          item.total > 0 ? Math.round((item.delivered / item.total) * 100) : 0,
      }))
      .sort((a, b) => b.total - a.total);
  }, [deliveries]);

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">ドライバー別実績</h1>
        <p className="mt-1 text-sm text-slate-500">担当者ごとの配送状況を確認できます。</p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        {loading ? (
          <div className="py-10 text-center text-slate-500">読み込み中...</div>
        ) : stats.length === 0 ? (
          <div className="py-10 text-center text-slate-400">ドライバー実績データがありません</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-slate-500">
                  <th className="px-3 py-3">ドライバー</th>
                  <th className="px-3 py-3">総件数</th>
                  <th className="px-3 py-3">完了</th>
                  <th className="px-3 py-3">配送中</th>
                  <th className="px-3 py-3">再配達</th>
                  <th className="px-3 py-3">完了率</th>
                </tr>
              </thead>
              <tbody>
                {stats.map((item) => (
                  <tr key={item.driverName} className="border-b border-slate-100">
                    <td className="px-3 py-3 font-medium text-slate-800">{item.driverName}</td>
                    <td className="px-3 py-3">{item.total}</td>
                    <td className="px-3 py-3">{item.delivered}</td>
                    <td className="px-3 py-3">{item.inTransit}</td>
                    <td className="px-3 py-3">{item.redelivery}</td>
                    <td className="px-3 py-3">{item.completionRate}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}