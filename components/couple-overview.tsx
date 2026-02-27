'use client';

import { ArrowUp, ArrowDown, Wallet, History } from 'lucide-react';

interface CoupleOverviewProps {
    totalBalance: number;
    monthlyIncome: number;
    monthlyExpense: number;
    onOpenHistory: () => void;
}

function formatVND(value: number): string {
    if (Math.abs(value) >= 1000000) {
        return `${(value / 1000000).toFixed(1)}M`;
    }
    if (Math.abs(value) >= 1000) {
        return `${(value / 1000).toFixed(0)}K`;
    }
    return value.toLocaleString('vi-VN');
}

export function CoupleOverview({
    totalBalance,
    monthlyIncome,
    monthlyExpense,
    onOpenHistory,
}: CoupleOverviewProps) {
    const monthlyNet = monthlyIncome - monthlyExpense;

    return (
        <div className="px-6 py-2">
            <div className="rounded-3xl border border-border bg-card p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                    <Wallet size={20} className="text-primary" />
                    <h3 className="font-bold text-foreground">Vốn chung</h3>
                </div>

                <div className="text-center mb-4">
                    <p className="text-3xl font-bold text-foreground">
                        {formatVND(totalBalance)}{' '}
                        <span className="text-sm font-medium">₫</span>
                    </p>
                </div>

                <div className="flex items-center justify-center gap-3">
                    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold ${monthlyNet >= 0
                        ? 'bg-green-50 text-green-600'
                        : 'bg-red-50 text-red-600'
                        }`}>
                        {monthlyNet >= 0 ? (
                            <ArrowUp size={16} />
                        ) : (
                            <ArrowDown size={16} />
                        )}
                        {monthlyNet >= 0 ? '+' : ''}{formatVND(monthlyNet)} ₫
                    </div>
                    <span className="text-xs text-muted-foreground">tháng này</span>
                </div>

                <button
                    onClick={onOpenHistory}
                    className="w-full mt-4 flex items-center justify-center gap-2 py-2.5 rounded-2xl border border-border hover:bg-muted/50 transition-all active:scale-[0.98] text-sm font-semibold text-muted-foreground"
                >
                    <History size={16} />
                    Xem lịch sử theo tháng
                </button>
            </div>
        </div>
    );
}
