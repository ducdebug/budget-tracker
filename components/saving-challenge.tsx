'use client';

import { Trophy } from 'lucide-react';

interface SavingChallengeProps {
  himSavingRate: number;
  herSavingRate: number;
  himName: string;
  herName: string;
}

export function SavingChallenge({
  himSavingRate,
  herSavingRate,
  himName,
  herName,
}: SavingChallengeProps) {
  const lead = Math.abs(himSavingRate - herSavingRate);
  const winner = himSavingRate > herSavingRate ? himName : herName;
  const isTied = himSavingRate === herSavingRate;

  return (
    <div className="px-6 py-4">
      <div className="rounded-3xl border-2 border-dashed border-primary/30 bg-gradient-to-r from-blue-50 to-pink-50 p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <Trophy size={24} className="text-primary" />
          <div className="flex-1">
            <h3 className="font-bold text-foreground">Cuộc đua tiết kiệm</h3>
            <p className="text-xs text-muted-foreground">
              So sánh tỷ lệ tiết kiệm hàng tháng
            </p>
          </div>
          {!isTied && (
            <div className="bg-primary/20 text-primary px-3 py-1 rounded-full text-xs font-bold">
              +{lead}% Dẫn đầu
            </div>
          )}
          {isTied && (
            <div className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-xs font-bold">
              Hòa! 🤝
            </div>
          )}
        </div>

        <div className="space-y-3">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-foreground">
                {himName}
              </span>
              <span className="text-xs font-medium text-foreground">
                {himSavingRate}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <div
                className="bg-blue-400 h-full rounded-full transition-all duration-700 ease-out"
                style={{ width: `${Math.min(himSavingRate, 100)}%` }}
              ></div>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-foreground">
                {herName}
              </span>
              <span className="text-xs font-medium text-foreground">
                {herSavingRate}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <div
                className="bg-pink-400 h-full rounded-full transition-all duration-700 ease-out"
                style={{ width: `${Math.min(herSavingRate, 100)}%` }}
              ></div>
            </div>
          </div>
        </div>

        <p className="text-center text-sm font-medium text-foreground mt-4">
          {isTied
            ? "🤝 Cả hai tiết kiệm như nhau!"
            : `💪 ${winner} tiết kiệm giỏi hơn tháng này!`}
        </p>
      </div>
    </div>
  );
}
