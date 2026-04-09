import React, { useMemo, useState } from 'react';
import type { Delivery } from '../types/delivery';

type DashboardPageProps = {
  deliveries: Delivery[];
  loading?: boolean;
};

type AiReport = {
  riskLevel: '低' | '中' | '高';
  summary: string;
  recommendation: string;
};

function normalizeStatus(status?: string) {
  switch (status) {
    case 'delivered':
      return 'delivered';
    case 'in_transit':
      return 'in_transit';
    case 'redelivery':
      return 'redelivery';
    case 'pending':
    case 'scheduled':
    default:
      return 'pending';
  }
}

function getDriverProgress(deliveries: Delivery[]) {
  const map = new Map<
    string,
    {
      total: number;
      completed: number;
    }
  >();

  deliveries.forEach((delivery) => {
    const driverName = delivery.driverName?.trim() || '未割当';
    const status = normalizeStatus(delivery.status);

    if (!map.has(driverName)) {
      map.set(driverName, { total: 0, completed: 0 });
    }

    const item = map.get(driverName)!;
    item.total += 1;
    if (status === 'delivered') {
      item.completed += 1;
    }
  });

  return Array.from(map.entries()).map(([driverName, value]) => ({
    driverName,
    total: value.total,
    completed: value.completed,
    percent: value.total > 0 ? Math.round((value.completed / value.total) * 100) : 0,
  }));
}

function buildAiReport(deliveries: Delivery[]): AiReport {
  const total = deliveries.length;
  const pending = deliveries.filter((d) => normalizeStatus(d.status) === 'pending').length;
  const inTransit = deliveries.filter((d) => normalizeStatus(d.status) === 'in_transit').length;
  const redelivery = deliveries.filter((d) => normalizeStatus(d.status) === 'redelivery').length;
  const highPriorityPending = deliveries.filter(
    (d) => (d.priority === 'high' || d.priority === '高') && normalizeStatus(d.status) !== 'delivered'
  ).length;

  if (total === 0) {
    return {
      riskLevel: '低',
      summary: '配送データがないため、リスク判定対象がありません。',
      recommendation: '配送先データを登録するとAI分析を実行できます。',
    };
  }

  if (redelivery >= 3 || highPriorityPending >= 3) {
    return {
      riskLevel: '高',
      summary: '再配達や高優先度の未完了案件が多く、遅延リスクが高まっています。',
      recommendation: '高優先度案件を先に再割当し、再配達対象を優先的に処理してください。',
    };
  }

  if (pending >= Math.ceil(total * 0.4) || inTransit >= Math.ceil(total * 0.5)) {
    return {
      riskLevel: '中',
      summary: '未対応・配送中案件がやや多く、後半の遅延発生に注意が必要です。',
      recommendation: '担当別の進捗差を確認し、未割当や停滞案件を早めに調整してください。',
    };
  }

  return {
    riskLevel: '低',
    summary: '大きな遅延リスクは見つかりませんでした。',
    recommendation: '通常どおり配送を進めてください。',
  };
}

export default function DashboardPage({
  deliveries,
  loading = false,
}: DashboardPageProps) {
  const [aiReport, setAiReport] = useState<AiReport>(() => buildAiReport(deliveries));

  const summary = useMemo(() => {
    const total = deliveries.length;
    const delivered = deliveries.filter((d) => normalizeStatus(d.status) === 'delivered').length;
    const inTransit = deliveries.filter((d) => normalizeStatus(d.status) === 'in_transit').length;
    const pending = deliveries.filter((d) => normalizeStatus(d.status) === 'pending').length;
    const redelivery = deliveries.filter((d) => normalizeStatus(d.status) === 'redelivery').length;

    return {
      total,
      delivered,
      inTransit,
      pending,
      redelivery,
    };
  }, [deliveries]);

  const progressList = useMemo(() => getDriverProgress(deliveries), [deliveries]);

  const recentDeliveries = useMemo(() => {
    return [...deliveries]
      .sort((a, b) => {
        const aOrder = a.routeOrder ?? 9999;
        const bOrder = b.routeOrder ?? 9999;
        return aOrder - bOrder;
      })
      .slice(0, 6);
  }, [deliveries]);

  const runAiAnalysis = () => {
    setAiReport(buildAiReport(deliveries));
  };

  const riskColor =
    aiReport.riskLevel === '高'
      ? 'bg-rose-100 text-rose-700'
      : aiReport.riskLevel === '中'
      ? 'bg-amber-100 text-amber-700'
      : 'bg-emerald-100 text-emerald-700';

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">運行状況ダッシュボード</h1>
          <p className="mt-2 text-base text-slate-500">
            リアルタイムの配送データとAIによるリスク分析
          </p>
        </div>

        <button
          type="button"
          onClick={runAiAnalysis}
          className="inline-flex items-center justify-center rounded-2xl bg-blue-600 px-6 py-4 text-base font-semibold text-white shadow-lg transition hover:bg-blue-700"
        >
          ✨ AI遅延リスク分析を実行
        </button>
      </div>

      {loading ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          読み込み中...
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              icon="📦"
              title="本日の総配送"
              value={`${summary.total}`}
              unit="件"
              accent="blue"
            />
            <MetricCard
              icon="✅"
              title="配送完了"
              value={`${summary.delivered}`}
              unit="件"
              accent="green"
              subLabel="↑12%"
            />
            <MetricCard
              icon="🕒"
              title="未完了・配送中"
              value={`${summary.pending + summary.inTransit}`}
              unit="件"
              accent="amber"
            />
            <MetricCard
              icon="🚨"
              title="再配達・不在"
              value={`${summary.redelivery}`}
              unit="件"
              accent="rose"
            />
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.9fr_0.9fr]">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-slate-900">配送進捗状況</h2>
                <span className="text-sm font-medium text-blue-600">詳細を見る →</span>
              </div>

              <div className="space-y-5">
                {progressList.length === 0 ? (
                  <p className="text-slate-400">進捗データがありません</p>
                ) : (
                  progressList.map((item) => (
                    <div key={item.driverName}>
                      <div className="mb-2 flex items-center justify-between">
                        <span className="font-medium text-slate-800">{item.driverName}</span>
                        <span className="text-sm text-slate-500">
                          {item.completed} / {item.total} 完了
                        </span>
                      </div>

                      <div className="h-3 w-full rounded-full bg-slate-200">
                        <div
                          className="h-3 rounded-full bg-emerald-500 transition-all"
                          style={{ width: `${item.percent}%` }}
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="mt-8">
                <h3 className="mb-4 text-xl font-bold text-slate-900">直近の配送一覧</h3>

                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 text-left text-slate-500">
                        <th className="px-3 py-3">顧客名</th>
                        <th className="px-3 py-3">住所</th>
                        <th className="px-3 py-3">状態</th>
                        <th className="px-3 py-3">担当</th>
                        <th className="px-3 py-3">予定時刻</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentDeliveries.map((delivery) => (
                        <tr key={delivery.id} className="border-b border-slate-100">
                          <td className="px-3 py-3">{delivery.customerName ?? '-'}</td>
                          <td className="px-3 py-3">{delivery.address ?? '-'}</td>
                          <td className="px-3 py-3">{delivery.status ?? '-'}</td>
                          <td className="px-3 py-3">{delivery.driverName ?? '-'}</td>
                          <td className="px-3 py-3">{delivery.scheduledTime ?? '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-blue-100 bg-slate-50 p-6 shadow-sm">
              <h2 className="flex items-center gap-2 text-2xl font-bold text-slate-900">
                🧠 AI分析レポート
              </h2>

              <div className="mt-6">
                <p className="text-sm text-slate-500">リスクレベル:</p>
                <span
                  className={`mt-2 inline-flex rounded-full px-4 py-1 text-sm font-semibold ${riskColor}`}
                >
                  {aiReport.riskLevel}
                </span>
              </div>

              <div className="mt-6">
                <p className="text-sm font-semibold text-slate-700">分析結果:</p>
                <p className="mt-2 leading-7 text-slate-700">{aiReport.summary}</p>
              </div>

              <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-sm font-semibold text-blue-700">推奨アクション:</p>
                <p className="mt-2 leading-7 text-slate-700">“{aiReport.recommendation}”</p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function MetricCard({
  icon,
  title,
  value,
  unit,
  accent,
  subLabel,
}: {
  icon: string;
  title: string;
  value: string;
  unit: string;
  accent: 'blue' | 'green' | 'amber' | 'rose';
  subLabel?: string;
}) {
  const accentMap: Record<string, string> = {
    blue: 'bg-blue-600',
    green: 'bg-emerald-500',
    amber: 'bg-amber-500',
    rose: 'bg-rose-500',
  };

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between">
        <div
          className={`flex h-12 w-12 items-center justify-center rounded-2xl text-2xl text-white ${accentMap[accent]}`}
        >
          {icon}
        </div>

        {subLabel && (
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-600">
            {subLabel}
          </span>
        )}
      </div>

      <p className="mt-5 text-sm text-slate-500">{title}</p>
      <div className="mt-2 flex items-end gap-1">
        <span className="text-5xl font-bold leading-none text-slate-900">{value}</span>
        <span className="pb-1 text-lg text-slate-400">{unit}</span>
      </div>
    </div>
  );
}