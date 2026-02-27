'use client';

import { useState, useEffect, useCallback } from 'react';
import { Tag, ChevronDown, ChevronUp, Check } from 'lucide-react';
import { getUncategorizedTransactions, updateTransactionCategory } from '@/lib/actions';
import type { Transaction, Category } from '@/lib/types';

interface UncategorizedBannerProps {
    categories: Category[];
    onUpdate: () => void;
}

export function UncategorizedBanner({ categories, onUpdate }: UncategorizedBannerProps) {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [expanded, setExpanded] = useState(false);
    const [selectingId, setSelectingId] = useState<string | null>(null);
    const [saving, setSaving] = useState<string | null>(null);

    const expenseCategories = categories.filter(c => c.type === 'expense' && c.name !== 'Chưa phân loại');

    const fetchUncategorized = useCallback(async () => {
        const res = await getUncategorizedTransactions();
        if (res.success && res.data) setTransactions(res.data);
    }, []);

    useEffect(() => {
        fetchUncategorized();
    }, [fetchUncategorized]);

    const handleCategorize = async (txId: string, categoryId: string) => {
        setSaving(txId);
        const result = await updateTransactionCategory(txId, categoryId);
        setSaving(null);

        if (result.success) {
            setTransactions(prev => prev.filter(t => t.id !== txId));
            setSelectingId(null);
            onUpdate();
        }
    };

    const formatTime = (dateStr: string) => {
        const d = new Date(dateStr);
        const now = new Date();
        const diffMs = now.getTime() - d.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);

        if (diffMins < 1) return 'Vừa xong';
        if (diffMins < 60) return `${diffMins} phút trước`;
        if (diffHours < 24) return `${diffHours} giờ trước`;
        return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
    };

    if (transactions.length === 0) return null;

    return (
        <div className="mx-6 mb-4">
            <button
                onClick={() => setExpanded(!expanded)}
                className="w-full flex items-center justify-between p-3 bg-amber-50 border border-amber-200 rounded-2xl hover:bg-amber-100 transition-colors active:scale-[0.99]"
            >
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-amber-100 rounded-xl flex items-center justify-center">
                        <Tag size={16} className="text-amber-600" />
                    </div>
                    <div className="text-left">
                        <p className="text-xs font-bold text-amber-800">
                            {transactions.length} giao dịch chưa phân loại
                        </p>
                        <p className="text-[10px] text-amber-600">
                            Bấm để phân loại
                        </p>
                    </div>
                </div>
                {expanded ? (
                    <ChevronUp size={16} className="text-amber-600" />
                ) : (
                    <ChevronDown size={16} className="text-amber-600" />
                )}
            </button>

            {expanded && (
                <div className="mt-2 space-y-2 animate-in slide-in-from-top-2 duration-200">
                    {transactions.map(tx => (
                        <div
                            key={tx.id}
                            className="bg-card rounded-2xl border border-border p-3 shadow-sm"
                        >
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <span className="text-lg">❓</span>
                                    <div>
                                        <p className="text-xs font-semibold text-foreground">
                                            -{tx.amount.toLocaleString('vi-VN')}₫
                                        </p>
                                        <p className="text-[10px] text-muted-foreground">
                                            {tx.note || 'Không có ghi chú'} · {formatTime(tx.created_at)}
                                            {tx.user && ` · ${tx.user.name}`}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setSelectingId(selectingId === tx.id ? null : tx.id)}
                                    className="text-[10px] font-semibold text-primary bg-primary/10 px-2.5 py-1 rounded-full hover:bg-primary/20 transition-colors"
                                >
                                    Phân loại
                                </button>
                            </div>

                            {selectingId === tx.id && (
                                <div className="pt-2 border-t border-border/50">
                                    <p className="text-[10px] text-muted-foreground mb-1.5">Chọn danh mục:</p>
                                    <div className="grid grid-cols-3 gap-1.5">
                                        {expenseCategories.map(cat => (
                                            <button
                                                key={cat.id}
                                                onClick={() => handleCategorize(tx.id, cat.id)}
                                                disabled={saving === tx.id}
                                                className="flex items-center gap-1.5 py-2 px-2 rounded-xl border border-border text-left hover:border-primary/40 hover:bg-primary/5 transition-all active:scale-95 disabled:opacity-50"
                                            >
                                                {saving === tx.id ? (
                                                    <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                                                ) : (
                                                    <span className="text-base">{cat.icon}</span>
                                                )}
                                                <span className="text-[10px] font-medium text-foreground truncate">
                                                    {cat.name}
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
