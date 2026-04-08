import React, { useMemo } from 'react';
import type { Delivery } from '../types/delivery';

type DashboardPageProps = {
  deliveries: Delivery[];
  loading?: boolean;
};

function countByStatus(deliveries: Delivery[], status: string) {
  return deliveries.filter((d) => d.status === status).length;
}

export default function DashboardPage({
  deliveries,
  loading = false,
}: DashboardPageProps) {
  const summary = useMemo(() => {
    const total = deliveries.length;
    const pending = countByStatus(deliveries, 'pending');
    const inTransit = countByStatus(deliveries, 'in_transit');
    const delivered = countByStatus(deliveries, 'delivered');
    const redelivery = countByStatus(deliveries, 'redelivery');

    return {
      total,
      pending,
      inTransit,
      delivered,
      redelivery,
    };
  }, [deliveries]);

  const recentDeliveries = useMemo(() => {
    return [...deliveries]
      .sort((a, b) => {
        const aOrder = a.routeOrder ?? 9999;
        const bOrder = b.routeOrder ?? 9999;
        return aOrder - bOrder;
      })
      .slice(0, 8);
  }, [deliveries]);

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">ダッシュボード</h1>
        <p className="mt-1 text-sm text-slate-500">配送状況の概要を確認できます。</p>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          読み込み中...
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <SummaryCard title="総配送件数" value={summary.total} />
            <SummaryCard title="未対応" value={summary.pending} />
            <SummaryCard title="配送中" value={summary.inTransit} />
            <SummaryCard title="配達完了" value={summary.delivered} />
            <SummaryCard title="再配達" value={summary.redelivery} />
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-slate-800">直近の配送一覧</h2>

            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-slate-500">
                    <th className="px-3 py-3">顧客名</th>
                    <th className="px-3 py-3">住所</th>
                    <th className="px-3 py-3">状態</th>
                    <th className="px-3 py-3">担当</th>
                    <th className="px-3 py-3">予定時刻</th>
                    <th className="px-3 py-3">順番</th>
                  </tr>
                </thead>
                <tbody>
                  {recentDeliveries.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-3 py-6 text-center text-slate-400">
                        データがありません
                      </td>
                    </tr>
                  ) : (
                    recentDeliveries.map((delivery) => (
                      <tr key={delivery.id} className="border-b border-slate-100">
                        <td className="px-3 py-3">{delivery.customerName ?? '-'}</td>
                        <td className="px-3 py-3">{delivery.address ?? '-'}</td>
                        <td className="px-3 py-3">{delivery.status}</td>
                        <td className="px-3 py-3">{delivery.driverName ?? '-'}</td>
                        <td className="px-3 py-3">{delivery.scheduledTime ?? '-'}</td>
                        <td className="px-3 py-3">{delivery.routeOrder ?? '-'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function SummaryCard({ title, value }: { title: string; value: number }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm text-slate-500">{title}</p>
      <p className="mt-2 text-3xl font-bold text-slate-800">{value}</p>
    </div>
  );
}