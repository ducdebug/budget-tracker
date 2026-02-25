'use client';

import { useState } from 'react';
import { Pencil, Check, X, Users } from 'lucide-react';
import { updateCategory, upsertUserCategoryLimit } from '@/lib/actions';
import type { BudgetStatus } from '@/lib/types';

const BUDGET_ICONS = [
    '🍔', '🍕', '🍜', '☕', '🚗', '🛵', '⛽', '🛒',
    '👗', '🏠', '💡', '💊', '🎬', '🎮', '📚', '💰',
    '💳', '🏖️', '🐶', '❤️', '⭐', '🔥', '🎉', '📱',
];

const USER_COLORS = ['#6366f1', '#ec4899', '#f59e0b', '#10b981'];

interface BudgetOverviewProps {
    budgets: BudgetStatus[];
    onUpdate?: () => void;
}

export function BudgetOverview({ budgets, onUpdate }: BudgetOverviewProps) {
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editLimit, setEditLimit] = useState('');
    const [editIcon, setEditIcon] = useState('');
    const [showIconPicker, setShowIconPicker] = useState(false);
    const [saving, setSaving] = useState(false);
    // Per-user limit editing
    const [editingUserLimits, setEditingUserLimits] = useState<Record<string, string>>({});

    const startEdit = (budget: BudgetStatus) => {
        setEditingId(budget.category.id);
        setEditLimit(budget.limit.toString());
        setEditIcon(budget.category.icon);
        setShowIconPicker(false);
        const userLimits: Record<string, string> = {};
        budget.perUser.forEach(u => {
            userLimits[u.userId] = u.limit.toString();
        });
        setEditingUserLimits(userLimits);
    };

    const cancelEdit = () => {
        setEditingId(null);
        setShowIconPicker(false);
        setEditingUserLimits({});
    };

    const handleSave = async (budget: BudgetStatus) => {
        setSaving(true);

        const catUpdates: { icon?: string; monthly_limit?: number } = {};
        const newLimit = parseInt(editLimit) || 0;
        if (newLimit !== budget.limit) catUpdates.monthly_limit = newLimit;
        if (editIcon !== budget.category.icon) catUpdates.icon = editIcon;

        if (Object.keys(catUpdates).length > 0) {
            await updateCategory(budget.category.id, catUpdates);
        }

        const userLimitPromises = budget.perUser.map(async (u) => {
            const newUserLimit = parseInt(editingUserLimits[u.userId] || '0') || 0;
            if (newUserLimit !== u.limit) {
                await upsertUserCategoryLimit(u.userId, budget.category.id, newUserLimit);
            }
        });
        await Promise.all(userLimitPromises);

        setSaving(false);
        cancelEdit();
        onUpdate?.();
    };

    if (budgets.length === 0) {
        return (
            <div className="px-6 py-4">
                <h2 className="text-lg font-bold text-foreground mb-4">📊 Ngân sách</h2>
                <p className="text-sm text-muted-foreground text-center py-6">
                    Chưa có danh mục nào đặt hạn mức.
                </p>
            </div>
        );
    }

    return (
        <div className="px-6 py-4">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-foreground">📊 Ngân sách</h2>
                <span className="text-xs text-muted-foreground font-medium">
                    Tháng này
                </span>
            </div>

            <div className="space-y-3">
                {budgets.map((budget) => {
                    const isOver = budget.percentage >= 100;
                    const isWarning = budget.percentage >= 75 && budget.percentage < 100;
                    const isEditing = editingId === budget.category.id;
                    const allUsers = budget.perUser || [];
                    const activeUsers = allUsers.filter(u => u.spent > 0);

                    return (
                        <div
                            key={budget.category.id}
                            className="bg-card rounded-2xl p-4 border border-dashed border-muted shadow-sm"
                        >
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    {isEditing ? (
                                        <button
                                            onClick={() => setShowIconPicker(!showIconPicker)}
                                            className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-lg hover:bg-muted/80 transition-colors"
                                        >
                                            {editIcon}
                                        </button>
                                    ) : (
                                        <span className="text-lg">{budget.category.icon}</span>
                                    )}
                                    <span className="text-sm font-medium text-foreground">
                                        {budget.category.name}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    {budget.limit > 0 && (
                                        <span
                                            className={`text-xs font-bold px-2 py-0.5 rounded-full ${isOver
                                                ? 'bg-red-100 text-red-600'
                                                : isWarning
                                                    ? 'bg-amber-100 text-amber-600'
                                                    : 'bg-green-100 text-green-600'
                                                }`}
                                        >
                                            {budget.percentage}%
                                        </span>
                                    )}
                                    {!isEditing && (
                                        <button
                                            onClick={() => startEdit(budget)}
                                            className="p-1 rounded-full hover:bg-muted transition-colors"
                                        >
                                            <Pencil size={12} className="text-muted-foreground" />
                                        </button>
                                    )}
                                </div>
                            </div>

                            {isEditing && showIconPicker && (
                                <div className="mb-2 p-2 bg-muted/50 rounded-xl border border-border max-h-24 overflow-y-auto">
                                    <div className="grid grid-cols-8 gap-1">
                                        {BUDGET_ICONS.map((icon) => (
                                            <button
                                                key={icon}
                                                type="button"
                                                onClick={() => {
                                                    setEditIcon(icon);
                                                    setShowIconPicker(false);
                                                }}
                                                className={`w-7 h-7 rounded text-sm flex items-center justify-center ${editIcon === icon ? 'bg-primary/20 ring-1 ring-primary' : 'hover:bg-card'}`}
                                            >
                                                {icon}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="space-y-2 mb-2">
                                {allUsers.map((u, idx) => {
                                    const userIsOver = u.percentage >= 100;
                                    const userIsWarning = u.percentage >= 75 && u.percentage < 100;
                                    const barColor = u.limit > 0
                                        ? userIsOver ? '#ef4444' : USER_COLORS[idx % USER_COLORS.length]
                                        : USER_COLORS[idx % USER_COLORS.length];
                                    const barWidth = u.limit > 0
                                        ? Math.min(u.percentage, 100)
                                        : (budget.limit > 0 ? Math.min((u.spent / budget.limit) * 100, 100) : 0);

                                    return (
                                        <div key={u.userId}>
                                            <div className="flex items-center gap-1.5 mb-0.5">
                                                <div
                                                    className="w-2 h-2 rounded-full flex-shrink-0"
                                                    style={{ backgroundColor: USER_COLORS[idx % USER_COLORS.length] }}
                                                />
                                                <span className="text-[11px] text-muted-foreground truncate min-w-0 flex-1">
                                                    {u.userName}
                                                </span>
                                                <span className="text-[11px] font-semibold text-foreground">
                                                    {u.spent.toLocaleString()}₫
                                                </span>
                                                {u.limit > 0 ? (
                                                    <span className="text-[10px] text-muted-foreground">
                                                        / {u.limit.toLocaleString()}₫
                                                    </span>
                                                ) : (
                                                    <span className="text-[9px] text-muted-foreground/50">
                                                        (chưa đặt)
                                                    </span>
                                                )}
                                                {u.limit > 0 && (
                                                    <span className={`text-[9px] font-bold ${userIsOver ? 'text-red-500' : userIsWarning ? 'text-amber-500' : 'text-green-500'}`}>
                                                        {u.percentage}%
                                                    </span>
                                                )}
                                            </div>
                                            <div className="ml-3.5 w-[calc(100%-14px)] bg-gray-200 rounded-full h-1.5 overflow-hidden">
                                                <div
                                                    className="h-full rounded-full transition-all duration-500"
                                                    style={{
                                                        width: `${barWidth}%`,
                                                        backgroundColor: barColor,
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {budget.limit > 0 && (
                                <div className="mt-2 pt-2 border-t border-border/30">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-[10px] text-muted-foreground font-medium">
                                            Tổng nhóm
                                        </span>
                                        <span className="text-[10px] text-muted-foreground">
                                            {budget.spent.toLocaleString()}₫ / {budget.limit.toLocaleString()}₫
                                        </span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden flex">
                                        {activeUsers.map((u, idx) => {
                                            const userWidth = Math.min((u.spent / budget.limit) * 100, 100);
                                            return (
                                                <div
                                                    key={u.userId}
                                                    className="h-full transition-all duration-500 first:rounded-l-full last:rounded-r-full"
                                                    style={{
                                                        width: `${userWidth}%`,
                                                        backgroundColor: isOver
                                                            ? '#ef4444'
                                                            : USER_COLORS[allUsers.findIndex(au => au.userId === u.userId) % USER_COLORS.length],
                                                    }}
                                                />
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {isEditing ? (
                                <div className="mt-3 pt-3 border-t border-border/50 space-y-3">
                                    <div>
                                        <label className="text-[10px] text-muted-foreground font-medium block mb-1">
                                            🏷️ Hạn mức chung (₫)
                                        </label>
                                        <input
                                            type="number"
                                            value={editLimit}
                                            onChange={(e) => setEditLimit(e.target.value)}
                                            className="w-full py-1.5 px-2.5 rounded-lg border border-border bg-muted/30 focus:border-primary focus:outline-none text-xs font-bold"
                                            min="0"
                                            placeholder="0 = không đặt"
                                        />
                                    </div>

                                    <div>
                                        <label className="text-[10px] text-muted-foreground font-medium flex items-center gap-1 mb-1.5">
                                            <Users size={10} />
                                            Hạn mức cá nhân (₫)
                                        </label>
                                        <div className="space-y-1.5">
                                            {allUsers.map((u, idx) => (
                                                <div key={u.userId} className="flex items-center gap-2">
                                                    <div
                                                        className="w-2 h-2 rounded-full flex-shrink-0"
                                                        style={{ backgroundColor: USER_COLORS[idx % USER_COLORS.length] }}
                                                    />
                                                    <span className="text-[11px] text-foreground min-w-[60px] truncate">
                                                        {u.userName}
                                                    </span>
                                                    <input
                                                        type="number"
                                                        value={editingUserLimits[u.userId] || '0'}
                                                        onChange={(e) => setEditingUserLimits(prev => ({
                                                            ...prev,
                                                            [u.userId]: e.target.value,
                                                        }))}
                                                        className="flex-1 py-1 px-2 rounded-lg border border-border bg-muted/30 focus:border-primary focus:outline-none text-xs font-bold text-right"
                                                        min="0"
                                                        placeholder="0"
                                                    />
                                                    <span className="text-[10px] text-muted-foreground">₫</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="flex gap-2 justify-end">
                                        <button
                                            onClick={() => handleSave(budget)}
                                            disabled={saving}
                                            className="px-3 py-1.5 rounded-full bg-green-500 text-white text-xs font-semibold hover:bg-green-600 transition-colors disabled:opacity-50 flex items-center gap-1"
                                        >
                                            {saving ? (
                                                <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                            ) : (
                                                <Check size={12} />
                                            )}
                                            Lưu
                                        </button>
                                        <button
                                            onClick={cancelEdit}
                                            className="px-3 py-1.5 rounded-full bg-gray-200 text-gray-600 text-xs font-semibold hover:bg-gray-300 transition-colors flex items-center gap-1"
                                        >
                                            <X size={12} />
                                            Hủy
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                !budget.limit && !allUsers.some(u => u.limit > 0) && (
                                    <div className="flex justify-center mt-1">
                                        <span className="text-[10px] text-muted-foreground/50">
                                            Chưa đặt hạn mức
                                        </span>
                                    </div>
                                )
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
