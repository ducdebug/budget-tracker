export interface User {
    id: string;
    auth_id: string;
    email: string;
    name: string;
    avatar: string;
    avatar_url: string | null;
    total_balance: number;
    is_admin: boolean;
    created_at: string;
    updated_at: string;
}

export interface Category {
    id: string;
    name: string;
    icon: string;
    type: 'income' | 'expense';
    monthly_limit: number;
    created_at: string;
}

export interface Transaction {
    id: string;
    user_id: string;
    category_id: string;
    amount: number;
    type: 'income' | 'expense';
    note: string;
    created_at: string;
    category?: Category;
    user?: User;
}

export interface Debt {
    id: string;
    user_id: string;
    debtor_name: string;
    amount: number;
    note: string;
    status: 'pending' | 'resolved';
    resolved_at: string | null;
    created_at: string;
    user?: User;
}

export interface AppSettings {
    registration_enabled: boolean;
    allow_balance_edit: boolean;
}

export interface UserFinanceSummary {
    user: User;
    totalIncome: number;   
    totalExpense: number;  
    balance: number;       
    savingRate: number;    
}

export interface BudgetStatus {
    category: Category;
    spent: number;
    limit: number;
    percentage: number; 
}

export interface AddTransactionInput {
    user_id: string;
    category_id: string;
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

export interface AddCategoryInput {
    name: string;
    icon: string;
    type: 'income' | 'expense';
    monthly_limit?: number;
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
