import React, { useEffect, useState } from 'react';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';
import { BarChart3, Users, Award, TrendingUp, CheckCircle2, AlertTriangle, RotateCcw, Clock } from 'lucide-react';
import { db } from '../lib/firebase.ts';
import { Delivery, UserProfile, DriverStats } from '../types.ts';
import { motion } from 'motion/react';
import { cn } from '../lib/utils.ts';

const DriverStatsPage = () => {
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [drivers, setDrivers] = useState<UserProfile[]>([]);

  useEffect(() => {
    const qD = query(collection(db, 'deliveries'), orderBy('createdAt', 'desc'));
    const unsubscribeD = onSnapshot(qD, (snapshot) => {
      setDeliveries(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Delivery)));
    });

    const qU = query(collection(db, 'users'));
    const unsubscribeU = onSnapshot(qU, (snapshot) => {
      setDrivers(snapshot.docs.map(doc => doc.data() as UserProfile).filter(u => u.role === 'driver'));
    });

    return () => {
      unsubscribeD();
      unsubscribeU();
    };
  }, []);

  const driverStats: DriverStats[] = drivers.map(driver => {
    const driverDeliveries = deliveries.filter(d => d.driverId === driver.uid || d.driverName === driver.displayName);
    const completed = driverDeliveries.filter(d => d.status === 'completed').length;
    const pending = driverDeliveries.filter(d => d.status === 'pending' || d.status === 'delivering').length;
    const redelivery = driverDeliveries.filter(d => d.status === 'redelivery' || d.status === 'absent').length;
    const total = driverDeliveries.length;
    const completionRate = total > 0 ? (completed / total) * 100 : 0;
    
    // Simple score calculation
    const score = total > 0 ? Math.round((completed / total) * 80 + (1 - redelivery / total) * 20) : 0;

    return {
      driverId: driver.uid,
      driverName: driver.displayName,
      completed,
      pending,
      redelivery,
      total,
      completionRate,
      score
    };
  });

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">ドライバー統計</h2>
        <p className="text-slate-500">配送効率とパフォーマンスの可視化</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="p-3 bg-blue-100 text-blue-600 rounded-xl">
            <Users size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">稼働ドライバー</p>
            <h3 className="text-2xl font-bold text-slate-900">{drivers.length} 名</h3>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="p-3 bg-emerald-100 text-emerald-600 rounded-xl">
            <Award size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">平均完了率</p>
            <h3 className="text-2xl font-bold text-slate-900">
              {driverStats.length > 0 ? Math.round(driverStats.reduce((acc, s) => acc + s.completionRate, 0) / driverStats.length) : 0} %
            </h3>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="p-3 bg-amber-100 text-amber-600 rounded-xl">
            <TrendingUp size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">総配送件数</p>
            <h3 className="text-2xl font-bold text-slate-900">{deliveries.length} 件</h3>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <BarChart3 size={20} className="text-blue-600" />
            ドライバー別パフォーマンス
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider">
                <th className="px-6 py-4">ドライバー</th>
                <th className="px-6 py-4">完了件数</th>
                <th className="px-6 py-4">未完了</th>
                <th className="px-6 py-4">再配達</th>
                <th className="px-6 py-4">完了率</th>
                <th className="px-6 py-4 text-right">スコア</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {driverStats.map((stat, i) => (
                <motion.tr 
                  key={stat.driverId}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="hover:bg-slate-50 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-500 text-xs">
                        {stat.driverName[0]}
                      </div>
                      <span className="font-bold text-slate-700">{stat.driverName}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-emerald-600 font-bold">
                      <CheckCircle2 size={16} />
                      {stat.completed}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-slate-500">
                      <Clock size={16} />
                      {stat.pending}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-rose-500">
                      <RotateCcw size={16} />
                      {stat.redelivery}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="w-full max-w-[100px] space-y-1">
                      <div className="flex justify-between text-[10px] font-bold text-slate-400">
                        <span>{Math.round(stat.completionRate)}%</span>
                      </div>
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-blue-500 rounded-full" 
                          style={{ width: `${stat.completionRate}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className={cn(
                      "inline-flex items-center justify-center w-10 h-10 rounded-full font-bold text-sm",
                      stat.score > 80 ? "bg-emerald-100 text-emerald-700" : stat.score > 60 ? "bg-blue-100 text-blue-700" : "bg-amber-100 text-amber-700"
                    )}>
                      {stat.score}
                    </span>
                  </td>
                </motion.tr>
              ))}
              {driverStats.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400 italic">
                    ドライバーデータがありません。
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DriverStatsPage;
