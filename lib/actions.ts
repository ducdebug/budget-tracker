'use server';

import { createClient } from '@/lib/supabase/server';
import type {
    User,
    UserFinanceSummary,
    BudgetStatus,
    Transaction,
    Category,
    Debt,
    MonthlyHistory,
    AddTransactionInput,
    AddDebtInput,
    UpdateUserInput,
    AddCategoryInput,
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

export async function addTransaction(
    input: AddTransactionInput
): Promise<ActionResult<Transaction>> {
    try {
        const supabase = await createClient();
        const { data: tx, error: txError } = await supabase
            .from('transactions')
            .insert({
                user_id: input.user_id,
                category_id: input.category_id,
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
            .select('*, category:categories(*), user:users(*)')
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
            .select('*, category:categories(*), user:users(*)')
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

export async function getCategories(): Promise<ActionResult<Category[]>> {
    try {
        const supabase = await createClient();

        const { data, error } = await supabase
            .from('categories')
            .select('*')
            .order('type', { ascending: true })
            .order('name', { ascending: true });

        if (error) throw error;
        return { success: true, data: data || [] };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function addCategory(
    input: AddCategoryInput
): Promise<ActionResult<Category>> {
    try {
        const supabase = await createClient();

        const { data, error } = await supabase
            .from('categories')
            .insert({
                name: input.name,
                icon: input.icon,
                type: input.type,
                monthly_limit: input.type === 'expense' ? (input.monthly_limit || 0) : 0,
            })
            .select()
            .single();

        if (error) throw error;
        return { success: true, data };
    } catch (error: any) {
        console.error('addCategory error:', error);
        return { success: false, error: error.message };
    }
}

export async function deleteCategory(
    categoryId: string
): Promise<ActionResult<void>> {
    try {
        const supabase = await createClient();

        const { count } = await supabase
            .from('transactions')
            .select('*', { count: 'exact', head: true })
            .eq('category_id', categoryId);

        if (count && count > 0) {
            return { success: false, error: `Cannot delete: ${count} transactions use this category` };
        }

        const { error } = await supabase
            .from('categories')
            .delete()
            .eq('id', categoryId);

        if (error) throw error;
        return { success: true };
    } catch (error: any) {
        console.error('deleteCategory error:', error);
        return { success: false, error: error.message };
    }
}

export async function getBudgetStatus(): Promise<ActionResult<BudgetStatus[]>> {
    try {
        const supabase = await createClient();
        const { start, end } = getCurrentMonthRange();

        const { data: categories, error: catError } = await supabase
            .from('categories')
            .select('*')
            .eq('type', 'expense');

        if (catError) throw catError;

        const { data: transactions, error: txError } = await supabase
            .from('transactions')
            .select('*')
            .eq('type', 'expense')
            .gte('created_at', start)
            .lte('created_at', end);

        if (txError) throw txError;

        const budgets: BudgetStatus[] = (categories || []).map(
            (cat: Category) => {
                const spent = (transactions || [])
                    .filter((tx: Transaction) => tx.category_id === cat.id)
                    .reduce((sum: number, tx: Transaction) => sum + tx.amount, 0);

                return {
                    category: cat,
                    spent,
                    limit: cat.monthly_limit,
                    percentage:
                        cat.monthly_limit > 0
                            ? Math.round((spent / cat.monthly_limit) * 100)
                            : 0,
                };
            }
        );

        return { success: true, data: budgets };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function updateCategory(
    id: string,
    updates: { name?: string; icon?: string; monthly_limit?: number }
): Promise<ActionResult<void>> {
    try {
        const supabase = await createClient();
        const { error } = await supabase
            .from('categories')
            .update(updates)
            .eq('id', id);
        if (error) throw error;
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function getUncategorizedTransactions(): Promise<ActionResult<Transaction[]>> {
    try {
        const supabase = await createClient();

        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (!authUser) return { success: false, error: 'Not authenticated' };

        const { data: currentUser } = await supabase
            .from('users')
            .select('id')
            .eq('auth_id', authUser.id)
            .single();

        if (!currentUser) return { success: true, data: [] };

        const { data: uncat } = await supabase
            .from('categories')
            .select('id')
            .eq('name', 'Chưa phân loại')
            .eq('type', 'expense')
            .single();

        if (!uncat) {
            return { success: true, data: [] };
        }

        const { data, error } = await supabase
            .from('transactions')
            .select('*, category:categories(*), user:users(*)')
            .eq('category_id', uncat.id)
            .eq('user_id', currentUser.id)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return { success: true, data: data || [] };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function updateTransactionCategory(
    transactionId: string,
    newCategoryId: string
): Promise<ActionResult<void>> {
    try {
        const supabase = await createClient();

        const { error } = await supabase
            .from('transactions')
            .update({ category_id: newCategoryId })
            .eq('id', transactionId);

        if (error) throw error;
        return { success: true };
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

        const { data: repaymentCat, error: catError } = await supabase
            .from('categories')
            .select('id')
            .eq('name', 'Debt Repayment')
            .eq('type', 'income')
            .single();

        if (catError || !repaymentCat) {
            throw new Error('Debt Repayment category not found. Please create an income category called "Debt Repayment".');
        }

        const { error: updateError } = await supabase
            .from('debts')
            .update({
                status: 'resolved',
                resolved_at: new Date().toISOString(),
            })
            .eq('id', debtId);

        if (updateError) throw updateError;

        const { error: txError } = await supabase
            .from('transactions')
            .insert({
                user_id: debt.user_id,
                category_id: repaymentCat.id,
                amount: debt.amount,
                type: 'income',
                note: `Debt repaid by ${debt.debtor_name}`,
            });

        if (txError) throw txError;

        const { data: user } = await supabase
            .from('users')
            .select('total_balance')
            .eq('id', debt.user_id)
            .single();

        if (user) {
            await supabase
                .from('users')
                .update({ total_balance: user.total_balance + debt.amount })
                .eq('id', debt.user_id);
        }

        return { success: true };
    } catch (error: any) {
        console.error('resolveDebt error:', error);
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

export async function getCategoryExpenseStats(): Promise<ActionResult<{
    category: string;
    icon: string;
    amount: number;
    color: string;
}[]>> {
    try {
        const supabase = await createClient();
        const { start, end } = getCurrentMonthRange();

        const { data: transactions, error: txError } = await supabase
            .from('transactions')
            .select('*, category:categories(*)')
            .eq('type', 'expense')
            .gte('created_at', start)
            .lte('created_at', end);

        if (txError) throw txError;

        const categoryMap = new Map<string, { name: string; icon: string; amount: number }>();

        for (const tx of transactions || []) {
            const cat = tx.category;
            const key = cat?.id || 'unknown';
            const existing = categoryMap.get(key);
            if (existing) {
                existing.amount += tx.amount;
            } else {
                categoryMap.set(key, {
                    name: cat?.name || 'Khác',
                    icon: cat?.icon || '❓',
                    amount: tx.amount,
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
