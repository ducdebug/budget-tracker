'use client';

import { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';
import { addDebt, resolveDebt } from '@/lib/actions';
import type { User, Debt } from '@/lib/types';

interface AddDebtDrawerProps {
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
    users: User[];
    currentUserId?: string;
}

export function AddDebtDrawer({
    open,
    onClose,
    onSuccess,
    users,
    currentUserId,
}: AddDebtDrawerProps) {
    const [userId, setUserId] = useState('');
    const [debtorName, setDebtorName] = useState('');
    const [amount, setAmount] = useState('');
    const [note, setNote] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (users.length > 0 && !userId) {
            if (currentUserId) {
                setUserId(currentUserId);
            } else {
                setUserId(users[0].id);
            }
        }
    }, [users, userId, currentUserId]);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!userId || !debtorName || !amount) {
            setError('Vui lòng điền đầy đủ thông tin');
            return;
        }

        setLoading(true);
        setError('');

        const result = await addDebt({
            user_id: userId,
            debtor_name: debtorName,
            amount: parseInt(amount),
            note,
        });

        setLoading(false);

        if (result.success) {
            setDebtorName('');
            setAmount('');
            setNote('');
            onSuccess();
            onClose();
        } else {
            setError(result.error || 'Lỗi khi thêm khoản nợ');
        }
    }

    if (!open) return null;

    return (
        <>
            <div
                className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
                onClick={onClose}
            />
            <div className="fixed bottom-0 left-0 right-0 z-50 max-w-md mx-auto animate-in slide-in-from-bottom duration-300">
                <div className="bg-background rounded-t-3xl shadow-2xl border-t border-border">
                    <div className="flex justify-center py-3">
                        <div className="w-10 h-1 bg-muted-foreground/30 rounded-full" />
                    </div>

                    <div className="flex items-center justify-between px-6 pb-4">
                        <h2 className="text-xl font-bold text-foreground">📒 Thêm khoản nợ</h2>
                        <button onClick={onClose} className="p-2 rounded-full hover:bg-muted">
                            <X size={20} />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="px-6 pb-8 space-y-4">
                        <div>
                            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                                Ai cho vay?
                            </label>
                            <div className="flex gap-2">
                                {users.map((user) => (
                                    <button
                                        key={user.id}
                                        type="button"
                                        onClick={() => setUserId(user.id)}
                                        className={`flex-1 py-3 rounded-2xl text-sm font-semibold border-2 transition-all ${userId === user.id
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
                            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                                Ai nợ?
                            </label>
                            <input
                                type="text"
                                value={debtorName}
                                onChange={(e) => setDebtorName(e.target.value)}
                                placeholder="Tên người nợ"
                                className="w-full py-3 px-4 rounded-2xl border-2 border-border bg-muted/30 focus:border-primary focus:outline-none transition-colors text-sm"
                                required
                            />
                        </div>

                        <div>
                            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                                Số tiền (₫)
                            </label>
                            <input
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                placeholder="0"
                                className="w-full text-2xl font-bold text-center py-3 px-4 rounded-2xl border-2 border-border bg-muted/30 focus:border-primary focus:outline-none transition-colors"
                                min="1"
                                required
                            />
                        </div>

                        <div>
                            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                                Ghi chú (không bắt buộc)
                            </label>
                            <input
                                type="text"
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                                placeholder="Khoản nợ này là gì?"
                                className="w-full py-3 px-4 rounded-2xl border-2 border-border bg-muted/30 focus:border-primary focus:outline-none transition-colors text-sm"
                            />
                        </div>

                        {error && (
                            <p className="text-red-500 text-sm text-center font-medium">{error}</p>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 rounded-2xl bg-primary text-primary-foreground font-bold text-base shadow-lg hover:opacity-90 disabled:opacity-50 active:scale-[0.98] transition-all"
                        >
                            {loading ? '⏳ Đang lưu...' : '📒 Thêm khoản nợ'}
                        </button>
                    </form>
                </div>
            </div>
        </>
    );
}

interface DebtItemProps {
    debt: Debt;
    onResolve: (id: string) => void;
    resolving: boolean;
    showResolveButton?: boolean;
}

export function DebtItem({ debt, onResolve, resolving, showResolveButton = true }: DebtItemProps) {
    return (
        <div
            className={`flex items-center gap-4 px-4 py-3 rounded-2xl border shadow-sm ${debt.status === 'resolved'
                ? 'bg-green-50 border-green-200'
                : 'bg-amber-50 border-amber-200'
                }`}
        >
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <p className="font-medium text-foreground text-sm truncate">
                        {debt.debtor_name}
                    </p>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${debt.status === 'resolved'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-amber-100 text-amber-700'
                        }`}>
                        {debt.status === 'resolved' ? '✓ Đã trả' : 'Chưa trả'}
                    </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                    {debt.user?.name || 'Không rõ'} cho vay • {debt.note || 'Không có ghi chú'}
                </p>
            </div>
            <div className="text-right flex items-center gap-2">
                <p className="font-bold text-sm text-foreground whitespace-nowrap">
                    {debt.amount.toLocaleString()} ₫
                </p>
                {debt.status === 'pending' && showResolveButton && (
                    <button
                        onClick={() => onResolve(debt.id)}
                        disabled={resolving}
                        className="w-8 h-8 flex items-center justify-center rounded-full border-2 border-green-400 text-green-600 hover:bg-green-100 transition-all active:scale-90 disabled:opacity-50"
                        title="Đánh dấu đã trả"
                    >
                        {resolving ? (
                            <div className="w-4 h-4 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
                        ) : (
                            <Check size={16} />
                        )}
                    </button>
                )}
            </div>
        </div>
    );
}
