'use client';

import { useState, useRef } from 'react';
import {
    Camera,
    Check,
    X,
    Eye,
    EyeOff,
    Lock,
    User as UserIcon,
    Loader2,
    Pencil,
    LogOut,
    Trash2,
} from 'lucide-react';
import {
    changePassword,
    updateProfile,
    signOut,
} from '@/lib/auth-actions';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@/lib/types';
import { useRouter } from 'next/navigation';

interface ProfileSectionProps {
    currentUser: User;
    onUpdate: () => void;
    showSignOut?: boolean;
}

export function ProfileSection({ currentUser, onUpdate, showSignOut = true }: ProfileSectionProps) {
    const router = useRouter();

    const [editingName, setEditingName] = useState(false);
    const [newName, setNewName] = useState(currentUser.name);
    const [savingName, setSavingName] = useState(false);

    const [showPasswordForm, setShowPasswordForm] = useState(false);
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showNewPwd, setShowNewPwd] = useState(false);
    const [showConfirmPwd, setShowConfirmPwd] = useState(false);
    const [savingPassword, setSavingPassword] = useState(false);

    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');
    const [signingOut, setSigningOut] = useState(false);

    const showSuccess = (msg: string) => {
        setSuccessMsg(msg);
        setTimeout(() => setSuccessMsg(''), 3000);
    };

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            setError('Vui lòng chọn file ảnh');
            return;
        }
        if (file.size > 2 * 1024 * 1024) {
            setError('Ảnh phải nhỏ hơn 2MB');
            return;
        }

        setUploadingAvatar(true);
        setError('');

        try {
            const supabase = createClient();
            const fileExt = file.name.split('.').pop();
            const filePath = `${currentUser.id}/avatar.${fileExt}`;

            if (currentUser.avatar_url) {
                const oldPath = currentUser.avatar_url.split('/avatars/')[1];
                if (oldPath) {
                    await supabase.storage.from('avatars').remove([oldPath]);
                }
            }

            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, file, {
                    cacheControl: '3600',
                    upsert: true,
                });

            if (uploadError) throw uploadError;

            const { data: urlData } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath);

            const avatarUrl = `${urlData.publicUrl}?t=${Date.now()}`;

            const result = await updateProfile(undefined, avatarUrl);
            if (!result.success) throw new Error(result.error);

            showSuccess('✅ Đã cập nhật ảnh đại diện!');
            onUpdate();
        } catch (error: any) {
            console.error('Avatar upload error:', error);
            setError(error.message || 'Lỗi khi tải ảnh lên');
        }

        setUploadingAvatar(false);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };
    const handleRemoveAvatar = async () => {
        if (!currentUser.avatar_url) return;

        setUploadingAvatar(true);
        setError('');

        try {
            const supabase = createClient();
            const oldPath = currentUser.avatar_url.split('/avatars/')[1]?.split('?')[0];
            if (oldPath) {
                await supabase.storage.from('avatars').remove([oldPath]);
            }

            const result = await updateProfile(undefined, null);
            if (!result.success) throw new Error(result.error);

            showSuccess('✅ Đã xóa ảnh đại diện!');
            onUpdate();
        } catch (error: any) {
            setError(error.message || 'Lỗi khi xóa ảnh');
        }

        setUploadingAvatar(false);
    };

    const handleSaveName = async () => {
        if (!newName.trim()) {
            setError('Tên không được để trống');
            return;
        }

        setSavingName(true);
        setError('');

        const result = await updateProfile(newName.trim());
        setSavingName(false);

        if (result.success) {
            setEditingName(false);
            showSuccess('✅ Đã cập nhật tên!');
            onUpdate();
        } else {
            setError(result.error || 'Lỗi khi cập nhật tên');
        }
    };

    const handleChangePassword = async () => {
        if (newPassword.length < 6) {
            setError('Mật khẩu mới phải có ít nhất 6 ký tự');
            return;
        }
        if (newPassword !== confirmPassword) {
            setError('Mật khẩu xác nhận không khớp');
            return;
        }

        setSavingPassword(true);
        setError('');

        const result = await changePassword(newPassword);
        setSavingPassword(false);

        if (result.success) {
            setShowPasswordForm(false);
            setNewPassword('');
            setConfirmPassword('');
            showSuccess('✅ Đã đổi mật khẩu thành công!');
        } else {
            setError(result.error || 'Lỗi khi đổi mật khẩu');
        }
    };

    const handleSignOut = async () => {
        setSigningOut(true);
        await signOut();
        router.push('/auth');
        router.refresh();
    };

    return (
        <div className="space-y-4">
            {successMsg && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-2xl animate-in fade-in slide-in-from-top-1">
                    <p className="text-sm text-green-700 font-medium text-center">{successMsg}</p>
                </div>
            )}

            {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-2xl animate-in fade-in slide-in-from-top-1">
                    <p className="text-sm text-red-600 font-medium text-center">{error}</p>
                    <button
                        onClick={() => setError('')}
                        className="text-red-400 text-xs mt-1 block mx-auto hover:text-red-600"
                    >
                        Đóng
                    </button>
                </div>
            )}

            <div className="bg-card rounded-2xl p-5 border border-border shadow-sm">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                    📸 Ảnh đại diện
                </h3>
                <div className="flex items-center gap-4">
                    <div className="relative group">
                        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center overflow-hidden border-3 border-primary/30 shadow-lg">
                            {currentUser.avatar_url ? (
                                <img
                                    src={currentUser.avatar_url}
                                    alt="Avatar"
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <span className="text-3xl">{currentUser.avatar || '👤'}</span>
                            )}
                        </div>
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploadingAvatar}
                            className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                        >
                            {uploadingAvatar ? (
                                <Loader2 size={20} className="text-white animate-spin" />
                            ) : (
                                <Camera size={20} className="text-white" />
                            )}
                        </button>
                    </div>

                    <div className="flex-1">
                        <p className="text-sm font-semibold text-foreground">{currentUser.name}</p>
                        <p className="text-xs text-muted-foreground mb-2">{currentUser.email}</p>
                        <div className="flex gap-2">
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                disabled={uploadingAvatar}
                                className="text-xs font-medium text-primary bg-primary/10 px-3 py-1.5 rounded-full hover:bg-primary/20 transition-colors active:scale-95 disabled:opacity-50"
                            >
                                {uploadingAvatar ? 'Đang tải...' : 'Đổi ảnh'}
                            </button>
                            {currentUser.avatar_url && (
                                <button
                                    onClick={handleRemoveAvatar}
                                    disabled={uploadingAvatar}
                                    className="text-xs font-medium text-red-500 bg-red-50 px-3 py-1.5 rounded-full hover:bg-red-100 transition-colors active:scale-95 disabled:opacity-50"
                                >
                                    <Trash2 size={12} className="inline mr-1" />
                                    Xóa
                                </button>
                            )}
                        </div>
                    </div>

                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarUpload}
                        className="hidden"
                    />
                </div>
                <p className="text-xs text-muted-foreground mt-3">
                    Hỗ trợ: JPG, PNG, GIF. Tối đa 2MB.
                </p>
            </div>

            <div className="bg-card rounded-2xl p-5 border border-border shadow-sm">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                    <UserIcon size={12} className="inline mr-1" /> Tên hiển thị
                </h3>
                {editingName ? (
                    <div className="space-y-3">
                        <input
                            type="text"
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            className="w-full py-2.5 px-3 rounded-xl border-2 border-border bg-muted/30 focus:border-primary focus:outline-none transition-colors text-sm font-medium"
                            placeholder="Nhập tên mới..."
                            autoFocus
                        />
                        <div className="flex gap-2 justify-end">
                            <button
                                onClick={() => {
                                    setEditingName(false);
                                    setNewName(currentUser.name);
                                    setError('');
                                }}
                                className="p-2 rounded-full bg-gray-200 text-gray-600 hover:bg-gray-300 transition-colors active:scale-95"
                            >
                                <X size={16} />
                            </button>
                            <button
                                onClick={handleSaveName}
                                disabled={savingName}
                                className="p-2 rounded-full bg-green-500 text-white hover:bg-green-600 transition-colors disabled:opacity-50 active:scale-95"
                            >
                                {savingName ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-foreground">{currentUser.name}</p>
                        <button
                            onClick={() => setEditingName(true)}
                            className="p-2 rounded-full hover:bg-muted transition-colors active:scale-95"
                        >
                            <Pencil size={16} className="text-muted-foreground" />
                        </button>
                    </div>
                )}
            </div>

            <div className="bg-card rounded-2xl p-5 border border-border shadow-sm">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                    <Lock size={12} className="inline mr-1" /> Đổi mật khẩu
                </h3>
                {showPasswordForm ? (
                    <div className="space-y-3">
                        <div className="relative">
                            <input
                                type={showNewPwd ? 'text' : 'password'}
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="w-full py-2.5 px-3 pr-10 rounded-xl border-2 border-border bg-muted/30 focus:border-primary focus:outline-none transition-colors text-sm font-medium"
                                placeholder="Mật khẩu mới (≥6 ký tự)"
                                minLength={6}
                            />
                            <button
                                type="button"
                                onClick={() => setShowNewPwd(!showNewPwd)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-muted/50"
                                tabIndex={-1}
                            >
                                {showNewPwd ? <EyeOff size={14} className="text-muted-foreground" /> : <Eye size={14} className="text-muted-foreground" />}
                            </button>
                        </div>

                        <div className="relative">
                            <input
                                type={showConfirmPwd ? 'text' : 'password'}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full py-2.5 px-3 pr-10 rounded-xl border-2 border-border bg-muted/30 focus:border-primary focus:outline-none transition-colors text-sm font-medium"
                                placeholder="Xác nhận mật khẩu mới"
                                minLength={6}
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirmPwd(!showConfirmPwd)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-muted/50"
                                tabIndex={-1}
                            >
                                {showConfirmPwd ? <EyeOff size={14} className="text-muted-foreground" /> : <Eye size={14} className="text-muted-foreground" />}
                            </button>
                        </div>

                        {confirmPassword && newPassword !== confirmPassword && (
                            <p className="text-xs text-red-500 font-medium">⚠️ Mật khẩu không khớp</p>
                        )}

                        <div className="flex gap-2 justify-end">
                            <button
                                onClick={() => {
                                    setShowPasswordForm(false);
                                    setNewPassword('');
                                    setConfirmPassword('');
                                    setError('');
                                }}
                                className="px-4 py-2 rounded-xl text-sm font-medium bg-gray-200 text-gray-600 hover:bg-gray-300 transition-colors active:scale-95"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={handleChangePassword}
                                disabled={savingPassword || !newPassword || !confirmPassword}
                                className="px-4 py-2 rounded-xl text-sm font-semibold bg-primary text-primary-foreground hover:opacity-90 transition-all disabled:opacity-50 active:scale-95"
                            >
                                {savingPassword ? (
                                    <span className="flex items-center gap-1.5">
                                        <Loader2 size={14} className="animate-spin" /> Đang lưu...
                                    </span>
                                ) : (
                                    'Lưu mật khẩu'
                                )}
                            </button>
                        </div>
                    </div>
                ) : (
                    <button
                        onClick={() => setShowPasswordForm(true)}
                        className="text-sm font-medium text-primary bg-primary/10 px-4 py-2 rounded-xl hover:bg-primary/20 transition-colors active:scale-95"
                    >
                        Đổi mật khẩu
                    </button>
                )}
            </div>

            {showSignOut && (
                <button
                    onClick={handleSignOut}
                    disabled={signingOut}
                    className="w-full py-3 px-4 rounded-2xl font-semibold text-sm border-2 border-red-200 text-red-500 hover:bg-red-50 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                >
                    {signingOut ? (
                        <>
                            <Loader2 size={16} className="animate-spin" /> Đang đăng xuất...
                        </>
                    ) : (
                        <>
                            <LogOut size={16} /> Đăng xuất
                        </>
                    )}
                </button>
            )}
        </div>
    );
}
