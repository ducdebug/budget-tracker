'use client';

import { useState, useMemo } from 'react';
import { X, Check } from 'lucide-react';
import { addTransactionSimple } from '@/lib/actions';

interface AddTransactionDrawerProps {
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
    currentUserId: string;
}

export function AddTransactionDrawer({ open, onClose, onSuccess, currentUserId }: AddTransactionDrawerProps) {
    const [type, setType] = useState<'expense' | 'income'>('expense');
    const [amount, setAmount] = useState('');
    const [note, setNote] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showSuccess, setShowSuccess] = useState(false);

    const preview = useMemo(() => {
        const n = parseInt(amount);
        if (!n) return null;
        if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M ₫`;
        if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K ₫`;
        return `${n.toLocaleString('vi-VN')} ₫`;
    }, [amount]);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!currentUserId || !amount) return;
        setLoading(true);
        setError('');
        const result = await addTransactionSimple({ user_id: currentUserId, amount: parseInt(amount), type, note });
        setLoading(false);
        if (result.success) {
            setShowSuccess(true);
            setTimeout(() => {
                setShowSuccess(false);
                setAmount('');
                setNote('');
                onSuccess();
                onClose();
            }, 600);
        } else {
            setError(result.error || 'Lỗi khi thêm giao dịch');
        }
    }

    if (!open) return null;

    return (
        <>
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40" onClick={onClose} />
            <div className="fixed bottom-0 left-0 right-0 z-50 max-w-md mx-auto animate-in slide-in-from-bottom duration-300">
                <div className="bg-background rounded-t-3xl shadow-2xl border-t border-border">
                    <div className="flex justify-center py-3">
                        <div className="w-10 h-1 bg-muted-foreground/30 rounded-full" />
                    </div>
                    <div className="flex items-center justify-between px-6 pb-4">
                        <h2 className="text-xl font-bold">Thêm giao dịch</h2>
                        <button onClick={onClose} className="p-2 rounded-full hover:bg-muted transition-colors">
                            <X size={20} />
                        </button>
                    </div>
                    <form onSubmit={handleSubmit} className="px-6 pb-8 space-y-4">
                        <div className="flex gap-2 bg-muted rounded-2xl p-1">
                            <button
                                type="button"
                                onClick={() => setType('expense')}
                                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${type === 'expense' ? 'bg-red-500 text-white shadow-md' : 'text-muted-foreground'}`}
                            >
                                💸 Chi tiêu
                            </button>
                            <button
                                type="button"
                                onClick={() => setType('income')}
                                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${type === 'income' ? 'bg-green-500 text-white shadow-md' : 'text-muted-foreground'}`}
                            >
                                💰 Thu nhập
                            </button>
                        </div>

                        <div>
                            <input
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                value={amount}
                                onChange={e => setAmount(e.target.value.replace(/[^0-9]/g, ''))}
                                placeholder="0"
                                className="w-full h-[68px] text-3xl font-bold text-center px-4 rounded-2xl border-2 border-border bg-muted/30 focus:border-primary focus:outline-none transition-colors"
                                required
                                autoFocus
                            />
                            {preview && (
                                <p className="text-center text-sm font-semibold text-primary mt-1.5">
                                    {type === 'expense' ? '−' : '+'}{preview}
                                </p>
                            )}
                        </div>

                        <input
                            type="text"
                            value={note}
                            onChange={e => setNote(e.target.value)}
                            placeholder="Ghi chú (không bắt buộc)..."
                            className="w-full py-3 px-4 rounded-2xl border-2 border-border bg-muted/30 focus:border-primary focus:outline-none transition-colors text-sm"
                        />

                        {error && <p className="text-red-500 text-sm text-center font-medium">{error}</p>}

                        {showSuccess ? (
                            <div className="w-full py-4 rounded-2xl bg-green-500 text-white font-bold flex items-center justify-center gap-2 animate-success-pop">
                                <Check size={20} strokeWidth={3} /> Đã thêm thành công!
                            </div>
                        ) : (
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-4 rounded-2xl bg-primary text-primary-foreground font-bold text-base shadow-lg hover:opacity-90 disabled:opacity-50 active:scale-[0.98] transition-all"
                            >
                                {loading ? '⏳ Đang lưu...' : `✅ Thêm ${type === 'expense' ? 'chi tiêu' : 'thu nhập'}`}
                            </button>
                        )}
                    </form>
                </div>
            </div>
        </>
    );
}
