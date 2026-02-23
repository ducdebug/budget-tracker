'use client';

import { useState } from 'react';
import { Pencil, Check, X } from 'lucide-react';
import { updateCategory } from '@/lib/actions';
import type { BudgetStatus } from '@/lib/types';

const BUDGET_ICONS = [
    '🍔', '🍕', '🍜', '☕', '🚗', '🛵', '⛽', '🛒',
    '👗', '🏠', '💡', '💊', '🎬', '🎮', '📚', '💰',
    '💳', '🏖️', '🐶', '❤️', '⭐', '🔥', '🎉', '📱',
];

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

    const startEdit = (budget: BudgetStatus) => {
        setEditingId(budget.category.id);
        setEditLimit(budget.limit.toString());
        setEditIcon(budget.category.icon);
        setShowIconPicker(false);
    };

    const cancelEdit = () => {
        setEditingId(null);
        setShowIconPicker(false);
    };

    const handleSave = async (budget: BudgetStatus) => {
        setSaving(true);
        const updates: { icon?: string; monthly_limit?: number } = {};

        const newLimit = parseInt(editLimit) || 0;
        if (newLimit !== budget.limit) updates.monthly_limit = newLimit;
        if (editIcon !== budget.category.icon) updates.icon = editIcon;

        if (Object.keys(updates).length === 0) {
            cancelEdit();
            setSaving(false);
            return;
        }

        const result = await updateCategory(budget.category.id, updates);
        setSaving(false);

        if (result.success) {
            cancelEdit();
            onUpdate?.();
        }
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

                            <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                                <div
                                    className={`h-full rounded-full transition-all duration-500 ${isOver
                                        ? 'bg-red-500'
                                        : isWarning
                                            ? 'bg-amber-400'
                                            : 'bg-green-400'
                                        }`}
                                    style={{ width: `${Math.min(budget.percentage, 100)}%` }}
                                />
                            </div>

                            {isEditing ? (
                                <div className="flex items-center gap-2 mt-2">
                                    <span className="text-xs text-muted-foreground">
                                        {budget.spent.toLocaleString()} ₫ /
                                    </span>
                                    <input
                                        type="number"
                                        value={editLimit}
                                        onChange={(e) => setEditLimit(e.target.value)}
                                        className="w-24 py-1 px-2 rounded-lg border border-border bg-muted/30 focus:border-primary focus:outline-none text-xs font-bold text-right"
                                        min="0"
                                    />
                                    <span className="text-xs text-muted-foreground">₫</span>
                                    <div className="flex-1" />
                                    <button
                                        onClick={() => handleSave(budget)}
                                        disabled={saving}
                                        className="p-1.5 rounded-full bg-green-500 text-white hover:bg-green-600 transition-colors disabled:opacity-50"
                                    >
                                        <Check size={12} />
                                    </button>
                                    <button
                                        onClick={cancelEdit}
                                        className="p-1.5 rounded-full bg-gray-200 text-gray-600 hover:bg-gray-300 transition-colors"
                                    >
                                        <X size={12} />
                                    </button>
                                </div>
                            ) : (
                                <div className="flex justify-between mt-1.5">
                                    <span className="text-xs text-muted-foreground">
                                        {budget.spent.toLocaleString()} ₫
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                        / {budget.limit.toLocaleString()} ₫
                                    </span>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
