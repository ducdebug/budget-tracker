'use client';

import { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, Filter, X, Search } from 'lucide-react';
import { getAllTransactions } from '@/lib/actions';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import type { Transaction, User } from '@/lib/types';

interface TransactionHistoryProps {
    users: User[];
    currentUserId: string;
    onBack: () => void;
}

export function TransactionHistory({ users, currentUserId, onBack }: TransactionHistoryProps) {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [showFilters, setShowFilters] = useState(false);

    const [filterUser, setFilterUser] = useState<string>('');       // '' = all
    const [filterType, setFilterType] = useState<string>('');       // '' = all
    const [filterDateFrom, setFilterDateFrom] = useState<string>('');
    const [filterDateTo, setFilterDateTo] = useState<string>('');
    const [searchNote, setSearchNote] = useState<string>('');

    const hasActiveFilters = filterUser || filterType || filterDateFrom || filterDateTo || searchNote;

    const fetchTransactions = useCallback(async () => {
        setLoading(true);
        const filters: {
            userId?: string;
            type?: 'income' | 'expense';
            dateFrom?: string;
            dateTo?: string;
        } = {};

        if (filterUser) filters.userId = filterUser;
        if (filterType === 'income' || filterType === 'expense') filters.type = filterType;
        if (filterDateFrom) filters.dateFrom = filterDateFrom;
        if (filterDateTo) filters.dateTo = filterDateTo;

        const res = await getAllTransactions(filters);
        if (res.success && res.data) {
            let data = res.data;
            if (searchNote.trim()) {
                const q = searchNote.toLowerCase();
                data = data.filter(tx =>
                    (tx.note && tx.note.toLowerCase().includes(q)) ||
                    (tx.category?.name && tx.category.name.toLowerCase().includes(q))
                );
            }
            setTransactions(data);
        }
        setLoading(false);
    }, [filterUser, filterType, filterDateFrom, filterDateTo, searchNote]);

    useEffect(() => {
        fetchTransactions();
    }, [fetchTransactions]);

    const clearFilters = () => {
        setFilterUser('');
        setFilterType('');
        setFilterDateFrom('');
        setFilterDateTo('');
        setSearchNote('');
    };

    const groupedByDate = transactions.reduce<Record<string, Transaction[]>>((groups, tx) => {
        const dateKey = format(new Date(tx.created_at), 'yyyy-MM-dd');
        if (!groups[dateKey]) groups[dateKey] = [];
        groups[dateKey].push(tx);
        return groups;
    }, {});

    const dateKeys = Object.keys(groupedByDate).sort((a, b) => b.localeCompare(a));

    const totalIncome = transactions.filter(tx => tx.type === 'income').reduce((sum, tx) => sum + tx.amount, 0);
    const totalExpense = transactions.filter(tx => tx.type === 'expense').reduce((sum, tx) => sum + tx.amount, 0);

    const formatDateLabel = (dateStr: string) => {
        const date = new Date(dateStr);
        const today = new Date();
        const yesterday = new Date();
        yesterday.setDate(today.getDate() - 1);

        if (format(date, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd')) {
            return 'Hôm nay';
        }
        if (format(date, 'yyyy-MM-dd') === format(yesterday, 'yyyy-MM-dd')) {
            return 'Hôm qua';
        }
        return format(date, 'EEEE, dd/MM/yyyy', { locale: vi });
    };

    return (
        <div className="min-h-screen bg-background">
            <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-md border-b border-border safe-area-top">
                <div className="flex items-center gap-3 px-4 py-3">
                    <button
                        onClick={onBack}
                        className="p-2 rounded-full hover:bg-muted transition-colors active:scale-95"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <h1 className="text-lg font-bold text-foreground flex-1">Lịch sử giao dịch</h1>
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`p-2 rounded-full transition-colors active:scale-95 ${hasActiveFilters
                            ? 'bg-primary/10 text-primary'
                            : 'hover:bg-muted text-muted-foreground'
                            }`}
                    >
                        <Filter size={20} />
                    </button>
                </div>

                {showFilters && (
                    <div className="px-4 pb-4 space-y-3 border-t border-border pt-3 animate-in slide-in-from-top-2 duration-200">
                        <div className="relative">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                            <input
                                type="text"
                                value={searchNote}
                                onChange={(e) => setSearchNote(e.target.value)}
                                placeholder="Tìm theo ghi chú, danh mục..."
                                className="w-full py-2.5 pl-9 pr-4 rounded-xl border border-border bg-muted/30 focus:border-primary focus:outline-none text-sm"
                            />
                        </div>

                        <div>
                            <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">
                                Của ai
                            </label>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setFilterUser('')}
                                    className={`flex-1 py-2 rounded-xl text-xs font-semibold border-2 transition-all ${filterUser === ''
                                        ? 'border-primary bg-primary/10 text-primary'
                                        : 'border-border text-muted-foreground'
                                        }`}
                                >
                                    Tất cả
                                </button>
                                {users.map(user => (
                                    <button
                                        key={user.id}
                                        onClick={() => setFilterUser(user.id)}
                                        className={`flex-1 py-2 rounded-xl text-xs font-semibold border-2 transition-all ${filterUser === user.id
                                            ? 'border-primary bg-primary/10 text-primary'
                                            : 'border-border text-muted-foreground'
                                            }`}
                                    >
                                        {user.avatar} {user.name}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div>
                            <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">
                                Loại
                            </label>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setFilterType('')}
                                    className={`flex-1 py-2 rounded-xl text-xs font-semibold border-2 transition-all ${filterType === ''
                                        ? 'border-primary bg-primary/10 text-primary'
                                        : 'border-border text-muted-foreground'
                                        }`}
                                >
                                    Tất cả
                                </button>
                                <button
                                    onClick={() => setFilterType('expense')}
                                    className={`flex-1 py-2 rounded-xl text-xs font-semibold border-2 transition-all ${filterType === 'expense'
                                        ? 'border-red-500 bg-red-50 text-red-600'
                                        : 'border-border text-muted-foreground'
                                        }`}
                                >
                                    💸 Chi tiêu
                                </button>
                                <button
                                    onClick={() => setFilterType('income')}
                                    className={`flex-1 py-2 rounded-xl text-xs font-semibold border-2 transition-all ${filterType === 'income'
                                        ? 'border-green-500 bg-green-50 text-green-600'
                                        : 'border-border text-muted-foreground'
                                        }`}
                                >
                                    💰 Thu nhập
                                </button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div>
                                <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">
                                    Từ ngày
                                </label>
                                <input
                                    type="date"
                                    value={filterDateFrom}
                                    onChange={(e) => setFilterDateFrom(e.target.value)}
                                    className="w-full py-2 px-3 rounded-xl border border-border bg-muted/30 focus:border-primary focus:outline-none text-sm"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">
                                    Đến ngày
                                </label>
                                <input
                                    type="date"
                                    value={filterDateTo}
                                    onChange={(e) => setFilterDateTo(e.target.value)}
                                    className="w-full py-2 px-3 rounded-xl border border-border bg-muted/30 focus:border-primary focus:outline-none text-sm"
                                />
                            </div>
                        </div>

                        {hasActiveFilters && (
                            <button
                                onClick={clearFilters}
                                className="flex items-center gap-1 text-xs text-red-500 font-medium hover:text-red-600 transition-colors"
                            >
                                <X size={14} />
                                Xóa bộ lọc
                            </button>
                        )}
                    </div>
                )}
            </div>

            {transactions.length > 0 && (
                <div className="px-4 py-3 flex items-center gap-3 border-b border-border bg-muted/30">
                    <div className="flex-1 text-center">
                        <p className="text-[10px] text-muted-foreground font-semibold uppercase">Tổng thu</p>
                        <p className="text-sm font-bold text-green-600">+{totalIncome.toLocaleString()}₫</p>
                    </div>
                    <div className="w-px h-8 bg-border"></div>
                    <div className="flex-1 text-center">
                        <p className="text-[10px] text-muted-foreground font-semibold uppercase">Tổng chi</p>
                        <p className="text-sm font-bold text-red-600">-{totalExpense.toLocaleString()}₫</p>
                    </div>
                    <div className="w-px h-8 bg-border"></div>
                    <div className="flex-1 text-center">
                        <p className="text-[10px] text-muted-foreground font-semibold uppercase">Số giao dịch</p>
                        <p className="text-sm font-bold text-foreground">{transactions.length}</p>
                    </div>
                </div>
            )}

            <div className="pb-8">
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="animate-spin w-6 h-6 border-3 border-primary border-t-transparent rounded-full" />
                    </div>
                ) : transactions.length === 0 ? (
                    <div className="text-center py-16">
                        <p className="text-4xl mb-3">🔍</p>
                        <p className="text-sm text-muted-foreground">
                            {hasActiveFilters ? 'Không tìm thấy giao dịch nào với bộ lọc này' : 'Chưa có giao dịch nào'}
                        </p>
                    </div>
                ) : (
                    dateKeys.map(dateKey => (
                        <div key={dateKey}>
                            <div className="sticky z-10 px-4 py-2 bg-muted/60 backdrop-blur-sm border-b border-border" style={{ top: 'calc(env(safe-area-inset-top, 0px) + 57px)' }}>
                                <p className="text-xs font-semibold text-muted-foreground capitalize">
                                    {formatDateLabel(dateKey)}
                                </p>
                            </div>

                            <div className="divide-y divide-border/50">
                                {groupedByDate[dateKey].map(tx => (
                                    <div key={tx.id} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg shadow-sm ${tx.type === 'expense' ? 'bg-red-50' : 'bg-green-50'
                                            }`}>
                                            {tx.category?.icon || '📦'}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-sm text-foreground truncate">
                                                {tx.note || tx.category?.name || 'Giao dịch'}
                                            </p>
                                            <p className="text-[11px] text-muted-foreground">
                                                {tx.user?.name && (
                                                    <span className="font-medium">{tx.user.name} • </span>
                                                )}
                                                {tx.category?.name && (
                                                    <span>{tx.category.name} • </span>
                                                )}
                                                {format(new Date(tx.created_at), 'HH:mm', { locale: vi })}
                                            </p>
                                        </div>

                                        <p className={`font-bold text-sm whitespace-nowrap ${tx.type === 'expense' ? 'text-red-600' : 'text-green-600'
                                            }`}>
                                            {tx.type === 'expense' ? '-' : '+'}
                                            {tx.amount.toLocaleString()}₫
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
