import React, { useEffect, useMemo, useState } from 'react';
import { collection, query, onSnapshot } from 'firebase/firestore';
import {
  Package,
  CheckCircle2,
  Clock,
  AlertTriangle,
  BrainCircuit,
  TrendingUp,
  ArrowRight,
} from 'lucide-react';
import { db } from '../lib/firebase.ts';
import { analyzeDelayRisk } from '../services/geminiService.ts';
import StatCard from '../components/StatCard.tsx';
import { motion } from 'motion/react';
import { cn } from '../lib/utils.ts';

type Delivery = {
  id: string;
  customerName?: string;
  address?: string;
  status: string;
  priority?: '高' | '中' | '低';
  scheduledTime?: string;
  routeOrder?: number;
  driverName?: string;
  createdAt?: any;
};

type RiskReport = {
  riskLevel: 'high' | 'medium' | 'low';
  reason: string;
  suggestions: string;
};

const DashboardPage = () => {
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [riskReport, setRiskReport] = useState<RiskReport | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'deliveries'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list = snapshot.docs.map(
          (doc) =>
            ({
              id: doc.id,
              ...doc.data(),
            }) as Delivery
        );

        setDeliveries(list);
      },
      (error) => {
        console.error('Firestore読み込みエラー:', error);
      }
    );

    return () => unsubscribe();
  }, []);

  const stats = useMemo(() => {
    const total = deliveries.length;
    const completed = deliveries.filter((d) => d.status === '完了').length;
    const pendingOnly = deliveries.filter((d) => d.status === '未対応').length;
    const delivering = deliveries.filter((d) => d.status === '配送中').length;
    const redelivery = deliveries.filter((d) => d.status === '再配達').length;

    return {
      total,
      completed,
      pending: pendingOnly + delivering,
      redelivery,
    };
  }, [deliveries]);

  const driverProgress = useMemo(() => {
    const grouped = deliveries.reduce<Record<string, Delivery[]>>((acc, delivery) => {
      const key = delivery.driverName || '未割当';
      if (!acc[key]) acc[key] = [];
      acc[key].push(delivery);
      return acc;
    }, {});

    const colors = ['bg-blue-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500'];

    return Object.entries(grouped).map(([name, list], index) => {
      const total = list.length;
      const completed = list.filter((d) => d.status === '完了').length;

      return {
        name,
        completed,
        total,
        color: colors[index % colors.length],
      };
    });
  }, [deliveries]);

  const handleAnalyze = async () => {
  if (deliveries.length === 0) return;

  setAnalyzing(true);

  try {
    const result = await analyzeDelayRisk(deliveries as any);
    setRiskReport(result);
  } catch (error: any) {
    console.error('AIエラー詳細:', error);
    alert(error?.message || 'AI分析に失敗しました');
  } finally {
    setAnalyzing(false);
  }
};

  return (
    <div className="space-y-8">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">運行状況ダッシュボード</h2>
          <p className="text-slate-500">リアルタイムの配送データとAIによるリスク分析</p>
        </div>

        <button
          onClick={handleAnalyze}
          disabled={analyzing || deliveries.length === 0}
          className="flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 font-bold text-white shadow-lg shadow-blue-200 transition-all hover:bg-blue-700 disabled:opacity-50"
        >
          {analyzing ? (
            <div className="h-5 w-5 animate-spin rounded-full border-b-2 border-white" />
          ) : (
            <BrainCircuit size={20} />
          )}
          AI遅延リスク分析を実行
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="本日の総配送"
          value={stats.total}
          icon={Package}
          color="bg-blue-600"
          delay={0.1}
        />
        <StatCard
          title="配送完了"
          value={stats.completed}
          icon={CheckCircle2}
          color="bg-emerald-500"
          delay={0.2}
          trend={{ value: 12, isUp: true }}
        />
        <StatCard
          title="未完了・配送中"
          value={stats.pending}
          icon={Clock}
          color="bg-amber-500"
          delay={0.3}
        />
        <StatCard
          title="再配達・不在"
          value={stats.redelivery}
          icon={AlertTriangle}
          color="bg-rose-500"
          delay={0.4}
        />
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-lg font-bold text-slate-900">
                <TrendingUp size={20} className="text-blue-600" />
                配送進捗状況
              </h3>

              <button className="flex items-center gap-1 text-sm font-bold text-blue-600 hover:text-blue-700">
                詳細を見る <ArrowRight size={16} />
              </button>
            </div>

            <div className="space-y-6">
              {driverProgress.length === 0 ? (
                <p className="text-sm text-slate-400">配送データがありません。</p>
              ) : (
                driverProgress.map((driver, i) => (
                  <div key={driver.name} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-bold text-slate-700">{driver.name}</span>
                      <span className="font-medium text-slate-500">
                        {driver.completed} / {driver.total} 完了
                      </span>
                    </div>

                    <div className="h-3 overflow-hidden rounded-full bg-slate-100 shadow-inner">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{
                          width:
                            driver.total === 0
                              ? '0%'
                              : `${(driver.completed / driver.total) * 100}%`,
                        }}
                        transition={{ duration: 1, delay: 0.5 + i * 0.1 }}
                        className={cn('h-full rounded-full', driver.color)}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div
            className={cn(
              'rounded-2xl border p-6 shadow-sm transition-all duration-500',
              riskReport ? 'border-blue-100 bg-blue-50' : 'border-slate-100 bg-white'
            )}
          >
            <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-slate-900">
              <BrainCircuit size={20} className="text-blue-600" />
              AI分析レポート
            </h3>

            {riskReport ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase text-slate-400">
                    リスクレベル:
                  </span>
                  <span
                    className={cn(
                      'rounded-full px-3 py-1 text-xs font-bold uppercase',
                      riskReport.riskLevel === 'high'
                        ? 'bg-rose-500 text-white'
                        : riskReport.riskLevel === 'medium'
                        ? 'bg-amber-500 text-white'
                        : 'bg-emerald-500 text-white'
                    )}
                  >
                    {riskReport.riskLevel === 'high'
                      ? '高'
                      : riskReport.riskLevel === 'medium'
                      ? '中'
                      : '低'}
                  </span>
                </div>

                <div>
                  <p className="mb-1 text-sm font-bold text-slate-700">分析結果:</p>
                  <p className="text-sm leading-relaxed text-slate-600">
                    {riskReport.reason}
                  </p>
                </div>

                <div className="rounded-xl border border-blue-100 bg-white p-4 shadow-sm">
                  <p className="mb-1 text-sm font-bold text-blue-700">推奨アクション:</p>
                  <p className="text-sm italic leading-relaxed text-slate-600">
                    "{riskReport.suggestions}"
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4 py-12 text-center">
                <div className="inline-flex rounded-full bg-slate-50 p-4 text-slate-200">
                  <BrainCircuit size={48} />
                </div>
                <p className="px-4 text-sm text-slate-400">
                  右上のボタンからAI分析を実行して、配送遅延リスクを予測します。
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;