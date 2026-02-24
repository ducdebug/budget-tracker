'use client';

import { useState } from 'react';
import { ArrowUp, ArrowDown, Wallet, History, ChevronDown, ChevronUp, X } from 'lucide-react';
import { getMonthlyHistory } from '@/lib/actions';
import type { MonthlyHistory } from '@/lib/types';

interface CoupleOverviewProps {
    totalBalance: number;
    monthlyIncome: number;
    monthlyExpense: number;
}

function formatVND(value: number): string {
    if (Math.abs(value) >= 1000000) {
        return `${(value / 1000000).toFixed(1)}M`;
    }
    if (Math.abs(value) >= 1000) {
        return `${(value / 1000).toFixed(0)}K`;
    }
    return value.toLocaleString();
}

export function CoupleOverview({
    totalBalance,
    monthlyIncome,
    monthlyExpense,
}: CoupleOverviewProps) {
    const monthlyNet = monthlyIncome - monthlyExpense;
    const [showHistory, setShowHistory] = useState(false);
    const [history, setHistory] = useState<MonthlyHistory[]>([]);
    const [loadingHistory, setLoadingHistory] = useState(false);
    const [expandedMonth, setExpandedMonth] = useState<string | null>(null);

    const handleOpenHistory = async () => {
        setShowHistory(true);
        if (history.length === 0) {
            setLoadingHistory(true);
            const res = await getMonthlyHistory();
            if (res.success && res.data) {
                setHistory(res.data.reverse()); // newest first
            }
            setLoadingHistory(false);
        }
    };

    return (
        <>
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
                        onClick={handleOpenHistory}
                        className="w-full mt-4 flex items-center justify-center gap-2 py-2.5 rounded-2xl border border-border hover:bg-muted/50 transition-all active:scale-[0.98] text-sm font-semibold text-muted-foreground"
                    >
                        <History size={16} />
                        Xem lịch sử theo tháng
                    </button>
                </div>
            </div>

            {showHistory && (
                <>
                    <div
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
                        onClick={() => setShowHistory(false)}
                    />
                    <div className="fixed inset-x-0 bottom-0 z-[60] max-w-md mx-auto animate-in slide-in-from-bottom duration-300">
                        <div className="bg-background rounded-t-3xl shadow-2xl border-t border-border max-h-[80vh] flex flex-col">
                            <div className="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0">
                                <div className="flex items-center gap-2">
                                    <History size={20} className="text-primary" />
                                    <h2 className="text-lg font-bold text-foreground">Lịch sử tháng</h2>
                                </div>
                                <button
                                    onClick={() => setShowHistory(false)}
                                    className="p-2 rounded-full hover:bg-muted transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="overflow-y-auto px-6 py-4 pb-20 space-y-3 flex-1">
                                {loadingHistory ? (
                                    <div className="flex items-center justify-center py-8">
                                        <div className="animate-spin w-6 h-6 border-3 border-primary border-t-transparent rounded-full" />
                                    </div>
                                ) : history.length === 0 ? (
                                    <p className="text-center text-sm text-muted-foreground py-8">
                                        Chưa có dữ liệu giao dịch
                                    </p>
                                ) : (
                                    history.map((m) => (
                                        <div key={m.month} className="rounded-2xl border border-border bg-card overflow-hidden">
                                            <button
                                                onClick={() => setExpandedMonth(expandedMonth === m.month ? null : m.month)}
                                                className="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition-colors"
                                            >
                                                <div className="text-left">
                                                    <p className="text-sm font-bold text-foreground">{m.label}</p>
                                                    <p className="text-xs text-muted-foreground mt-0.5">
                                                        Thu: +{formatVND(m.totalIncome)}₫ • Chi: -{formatVND(m.totalExpense)}₫
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className={`text-sm font-bold ${m.netChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                        {m.netChange >= 0 ? '+' : ''}{formatVND(m.netChange)}₫
                                                    </span>
                                                    {expandedMonth === m.month ? (
                                                        <ChevronUp size={16} className="text-muted-foreground" />
                                                    ) : (
                                                        <ChevronDown size={16} className="text-muted-foreground" />
                                                    )}
                                                </div>
                                            </button>

                                            {expandedMonth === m.month && (
                                                <div className="border-t border-border px-4 py-3 space-y-2 bg-muted/20">
                                                    {m.perUser.map((u) => (
                                                        <div key={u.userId} className="flex items-center justify-between">
                                                            <p className="text-xs font-semibold text-foreground">{u.userName}</p>
                                                            <div className="text-right">
                                                                <p className="text-xs text-muted-foreground">
                                                                    <span className="text-green-600">+{formatVND(u.income)}</span>
                                                                    {' / '}
                                                                    <span className="text-red-600">-{formatVND(u.expense)}</span>
                                                                </p>
                                                                <p className={`text-xs font-bold ${u.net >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                                    {u.net >= 0 ? '+' : ''}{formatVND(u.net)}₫
                                                                </p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </>
            )}
        </>
    );
}
