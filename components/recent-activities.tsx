import { TransactionItem } from './transaction-item';
import type { Transaction } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { ChevronRight } from 'lucide-react';

interface RecentActivitiesProps {
  transactions: Transaction[];
  onViewAll?: () => void;
}

export function RecentActivities({ transactions, onViewAll }: RecentActivitiesProps) {
  return (
    <div className="px-6 py-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-foreground">Hoạt động gần đây</h2>
        {onViewAll && (
          <button
            onClick={onViewAll}
            className="flex items-center gap-0.5 text-xs text-primary font-semibold hover:text-primary/80 transition-colors active:scale-95"
          >
            Xem tất cả
            <ChevronRight size={14} />
          </button>
        )}
      </div>

      {transactions.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-4xl mb-2">📝</p>
          <p className="text-sm text-muted-foreground">
            Chưa có giao dịch nào. Bấm + để thêm!
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {transactions.map((tx) => (
            <TransactionItem
              key={tx.id}
              icon={tx.category?.icon || '📦'}
              name={tx.note || tx.category?.name || 'Giao dịch'}
              time={formatDistanceToNow(new Date(tx.created_at), {
                addSuffix: true,
                locale: vi,
              })}
              amount={tx.amount}
              type={tx.type}
              userName={tx.user?.name}
            />
          ))}
        </div>
      )}
    </div>
  );
}
