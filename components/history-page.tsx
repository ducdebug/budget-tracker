'use client';

import { useState, useEffect, useCallback } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { getAllTransactions } from '@/lib/actions';
import { getUserProfile } from '@/lib/auth-actions';
import type { Transaction } from '@/lib/types';

let cachedTxs: Transaction[] | null = null;
let cachedNames: Record<string, string> | null = null;

function fv(v: number) {
    if (Math.abs(v) >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
    if (Math.abs(v) >= 1_000) return `${(v / 1_000).toFixed(0)}K`;
    return Math.abs(v).toLocaleString('vi-VN');
}

function formatTime(iso: string) {
    const d = new Date(iso);
    return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
}

interface MonthGroup {
    key: string;
    label: string;
    txs: Transaction[];
    userStats: Record<string, { income: number; expense: number; net: number }>;
}

interface HistoryPageProps {
    currentUserId: string;
}

export function HistoryPage({ currentUserId }: HistoryPageProps) {
    const [txs, setTxs] = useState<Transaction[]>(cachedTxs || []);
    const [loading, setLoading] = useState(!cachedTxs);
    const [expandedMonth, setExpandedMonth] = useState<string | null>(null);
    const [userNames, setUserNames] = useState<Record<string, string>>(cachedNames || {});

    const load = useCallback(async () => {
        if (cachedTxs) {
            setTxs(cachedTxs);
            if (cachedNames) setUserNames(cachedNames);
            setLoading(false);
            return;
        }

        setLoading(true);
        const [txRes, profileRes] = await Promise.all([
            getAllTransactions(),
            getUserProfile(),
        ]);
        
        let newTxs = txRes.success && txRes.data ? txRes.data : [];
        let newNames: Record<string, string> = {};

        if (profileRes.success && profileRes.data) {
            newNames[profileRes.data.id] = profileRes.data.name;
        }

        cachedTxs = newTxs;
        cachedNames = newNames;

        setTxs(newTxs);
        setUserNames(prev => ({ ...prev, ...newNames }));
        setLoading(false);
    }, []);

    useEffect(() => { load(); }, [load]);

    const months: MonthGroup[] = (() => {
        const map = new Map<string, MonthGroup>();
        
        const now = new Date();
        const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

        for (const tx of txs) {
            const d = new Date(tx.created_at);
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            if (key === currentMonthKey) continue;
            
            const label = `Tháng ${d.getMonth() + 1}/${d.getFullYear()}`;
            if (!map.has(key)) map.set(key, { key, label, txs: [], userStats: {} });
            const g = map.get(key)!;
            g.txs.push(tx);

            const uid = tx.user_id;
            if (!g.userStats[uid]) g.userStats[uid] = { income: 0, expense: 0, net: 0 };
            if (tx.type === 'income') { g.userStats[uid].income += tx.amount; g.userStats[uid].net += tx.amount; }
            else { g.userStats[uid].expense += tx.amount; g.userStats[uid].net -= tx.amount; }
        }
        return Array.from(map.entries())
            .sort(([a], [b]) => b.localeCompare(a))
            .map(([, v]) => v);
    })();

    const otherUserId = txs.find(t => t.user_id !== currentUserId)?.user_id
        ?? txs.find(t => t.user?.id !== currentUserId)?.user?.id ?? '';

    const userName = (uid: string) =>
        txs.find(t => t.user_id === uid)?.user?.name ?? userNames[uid] ?? '?';

    if (loading) return (
        <div className="flex items-center justify-center h-screen">
            <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
        </div>
    );

    return (
        <div className="min-h-screen bg-background" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom,0px) + 90px)' }}>
            <div className="px-4 pt-[calc(env(safe-area-inset-top)+1rem)] pb-2">
                <h2 className="text-base font-bold text-foreground">Lịch sử giao dịch</h2>
            </div>

            {months.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 gap-2 text-muted-foreground">
                    <span className="text-4xl">📭</span>
                    <p className="text-sm">Chưa có giao dịch nào</p>
                </div>
            )}

            <div className="px-4 space-y-2">
                {months.map(m => {
                    const isOpen = expandedMonth === m.key;
                    const myStats = m.userStats[currentUserId] ?? { income: 0, expense: 0, net: 0 };
                    const otherStats = m.userStats[otherUserId] ?? { income: 0, expense: 0, net: 0 };

                    const sortedTxs = [...m.txs].sort((a, b) =>
                        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
                    );

                    return (
                        <div key={m.key} className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
                            {/* Month header row */}
                            <button
                                onClick={() => setExpandedMonth(isOpen ? null : m.key)}
                                className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors"
                            >
                                <div className="text-left">
                                    <p className="text-sm font-bold text-foreground">{m.label}</p>
                                </div>
                                {isOpen
                                    ? <ChevronUp size={16} className="text-muted-foreground flex-shrink-0" />
                                    : <ChevronDown size={16} className="text-muted-foreground flex-shrink-0" />
                                }
                            </button>

                            {/* Summary table: opponent left, me right */}
                            <div className="flex items-stretch border-t border-border/50">
                                <div className="flex-1 px-3 py-2 bg-pink-50/60 text-left">
                                    <p className="text-[10px] text-muted-foreground font-medium truncate">{userName(otherUserId)}</p>
                                    <p className={`text-sm font-bold ${otherStats.net >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                                        {otherStats.net >= 0 ? '+' : '-'}{fv(otherStats.net)}₫
                                    </p>
                                    <p className="text-[10px] text-muted-foreground">
                                        <span className="text-green-600">+{fv(otherStats.income)}</span>
                                        {' '}
                                        <span className="text-red-500">-{fv(otherStats.expense)}</span>
                                    </p>
                                </div>
                                <div className="w-px bg-border/50" />
                                <div className="flex-1 px-3 py-2 bg-blue-50/60 text-right">
                                    <p className="text-[10px] text-muted-foreground font-medium truncate">{userName(currentUserId)}</p>
                                    <p className={`text-sm font-bold ${myStats.net >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                                        {myStats.net >= 0 ? '+' : '-'}{fv(myStats.net)}₫
                                    </p>
                                    <p className="text-[10px] text-muted-foreground">
                                        <span className="text-green-600">+{fv(myStats.income)}</span>
                                        {' '}
                                        <span className="text-red-500">-{fv(myStats.expense)}</span>
                                    </p>
                                </div>
                            </div>

                            {/* Chat-style expanded view */}
                            {isOpen && (
                                <div className="border-t border-border/50 bg-muted/20 px-3 py-3 space-y-1 max-h-[60vh] overflow-y-auto">
                                    {sortedTxs.map(tx => {
                                        const isMe = tx.user_id === currentUserId;
                                        const isIncome = tx.type === 'income';
                                        return (
                                            <div key={tx.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                                <div className={`max-w-[72%] px-3 py-2 rounded-2xl shadow-sm ${isMe
                                                    ? 'bg-blue-500 text-white rounded-br-sm'
                                                    : 'bg-card border border-border text-foreground rounded-bl-sm'
                                                    }`}>
                                                    <p className={`text-sm font-bold leading-tight ${isMe ? 'text-white' : isIncome ? 'text-green-600' : 'text-red-500'}`}>
                                                        {isIncome ? '+' : '-'}{fv(tx.amount)}₫
                                                    </p>
                                                    {tx.note && (
                                                        <p className={`text-xs mt-0.5 ${isMe ? 'text-blue-100' : 'text-muted-foreground'}`}>
                                                            {tx.note}
                                                        </p>
                                                    )}
                                                    <p className={`text-[10px] mt-0.5 text-right ${isMe ? 'text-blue-200' : 'text-muted-foreground'}`}>
                                                        {formatTime(tx.created_at)}
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
