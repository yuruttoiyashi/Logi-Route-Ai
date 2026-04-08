import React, { useState } from 'react';
import { X, MapPin, Package, Clock, User, FileText } from 'lucide-react';
import { Delivery, Priority, DeliveryStatus } from '../types.ts';
import { db } from '../lib/firebase.ts';
import { collection, addDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { cn } from '../lib/utils.ts';

interface DeliveryFormProps {
  delivery?: Delivery;
  onClose: () => void;
}

const DeliveryForm: React.FC<DeliveryFormProps> = ({ delivery, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    customerName: delivery?.customerName || '',
    address: delivery?.address || '',
    lat: delivery?.lat || 35.681236,
    lng: delivery?.lng || 139.767125,
    packageId: delivery?.packageId || '',
    priority: delivery?.priority || 'medium' as Priority,
    timeWindowStart: delivery?.timeWindowStart || '09:00',
    timeWindowEnd: delivery?.timeWindowEnd || '12:00',
    status: delivery?.status || 'pending' as DeliveryStatus,
    driverName: delivery?.driverName || '',
    notes: delivery?.notes || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = {
        ...formData,
        updatedAt: new Date().toISOString(),
      };

      if (delivery) {
        await updateDoc(doc(db, 'deliveries', delivery.id), data);
      } else {
        await addDoc(collection(db, 'deliveries'), {
          ...data,
          redeliveryCount: 0,
          createdAt: new Date().toISOString(),
        });
      }
      onClose();
    } catch (error) {
      console.error(error);
      alert('保存に失敗しました。');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <h3 className="text-xl font-bold text-slate-900">
            {delivery ? '配送先を編集' : '配送先を新規登録'}
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                <User size={16} className="text-blue-600" />
                配送先名
              </label>
              <input
                required
                type="text"
                value={formData.customerName}
                onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="例: 山田 太郎 様"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                <Package size={16} className="text-blue-600" />
                荷物ID
              </label>
              <input
                required
                type="text"
                value={formData.packageId}
                onChange={(e) => setFormData({ ...formData, packageId: e.target.value })}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="例: PKG-12345"
              />
            </div>

            <div className="md:col-span-2 space-y-2">
              <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                <MapPin size={16} className="text-blue-600" />
                住所
              </label>
              <input
                required
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="例: 東京都千代田区丸の内1-1-1"
              />
              <p className="text-[10px] text-slate-400">※緯度経度は住所から自動取得する機能を将来的に実装予定です。</p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                <Clock size={16} className="text-blue-600" />
                時間指定 (開始)
              </label>
              <input
                type="time"
                value={formData.timeWindowStart}
                onChange={(e) => setFormData({ ...formData, timeWindowStart: e.target.value })}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                <Clock size={16} className="text-blue-600" />
                時間指定 (終了)
              </label>
              <input
                type="time"
                value={formData.timeWindowEnd}
                onChange={(e) => setFormData({ ...formData, timeWindowEnd: e.target.value })}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">優先度</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value as Priority })}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="high">高</option>
                <option value="medium">中</option>
                <option value="low">低</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">ステータス</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as DeliveryStatus })}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="pending">未着手</option>
                <option value="delivering">配送中</option>
                <option value="completed">完了</option>
                <option value="absent">不在</option>
                <option value="redelivery">再配達</option>
              </select>
            </div>

            <div className="md:col-span-2 space-y-2">
              <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                <FileText size={16} className="text-blue-600" />
                備考
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none min-h-[100px]"
                placeholder="不在時の対応など"
              />
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-all"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 disabled:opacity-50"
            >
              {loading ? '保存中...' : '保存する'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DeliveryForm;
