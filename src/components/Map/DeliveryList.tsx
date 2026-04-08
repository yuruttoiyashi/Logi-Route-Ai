import React from 'react';
import { MapPin, Clock, Package, ChevronRight, AlertCircle } from 'lucide-react';
import { Delivery } from '../../types.ts';
import { cn } from '../../lib/utils.ts';
import { motion } from 'motion/react';

interface DeliveryListProps {
  deliveries: Delivery[];
  selectedDelivery?: Delivery;
  onSelectDelivery: (delivery: Delivery) => void;
}

const DeliveryList: React.FC<DeliveryListProps> = ({ 
  deliveries, 
  selectedDelivery, 
  onSelectDelivery 
}) => {
  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <h3 className="font-bold text-slate-900 flex items-center gap-2">
          <Package size={18} className="text-blue-600" />
          配送リスト
        </h3>
        <span className="text-[10px] font-bold text-slate-400 bg-white px-2 py-1 rounded-full border border-slate-100">
          {deliveries.length} 件
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
        {deliveries.length > 0 ? (
          deliveries.map((delivery, index) => (
            <motion.div
              key={delivery.id}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => onSelectDelivery(delivery)}
              className={cn(
                "p-4 rounded-xl border transition-all cursor-pointer group relative",
                selectedDelivery?.id === delivery.id 
                  ? "bg-blue-50 border-blue-200 shadow-sm" 
                  : "bg-white border-slate-100 hover:border-blue-100"
              )}
            >
              {/* 配送順番号 */}
              <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-6 h-6 bg-slate-900 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white shadow-sm z-10">
                {index + 1}
              </div>

              <div className="pl-2 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-900 text-sm group-hover:text-blue-600 transition-colors truncate pr-2">
                    {delivery.customerName}
                  </h4>
                  {delivery.priority === 'high' && (
                    <AlertCircle size={14} className="text-rose-500 flex-shrink-0" />
                  )}
                </div>
                
                <p className="text-[11px] text-slate-500 flex items-start gap-1">
                  <MapPin size={12} className="mt-0.5 flex-shrink-0" />
                  <span className="line-clamp-1">{delivery.address}</span>
                </p>

                <div className="flex items-center justify-between text-[10px]">
                  <span className="flex items-center gap-1 text-slate-400">
                    <Clock size={10} />
                    {delivery.timeWindowStart} - {delivery.timeWindowEnd}
                  </span>
                  <ChevronRight size={14} className={cn(
                    "transition-transform",
                    selectedDelivery?.id === delivery.id ? "text-blue-600 translate-x-1" : "text-slate-300"
                  )} />
                </div>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="py-12 text-center">
            <p className="text-sm text-slate-400">配送データがありません。</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DeliveryList;
