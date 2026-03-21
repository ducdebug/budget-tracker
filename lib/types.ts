export interface User {
    id: string;
    auth_id: string;
    email: string;
    name: string;
    avatar: string;
    avatar_url: string | null;
    total_balance: number;
    stashed_amount: number;
    is_admin: boolean;
    created_at: string;
    updated_at: string;
}

export interface Transaction {
    id: string;
    user_id: string;
    amount: number;
    type: 'income' | 'expense';
    note: string;
    created_at: string;
    user?: User;
}

export interface Debt {
    id: string;
    user_id: string;
    debtor_name: string;
    amount: number;
    original_amount: number;
    paid_amount: number;
    note: string;
    status: 'pending' | 'resolved';
    resolved_at: string | null;
    created_at: string;
    user?: User;
}

export interface AppSettings {
    registration_enabled: boolean;
    allow_balance_edit: boolean;
    stash_name: string;
}

export interface UserFinanceSummary {
    user: User;
    totalIncome: number;
    totalExpense: number;
    balance: number;
    savingRate: number;
}

export interface AddTransactionInput {
    user_id: string;
    amount: number;
    type: 'income' | 'expense';
    note?: string;
}

export interface AddDebtInput {
    user_id: string;
    debtor_name: string;
    amount: number;
    note?: string;
}

export interface UpdateUserInput {
    id: string;
    name: string;
    total_balance: number;
}

export interface UpdateProfileInput {
    name?: string;
    avatar_url?: string | null;
}

export interface ActionResult<T = void> {
    success: boolean;
    data?: T;
    error?: string;
}

export interface MonthlyHistory {
    month: string;
    label: string;
    totalIncome: number;
    totalExpense: number;
    netChange: number;
    perUser: {
        userId: string;
        userName: string;
        income: number;
        expense: number;
        net: number;
    }[];
}

export interface MonthlyBalanceSummary {
    month: string;
    label: string;
    totalExpense: number;
    perUser: {
        userId: string;
        userName: string;
        endBalance: number;
        totalIncome: number;
        totalExpense: number;
        netChange: number;
    }[];
    combinedBalance: number;
}
