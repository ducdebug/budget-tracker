'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { addTransaction } from '@/lib/actions';
import type { Category } from '@/lib/types';

interface AddTransactionDrawerProps {
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
    categories: Category[];
    currentUserId: string;
}

export function AddTransactionDrawer({
    open,
    onClose,
    onSuccess,
    categories,
    currentUserId,
}: AddTransactionDrawerProps) {
    const [type, setType] = useState<'expense' | 'income'>('expense');
    const [categoryId, setCategoryId] = useState('');
    const [amount, setAmount] = useState('');
    const [note, setNote] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const filteredCategories = categories.filter((cat) => cat.type === type);

    useEffect(() => {
        setCategoryId('');
    }, [type]);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!currentUserId || !categoryId || !amount) {
            setError('Vui lòng điền đầy đủ thông tin');
            return;
        }

        setLoading(true);
        setError('');

        const result = await addTransaction({
            user_id: currentUserId,
            category_id: categoryId,
            amount: parseInt(amount),
            type,
            note,
        });

        setLoading(false);

        if (result.success) {
            setAmount('');
            setNote('');
            setCategoryId('');
            onSuccess();
            onClose();
        } else {
            setError(result.error || 'Lỗi khi thêm giao dịch');
        }
    }

    if (!open) return null;

    return (
        <>
            <div
                className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity"
                onClick={onClose}
            />

            <div className="fixed bottom-0 left-0 right-0 z-50 max-w-md mx-auto animate-in slide-in-from-bottom duration-300">
                <div className="bg-background rounded-t-3xl shadow-2xl border-t border-border">
                    <div className="flex justify-center py-3">
                        <div className="w-10 h-1 bg-muted-foreground/30 rounded-full" />
                    </div>

                    <div className="flex items-center justify-between px-6 pb-4">
                        <h2 className="text-xl font-bold text-foreground">
                            Thêm giao dịch
                        </h2>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-full hover:bg-muted transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="px-6 pb-8 space-y-4">
                        <div className="flex gap-2 bg-muted rounded-2xl p-1">
                            <button
                                type="button"
                                onClick={() => setType('expense')}
                                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${type === 'expense'
                                    ? 'bg-red-500 text-white shadow-md'
                                    : 'text-muted-foreground hover:text-foreground'
                                    }`}
                            >
                                💸 Chi tiêu
                            </button>
                            <button
                                type="button"
                                onClick={() => setType('income')}
                                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${type === 'income'
                                    ? 'bg-green-500 text-white shadow-md'
                                    : 'text-muted-foreground hover:text-foreground'
                                    }`}
                            >
                                💰 Thu nhập
                            </button>
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
                                className="w-full text-3xl font-bold text-center py-4 px-4 rounded-2xl border-2 border-border bg-muted/30 focus:border-primary focus:outline-none transition-colors"
                                min="1"
                                required
                            />
                        </div>

                        <div>
                            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                                Danh mục
                            </label>
                            <div className="grid grid-cols-4 gap-2">
                                {filteredCategories.map((cat) => (
                                    <button
                                        key={cat.id}
                                        type="button"
                                        onClick={() => setCategoryId(cat.id)}
                                        className={`flex flex-col items-center gap-1 py-3 px-2 rounded-2xl text-xs border-2 transition-all ${categoryId === cat.id
                                            ? 'border-primary bg-primary/10 text-primary font-semibold'
                                            : 'border-border text-muted-foreground hover:border-primary/30'
                                            }`}
                                    >
                                        <span className="text-lg">{cat.icon}</span>
                                        <span className="truncate w-full text-center">
                                            {cat.name}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                                Ghi chú (không bắt buộc)
                            </label>
                            <input
                                type="text"
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                                placeholder="Ghi chú cho giao dịch này..."
                                className="w-full py-3 px-4 rounded-2xl border-2 border-border bg-muted/30 focus:border-primary focus:outline-none transition-colors text-sm"
                            />
                        </div>

                        {error && (
                            <p className="text-red-500 text-sm text-center font-medium">
                                {error}
                            </p>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 rounded-2xl bg-primary text-primary-foreground font-bold text-base shadow-lg hover:opacity-90 transition-all disabled:opacity-50 active:scale-[0.98]"
                        >
                            {loading ? '⏳ Đang lưu...' : `✅ Thêm ${type === 'expense' ? 'chi tiêu' : 'thu nhập'}`}
                        </button>
                    </form>
                </div>
            </div>
        </>
    );
}
