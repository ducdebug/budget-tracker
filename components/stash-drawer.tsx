'use client';

import { useState } from 'react';
import { Lock, X, Plus, Minus, Loader2 } from 'lucide-react';
import { updateStashedAmount } from '@/lib/actions';
import type { User, AppSettings } from '@/lib/types';

interface StashDrawerProps {
    open: boolean;
    onClose: () => void;
    users: User[];
    currentUserId: string;
    appSettings: AppSettings;
    onSuccess: () => void;
}

export function StashDrawer({
    open,
    onClose,
    users,
    currentUserId,
    appSettings,
    onSuccess,
}: StashDrawerProps) {
    const [loading, setLoading] = useState(false);
    const [amountInput, setAmountInput] = useState('');
    const [error, setError] = useState('');

    if (!open) return null;

    const currentUser = users.find(u => u.id === currentUserId);
    const otherUser = users.find(u => u.id !== currentUserId);

    const currentUserStash = currentUser?.stashed_amount || 0;
    const otherUserStash = otherUser?.stashed_amount || 0;
    const totalStash = currentUserStash + otherUserStash;

    const stashName = appSettings.stash_name || 'Két sắt';

    const handleUpdate = async (type: 'add' | 'withdraw') => {
        const amount = Number(amountInput.replace(/\D/g, ''));
        if (!amount || amount <= 0) {
            setError('Vui lòng nhập số tiền hợp lệ');
            return;
        }

        if (type === 'withdraw' && amount > currentUserStash) {
            setError('Số tiền rút không được vượt quá số tiền trong két của bạn');
            return;
        }

        setLoading(true);
        setError('');

        const delta = type === 'add' ? amount : -amount;
        const result = await updateStashedAmount(delta);

        setLoading(false);

        if (result.success) {
            setAmountInput('');
            onSuccess();
        } else {
            setError(result.error || 'Có lỗi xảy ra');
        }
    };

    const currentBalanceForStash = currentUser?.total_balance || 0;
    const maxStashAble = currentBalanceForStash - currentUserStash;

    return (
        <>
            <div
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] animate-in fade-in"
                onClick={onClose}
            />
            <div className="fixed bottom-0 left-0 right-0 z-[101] bg-background rounded-t-[32px] shadow-2xl animate-in slide-in-from-bottom-full duration-300">
                <div className="flex flex-col h-[70vh] max-h-[600px]">
                    <div className="flex-shrink-0 flex items-center justify-between p-5 border-b border-border/50">
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            <Lock size={20} className="text-primary" /> {stashName}
                        </h2>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-muted rounded-full transition-colors active:scale-95 text-muted-foreground"
                        >
                            <X size={24} />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-5 space-y-6">
                        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl p-6 text-white shadow-lg relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-20">
                                <Lock size={64} />
                            </div>
                            <p className="text-sm font-medium text-white/80 uppercase tracking-widest mb-1">
                                Tổng lưu trữ
                            </p>
                            <h3 className="text-4xl font-extrabold mb-4">
                                {totalStash.toLocaleString('vi-VN')} ₫
                            </h3>

                            <div className="space-y-3">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-white/80">Của {currentUser?.name || 'Bạn'}:</span>
                                    <span className="font-bold">{currentUserStash.toLocaleString('vi-VN')} ₫</span>
                                </div>
                                {otherUser && (
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-white/80">Của {otherUser.name}:</span>
                                        <span className="font-bold">{otherUserStash.toLocaleString('vi-VN')} ₫</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="space-y-3">
                            <h4 className="font-semibold text-sm uppercase text-muted-foreground">Thao tác két sắt</h4>

                            {error && (
                                <div className="p-3 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100">
                                    {error}
                                </div>
                            )}

                            <div className="relative">
                                <input
                                    type="text"
                                    value={amountInput}
                                    onChange={(e) => {
                                        const val = e.target.value.replace(/\D/g, '');
                                        setAmountInput(val ? Number(val).toLocaleString('vi-VN') : '');
                                    }}
                                    placeholder="Nhập số tiền..."
                                    className="w-full text-2xl font-bold p-4 bg-muted/50 rounded-2xl border-none focus:ring-2 focus:ring-primary pl-[50px] outline-none"
                                />
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl text-muted-foreground font-bold">
                                    ₫
                                </span>
                                {amountInput && (
                                    <button
                                        onClick={() => setAmountInput('')}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground p-1 hover:bg-muted rounded-full"
                                    >
                                        <X size={16} />
                                    </button>
                                )}
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => handleUpdate('withdraw')}
                                    disabled={loading || !amountInput || Number(amountInput.replace(/\D/g, '')) > currentUserStash}
                                    className="flex-1 bg-amber-100 text-amber-700 hover:bg-amber-200 disabled:opacity-50 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-transform active:scale-95"
                                >
                                    <Minus size={20} /> Rút ra
                                </button>
                                <button
                                    onClick={() => handleUpdate('add')}
                                    disabled={loading || !amountInput}
                                    className="flex-1 bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-transform active:scale-95"
                                >
                                    {loading ? <Loader2 className="animate-spin" size={20} /> : <Plus size={20} />} Cất đi
                                </button>
                            </div>

                        </div>

                        <p className="text-xs text-center text-muted-foreground/70 italic px-4">
                            *Tiền cất đi sẽ không hiển thị ở màn hình chính, giúp bạn có cảm giác mình đã "hết tiền" để bớt tiêu xài.
                        </p>
                    </div>
                </div>
            </div>
        </>
    );
}
