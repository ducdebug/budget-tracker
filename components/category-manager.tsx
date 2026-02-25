'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, X, Trash2, Pencil, Check } from 'lucide-react';
import { addCategory, deleteCategory, updateCategory, getBudgetStatus } from '@/lib/actions';
import type { Category, BudgetStatus } from '@/lib/types';

const POPULAR_ICONS = [
    '🍔', '🍕', '🍜', '🍣', '☕', '🧋', '🍰', '🥗',
    '🚗', '🛵', '⛽', '🚌', '✈️', '🚕', '🚂', '🅿️',
    '🛒', '👗', '👟', '💄', '🎁', '🛍️', '💎', '🧴',
    '🏠', '💡', '🔧', '🧹', '🪴', '🛋️', '🚿', '🏗️',
    '💊', '🏥', '🏋️', '🧘', '🦷', '👓', '💉', '🩺',
    '🎬', '🎮', '🎵', '📚', '🎯', '🎭', '🎨', '🏈',
    '📖', '🎓', '💻', '📝', '🎒', '✏️', '📐', '🔬',
    '💰', '💳', '📈', '🏦', '💸', '🪙', '📊', '🧾',
    '🏖️', '⛰️', '🏕️', '🗺️', '📸', '🌍', '🎫', '🏨',
    '🐶', '🐱', '🐟', '🐦', '🐰', '🐹', '🦮', '🐾',
    '❤️', '⭐', '🔥', '🎉', '💼', '📱', '🏆', '🌸',
];

interface CategoryManagerProps {
    categories: Category[];
    onUpdate: () => void;
}

export function CategoryManager({ categories, onUpdate }: CategoryManagerProps) {
    const [showAddForm, setShowAddForm] = useState(false);
    const [newName, setNewName] = useState('');
    const [newIcon, setNewIcon] = useState('');
    const [newType, setNewType] = useState<'expense' | 'income'>('expense');
    const [newLimit, setNewLimit] = useState('');
    const [showIconPicker, setShowIconPicker] = useState(false);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState<string | null>(null);
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    const [editingId, setEditingId] = useState<string | null>(null);
    const [editName, setEditName] = useState('');
    const [editIcon, setEditIcon] = useState('');
    const [editLimit, setEditLimit] = useState('');
    const [showEditIconPicker, setShowEditIconPicker] = useState(false);
    const [savingEdit, setSavingEdit] = useState(false);

    const [budgets, setBudgets] = useState<BudgetStatus[]>([]);

    const expenseCategories = categories.filter((c) => c.type === 'expense');
    const incomeCategories = categories.filter((c) => c.type === 'income');

    const fetchBudgets = useCallback(async () => {
        const res = await getBudgetStatus();
        if (res.success && res.data) setBudgets(res.data);
    }, []);

    useEffect(() => {
        fetchBudgets();
    }, [fetchBudgets, categories]);

    const getBudgetForCategory = (categoryId: string): BudgetStatus | undefined => {
        return budgets.find(b => b.category.id === categoryId);
    };

    const getSpentForCategory = (categoryId: string): number => {
        const budget = getBudgetForCategory(categoryId);
        return budget?.spent || 0;
    };

    const resetForm = () => {
        setNewName('');
        setNewIcon('');
        setNewType('expense');
        setNewLimit('');
        setShowIconPicker(false);
        setError('');
    };

    const handleAdd = async () => {
        if (!newName.trim()) {
            setError('Tên danh mục không được để trống');
            return;
        }
        if (!newIcon) {
            setError('Vui lòng chọn icon');
            return;
        }

        setSaving(true);
        setError('');

        const result = await addCategory({
            name: newName.trim(),
            icon: newIcon,
            type: newType,
            monthly_limit: newType === 'expense' && newLimit ? parseInt(newLimit) : 0,
        });

        setSaving(false);

        if (result.success) {
            resetForm();
            setShowAddForm(false);
            setSuccessMsg('✅ Đã tạo danh mục mới!');
            onUpdate();
            fetchBudgets();
            setTimeout(() => setSuccessMsg(''), 3000);
        } else {
            setError(result.error || 'Lỗi khi tạo danh mục');
        }
    };

    const handleDelete = async (categoryId: string) => {
        setDeleting(categoryId);
        const result = await deleteCategory(categoryId);
        setDeleting(null);

        if (result.success) {
            setSuccessMsg('🗑️ Đã xóa danh mục!');
            onUpdate();
            fetchBudgets();
            setTimeout(() => setSuccessMsg(''), 3000);
        } else {
            setError(result.error || 'Lỗi khi xóa');
            setTimeout(() => setError(''), 3000);
        }
    };

    const startEdit = (cat: Category) => {
        setEditingId(cat.id);
        setEditName(cat.name);
        setEditIcon(cat.icon);
        setEditLimit(cat.monthly_limit?.toString() || '0');
        setShowEditIconPicker(false);
        setError('');
    };

    const cancelEdit = () => {
        setEditingId(null);
        setShowEditIconPicker(false);
    };

    const handleSaveEdit = async (cat: Category) => {
        if (!editName.trim()) {
            setError('Tên danh mục không được để trống');
            return;
        }

        setSavingEdit(true);
        setError('');

        const updates: { name?: string; icon?: string; monthly_limit?: number } = {};
        if (editName.trim() !== cat.name) updates.name = editName.trim();
        if (editIcon !== cat.icon) updates.icon = editIcon;
        if (cat.type === 'expense') {
            const newLimitVal = parseInt(editLimit) || 0;
            if (newLimitVal !== cat.monthly_limit) updates.monthly_limit = newLimitVal;
        }

        if (Object.keys(updates).length === 0) {
            cancelEdit();
            setSavingEdit(false);
            return;
        }

        const result = await updateCategory(cat.id, updates);
        setSavingEdit(false);

        if (result.success) {
            cancelEdit();
            setSuccessMsg('✅ Đã cập nhật danh mục!');
            onUpdate();
            fetchBudgets();
            setTimeout(() => setSuccessMsg(''), 3000);
        } else {
            setError(result.error || 'Lỗi khi cập nhật');
        }
    };

    const USER_COLORS = ['#6366f1', '#ec4899', '#f59e0b', '#10b981'];

    const renderBudgetBar = (cat: Category) => {
        if (cat.type !== 'expense') return null;

        const budget = getBudgetForCategory(cat.id);
        const spent = budget?.spent || 0;
        const limit = cat.monthly_limit || 0;
        const percentage = limit > 0 ? Math.round((spent / limit) * 100) : 0;
        const isOver = percentage >= 100;
        const isWarning = percentage >= 75 && percentage < 100;
        const perUser = budget?.perUser || [];
        const activeUsers = perUser.filter(u => u.spent > 0);

        return (
            <div className="mt-2 pt-2 border-t border-border/50">
                {perUser.length > 0 && (
                    <div className="space-y-1.5 mb-1.5">
                        {perUser.filter(u => u.spent > 0 || u.limit > 0).map((u, idx) => {
                            const userIsOver = u.percentage >= 100;
                            const userIsWarning = u.percentage >= 75 && u.percentage < 100;
                            const barColor = u.limit > 0
                                ? userIsOver ? '#ef4444' : USER_COLORS[idx % USER_COLORS.length]
                                : USER_COLORS[idx % USER_COLORS.length];
                            const barWidth = u.limit > 0
                                ? Math.min(u.percentage, 100)
                                : (limit > 0 ? Math.min((u.spent / limit) * 100, 100) : 0);

                            return (
                                <div key={u.userId}>
                                    <div className="flex items-center gap-1.5">
                                        <div
                                            className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                                            style={{ backgroundColor: USER_COLORS[idx % USER_COLORS.length] }}
                                        />
                                        <span className="text-[10px] text-muted-foreground truncate min-w-0 flex-1">
                                            {u.userName}
                                        </span>
                                        <span className="text-[10px] font-semibold text-foreground">
                                            {u.spent.toLocaleString()}₫
                                        </span>
                                        {u.limit > 0 ? (
                                            <>
                                                <span className="text-[9px] text-muted-foreground">
                                                    / {u.limit.toLocaleString()}₫
                                                </span>
                                                <span className={`text-[9px] font-bold ${userIsOver ? 'text-red-500' : userIsWarning ? 'text-amber-500' : 'text-green-500'}`}>
                                                    {u.percentage}%
                                                </span>
                                            </>
                                        ) : limit > 0 ? (
                                            <span className="text-[9px] text-muted-foreground">
                                                ({Math.round((u.spent / limit) * 100)}%)
                                            </span>
                                        ) : null}
                                    </div>
                                    {(u.limit > 0 || limit > 0) && (
                                        <div className="ml-3 w-[calc(100%-12px)] bg-gray-200 rounded-full h-1 overflow-hidden mt-0.5">
                                            <div
                                                className="h-full rounded-full transition-all duration-500"
                                                style={{
                                                    width: `${barWidth}%`,
                                                    backgroundColor: barColor,
                                                }}
                                            />
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}

                <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] text-muted-foreground">
                        Tổng: {spent.toLocaleString()}₫
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                        {limit > 0 ? (
                            <>Hạn mức chung: {limit.toLocaleString()}₫</>
                        ) : (
                            <span className="text-muted-foreground/50">Chưa đặt hạn mức</span>
                        )}
                    </span>
                </div>
                {limit > 0 ? (
                    <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden flex">
                        {activeUsers.map((u, idx) => {
                            const userWidth = limit > 0 ? Math.min((u.spent / limit) * 100, 100) : 0;
                            const totalSoFar = activeUsers
                                .slice(0, idx + 1)
                                .reduce((s, x) => s + x.spent, 0);
                            const cappedWidth = totalSoFar > limit
                                ? Math.max(0, userWidth - ((totalSoFar - limit) / limit) * 100)
                                : userWidth;
                            return (
                                <div
                                    key={u.userId}
                                    className="h-full transition-all duration-500 first:rounded-l-full last:rounded-r-full"
                                    style={{
                                        width: `${cappedWidth}%`,
                                        backgroundColor: isOver
                                            ? '#ef4444'
                                            : USER_COLORS[perUser.findIndex(pu => pu.userId === u.userId) % USER_COLORS.length],
                                    }}
                                />
                            );
                        })}
                    </div>
                ) : (
                    <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                        <div className="h-full rounded-full bg-gray-300" style={{ width: '0%' }} />
                    </div>
                )}
                {limit > 0 && (
                    <div className="flex justify-end mt-0.5">
                        <span className={`text-[10px] font-bold ${isOver ? 'text-red-500' : isWarning ? 'text-amber-500' : 'text-green-500'
                            }`}>
                            {percentage}%
                        </span>
                    </div>
                )}
            </div>
        );
    };

    const renderCategoryList = (cats: Category[], title: string, emoji: string, isExpense: boolean) => (
        <div className="mb-5">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                {emoji} {title} ({cats.length})
            </h3>
            {cats.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-3 bg-muted/30 rounded-xl">
                    Chưa có danh mục nào
                </p>
            ) : (
                <div className="space-y-2">
                    {cats.map((cat) => (
                        <div key={cat.id}>
                            {editingId === cat.id ? (
                                <div className="bg-blue-50/50 rounded-2xl p-3.5 border border-blue-200 shadow-sm space-y-2.5 overflow-hidden">
                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setShowEditIconPicker(!showEditIconPicker)}
                                            className="w-10 h-10 rounded-xl bg-white border border-border flex items-center justify-center text-xl hover:bg-muted/50 transition-colors flex-shrink-0 shadow-sm"
                                        >
                                            {editIcon}
                                        </button>
                                        <input
                                            type="text"
                                            value={editName}
                                            onChange={(e) => setEditName(e.target.value)}
                                            className="flex-1 min-w-0 py-2 px-3 rounded-xl border border-border bg-white focus:border-blue-400 focus:ring-1 focus:ring-blue-100 focus:outline-none text-sm font-medium shadow-sm"
                                        />
                                        <button
                                            onClick={() => handleSaveEdit(cat)}
                                            disabled={savingEdit}
                                            className="p-2 rounded-xl bg-blue-500 text-white hover:bg-blue-600 transition-colors disabled:opacity-50 shadow-sm flex-shrink-0"
                                        >
                                            <Check size={14} />
                                        </button>
                                        <button onClick={cancelEdit} className="p-2 rounded-xl bg-white border border-border text-gray-500 hover:bg-gray-50 transition-colors shadow-sm flex-shrink-0">
                                            <X size={14} />
                                        </button>
                                    </div>

                                    {showEditIconPicker && (
                                        <div className="p-2.5 bg-white rounded-xl border border-border max-h-36 overflow-y-auto shadow-sm">
                                            <div className="grid grid-cols-8 gap-1">
                                                {POPULAR_ICONS.map((icon) => (
                                                    <button
                                                        key={icon}
                                                        type="button"
                                                        onClick={() => {
                                                            setEditIcon(icon);
                                                            setShowEditIconPicker(false);
                                                        }}
                                                        className={`w-8 h-8 rounded-lg flex items-center justify-center text-base transition-all hover:scale-110 ${editIcon === icon ? 'bg-blue-100 ring-2 ring-blue-400' : 'hover:bg-gray-100'}`}
                                                    >
                                                        {icon}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {cat.type === 'expense' && (
                                        <div>
                                            <label className="text-[10px] text-muted-foreground font-medium mb-1 block">Hạn mức chung (₫)</label>
                                            <input
                                                type="number"
                                                value={editLimit}
                                                onChange={(e) => setEditLimit(e.target.value)}
                                                className="w-full py-2 px-3 rounded-xl border border-border bg-white focus:border-blue-400 focus:ring-1 focus:ring-blue-100 focus:outline-none text-sm shadow-sm"
                                                min="0"
                                                placeholder="0 = không đặt"
                                            />
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="bg-card rounded-2xl p-3 border border-border shadow-sm transition-all hover:shadow-md">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 min-w-0">
                                            <span className="text-xl flex-shrink-0">{cat.icon}</span>
                                            <div className="min-w-0">
                                                <p className="text-xs font-semibold text-foreground truncate">{cat.name}</p>
                                                {cat.type === 'expense' && cat.monthly_limit > 0 && (
                                                    <p className="text-[10px] text-muted-foreground">
                                                        Hạn mức: {cat.monthly_limit.toLocaleString()}₫
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => startEdit(cat)}
                                                className="p-1.5 rounded-full hover:bg-blue-50 transition-all active:scale-95"
                                            >
                                                <Pencil size={14} className="text-blue-400" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(cat.id)}
                                                disabled={deleting === cat.id}
                                                className="p-1.5 rounded-full hover:bg-red-50 transition-all active:scale-95 disabled:opacity-50"
                                            >
                                                {deleting === cat.id ? (
                                                    <div className="w-3.5 h-3.5 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                                                ) : (
                                                    <Trash2 size={14} className="text-red-400" />
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                    {isExpense && renderBudgetBar(cat)}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );

    return (
        <div className="px-6 py-4">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-foreground">📂 Danh mục</h2>
                <button
                    onClick={() => {
                        resetForm();
                        setShowAddForm(!showAddForm);
                    }}
                    className="text-sm font-semibold text-primary bg-primary/10 px-3 py-1.5 rounded-full hover:bg-primary/20 transition-colors active:scale-95"
                >
                    {showAddForm ? 'Đóng' : '+ Tạo mới'}
                </button>
            </div>

            {successMsg && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-2xl">
                    <p className="text-sm text-green-700 font-medium text-center">{successMsg}</p>
                </div>
            )}

            {error && !showAddForm && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-2xl">
                    <p className="text-sm text-red-600 font-medium text-center">{error}</p>
                </div>
            )}

            {showAddForm && (
                <div className="bg-card rounded-2xl p-4 border-2 border-primary/20 shadow-md mb-5 animate-slide-up">
                    <h3 className="text-sm font-bold text-foreground mb-3">🆕 Tạo danh mục mới</h3>

                    <div className="flex gap-2 bg-muted rounded-2xl p-1 mb-3">
                        <button
                            type="button"
                            onClick={() => setNewType('expense')}
                            className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all ${newType === 'expense'
                                ? 'bg-red-500 text-white shadow-md'
                                : 'text-muted-foreground hover:text-foreground'
                                }`}
                        >
                            💸 Chi tiêu
                        </button>
                        <button
                            type="button"
                            onClick={() => setNewType('income')}
                            className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all ${newType === 'income'
                                ? 'bg-green-500 text-white shadow-md'
                                : 'text-muted-foreground hover:text-foreground'
                                }`}
                        >
                            💰 Thu nhập
                        </button>
                    </div>

                    <div className="mb-3">
                        <label className="text-xs font-medium text-muted-foreground mb-1 block">
                            Tên danh mục
                        </label>
                        <input
                            type="text"
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            placeholder="VD: Trà sữa, Xăng xe..."
                            className="w-full py-2.5 px-3 rounded-xl border-2 border-border bg-muted/30 focus:border-primary focus:outline-none transition-colors text-sm"
                        />
                    </div>

                    <div className="mb-3">
                        <label className="text-xs font-medium text-muted-foreground mb-1 block">
                            Chọn icon
                        </label>
                        <button
                            type="button"
                            onClick={() => setShowIconPicker(!showIconPicker)}
                            className="w-full py-2.5 px-3 rounded-xl border-2 border-border bg-muted/30 hover:border-primary/30 transition-colors text-sm text-left flex items-center gap-2"
                        >
                            {newIcon ? (
                                <>
                                    <span className="text-2xl">{newIcon}</span>
                                    <span className="text-muted-foreground">Tap để đổi icon</span>
                                </>
                            ) : (
                                <span className="text-muted-foreground">Tap để chọn icon...</span>
                            )}
                        </button>

                        {showIconPicker && (
                            <div className="mt-2 p-3 bg-muted/50 rounded-xl border border-border max-h-48 overflow-y-auto">
                                <div className="grid grid-cols-8 gap-1.5">
                                    {POPULAR_ICONS.map((icon) => (
                                        <button
                                            key={icon}
                                            type="button"
                                            onClick={() => {
                                                setNewIcon(icon);
                                                setShowIconPicker(false);
                                            }}
                                            className={`w-9 h-9 rounded-lg flex items-center justify-center text-lg transition-all hover:scale-110 active:scale-95 ${newIcon === icon
                                                ? 'bg-primary/20 ring-2 ring-primary'
                                                : 'hover:bg-card'
                                                }`}
                                        >
                                            {icon}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {newType === 'expense' && (
                        <div className="mb-3">
                            <label className="text-xs font-medium text-muted-foreground mb-1 block">
                                Hạn mức hàng tháng (₫) <span className="text-muted-foreground/60">— không bắt buộc</span>
                            </label>
                            <input
                                type="number"
                                value={newLimit}
                                onChange={(e) => setNewLimit(e.target.value)}
                                placeholder="VD: 500000"
                                className="w-full py-2.5 px-3 rounded-xl border-2 border-border bg-muted/30 focus:border-primary focus:outline-none transition-colors text-sm"
                                min="0"
                            />
                        </div>
                    )}

                    {error && (
                        <p className="text-red-500 text-xs font-medium mb-3">{error}</p>
                    )}

                    <div className="flex gap-2">
                        <button
                            onClick={handleAdd}
                            disabled={saving}
                            className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm shadow-lg hover:opacity-90 transition-all disabled:opacity-50 active:scale-[0.98] flex items-center justify-center gap-2"
                        >
                            {saving ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    Đang tạo...
                                </>
                            ) : (
                                <>
                                    <Plus size={16} />
                                    Tạo danh mục
                                </>
                            )}
                        </button>
                        <button
                            onClick={() => {
                                resetForm();
                                setShowAddForm(false);
                            }}
                            className="py-3 px-4 rounded-xl bg-muted text-muted-foreground font-semibold text-sm hover:bg-muted/80 transition-all active:scale-[0.98]"
                        >
                            <X size={16} />
                        </button>
                    </div>
                </div>
            )}

            {renderCategoryList(expenseCategories, 'Chi tiêu', '💸', true)}
            {renderCategoryList(incomeCategories, 'Thu nhập', '💰', false)}
        </div>
    );
}
