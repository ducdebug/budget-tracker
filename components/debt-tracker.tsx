'use client';

import { useState } from 'react';
import { Trash2, Pencil, Check, X } from 'lucide-react';
import { addDebt, deleteDebt, updateDebt } from '@/lib/actions';
import type { User, Debt } from '@/lib/types';

interface AddDebtDrawerProps {
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
    users: User[];
    currentUserId?: string;
}

export function AddDebtDrawer({ open, onClose, onSuccess, users, currentUserId }: AddDebtDrawerProps) {
    const [userId, setUserId] = useState(currentUserId || users[0]?.id || '');
    const [debtorName, setDebtorName] = useState('');
    const [amount, setAmount] = useState('');
    const [note, setNote] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!userId || !debtorName || !amount) { setError('Vui lòng điền đầy đủ'); return; }
        setLoading(true);
        const result = await addDebt({ user_id: userId, debtor_name: debtorName, amount: parseInt(amount), note });
        setLoading(false);
        if (result.success) { setDebtorName(''); setAmount(''); setNote(''); onSuccess(); onClose(); }
        else setError(result.error || 'Lỗi');
    }

    if (!open) return null;
    return (
        <>
            <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40" onClick={onClose} />
            <div className="fixed bottom-0 left-0 right-0 z-50 max-w-md mx-auto animate-in slide-in-from-bottom duration-300">
                <div className="bg-card rounded-t-3xl shadow-2xl">
                    <div className="flex justify-center pt-3 pb-1">
                        <div className="w-9 h-1 bg-muted-foreground/25 rounded-full" />
                    </div>
                    <div className="flex items-center justify-between px-5 pb-3">
                        <h2 className="text-lg font-semibold">Thêm khoản nợ</h2>
                        <button onClick={onClose} className="p-1.5 rounded-full hover:bg-muted"><X size={18} /></button>
                    </div>
                    <form onSubmit={handleSubmit} className="px-5 pb-8 space-y-3">
                        <input type="text" value={debtorName} onChange={e => setDebtorName(e.target.value)} placeholder="Ai nợ?"
                            className="w-full py-3 px-4 rounded-xl border border-border bg-muted/40 focus:border-primary focus:outline-none text-sm" required />
                        <input type="text" inputMode="numeric" pattern="[0-9]*" value={amount} onChange={e => setAmount(e.target.value.replace(/[^0-9]/g, ''))} placeholder="Số tiền (₫)"
                            className="w-full h-14 text-2xl font-bold text-center px-4 rounded-xl border border-border bg-muted/40 focus:border-primary focus:outline-none" required />
                        <input type="text" value={note} onChange={e => setNote(e.target.value)} placeholder="Ghi chú (không bắt buộc)"
                            className="w-full py-3 px-4 rounded-xl border border-border bg-muted/40 focus:border-primary focus:outline-none text-sm" />
                        {error && <p className="text-destructive text-sm text-center">{error}</p>}
                        <button type="submit" disabled={loading}
                            className="w-full py-3.5 rounded-2xl bg-primary text-white font-semibold shadow hover:opacity-90 disabled:opacity-50 active:scale-[0.98] transition-all">
                            {loading ? 'Đang lưu...' : 'Thêm khoản nợ'}
                        </button>
                    </form>
                </div>
            </div>
        </>
    );
}

interface DebtItemProps {
    debt: Debt;
    isOwner: boolean;
    onDelete: (id: string) => void;
    onUpdate: () => void;
}

export function DebtItem({ debt, isOwner, onDelete, onUpdate }: DebtItemProps) {
    const [editing, setEditing] = useState(false);
    const [name, setName] = useState(debt.debtor_name);
    const [amount, setAmount] = useState(debt.amount.toString());
    const [note, setNote] = useState(debt.note || '');
    const [saving, setSaving] = useState(false);

    async function handleSave() {
        setSaving(true);
        await updateDebt(debt.id, { debtor_name: name, amount: parseInt(amount) || debt.amount, note });
        setSaving(false);
        setEditing(false);
        onUpdate();
    }

    if (editing) {
        return (
            <div className="bg-card rounded-2xl border border-border p-4 space-y-2 shadow-sm">
                <input value={name} onChange={e => setName(e.target.value)}
                    className="w-full py-2 px-3 rounded-xl border border-border bg-muted/40 focus:border-primary focus:outline-none text-sm font-medium" />
                <input type="number" value={amount} onChange={e => setAmount(e.target.value)}
                    className="w-full py-2 px-3 rounded-xl border border-border bg-muted/40 focus:border-primary focus:outline-none text-sm text-right font-bold" />
                <input value={note} onChange={e => setNote(e.target.value)} placeholder="Ghi chú"
                    className="w-full py-2 px-3 rounded-xl border border-border bg-muted/40 focus:border-primary focus:outline-none text-sm" />
                <div className="flex gap-2 pt-1">
                    <button onClick={handleSave} disabled={saving}
                        className="flex-1 py-2 rounded-xl bg-primary text-white text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-1">
                        <Check size={14} /> Lưu
                    </button>
                    <button onClick={() => setEditing(false)}
                        className="flex-1 py-2 rounded-xl bg-muted text-muted-foreground text-sm font-medium flex items-center justify-center gap-1">
                        <X size={14} /> Hủy
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-card rounded-2xl border border-border px-4 py-3 flex items-center gap-3 shadow-sm">
            <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-foreground truncate">{debt.debtor_name}</p>
                {debt.note && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                        {debt.note}
                    </p>
                )}
            </div>
            <p className="font-bold text-sm text-foreground whitespace-nowrap">
                {debt.amount.toLocaleString('vi-VN')}₫
            </p>
            {isOwner && (
                <div className="flex gap-1.5">
                    <button onClick={() => setEditing(true)}
                        className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-muted transition-colors">
                        <Pencil size={14} className="text-muted-foreground" />
                    </button>
                    <button onClick={() => onDelete(debt.id)}
                        className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-red-50 transition-colors">
                        <Trash2 size={14} className="text-destructive" />
                    </button>
                </div>
            )}
        </div>
    );
}
