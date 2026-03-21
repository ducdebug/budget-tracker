'use server';

import { createClient } from '@/lib/supabase/server';
import type {
    User,
    UserFinanceSummary,
    Transaction,
    Debt,
    MonthlyHistory,
    MonthlyBalanceSummary,
    AddTransactionInput,
    AddDebtInput,
    UpdateUserInput,
    ActionResult,
} from '@/lib/types';

function getCurrentMonthRange() {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    return {
        start: start.toISOString(),
        end: end.toISOString(),
    };
}

export async function getUsersSummary(): Promise<ActionResult<UserFinanceSummary[]>> {
    try {
        const supabase = await createClient();
        const { start, end } = getCurrentMonthRange();

        const { data: users, error: usersError } = await supabase
            .from('users')
            .select('*')
            .order('name', { ascending: true });

        if (usersError) throw usersError;
        if (!users || users.length === 0) {
            return { success: true, data: [] };
        }

        const { data: transactions, error: txError } = await supabase
            .from('transactions')
            .select('*')
            .gte('created_at', start)
            .lte('created_at', end);

        if (txError) throw txError;

        const summaries: UserFinanceSummary[] = users.map((user: User) => {
            const userTx = (transactions || []).filter(
                (tx: Transaction) => tx.user_id === user.id
            );

            const totalIncome = userTx
                .filter((tx: Transaction) => tx.type === 'income')
                .reduce((sum: number, tx: Transaction) => sum + tx.amount, 0);

            const totalExpense = userTx
                .filter((tx: Transaction) => tx.type === 'expense')
                .reduce((sum: number, tx: Transaction) => sum + tx.amount, 0);

            const savingRate =
                totalIncome > 0
                    ? Math.round(((totalIncome - totalExpense) / totalIncome) * 100)
                    : 0;

            return {
                user,
                totalIncome,
                totalExpense,
                balance: user.total_balance,
                savingRate: Math.max(0, savingRate),
            };
        });

        return { success: true, data: summaries };
    } catch (error: any) {
        console.error('getUsersSummary error:', error);
        return { success: false, error: error.message };
    }
}

export async function getUsers(): Promise<ActionResult<User[]>> {
    try {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .order('name', { ascending: true });

        if (error) throw error;
        return { success: true, data: data || [] };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function updateUser(
    input: UpdateUserInput
): Promise<ActionResult<User>> {
    try {
        const supabase = await createClient();

        const { data, error } = await supabase
            .from('users')
            .update({
                name: input.name,
                total_balance: input.total_balance,
                updated_at: new Date().toISOString(),
            })
            .eq('id', input.id)
            .select()
            .single();

        if (error) throw error;
        return { success: true, data };
    } catch (error: any) {
        console.error('updateUser error:', error);
        return { success: false, error: error.message };
    }
}

export async function updateStashedAmount(
    amount: number
): Promise<ActionResult> {
    try {
        const supabase = await createClient();

        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) throw new Error('Chưa đăng nhập');

        const { data: profile } = await supabase
            .from('users')
            .select('id, stashed_amount')
            .eq('auth_id', user.id)
            .single();

        if (!profile) throw new Error('User not found');

        const { error } = await supabase
            .from('users')
            .update({
                stashed_amount: profile.stashed_amount + amount,
                updated_at: new Date().toISOString(),
            })
            .eq('id', profile.id);

        if (error) throw error;
        return { success: true };
    } catch (error: any) {
        console.error('updateStashedAmount error:', error);
        return { success: false, error: error.message };
    }
}

export async function addTransactionSimple(input: {
    user_id: string;
    amount: number;
    type: 'income' | 'expense';
    note?: string;
}): Promise<ActionResult<Transaction>> {
    return addTransaction({
        user_id: input.user_id,
        amount: input.amount,
        type: input.type,
        note: input.note || '',
    });
}

export async function addTransaction(
    input: AddTransactionInput
): Promise<ActionResult<Transaction>> {
    try {
        const supabase = await createClient();
        const { data: tx, error: txError } = await supabase
            .from('transactions')
            .insert({
                user_id: input.user_id,
                amount: input.amount,
                type: input.type,
                note: input.note || '',
            })
            .select()
            .single();

        if (txError) throw txError;

        const balanceDelta = input.type === 'income' ? input.amount : -input.amount;

        const { error: userError } = await supabase.rpc('update_user_balance', {
            p_user_id: input.user_id,
            p_delta: balanceDelta,
        });

        if (userError) {
            const { data: user } = await supabase
                .from('users')
                .select('total_balance')
                .eq('id', input.user_id)
                .single();

            if (user) {
                await supabase
                    .from('users')
                    .update({ total_balance: user.total_balance + balanceDelta })
                    .eq('id', input.user_id);
            }
        }

        return { success: true, data: tx };
    } catch (error: any) {
        console.error('addTransaction error:', error);
        return { success: false, error: error.message };
    }
}

export async function getRecentTransactions(
    limit = 10
): Promise<ActionResult<Transaction[]>> {
    try {
        const supabase = await createClient();

        const { data, error } = await supabase
            .from('transactions')
            .select('*, user:users(*)')
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) throw error;
        return { success: true, data: data || [] };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function getAllTransactions(filters?: {
    userId?: string;
    type?: 'income' | 'expense';
    dateFrom?: string;
    dateTo?: string;
}): Promise<ActionResult<Transaction[]>> {
    try {
        const supabase = await createClient();

        let query = supabase
            .from('transactions')
            .select('*, user:users(*)')
            .order('created_at', { ascending: false });

        if (filters?.userId) {
            query = query.eq('user_id', filters.userId);
        }
        if (filters?.type) {
            query = query.eq('type', filters.type);
        }
        if (filters?.dateFrom) {
            query = query.gte('created_at', filters.dateFrom);
        }
        if (filters?.dateTo) {
            const toDate = new Date(filters.dateTo);
            toDate.setDate(toDate.getDate() + 1);
            query = query.lt('created_at', toDate.toISOString());
        }

        const { data, error } = await query;
        if (error) throw error;
        return { success: true, data: data || [] };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}



export async function getDebts(
    status?: 'pending' | 'resolved'
): Promise<ActionResult<Debt[]>> {
    try {
        const supabase = await createClient();

        let query = supabase
            .from('debts')
            .select('*, user:users(*)')
            .order('created_at', { ascending: false });

        if (status) {
            query = query.eq('status', status);
        }

        const { data, error } = await query;
        if (error) throw error;
        return { success: true, data: data || [] };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function addDebt(
    input: AddDebtInput
): Promise<ActionResult<Debt>> {
    try {
        const supabase = await createClient();

        const { data, error } = await supabase
            .from('debts')
            .insert({
                user_id: input.user_id,
                debtor_name: input.debtor_name,
                amount: input.amount,
                note: input.note || '',
            })
            .select()
            .single();

        if (error) throw error;
        return { success: true, data };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function deleteDebt(debtId: string): Promise<ActionResult<void>> {
    try {
        const supabase = await createClient();
        const { error } = await supabase.from('debts').delete().eq('id', debtId);
        if (error) throw error;
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function updateDebt(
    debtId: string,
    updates: { debtor_name?: string; amount?: number; note?: string }
): Promise<ActionResult<void>> {
    try {
        const supabase = await createClient();
        const { error } = await supabase.from('debts').update(updates).eq('id', debtId);
        if (error) throw error;
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}


export async function resolveDebt(
    debtId: string
): Promise<ActionResult<void>> {
    try {
        const supabase = await createClient();

        const { data: debt, error: debtError } = await supabase
            .from('debts')
            .select('*')
            .eq('id', debtId)
            .eq('status', 'pending')
            .single();

        if (debtError || !debt) {
            throw new Error('Debt not found or already resolved');
        }



        // Đánh dấu resolved với paid_amount = original_amount
        const { error: updateError } = await supabase
            .from('debts')
            .update({
                status: 'resolved',
                paid_amount: debt.original_amount ?? debt.amount,
                amount: 0,
                resolved_at: new Date().toISOString(),
            })
            .eq('id', debtId);

        if (updateError) throw updateError;

        // Tạo transaction income
        const repayAmount = debt.amount;
        const { error: txError } = await supabase
            .from('transactions')
            .insert({
                user_id: debt.user_id,
                amount: repayAmount,
                type: 'income',
                note: `Debt repaid by ${debt.debtor_name}`,
            });

        if (txError) throw txError;

        // Cập nhật balance qua RPC (hoặc fallback thủ công)
        const { error: rpcError } = await supabase.rpc('update_user_balance', {
            p_user_id: debt.user_id,
            p_delta: repayAmount,
        });

        if (rpcError) {
            // Fallback thủ công nếu RPC không tồn tại
            const { data: user } = await supabase
                .from('users')
                .select('total_balance')
                .eq('id', debt.user_id)
                .single();

            if (user) {
                await supabase
                    .from('users')
                    .update({ total_balance: user.total_balance + repayAmount })
                    .eq('id', debt.user_id);
            }
        }

        return { success: true };
    } catch (error: any) {
        console.error('resolveDebt error:', error);
        return { success: false, error: error.message };
    }
}

export async function partialRepayDebt(
    debtId: string,
    partialAmount: number
): Promise<ActionResult<void>> {
    try {
        const supabase = await createClient();

        const { data: debt, error: debtError } = await supabase
            .from('debts')
            .select('*')
            .eq('id', debtId)
            .eq('status', 'pending')
            .single();

        if (debtError || !debt) {
            throw new Error('Khoản nợ không tồn tại hoặc đã được thanh toán');
        }

        if (partialAmount <= 0) {
            throw new Error('Số tiền phải lớn hơn 0');
        }

        if (partialAmount > debt.amount) {
            throw new Error('Số tiền trả không được vượt quá số nợ còn lại');
        }



        const newAmount = debt.amount - partialAmount;
        const newPaidAmount = (debt.paid_amount ?? 0) + partialAmount;
        const originalAmount = debt.original_amount ?? debt.amount;
        const isFullyPaid = newAmount === 0;

        // Cập nhật debt: giảm amount còn lại, tăng paid_amount
        const { error: updateError } = await supabase
            .from('debts')
            .update({
                amount: isFullyPaid ? 0 : newAmount,
                paid_amount: newPaidAmount,
                original_amount: originalAmount,
                status: isFullyPaid ? 'resolved' : 'pending',
                resolved_at: isFullyPaid ? new Date().toISOString() : null,
            })
            .eq('id', debtId);

        if (updateError) throw updateError;

        // Tạo transaction income cho phần đã trả
        const { error: txError } = await supabase
            .from('transactions')
            .insert({
                user_id: debt.user_id,
                amount: partialAmount,
                type: 'income',
                note: `${debt.debtor_name} trả một phần (${partialAmount.toLocaleString('vi-VN')}₫/${originalAmount.toLocaleString('vi-VN')}₫)`,
            });

        if (txError) throw txError;

        // Cập nhật balance
        const { error: rpcError } = await supabase.rpc('update_user_balance', {
            p_user_id: debt.user_id,
            p_delta: partialAmount,
        });

        if (rpcError) {
            const { data: user } = await supabase
                .from('users')
                .select('total_balance')
                .eq('id', debt.user_id)
                .single();

            if (user) {
                await supabase
                    .from('users')
                    .update({ total_balance: user.total_balance + partialAmount })
                    .eq('id', debt.user_id);
            }
        }

        return { success: true };
    } catch (error: any) {
        console.error('partialRepayDebt error:', error);
        return { success: false, error: error.message };
    }
}

export async function getMonthlyHistory(): Promise<ActionResult<MonthlyHistory[]>> {
    try {
        const supabase = await createClient();

        const { data: users, error: usersError } = await supabase
            .from('users')
            .select('id, name')
            .order('name');
        if (usersError) throw usersError;

        const { data: transactions, error: txError } = await supabase
            .from('transactions')
            .select('*')
            .order('created_at', { ascending: true });
        if (txError) throw txError;

        if (!transactions || transactions.length === 0 || !users) {
            return { success: true, data: [] };
        }

        const monthMap = new Map<string, {
            income: Map<string, number>;
            expense: Map<string, number>;
        }>();

        for (const tx of transactions) {
            const date = new Date(tx.created_at);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

            if (!monthMap.has(monthKey)) {
                monthMap.set(monthKey, {
                    income: new Map(),
                    expense: new Map(),
                });
            }

            const monthData = monthMap.get(monthKey)!;
            const targetMap = tx.type === 'income' ? monthData.income : monthData.expense;
            targetMap.set(tx.user_id, (targetMap.get(tx.user_id) || 0) + tx.amount);
        }

        const months = Array.from(monthMap.entries())
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([monthKey, data]) => {
                const [year, month] = monthKey.split('-');
                const perUser = (users || []).map((u: any) => ({
                    userId: u.id,
                    userName: u.name,
                    income: data.income.get(u.id) || 0,
                    expense: data.expense.get(u.id) || 0,
                    net: (data.income.get(u.id) || 0) - (data.expense.get(u.id) || 0),
                }));

                const totalIncome = perUser.reduce((s, p) => s + p.income, 0);
                const totalExpense = perUser.reduce((s, p) => s + p.expense, 0);

                return {
                    month: monthKey,
                    label: `Tháng ${parseInt(month)}/${year}`,
                    totalIncome,
                    totalExpense,
                    netChange: totalIncome - totalExpense,
                    perUser,
                } as MonthlyHistory;
            });

        return { success: true, data: months };
    } catch (error: any) {
        console.error('getMonthlyHistory error:', error);
        return { success: false, error: error.message };
    }
}

export async function getMonthlyBalanceSummary(): Promise<ActionResult<MonthlyBalanceSummary[]>> {
    try {
        const supabase = await createClient();

        // Lấy danh sách users với balance hiện tại
        const { data: users, error: usersError } = await supabase
            .from('users')
            .select('id, name, total_balance')
            .order('name');
        if (usersError) throw usersError;
        if (!users || users.length === 0) return { success: true, data: [] };

        // Lấy tất cả transactions sort tăng dần
        const { data: transactions, error: txError } = await supabase
            .from('transactions')
            .select('*')
            .order('created_at', { ascending: true });
        if (txError) throw txError;
        if (!transactions || transactions.length === 0) return { success: true, data: [] };

        // Gom transactions theo tháng cho từng user
        // key: monthKey, value: Map<userId, {income, expense}>
        const monthUserMap = new Map<string, Map<string, { income: number; expense: number }>>();

        for (const tx of transactions) {
            const date = new Date(tx.created_at);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

            if (!monthUserMap.has(monthKey)) {
                monthUserMap.set(monthKey, new Map());
            }
            const userMap = monthUserMap.get(monthKey)!;
            if (!userMap.has(tx.user_id)) {
                userMap.set(tx.user_id, { income: 0, expense: 0 });
            }
            const entry = userMap.get(tx.user_id)!;
            if (tx.type === 'income') entry.income += tx.amount;
            else entry.expense += tx.amount;
        }

        const sortedMonths = Array.from(monthUserMap.keys()).sort();

        // Tính balance cuối tháng:
        // balance cuối tháng = balance hiện tại - tổng net từ các tháng SAU tháng đó
        // Cách: tính net mỗi tháng cho mỗi user, rồi cộng dồn ngược từ hiện tại
        const userCurrentBalance: Record<string, number> = {};
        for (const u of users) {
            userCurrentBalance[u.id] = u.total_balance;
        }

        // Tính net mỗi tháng cho mỗi user
        const monthNetByUser: Record<string, Record<string, number>> = {};
        for (const monthKey of sortedMonths) {
            monthNetByUser[monthKey] = {};
            const userMap = monthUserMap.get(monthKey)!;
            for (const u of users) {
                const data = userMap.get(u.id) || { income: 0, expense: 0 };
                monthNetByUser[monthKey][u.id] = data.income - data.expense;
            }
        }

        // Tính balance cuối mỗi tháng bằng cách duyệt ngược:
        // Bắt đầu từ balance hiện tại, trừ dần net của từng tháng từ mới đến cũ
        const monthEndBalance: Record<string, Record<string, number>> = {};
        const runningBalance: Record<string, number> = { ...userCurrentBalance };

        for (let i = sortedMonths.length - 1; i >= 0; i--) {
            const monthKey = sortedMonths[i];
            monthEndBalance[monthKey] = {};
            for (const u of users) {
                monthEndBalance[monthKey][u.id] = runningBalance[u.id];
            }
            // Trước tháng này: trừ đi net của tháng này
            for (const u of users) {
                runningBalance[u.id] -= (monthNetByUser[monthKey]?.[u.id] || 0);
            }
        }

        // Tổng hợp output
        const [year, month] = sortedMonths[0]?.split('-') || ['', ''];
        const result: MonthlyBalanceSummary[] = sortedMonths.map((monthKey) => {
            const [yr, mo] = monthKey.split('-');
            const userMap = monthUserMap.get(monthKey)!;
            const perUser = users.map((u: any) => {
                const data = userMap.get(u.id) || { income: 0, expense: 0 };
                return {
                    userId: u.id,
                    userName: u.name,
                    endBalance: monthEndBalance[monthKey][u.id],
                    totalIncome: data.income,
                    totalExpense: data.expense,
                    netChange: data.income - data.expense,
                };
            });

            const combinedBalance = perUser.reduce((s, p) => s + p.endBalance, 0);
            const totalExpense = perUser.reduce((s, p) => s + p.totalExpense, 0);

            return {
                month: monthKey,
                label: `Tháng ${parseInt(mo)}/${yr}`,
                totalExpense,
                perUser,
                combinedBalance,
            };
        });

        return { success: true, data: result };
    } catch (error: any) {
        console.error('getMonthlyBalanceSummary error:', error);
        return { success: false, error: error.message };
    }
}

export async function getCategoryExpenseStats(): Promise<ActionResult<{
    category: string;
    icon: string;
    amount: number;
    color: string;
    perUser: { userId: string; userName: string; amount: number }[];
}[]>> {
    try {
        const supabase = await createClient();
        const { start, end } = getCurrentMonthRange();

        const [txRes, usersRes] = await Promise.all([
            supabase.from('transactions').select('*, category:categories(*)')
                .eq('type', 'expense').gte('created_at', start).lte('created_at', end),
            supabase.from('users').select('id, name').order('name'),
        ]);

        if (txRes.error) throw txRes.error;
        if (usersRes.error) throw usersRes.error;

        const transactions = txRes.data || [];
        const users = usersRes.data || [];

        const categoryMap = new Map<string, {
            name: string;
            icon: string;
            amount: number;
            userAmounts: Map<string, number>;
        }>();

        for (const tx of transactions) {
            const cat = tx.category;
            const key = cat?.id || 'unknown';
            const existing = categoryMap.get(key);
            if (existing) {
                existing.amount += tx.amount;
                existing.userAmounts.set(
                    tx.user_id,
                    (existing.userAmounts.get(tx.user_id) || 0) + tx.amount
                );
            } else {
                const userAmounts = new Map<string, number>();
                userAmounts.set(tx.user_id, tx.amount);
                categoryMap.set(key, {
                    name: cat?.name || 'Khác',
                    icon: cat?.icon || '❓',
                    amount: tx.amount,
                    userAmounts,
                });
            }
        }

        const COLORS = [
            '#6366f1', '#ec4899', '#f59e0b', '#10b981', '#3b82f6',
            '#8b5cf6', '#ef4444', '#14b8a6', '#f97316', '#06b6d4',
            '#84cc16', '#e879f9', '#fb923c', '#22d3ee', '#a78bfa',
        ];

        const result = Array.from(categoryMap.values())
            .sort((a, b) => b.amount - a.amount)
            .map((item, index) => ({
                category: item.name,
                icon: item.icon,
                amount: item.amount,
                color: COLORS[index % COLORS.length],
                perUser: users.map((u: any) => ({
                    userId: u.id,
                    userName: u.name,
                    amount: item.userAmounts.get(u.id) || 0,
                })),
            }));

        return { success: true, data: result };
    } catch (error: any) {
        console.error('getCategoryExpenseStats error:', error);
        return { success: false, error: error.message };
    }
}

export async function getMonthlyUserComparison(): Promise<ActionResult<{
    month: string;
    label: string;
    users: { userId: string; userName: string; expense: number; color: string }[];
}[]>> {
    try {
        const supabase = await createClient();

        const now = new Date();
        const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

        const { data: users, error: usersError } = await supabase
            .from('users')
            .select('id, name')
            .order('name');
        if (usersError) throw usersError;
        const { data: transactions, error: txError } = await supabase
            .from('transactions')
            .select('*')
            .eq('type', 'expense')
            .gte('created_at', sixMonthsAgo.toISOString())
            .order('created_at', { ascending: true });
        if (txError) throw txError;

        const USER_COLORS = ['#6366f1', '#ec4899'];

        const months: {
            month: string;
            label: string;
            users: { userId: string; userName: string; expense: number; color: string }[];
        }[] = [];

        for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            const label = `T${d.getMonth() + 1}`;

            const monthUsers = (users || []).map((u: any, idx: number) => {
                const expense = (transactions || [])
                    .filter((tx: any) => {
                        const txDate = new Date(tx.created_at);
                        const txMonth = `${txDate.getFullYear()}-${String(txDate.getMonth() + 1).padStart(2, '0')}`;
                        return txMonth === monthKey && tx.user_id === u.id;
                    })
                    .reduce((sum: number, tx: any) => sum + tx.amount, 0);

                return {
                    userId: u.id,
                    userName: u.name,
                    expense,
                    color: USER_COLORS[idx % USER_COLORS.length],
                };
            });

            months.push({ month: monthKey, label, users: monthUsers });
        }

        return { success: true, data: months };
    } catch (error: any) {
        console.error('getMonthlyUserComparison error:', error);
        return { success: false, error: error.message };
    }
}
