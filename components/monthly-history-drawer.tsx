'use client';

import { useState, useEffect } from 'react';
import { History, ChevronDown, ChevronUp, X, Wallet, TrendingUp, TrendingDown } from 'lucide-react';
import { getMonthlyHistory, getMonthlyBalanceSummary } from '@/lib/actions';
import type { MonthlyHistory, MonthlyBalanceSummary } from '@/lib/types';

interface MonthlyHistoryDrawerProps {
    open: boolean;
    onClose: () => void;
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

const USER_COLORS = ['#6366f1', '#ec4899'];

export function MonthlyHistoryDrawer({ open, onClose }: MonthlyHistoryDrawerProps) {
    const [history, setHistory] = useState<MonthlyHistory[]>([]);
    const [balanceSummary, setBalanceSummary] = useState<MonthlyBalanceSummary[]>([]);
    const [loadingHistory, setLoadingHistory] = useState(false);
    const [expandedMonth, setExpandedMonth] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'transactions' | 'balance'>('balance');

    useEffect(() => {
        if (open && history.length === 0) {
            setLoadingHistory(true);
            Promise.all([
                getMonthlyHistory(),
                getMonthlyBalanceSummary(),
            ]).then(([histRes, balRes]) => {
                if (histRes.success && histRes.data) {
                    setHistory(histRes.data.slice().reverse()); // newest first
                }
                if (balRes.success && balRes.data) {
                    setBalanceSummary(balRes.data.slice().reverse()); // newest first
                }
                setLoadingHistory(false);
            });
        }
    }, [open, history.length]);

    if (!open) return null;

    return (
        <>
            <div
                className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
                onClick={onClose}
            />
            <div className="fixed inset-x-0 bottom-0 z-[60] max-w-md mx-auto animate-in slide-in-from-bottom duration-300">
                <div className="bg-background rounded-t-3xl shadow-2xl border-t border-border max-h-[85vh] flex flex-col">
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0">
                        <div className="flex items-center gap-2">
                            <History size={20} className="text-primary" />
                            <h2 className="text-lg font-bold text-foreground">Lịch sử tháng</h2>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-full hover:bg-muted transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Tabs */}
                    <div className="flex px-6 pt-3 gap-2 flex-shrink-0">
                        <button
                            onClick={() => setActiveTab('balance')}
                            className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all ${activeTab === 'balance'
                                ? 'bg-primary text-primary-foreground shadow'
                                : 'bg-muted text-muted-foreground hover:bg-muted/80'
                                }`}
                        >
                            💰 Tổng kết số dư
                        </button>
                        <button
                            onClick={() => setActiveTab('transactions')}
                            className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all ${activeTab === 'transactions'
                                ? 'bg-primary text-primary-foreground shadow'
                                : 'bg-muted text-muted-foreground hover:bg-muted/80'
                                }`}
                        >
                            📊 Thu/Chi
                        </button>
                    </div>

                    {/* Content */}
                    <div className="overflow-y-auto px-6 py-4 pb-20 space-y-3 flex-1">
                        {loadingHistory ? (
                            <div className="flex items-center justify-center py-8">
                                <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
                            </div>
                        ) : activeTab === 'balance' ? (
                            /* --- Bảng tổng kết số dư --- */
                            balanceSummary.length === 0 ? (
                                <p className="text-center text-sm text-muted-foreground py-8">
                                    Chưa có dữ liệu giao dịch
                                </p>
                            ) : (
                                <>
                                    {/* Legend */}
                                    {balanceSummary[0]?.perUser && (
                                        <div className="flex items-center gap-3 justify-center pb-1">
                                            {balanceSummary[0].perUser.map((u, idx) => (
                                                <div key={u.userId} className="flex items-center gap-1.5">
                                                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: USER_COLORS[idx % USER_COLORS.length] }} />
                                                    <span className="text-xs text-muted-foreground font-medium">{u.userName}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {balanceSummary.map((m) => (
                                        <div key={m.month} className="rounded-2xl border border-border bg-card overflow-hidden">
                                            {/* Header row */}
                                            <button
                                                onClick={() => setExpandedMonth(expandedMonth === m.month ? null : m.month)}
                                                className="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition-colors"
                                            >
                                                <div className="text-left">
                                                    <p className="text-sm font-bold text-foreground">{m.label}</p>
                                                    <p className="text-xs text-muted-foreground mt-0.5">
                                                        Chi: {formatVND(m.totalExpense)}₫
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <div className="text-right">
                                                        <p className="text-xs text-muted-foreground">Tổng số dư</p>
                                                        <p className="text-sm font-bold text-foreground">
                                                            {formatVND(m.combinedBalance)}₫
                                                        </p>
                                                    </div>
                                                    {expandedMonth === m.month ? (
                                                        <ChevronUp size={16} className="text-muted-foreground" />
                                                    ) : (
                                                        <ChevronDown size={16} className="text-muted-foreground" />
                                                    )}
                                                </div>
                                            </button>

                                            {/* Expanded detail */}
                                            {expandedMonth === m.month && (
                                                <div className="border-t border-border bg-muted/20">
                                                    {/* Per user table */}
                                                    <div className="px-4 pt-3 pb-2">
                                                        <div className="grid grid-cols-4 gap-1 text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mb-1.5 px-1">
                                                            <span>Người</span>
                                                            <span className="text-center">Thu</span>
                                                            <span className="text-center">Chi</span>
                                                            <span className="text-right">Số dư cuối</span>
                                                        </div>
                                                        <div className="space-y-2">
                                                            {m.perUser.map((u, idx) => (
                                                                <div key={u.userId} className="grid grid-cols-4 gap-1 items-center py-2 px-2 rounded-xl bg-card">
                                                                    <div className="flex items-center gap-1.5 min-w-0">
                                                                        <div
                                                                            className="w-2 h-2 rounded-full flex-shrink-0"
                                                                            style={{ backgroundColor: USER_COLORS[idx % USER_COLORS.length] }}
                                                                        />
                                                                        <span className="text-xs font-semibold text-foreground truncate">{u.userName}</span>
                                                                    </div>
                                                                    <div className="text-center">
                                                                        <span className="text-[11px] font-medium text-green-600">
                                                                            +{formatVND(u.totalIncome)}
                                                                        </span>
                                                                    </div>
                                                                    <div className="text-center">
                                                                        <span className="text-[11px] font-medium text-red-500">
                                                                            -{formatVND(u.totalExpense)}
                                                                        </span>
                                                                    </div>
                                                                    <div className="text-right">
                                                                        <span className={`text-[11px] font-bold ${u.endBalance >= 0 ? 'text-foreground' : 'text-red-500'}`}>
                                                                            {formatVND(u.endBalance)}₫
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    {/* Summary row */}
                                                    <div className="mx-4 mb-3 px-3 py-2 rounded-xl bg-primary/8 border border-primary/20 flex items-center justify-between">
                                                        <div className="flex items-center gap-1.5">
                                                            <Wallet size={13} className="text-primary" />
                                                            <span className="text-xs font-semibold text-primary">Tổng cộng</span>
                                                        </div>
                                                        <div className="flex items-center gap-3">
                                                            <div className="flex items-center gap-1">
                                                                {m.perUser.reduce((s, u) => s + u.netChange, 0) >= 0
                                                                    ? <TrendingUp size={12} className="text-green-600" />
                                                                    : <TrendingDown size={12} className="text-red-500" />
                                                                }
                                                                <span className={`text-[11px] font-semibold ${m.perUser.reduce((s, u) => s + u.netChange, 0) >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                                                                    {m.perUser.reduce((s, u) => s + u.netChange, 0) >= 0 ? '+' : ''}
                                                                    {formatVND(m.perUser.reduce((s, u) => s + u.netChange, 0))}₫
                                                                </span>
                                                            </div>
                                                            <span className="text-sm font-bold text-foreground">
                                                                {formatVND(m.combinedBalance)}₫
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </>
                            )
                        ) : (
                            /* --- Tab Thu/Chi --- */
                            history.length === 0 ? (
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
                                                    <div key={u.userId} className="flex items-center justify-between py-1.5 px-2 rounded-xl bg-card">
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
                            )
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
