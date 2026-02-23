'use client';

import { useState, useEffect, useCallback } from 'react';
import { Pencil, Check, X, Wallet, Loader2, Lock } from 'lucide-react';
import { updateUser } from '@/lib/actions';
import { getUserProfile, getAppSettings } from '@/lib/auth-actions';
import { ProfileSection } from '@/components/profile-section';
import { AdminSettings } from '@/components/admin-settings';
import type { User } from '@/lib/types';

interface SettingsPanelProps {
    users: User[];
    onUpdate: () => void;
}

export function SettingsPanel({ users, onUpdate }: SettingsPanelProps) {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [loadingProfile, setLoadingProfile] = useState(true);
    const [editingBalance, setEditingBalance] = useState(false);
    const [editBalance, setEditBalance] = useState('');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');
    const [allowBalanceEdit, setAllowBalanceEdit] = useState(true);

    const fetchProfile = useCallback(async () => {
        const [result, settingsResult] = await Promise.all([
            getUserProfile(),
            getAppSettings(),
        ]);
        if (result.success && result.data) {
            setCurrentUser(result.data);
        }
        if (settingsResult.success && settingsResult.data) {
            setAllowBalanceEdit(settingsResult.data.allow_balance_edit);
        }
        setLoadingProfile(false);
    }, []);

    useEffect(() => {
        fetchProfile();
    }, [fetchProfile]);

    const handleProfileUpdate = () => {
        fetchProfile();
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
            fetchProfile();
            onUpdate();
            setTimeout(() => setSuccessMsg(''), 3000);
        } else {
            setError(result.error || 'Lỗi khi cập nhật');
        }
    };

    const otherUser = users.find(u => u.id !== currentUser?.id);

    return (
        <div className="px-6 py-4">
            <h2 className="text-lg font-bold text-foreground mb-4">⚙️ Cài đặt</h2>

            {loadingProfile ? (
                <div className="flex items-center justify-center py-8">
                    <Loader2 size={24} className="animate-spin text-primary" />
                </div>
            ) : currentUser ? (
                <div className="mb-6">
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                        👤 Tài khoản của tôi
                    </h3>
                    <ProfileSection currentUser={currentUser} onUpdate={handleProfileUpdate} showSignOut={false} />

                    <div className="mt-3 bg-card rounded-2xl p-4 border border-border shadow-sm">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Wallet size={16} className="text-primary" />
                                <span className="text-sm font-medium text-foreground">Số dư của tôi</span>
                            </div>
                            {editingBalance ? (
                                <div className="flex items-center gap-2">
                                    <input
                                        type="number"
                                        value={editBalance}
                                        onChange={(e) => setEditBalance(e.target.value)}
                                        className="w-28 py-1.5 px-2 rounded-xl border border-border bg-muted/30 focus:border-primary focus:outline-none text-sm font-bold text-right"
                                        min="0"
                                    />
                                    <button
                                        onClick={handleSaveBalance}
                                        disabled={saving}
                                        className="p-1.5 rounded-full bg-green-500 text-white hover:bg-green-600 transition-colors disabled:opacity-50"
                                    >
                                        <Check size={14} />
                                    </button>
                                    <button
                                        onClick={() => setEditingBalance(false)}
                                        className="p-1.5 rounded-full bg-gray-200 text-gray-600 hover:bg-gray-300 transition-colors"
                                    >
                                        <X size={14} />
                                    </button>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-bold text-foreground">
                                        {currentUser.total_balance.toLocaleString()} ₫
                                    </span>
                                    {allowBalanceEdit ? (
                                        <button
                                            onClick={startEditBalance}
                                            className="p-1.5 rounded-full hover:bg-muted transition-colors"
                                        >
                                            <Pencil size={14} className="text-muted-foreground" />
                                        </button>
                                    ) : (
                                        <Lock size={14} className="text-muted-foreground/50" />
                                    )}
                                </div>
                            )}
                        </div>
                        {!allowBalanceEdit && (
                            <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                                <Lock size={10} /> Chỉnh sửa số dư đang bị tắt
                            </p>
                        )}
                        {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
                    </div>
                </div>
            ) : null}

            {successMsg && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-2xl">
                    <p className="text-sm text-green-700 font-medium text-center">{successMsg}</p>
                </div>
            )}

            {otherUser && (
                <div className="mb-6">
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                        👥 Thành viên khác
                    </h3>
                    <div className="bg-card rounded-2xl p-4 border border-border shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                                {otherUser.avatar_url ? (
                                    <img src={otherUser.avatar_url} alt="" className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-xl">{otherUser.avatar}</span>
                                )}
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-semibold text-foreground">
                                    {otherUser.name}
                                    {otherUser.is_admin && (
                                        <span className="ml-1.5 text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full">Admin</span>
                                    )}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    Số dư: {otherUser.total_balance.toLocaleString()} ₫
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {currentUser?.is_admin && (
                <div className="mb-6">
                    <AdminSettings onUpdate={onUpdate} />
                </div>
            )}
        </div>
    );
}
