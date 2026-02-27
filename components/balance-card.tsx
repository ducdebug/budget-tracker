'use client';

import { ArrowDown, ArrowUp } from 'lucide-react';
import { useState } from 'react';

interface BalanceCardProps {
  name: string;
  balance: number;
  income: number;
  expense: number;
  avatar: string;
  avatarInitial: string;
  avatarUrl?: string | null;
  bgColor: string;
}

function formatVND(value: number): string {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(0)}K`;
  }
  return value.toLocaleString('vi-VN');
}

export function BalanceCard({
  name,
  balance,
  income,
  expense,
  avatar,
  avatarInitial,
  avatarUrl,
  bgColor,
}: BalanceCardProps) {
  const [showFull, setShowFull] = useState(false);

  return (
    <div
      className={`flex-1 rounded-3xl p-5 flex flex-col items-center gap-3 border-2 border-dashed border-muted ${bgColor} shadow-sm transition-transform duration-200 active:scale-[0.97]`}
      onClick={() => setShowFull(!showFull)}
    >
      <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center shadow-md overflow-hidden">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div
            className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg ${avatar}`}
          >
            {avatarInitial}
          </div>
        )}
      </div>

      <div className="text-center">
        <p className="text-xs text-muted-foreground font-medium">Số dư của {name}</p>
        <p className="text-2xl font-bold text-foreground mt-0.5 animate-count">
          {showFull ? balance.toLocaleString('vi-VN') : formatVND(balance)}{' '}
          <span className="text-xs font-medium">₫</span>
        </p>
      </div>

      <div className="flex gap-4 w-full justify-center">
        <div className="flex flex-col items-center gap-1">
          <div className="w-7 h-7 rounded-full bg-green-100 flex items-center justify-center">
            <ArrowUp size={14} className="text-green-600" />
          </div>
          <p className="text-[10px] text-muted-foreground font-medium">
            +{showFull ? income.toLocaleString('vi-VN') : formatVND(income)}
          </p>
        </div>
        <div className="w-px bg-border"></div>
        <div className="flex flex-col items-center gap-1">
          <div className="w-7 h-7 rounded-full bg-red-100 flex items-center justify-center">
            <ArrowDown size={14} className="text-red-600" />
          </div>
          <p className="text-[10px] text-muted-foreground font-medium">
            -{showFull ? expense.toLocaleString('vi-VN') : formatVND(expense)}
          </p>
        </div>
      </div>
    </div>
  );
}
