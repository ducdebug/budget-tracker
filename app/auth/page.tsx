'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
    Eye, EyeOff, Mail, Lock, User, LogIn, UserPlus,
    Loader2, Sparkles, KeyRound
} from 'lucide-react';
import { signIn, signUp, signInWithMagicLink, getAppSettings } from '@/lib/auth-actions';

type AuthMode = 'login' | 'register' | 'magic-link';

export default function AuthPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50">
                <Loader2 size={32} className="animate-spin text-primary" />
            </div>
        }>
            <AuthContent />
        </Suspense>
    );
}

function AuthContent() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [mode, setMode] = useState<AuthMode>('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [registrationEnabled, setRegistrationEnabled] = useState(true);
    const [checkingSettings, setCheckingSettings] = useState(true);
    useEffect(() => {
        const urlError = searchParams.get('error');
        const errorDescription = searchParams.get('error_description');
        if (errorDescription) {
            setError(decodeURIComponent(errorDescription.replace(/\+/g, ' ')));
        } else if (urlError) {
            setError(decodeURIComponent(urlError));
        }
    }, [searchParams]);

    useEffect(() => {
        const checkSettings = async () => {
            const result = await getAppSettings();
            if (result.success && result.data) {
                setRegistrationEnabled(result.data.registration_enabled);
            }
            setCheckingSettings(false);
        };
        checkSettings();
    }, []);

    const getSiteUrl = () => {
        return window.location.origin;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setLoading(true);

        try {
            if (mode === 'magic-link') {
                const result = await signInWithMagicLink(email, getSiteUrl());
                if (result.success) {
                    setSuccess('📧 Đã gửi link đăng nhập! Kiểm tra email của bạn.');
                } else {
                    setError(result.error || 'Không thể gửi email');
                }
            } else if (mode === 'register') {
                if (!name.trim()) {
                    setError('Vui lòng nhập tên của bạn');
                    setLoading(false);
                    return;
                }
                const result = await signUp(email, password, name.trim(), getSiteUrl());
                if (result.success) {
                    router.push('/');
                    router.refresh();
                } else {
                    setError(result.error || 'Đăng ký thất bại');
                }
            } else {
                const result = await signIn(email, password);
                if (result.success) {
                    router.push('/');
                    router.refresh();
                } else {
                    setError(result.error || 'Đăng nhập thất bại');
                }
            }
        } catch {
            setError('Có lỗi xảy ra, vui lòng thử lại');
        }

        setLoading(false);
    };

    const switchMode = (newMode: AuthMode) => {
        setMode(newMode);
        setError('');
        setSuccess('');
    };

    return (
        <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50">
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-20 -left-20 w-64 h-64 bg-gradient-to-br from-primary/20 to-accent/10 rounded-full blur-3xl animate-pulse" />
                <div className="absolute -bottom-32 -right-16 w-80 h-80 bg-gradient-to-tl from-secondary/20 to-primary/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
                <div className="absolute top-1/3 right-8 w-40 h-40 bg-gradient-to-bl from-accent/15 to-transparent rounded-full blur-2xl animate-pulse" style={{ animationDelay: '2s' }} />
            </div>

            <div className="w-full max-w-sm relative z-10">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-primary to-accent shadow-xl shadow-primary/30 mb-4">
                        <span className="text-4xl">💰</span>
                    </div>
                    <h1 className="text-2xl font-bold text-foreground tracking-tight">
                        Quản lý Chi tiêu
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        {mode === 'login' && 'Đăng nhập tài khoản'}
                        {mode === 'register' && 'Tạo tài khoản mới'}
                        {mode === 'magic-link' && 'Đăng nhập bằng email'}
                    </p>
                </div>
                <div className="bg-card/80 backdrop-blur-xl rounded-3xl border border-border/50 shadow-2xl shadow-black/5 p-6">
                    <div className="flex rounded-2xl bg-muted/50 p-1 mb-5 gap-1">
                        <button
                            onClick={() => switchMode('login')}
                            className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold transition-all ${mode === 'login'
                                ? 'bg-card text-foreground shadow-sm'
                                : 'text-muted-foreground hover:text-foreground'
                                }`}
                        >
                            <KeyRound size={12} className="inline mr-1" />
                            Mật khẩu
                        </button>
                        <button
                            onClick={() => switchMode('magic-link')}
                            className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold transition-all ${mode === 'magic-link'
                                ? 'bg-card text-foreground shadow-sm'
                                : 'text-muted-foreground hover:text-foreground'
                                }`}
                        >
                            <Sparkles size={12} className="inline mr-1" />
                            Magic Link
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {mode === 'register' && (
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                                    <User size={12} /> Tên hiển thị
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="VD: Nguyễn Văn A"
                                        className="w-full py-3 px-4 pl-11 rounded-2xl border-2 border-border/50 bg-muted/30 focus:border-primary focus:outline-none transition-all text-sm font-medium placeholder:text-muted-foreground/50"
                                        autoComplete="name"
                                    />
                                    <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/50" />
                                </div>
                            </div>
                        )}
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                                <Mail size={12} /> Email
                            </label>
                            <div className="relative">
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="email@example.com"
                                    className="w-full py-3 px-4 pl-11 rounded-2xl border-2 border-border/50 bg-muted/30 focus:border-primary focus:outline-none transition-all text-sm font-medium placeholder:text-muted-foreground/50"
                                    required
                                    autoComplete="email"
                                />
                                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/50" />
                            </div>
                        </div>
                        {mode !== 'magic-link' && (
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                                    <Lock size={12} /> Mật khẩu
                                </label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="Nhập mật khẩu..."
                                        className="w-full py-3 px-4 pl-11 pr-11 rounded-2xl border-2 border-border/50 bg-muted/30 focus:border-primary focus:outline-none transition-all text-sm font-medium placeholder:text-muted-foreground/50"
                                        required
                                        minLength={6}
                                        autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                                    />
                                    <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/50" />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-muted/50 transition-colors"
                                        tabIndex={-1}
                                    >
                                        {showPassword ? (
                                            <EyeOff size={16} className="text-muted-foreground" />
                                        ) : (
                                            <Eye size={16} className="text-muted-foreground" />
                                        )}
                                    </button>
                                </div>
                            </div>
                        )}
                        {mode === 'magic-link' && (
                            <div className="p-3 bg-blue-50 border border-blue-200 rounded-2xl">
                                <p className="text-xs text-blue-700 text-center">
                                    ✨ Chúng tôi sẽ gửi link đăng nhập đến email của bạn. Không cần mật khẩu!
                                </p>
                            </div>
                        )}
                        {error && (
                            <div className="p-3 bg-red-50 border border-red-200 rounded-2xl animate-in fade-in slide-in-from-top-1">
                                <p className="text-sm text-red-600 font-medium text-center">{error}</p>
                            </div>
                        )}
                        {success && (
                            <div className="p-3 bg-green-50 border border-green-200 rounded-2xl animate-in fade-in slide-in-from-top-1">
                                <p className="text-sm text-green-600 font-medium text-center">{success}</p>
                            </div>
                        )}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3.5 px-4 rounded-2xl font-semibold text-sm transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 hover:-translate-y-0.5"
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <Loader2 size={18} className="animate-spin" />
                                    {mode === 'login' && 'Đang đăng nhập...'}
                                    {mode === 'register' && 'Đang đăng ký...'}
                                    {mode === 'magic-link' && 'Đang gửi...'}
                                </span>
                            ) : (
                                <span className="flex items-center justify-center gap-2">
                                    {mode === 'login' && <><LogIn size={18} /> Đăng nhập</>}
                                    {mode === 'register' && <><UserPlus size={18} /> Đăng ký</>}
                                    {mode === 'magic-link' && <><Sparkles size={18} /> Gửi link đăng nhập</>}
                                </span>
                            )}
                        </button>
                    </form>
                    <div className="relative my-5">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-border/50" />
                        </div>
                    </div>
                    {mode === 'login' || mode === 'magic-link' ? (
                        registrationEnabled ? (
                            <button
                                onClick={() => switchMode('register')}
                                className="w-full py-3 px-4 rounded-2xl font-semibold text-sm border-2 border-border/50 text-foreground hover:bg-muted/50 transition-all active:scale-[0.98]"
                            >
                                <span className="flex items-center justify-center gap-2">
                                    <UserPlus size={16} />
                                    Chưa có tài khoản? Đăng ký
                                </span>
                            </button>
                        ) : (
                            <div className="text-center">
                                <p className="text-xs text-muted-foreground bg-muted/50 rounded-2xl py-3 px-4">
                                    🔒 Đăng ký tạm thời đã bị tắt
                                </p>
                            </div>
                        )
                    ) : (
                        <button
                            onClick={() => switchMode('login')}
                            className="w-full py-3 px-4 rounded-2xl font-semibold text-sm border-2 border-border/50 text-foreground hover:bg-muted/50 transition-all active:scale-[0.98]"
                        >
                            <span className="flex items-center justify-center gap-2">
                                <LogIn size={16} />
                                Đã có tài khoản? Đăng nhập
                            </span>
                        </button>
                    )}
                </div>
                <p className="text-center text-xs text-muted-foreground mt-6">
                    💕 Quản lý chi tiêu cùng nhau
                </p>
            </div>
        </div>
    );
}
