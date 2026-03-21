'use client';

import { useState } from 'react';
import { Pencil, Check, X, Wallet, Loader2, Lock, Archive } from 'lucide-react';
import { updateUser } from '@/lib/actions';
import { ProfileSection } from '@/components/profile-section';
import { AdminSettings } from '@/components/admin-settings';
import { StashDrawer } from '@/components/stash-drawer';
import type { User, AppSettings } from '@/lib/types';

interface SettingsPanelProps {
    users: User[];
    currentUser: User | null;
    appSettings: AppSettings;
    onUpdate: () => void;
    onProfileRefresh: () => Promise<void>;
    onSettingsRefresh: () => Promise<void>;
}

export function SettingsPanel({ users, currentUser, appSettings, onUpdate, onProfileRefresh, onSettingsRefresh }: SettingsPanelProps) {
    const [editingBalance, setEditingBalance] = useState(false);
    const [editBalance, setEditBalance] = useState('');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');
    const [showStash, setShowStash] = useState(false);

    const allowBalanceEdit = appSettings.allow_balance_edit;

    const handleProfileUpdate = () => {
        onProfileRefresh();
        onUpdate();
    };

    const startEditBalance = () => {
        if (!currentUser) return;
        setEditingBalance(true);
        setEditBalance(currentUser.total_balance.toString());
        setError('');
    };

    const handleSaveBalance = async () => {
        if (!currentUser) return;
        const balance = parseInt(editBalance);
        if (isNaN(balance) || balance < 0) {
            setError('Số dư phải là số hợp lệ');
            return;
        }

        setSaving(true);
        setError('');

        const result = await updateUser({
            id: currentUser.id,
            name: currentUser.name,
            total_balance: balance,
        });

        setSaving(false);

        if (result.success) {
            setEditingBalance(false);
            setSuccessMsg('✅ Đã cập nhật số dư!');
            onProfileRefresh();
            onUpdate();
            setTimeout(() => setSuccessMsg(''), 3000);
        } else {
            setError(result.error || 'Lỗi khi cập nhật');
        }
    };

    const handleSettingsChange = () => {
        onSettingsRefresh();
        onUpdate();
    };

    const otherUser = users.find(u => u.id !== currentUser?.id);

    return (
        <div className="px-5 py-4">
            <h2 className="text-xl font-bold text-foreground mb-5">Cài đặt</h2>

            {!currentUser ? (
                <div className="flex items-center justify-center py-8">
                    <Loader2 size={24} className="animate-spin text-primary" />
                </div>
            ) : (
                <>
                    <div className="mb-6">
                        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">
                            Tài khoản của tôi
                        </h3>
                        <ProfileSection currentUser={currentUser} onUpdate={handleProfileUpdate} showSignOut={false} />

                        <div className="mt-3 bg-card rounded-2xl p-4 border border-border shadow-sm">
                            <div className="flex flex-col gap-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Wallet size={16} className="text-muted-foreground" />
                                        <span className="text-sm font-semibold text-foreground">Số dư thực tế</span>
                                    </div>
                                    {editingBalance ? (
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="number"
                                                value={editBalance}
                                                onChange={(e) => setEditBalance(e.target.value)}
                                                className="w-28 py-1.5 px-2 rounded-xl border border-border bg-muted/40 focus:border-primary focus:outline-none text-sm font-bold text-right shadow-inner"
                                                min="0"
                                            />
                                            <button
                                                onClick={handleSaveBalance}
                                                disabled={saving}
                                                className="p-1.5 rounded-full bg-primary text-white hover:opacity-90 transition-opacity disabled:opacity-50"
                                            >
                                                <Check size={14} />
                                            </button>
                                            <button
                                                onClick={() => setEditingBalance(false)}
                                                className="p-1.5 rounded-full bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
                                            >
                                                <X size={14} />
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-bold text-foreground">
                                                {currentUser.total_balance.toLocaleString('vi-VN')} ₫
                                            </span>
                                            {allowBalanceEdit ? (
                                                <button
                                                    onClick={startEditBalance}
                                                    className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-secondary transition-colors"
                                                >
                                                    <Pencil size={12} className="text-muted-foreground" />
                                                </button>
                                            ) : (
                                                <Lock size={12} className="text-muted-foreground/40" />
                                            )}
                                        </div>
                                    )}
                                </div>
                                {(!allowBalanceEdit || error) && (
                                    <div className="flex justify-between items-center px-1">
                                        {!allowBalanceEdit && (
                                            <p className="text-[10px] text-muted-foreground flex items-center gap-1 font-medium">
                                                <Lock size={10} /> Đã khóa sửa số dư
                                            </p>
                                        )}
                                        {error && <p className="text-destructive text-xs font-medium">{error}</p>}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Stash Button */}
                        <div className="mt-3">
                            <button
                                onClick={() => setShowStash(true)}
                                className="w-full bg-card rounded-2xl p-4 border border-border shadow-sm flex items-center justify-between hover:bg-secondary/30 transition-colors active:scale-[0.98]"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
                                        <Archive size={16} className="text-indigo-600" />
                                    </div>
                                    <div className="text-left">
                                        <p className="text-sm font-bold text-foreground">{appSettings.stash_name || 'Két sắt'}</p>
                                        <p className="text-xs text-muted-foreground mt-0.5 font-medium">Lưu trữ tiền tiết kiệm riêng</p>
                                    </div>
                                </div>
                                <span className="text-indigo-600 bg-indigo-50 px-2 py-1 rounded-full text-[10px] font-bold">Mở</span>
                            </button>
                        </div>
                    </div>

                    {successMsg && (
                        <div className="mb-5 p-3 bg-green-500/10 border border-green-500/20 rounded-2xl animate-in fade-in slide-in-from-top-2">
                            <p className="text-sm text-green-600 font-bold text-center flex items-center justify-center gap-1.5">
                                <Check size={16} /> {successMsg}
                            </p>
                        </div>
                    )}

                    {otherUser && (
                        <div className="mb-6">
                            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">
                                Thành viên khác
                            </h3>
                            <div className="bg-card rounded-2xl p-4 border border-border flex items-center gap-3 shadow-sm">
                                <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center overflow-hidden flex-shrink-0">
                                    {otherUser.avatar_url ? (
                                        <img src={otherUser.avatar_url} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="text-sm font-bold text-muted-foreground">{otherUser.avatar}</span>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-foreground truncate flex items-center gap-1.5">
                                        {otherUser.name}
                                        {otherUser.is_admin && (
                                            <span className="text-[9px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wide">Admin</span>
                                        )}
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-0.5 font-medium">
                                        Số dư: {otherUser.total_balance.toLocaleString('vi-VN')} ₫
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {currentUser?.is_admin && (
                        <div className="mb-6">
                            <AdminSettings appSettings={appSettings} onUpdate={handleSettingsChange} />
                        </div>
                    )}
                </>
            )}

            {currentUser && (
                <StashDrawer
                    open={showStash}
                    onClose={() => setShowStash(false)}
                    users={users}
                    currentUserId={currentUser.id}
                    appSettings={appSettings}
                    onSuccess={handleProfileUpdate}
                />
            )}
        </div>
    );
}
