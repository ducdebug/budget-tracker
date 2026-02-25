'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
} from 'recharts';
import { getCategoryExpenseStats, getMonthlyUserComparison } from '@/lib/actions';

interface CategoryStat {
    category: string;
    icon: string;
    amount: number;
    color: string;
    perUser: { userId: string; userName: string; amount: number }[];
}

interface MonthlyComparison {
    month: string;
    label: string;
    users: { userId: string; userName: string; expense: number; color: string }[];
}

const USER_COLORS = ['#6366f1', '#ec4899', '#f59e0b', '#10b981'];

export function StatisticsPanel() {
    const [categoryStats, setCategoryStats] = useState<CategoryStat[]>([]);
    const [monthlyData, setMonthlyData] = useState<MonthlyComparison[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        setLoading(true);
        const [catRes, monthRes] = await Promise.all([
            getCategoryExpenseStats(),
            getMonthlyUserComparison(),
        ]);
        if (catRes.success && catRes.data) setCategoryStats(catRes.data);
        if (monthRes.success && monthRes.data) setMonthlyData(monthRes.data);
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const totalExpense = categoryStats.reduce((sum, s) => sum + s.amount, 0);

    const allUsers = categoryStats.length > 0
        ? categoryStats[0].perUser.map(u => u.userName)
        : [];

    const barData = monthlyData.map(m => {
        const entry: any = { label: m.label };
        m.users.forEach(u => {
            entry[u.userName] = u.expense;
        });
        return entry;
    });

    const userNames = monthlyData[0]?.users.map(u => u.userName) || [];
    const userColors = monthlyData[0]?.users.map(u => u.color) || ['#6366f1', '#ec4899'];

    const PieTooltipContent = ({ active, payload }: any) => {
        if (!active || !payload?.length) return null;
        const data = payload[0].payload;
        const percent = totalExpense > 0 ? ((data.amount / totalExpense) * 100).toFixed(1) : '0';
        return (
            <div className="bg-card border border-border rounded-xl px-3 py-2 shadow-lg">
                <p className="text-sm font-semibold text-foreground">
                    {data.icon} {data.category}
                </p>
                <p className="text-xs text-muted-foreground mb-1">
                    {data.amount.toLocaleString()}₫ ({percent}%)
                </p>
                {data.perUser && data.perUser.filter((u: any) => u.amount > 0).map((u: any, idx: number) => (
                    <div key={u.userId} className="flex items-center gap-1.5">
                        <div
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: USER_COLORS[idx % USER_COLORS.length] }}
                        />
                        <span className="text-[11px] text-muted-foreground">
                            {u.userName}: {u.amount.toLocaleString()}₫
                        </span>
                    </div>
                ))}
            </div>
        );
    };

    const BarTooltipContent = ({ active, payload, label }: any) => {
        if (!active || !payload?.length) return null;
        return (
            <div className="bg-card border border-border rounded-xl px-3 py-2 shadow-lg">
                <p className="text-xs font-bold text-foreground mb-1">{label}</p>
                {payload.map((entry: any, i: number) => (
                    <p key={i} className="text-xs" style={{ color: entry.color }}>
                        {entry.name}: {entry.value.toLocaleString()}₫
                    </p>
                ))}
            </div>
        );
    };

    const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, icon, amount }: any) => {
        if (totalExpense > 0 && (amount / totalExpense) < 0.05) return null;
        const RADIAN = Math.PI / 180;
        const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
        const x = cx + radius * Math.cos(-midAngle * RADIAN);
        const y = cy + radius * Math.sin(-midAngle * RADIAN);
        return (
            <text x={x} y={y} textAnchor="middle" dominantBaseline="central" className="text-sm">
                {icon}
            </text>
        );
    };

    if (loading) {
        return (
            <div className="px-6 py-4">
                <h2 className="text-lg font-bold text-foreground mb-4">📊 Thống kê</h2>
                <div className="flex items-center justify-center py-12">
                    <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
                </div>
            </div>
        );
    }

    return (
        <div className="px-6 py-4 space-y-6">
            <h2 className="text-lg font-bold text-foreground">📊 Thống kê</h2>

            <div className="bg-card rounded-2xl p-4 border border-border shadow-sm">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-bold text-foreground">
                        💸 Chi tiêu theo danh mục
                    </h3>
                    <span className="text-xs text-muted-foreground font-medium bg-muted px-2.5 py-1 rounded-full">
                        Tháng này
                    </span>
                </div>

                {categoryStats.length === 0 ? (
                    <div className="text-center py-8">
                        <p className="text-3xl mb-2">📭</p>
                        <p className="text-sm text-muted-foreground">Chưa có chi tiêu nào tháng này</p>
                    </div>
                ) : (
                    <>
                        <div className="text-center mb-2">
                            <p className="text-2xl font-bold text-foreground">
                                {totalExpense.toLocaleString()}₫
                            </p>
                            <p className="text-xs text-muted-foreground">Tổng chi tiêu</p>
                        </div>

                        {allUsers.length > 0 && (
                            <div className="flex items-center justify-center gap-4 mb-3">
                                {allUsers.map((userName, idx) => {
                                    const userTotal = categoryStats.reduce((sum, stat) => {
                                        const userEntry = stat.perUser.find(u => u.userName === userName);
                                        return sum + (userEntry?.amount || 0);
                                    }, 0);
                                    const userPercent = totalExpense > 0
                                        ? ((userTotal / totalExpense) * 100).toFixed(1)
                                        : '0';
                                    return (
                                        <div key={userName} className="text-center">
                                            <div className="flex items-center gap-1.5 justify-center mb-0.5">
                                                <div
                                                    className="w-2.5 h-2.5 rounded-full"
                                                    style={{ backgroundColor: USER_COLORS[idx % USER_COLORS.length] }}
                                                />
                                                <span className="text-xs font-medium text-foreground">{userName}</span>
                                            </div>
                                            <p className="text-sm font-bold" style={{ color: USER_COLORS[idx % USER_COLORS.length] }}>
                                                {userTotal.toLocaleString()}₫
                                            </p>
                                            <p className="text-[10px] text-muted-foreground">{userPercent}%</p>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        <div className="w-full h-[220px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={categoryStats}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={50}
                                        outerRadius={90}
                                        paddingAngle={3}
                                        dataKey="amount"
                                        labelLine={false}
                                        label={renderCustomLabel}
                                        animationBegin={0}
                                        animationDuration={800}
                                    >
                                        {categoryStats.map((entry, index) => (
                                            <Cell
                                                key={index}
                                                fill={entry.color}
                                                stroke="transparent"
                                                strokeWidth={2}
                                            />
                                        ))}
                                    </Pie>
                                    <Tooltip content={<PieTooltipContent />} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>

                        <div className="space-y-2 mt-3">
                            {categoryStats.map((stat, i) => {
                                const percent = totalExpense > 0
                                    ? ((stat.amount / totalExpense) * 100).toFixed(1)
                                    : '0';
                                const activePerUser = stat.perUser.filter(u => u.amount > 0);
                                return (
                                    <div
                                        key={i}
                                        className="p-2.5 rounded-xl bg-muted/40 hover:bg-muted/60 transition-colors"
                                    >
                                        <div className="flex items-center gap-2 mb-1">
                                            <div
                                                className="w-3 h-3 rounded-full flex-shrink-0"
                                                style={{ backgroundColor: stat.color }}
                                            />
                                            <p className="text-xs font-medium text-foreground truncate flex-1">
                                                {stat.icon} {stat.category}
                                            </p>
                                            <p className="text-xs font-semibold text-foreground">
                                                {stat.amount.toLocaleString()}₫
                                            </p>
                                            <span className="text-[10px] text-muted-foreground">
                                                {percent}%
                                            </span>
                                        </div>
                                        {activePerUser.length > 0 && (
                                            <div className="ml-5 space-y-0.5">
                                                {activePerUser.map((u, idx) => {
                                                    const userPercent = stat.amount > 0
                                                        ? ((u.amount / stat.amount) * 100).toFixed(0)
                                                        : '0';
                                                    return (
                                                        <div key={u.userId} className="flex items-center gap-1.5">
                                                            <div
                                                                className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                                                                style={{ backgroundColor: USER_COLORS[idx % USER_COLORS.length] }}
                                                            />
                                                            <span className="text-[10px] text-muted-foreground flex-1 truncate">
                                                                {u.userName}
                                                            </span>
                                                            <span className="text-[10px] font-medium text-foreground">
                                                                {u.amount.toLocaleString()}₫
                                                            </span>
                                                            <span className="text-[9px] text-muted-foreground">
                                                                ({userPercent}%)
                                                            </span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </>
                )}
            </div>

            <div className="bg-card rounded-2xl p-4 border border-border shadow-sm">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-bold text-foreground">
                        👫 So sánh chi tiêu
                    </h3>
                    <span className="text-xs text-muted-foreground font-medium bg-muted px-2.5 py-1 rounded-full">
                        6 tháng gần nhất
                    </span>
                </div>

                {barData.length === 0 ? (
                    <div className="text-center py-8">
                        <p className="text-3xl mb-2">📭</p>
                        <p className="text-sm text-muted-foreground">Chưa có dữ liệu</p>
                    </div>
                ) : (
                    <>
                        <div className="flex items-center justify-center gap-4 mb-3">
                            {userNames.map((name, i) => (
                                <div key={name} className="flex items-center gap-1.5">
                                    <div
                                        className="w-3 h-3 rounded-sm"
                                        style={{ backgroundColor: userColors[i] }}
                                    />
                                    <span className="text-xs font-medium text-foreground">{name}</span>
                                </div>
                            ))}
                        </div>

                        <div className="w-full h-[240px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={barData}
                                    margin={{ top: 5, right: 5, left: -15, bottom: 5 }}
                                    barGap={2}
                                    barCategoryGap="20%"
                                >
                                    <CartesianGrid
                                        strokeDasharray="3 3"
                                        stroke="var(--color-border, #e5e7eb)"
                                        vertical={false}
                                    />
                                    <XAxis
                                        dataKey="label"
                                        tick={{ fontSize: 11, fill: 'var(--color-muted-foreground, #9ca3af)' }}
                                        axisLine={false}
                                        tickLine={false}
                                    />
                                    <YAxis
                                        tick={{ fontSize: 10, fill: 'var(--color-muted-foreground, #9ca3af)' }}
                                        axisLine={false}
                                        tickLine={false}
                                        tickFormatter={(v: number) => {
                                            if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
                                            if (v >= 1_000) return `${(v / 1_000).toFixed(0)}K`;
                                            return v.toString();
                                        }}
                                    />
                                    <Tooltip content={<BarTooltipContent />} />
                                    {userNames.map((name, i) => (
                                        <Bar
                                            key={name}
                                            dataKey={name}
                                            fill={userColors[i]}
                                            radius={[6, 6, 0, 0]}
                                            animationBegin={i * 200}
                                            animationDuration={600}
                                        />
                                    ))}
                                </BarChart>
                            </ResponsiveContainer>
                        </div>

                        {monthlyData.length > 0 && (() => {
                            const currentMonth = monthlyData[monthlyData.length - 1];
                            const total = currentMonth.users.reduce((s, u) => s + u.expense, 0);
                            return (
                                <div className="mt-3 p-3 bg-muted/40 rounded-xl">
                                    <p className="text-xs text-muted-foreground text-center mb-2 font-medium">
                                        Tháng này
                                    </p>
                                    <div className="flex items-center justify-around">
                                        {currentMonth.users.map(u => (
                                            <div key={u.userId} className="text-center">
                                                <p className="text-sm font-bold" style={{ color: u.color }}>
                                                    {u.expense.toLocaleString()}₫
                                                </p>
                                                <p className="text-[10px] text-muted-foreground">{u.userName}</p>
                                            </div>
                                        ))}
                                        <div className="text-center">
                                            <p className="text-sm font-bold text-foreground">
                                                {total.toLocaleString()}₫
                                            </p>
                                            <p className="text-[10px] text-muted-foreground">Tổng cộng</p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })()}
                    </>
                )}
            </div>
        </div>
    );
}
