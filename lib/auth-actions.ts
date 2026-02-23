'use server';

import { createClient } from '@/lib/supabase/server';
import type { ActionResult, AppSettings } from '@/lib/types';

export async function getAppSettings(): Promise<ActionResult<AppSettings>> {
    try {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('app_settings')
            .select('key, value');

        if (error) throw error;

        const settings: AppSettings = {
            registration_enabled: true,
            allow_balance_edit: true,
        };

        (data || []).forEach((row: { key: string; value: string }) => {
            if (row.key === 'registration_enabled') {
                settings.registration_enabled = row.value === 'true';
            }
            if (row.key === 'allow_balance_edit') {
                settings.allow_balance_edit = row.value === 'true';
            }
        });

        return { success: true, data: settings };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function signUp(
    email: string,
    password: string,
    name: string,
    siteUrl: string
): Promise<ActionResult> {
    try {
        const supabase = await createClient();
        const settingsResult = await getAppSettings();
        if (settingsResult.success && settingsResult.data && !settingsResult.data.registration_enabled) {
            return { success: false, error: 'Đăng ký đã bị tắt bởi quản trị viên' };
        }
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email,
            password,
            options: {
                emailRedirectTo: `${siteUrl}/auth/callback`,
            },
        });

        if (authError) throw authError;
        if (!authData.user) throw new Error('Không thể tạo tài khoản');

        const isRealUser = authData.user.identities && authData.user.identities.length > 0;
        if (!isRealUser) {
            return { success: false, error: 'Email này đã được đăng ký' };
        }
        const { data: existingProfile } = await supabase
            .from('users')
            .select('id')
            .eq('auth_id', authData.user.id)
            .maybeSingle();

        if (!existingProfile) {
            const { error: profileError } = await supabase
                .from('users')
                .insert({
                    auth_id: authData.user.id,
                    email: email,
                    name: name,
                    avatar: '👤',
                    avatar_url: null,
                    total_balance: 0,
                    is_admin: false,
                });

            if (profileError) throw profileError;
        }

        return { success: true };
    } catch (error: any) {
        console.error('signUp error:', error);
        if (error.message?.includes('already registered') || error.code === '23505') {
            return { success: false, error: 'Email này đã được đăng ký' };
        }
        if (error.message?.includes('valid email')) {
            return { success: false, error: 'Email không hợp lệ' };
        }
        if (error.message?.includes('at least 6')) {
            return { success: false, error: 'Mật khẩu phải có ít nhất 6 ký tự' };
        }
        if (error.code === '23503') {
            return { success: false, error: 'Lỗi tạo tài khoản. Vui lòng thử lại.' };
        }
        return { success: false, error: error.message };
    }
}

export async function signIn(
    email: string,
    password: string
): Promise<ActionResult> {
    try {
        const supabase = await createClient();

        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) throw error;

        return { success: true };
    } catch (error: any) {
        console.error('signIn error:', error);
        if (error.message?.includes('Invalid login')) {
            return { success: false, error: 'Email hoặc mật khẩu không đúng' };
        }
        if (error.message?.includes('Email not confirmed')) {
            return { success: false, error: 'Email chưa được xác nhận. Kiểm tra hộp thư của bạn.' };
        }
        return { success: false, error: error.message };
    }
}

export async function signInWithMagicLink(
    email: string,
    siteUrl: string
): Promise<ActionResult> {
    try {
        const supabase = await createClient();

        const { error } = await supabase.auth.signInWithOtp({
            email,
            options: {
                emailRedirectTo: `${siteUrl}/auth/callback`,
            },
        });

        if (error) throw error;

        return { success: true };
    } catch (error: any) {
        console.error('signInWithMagicLink error:', error);
        return { success: false, error: error.message };
    }
}

export async function signOut(): Promise<ActionResult> {
    try {
        const supabase = await createClient();
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function getCurrentUser(): Promise<ActionResult<{ authId: string; email: string }>> {
    try {
        const supabase = await createClient();
        const { data: { user }, error } = await supabase.auth.getUser();

        if (error) throw error;
        if (!user) return { success: false, error: 'Chưa đăng nhập' };

        return {
            success: true,
            data: {
                authId: user.id,
                email: user.email || '',
            },
        };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function changePassword(
    newPassword: string
): Promise<ActionResult> {
    try {
        const supabase = await createClient();

        const { error } = await supabase.auth.updateUser({
            password: newPassword,
        });

        if (error) throw error;
        return { success: true };
    } catch (error: any) {
        console.error('changePassword error:', error);
        if (error.message?.includes('at least 6')) {
            return { success: false, error: 'Mật khẩu mới phải có ít nhất 6 ký tự' };
        }
        if (error.message?.includes('same as')) {
            return { success: false, error: 'Mật khẩu mới phải khác mật khẩu cũ' };
        }
        return { success: false, error: error.message };
    }
}

export async function updateProfile(
    name?: string,
    avatarUrl?: string | null
): Promise<ActionResult> {
    try {
        const supabase = await createClient();

        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) throw new Error('Chưa đăng nhập');

        const updateData: Record<string, any> = {};
        if (name !== undefined) updateData.name = name;
        if (avatarUrl !== undefined) updateData.avatar_url = avatarUrl;

        const { error } = await supabase
            .from('users')
            .update(updateData)
            .eq('auth_id', user.id);

        if (error) throw error;
        return { success: true };
    } catch (error: any) {
        console.error('updateProfile error:', error);
        return { success: false, error: error.message };
    }
}

export async function toggleRegistration(
    enabled: boolean
): Promise<ActionResult> {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) throw new Error('Chưa đăng nhập');

        const { data: profile } = await supabase
            .from('users')
            .select('is_admin')
            .eq('auth_id', user.id)
            .single();

        if (!profile?.is_admin) {
            return { success: false, error: 'Bạn không có quyền quản trị' };
        }

        const { error } = await supabase
            .from('app_settings')
            .update({ value: enabled ? 'true' : 'false', updated_at: new Date().toISOString() })
            .eq('key', 'registration_enabled');

        if (error) throw error;
        return { success: true };
    } catch (error: any) {
        console.error('toggleRegistration error:', error);
        return { success: false, error: error.message };
    }
}

export async function toggleBalanceEdit(
    enabled: boolean
): Promise<ActionResult> {
    try {
        const supabase = await createClient();

        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) throw new Error('Chưa đăng nhập');

        const { data: profile } = await supabase
            .from('users')
            .select('is_admin')
            .eq('auth_id', user.id)
            .single();

        if (!profile?.is_admin) {
            return { success: false, error: 'Bạn không có quyền quản trị' };
        }

        const { error } = await supabase
            .from('app_settings')
            .update({ value: enabled ? 'true' : 'false', updated_at: new Date().toISOString() })
            .eq('key', 'allow_balance_edit');

        if (error) throw error;
        return { success: true };
    } catch (error: any) {
        console.error('toggleBalanceEdit error:', error);
        return { success: false, error: error.message };
    }
}

export async function getUserProfile(): Promise<ActionResult<import('@/lib/types').User>> {
    try {
        const supabase = await createClient();

        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) throw new Error('Chưa đăng nhập');

        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('auth_id', user.id)
            .single();

        if (error) throw error;
        return { success: true, data };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
