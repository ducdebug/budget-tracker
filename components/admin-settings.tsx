'use client';

import { useState } from 'react';
import { Shield, ToggleLeft, ToggleRight, Loader2, AlertTriangle, Wallet } from 'lucide-react';
import { toggleRegistration, toggleBalanceEdit } from '@/lib/auth-actions';
import type { AppSettings } from '@/lib/types';

interface AdminSettingsProps {
    appSettings: AppSettings;
    onUpdate?: () => void;
}

export function AdminSettings({ appSettings, onUpdate }: AdminSettingsProps) {
    const [savingReg, setSavingReg] = useState(false);
    const [savingBalance, setSavingBalance] = useState(false);
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    const registrationEnabled = appSettings.registration_enabled;
    const balanceEditEnabled = appSettings.allow_balance_edit;

    const handleToggleRegistration = async () => {
        setSavingReg(true);
        setError('');

        const newValue = !registrationEnabled;
        const result = await toggleRegistration(newValue);

        setSavingReg(false);

        if (result.success) {
            setSuccessMsg(
                newValue
                    ? '✅ Đã mở đăng ký cho người dùng mới'
                    : '🔒 Đã tắt đăng ký. Không ai có thể đăng ký mới.'
            );
            setTimeout(() => setSuccessMsg(''), 4000);
            onUpdate?.();
        } else {
            setError(result.error || 'Lỗi khi cập nhật cài đặt');
        }
    };

    const handleToggleBalanceEdit = async () => {
        setSavingBalance(true);
        setError('');

        const newValue = !balanceEditEnabled;
        const result = await toggleBalanceEdit(newValue);

        setSavingBalance(false);

        if (result.success) {
            setSuccessMsg(
                newValue
                    ? '✅ Đã cho phép người dùng chỉnh sửa số dư'
                    : '🔒 Đã tắt quyền chỉnh sửa số dư cho người dùng.'
            );
            setTimeout(() => setSuccessMsg(''), 4000);
            onUpdate?.();
        } else {
            setError(result.error || 'Lỗi khi cập nhật cài đặt');
        }
    };

    return (
        <div className="space-y-3">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Shield size={12} className="text-amber-500" /> Quản trị viên
            </h3>

            {successMsg && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-2xl animate-in fade-in slide-in-from-top-1">
                    <p className="text-sm text-green-700 font-medium text-center">{successMsg}</p>
                </div>
            )}
            {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-2xl animate-in fade-in slide-in-from-top-1">
                    <p className="text-sm text-red-600 font-medium text-center">{error}</p>
                </div>
            )}

            <div className="bg-card rounded-2xl p-4 border border-border shadow-sm">
                <div className="flex items-center justify-between">
                    <div className="flex-1 mr-3">
                        <p className="text-sm font-semibold text-foreground">Cho phép đăng ký</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            {registrationEnabled
                                ? 'Người dùng mới có thể tạo tài khoản'
                                : 'Đã khóa — không ai có thể tạo tài khoản mới'}
                        </p>
                    </div>
                    <button
                        onClick={handleToggleRegistration}
                        disabled={savingReg}
                        className="flex-shrink-0 transition-all active:scale-95 disabled:opacity-50"
                    >
                        {savingReg ? (
                            <Loader2 size={28} className="animate-spin text-primary" />
                        ) : registrationEnabled ? (
                            <ToggleRight size={36} className="text-green-500" />
                        ) : (
                            <ToggleLeft size={36} className="text-gray-400" />
                        )}
                    </button>
                </div>

                {!registrationEnabled && (
                    <div className="mt-3 flex items-start gap-2 p-2.5 bg-amber-50 border border-amber-200 rounded-xl">
                        <AlertTriangle size={14} className="text-amber-500 mt-0.5 flex-shrink-0" />
                        <p className="text-xs text-amber-700">
                            Trang đăng ký hiện đang bị ẩn. Chỉ những người đã có tài khoản mới có thể đăng nhập.
                        </p>
                    </div>
                )}
            </div>

            {/* Balance Edit Toggle */}
            <div className="bg-card rounded-2xl p-4 border border-border shadow-sm">
                <div className="flex items-center justify-between">
                    <div className="flex-1 mr-3">
                        <div className="flex items-center gap-1.5 mb-0.5">
                            <Wallet size={14} className="text-primary" />
                            <p className="text-sm font-semibold text-foreground">Cho phép chỉnh sửa số dư</p>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            {balanceEditEnabled
                                ? 'Người dùng có thể tự chỉnh sửa số tiền hiện tại'
                                : 'Chỉ admin mới có thể chỉnh sửa số dư'}
                        </p>
                    </div>
                    <button
                        onClick={handleToggleBalanceEdit}
                        disabled={savingBalance}
                        className="flex-shrink-0 transition-all active:scale-95 disabled:opacity-50"
                    >
                        {savingBalance ? (
                            <Loader2 size={28} className="animate-spin text-primary" />
                        ) : balanceEditEnabled ? (
                            <ToggleRight size={36} className="text-green-500" />
                        ) : (
                            <ToggleLeft size={36} className="text-gray-400" />
                        )}
                    </button>
                </div>

                {!balanceEditEnabled && (
                    <div className="mt-3 flex items-start gap-2 p-2.5 bg-blue-50 border border-blue-200 rounded-xl">
                        <Wallet size={14} className="text-blue-500 mt-0.5 flex-shrink-0" />
                        <p className="text-xs text-blue-700">
                            Người dùng không thể tự thay đổi số dư. Chỉ admin mới có thể thay đổi thông qua cài đặt.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
