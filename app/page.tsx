'use client';

import { useState, useEffect, useCallback } from 'react';
import { Header } from '@/components/header';
import { BalanceCard } from '@/components/balance-card';
import { CoupleOverview } from '@/components/couple-overview';
import { RecentActivities } from '@/components/recent-activities';
import { BottomNav } from '@/components/bottom-nav';
import { AddTransactionDrawer } from '@/components/add-transaction-drawer';
import { MonthlyHistoryDrawer } from '@/components/monthly-history-drawer';
import { StatisticsPanel } from '@/components/statistics-panel';
import { DebtItem, AddDebtDrawer } from '@/components/debt-tracker';
import { SettingsPanel } from '@/components/settings-panel';
import { CategoryManager } from '@/components/category-manager';
import { TransactionHistory } from '@/components/transaction-history';
import { UncategorizedBanner } from '@/components/uncategorized-banner';
import { PullToRefresh } from '@/components/pull-to-refresh';
import {
  getUsersSummary,
  getRecentTransactions,
  getCategories,
  getDebts,
  resolveDebt,
} from '@/lib/actions';
import { getUserProfile } from '@/lib/auth-actions';
import type {
  UserFinanceSummary,
  Transaction,
  Category,
  Debt,
  User,
} from '@/lib/types';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('home');
  const [showAddTx, setShowAddTx] = useState(false);
  const [showAddDebt, setShowAddDebt] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showMonthlyHistory, setShowMonthlyHistory] = useState(false);

  const [summaries, setSummaries] = useState<UserFinanceSummary[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  const [debts, setDebts] = useState<Debt[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string>('');

  const [initialLoading, setInitialLoading] = useState(true);
  const [resolvingDebt, setResolvingDebt] = useState<string | null>(null);

  const refreshSummaries = useCallback(async () => {
    const res = await getUsersSummary();
    if (res.success && res.data) {
      setSummaries(res.data);
      setUsers(res.data.map((s) => s.user));
    }
  }, []);

  const refreshTransactions = useCallback(async () => {
    const res = await getRecentTransactions(10);
    if (res.success && res.data) setTransactions(res.data);
  }, []);

  const refreshCategories = useCallback(async () => {
    const res = await getCategories();
    if (res.success && res.data) setCategories(res.data);
  }, []);



  const refreshDebts = useCallback(async () => {
    const res = await getDebts();
    if (res.success && res.data) setDebts(res.data);
  }, []);

  const fetchAll = useCallback(async () => {
    setInitialLoading(true);
    try {
      const [summaryRes, txRes, catRes, debtRes, profileRes] = await Promise.all(
        [
          getUsersSummary(),
          getRecentTransactions(10),
          getCategories(),
          getDebts(),
          getUserProfile(),
        ]
      );

      if (summaryRes.success && summaryRes.data) {
        setSummaries(summaryRes.data);
        setUsers(summaryRes.data.map((s) => s.user));
      }
      if (txRes.success && txRes.data) setTransactions(txRes.data);
      if (catRes.success && catRes.data) setCategories(catRes.data);

      if (debtRes.success && debtRes.data) setDebts(debtRes.data);
      if (profileRes.success && profileRes.data) {
        setCurrentUserId(profileRes.data.id);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    }
    setInitialLoading(false);
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const handleTransactionSuccess = useCallback(() => {
    Promise.all([refreshSummaries(), refreshTransactions()]);
  }, [refreshSummaries, refreshTransactions]);

  const handleResolveDebt = useCallback(async (debtId: string) => {
    setResolvingDebt(debtId);
    const result = await resolveDebt(debtId);
    setResolvingDebt(null);
    if (result.success) {
      Promise.all([refreshDebts(), refreshSummaries(), refreshTransactions()]);
    }
  }, [refreshDebts, refreshSummaries, refreshTransactions]);

  const handleDebtSuccess = useCallback(() => {
    refreshDebts();
  }, [refreshDebts]);

  const handleCategoryUpdate = useCallback(() => {
    refreshCategories();
  }, [refreshCategories]);

  const handleSettingsUpdate = useCallback(() => {
    refreshSummaries();
  }, [refreshSummaries]);

  const totalIncome = summaries.reduce((sum, s) => sum + s.totalIncome, 0);
  const totalExpense = summaries.reduce((sum, s) => sum + s.totalExpense, 0);
  const totalBalance = summaries.reduce((sum, s) => sum + s.balance, 0);
  if (showHistory) {
    return (
      <TransactionHistory
        users={users}
        currentUserId={currentUserId}
        onBack={() => setShowHistory(false)}
      />
    );
  }

  return (
    <>
      <PullToRefresh onRefresh={async () => {
        await Promise.all([
          refreshSummaries(),
          refreshTransactions(),
          refreshCategories(),
          refreshDebts(),
        ]);
      }}>
        <div className="min-h-screen bg-background">
          <Header />
          {initialLoading && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
            </div>
          )}
          {!initialLoading && users.length < 2 && activeTab !== 'settings' && (
            <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mb-5 shadow-lg">
                <span className="text-5xl">👫</span>
              </div>
              <h2 className="text-xl font-bold text-foreground mb-2">Cần 2 người dùng</h2>
              <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
                Ứng dụng cần <strong>2 thành viên</strong> để hoạt động.
                Hiện tại mới có <strong>{users.length}</strong> người đăng ký.
              </p>
              <p className="text-sm text-muted-foreground mt-3">
                Hãy mời người còn lại tạo tài khoản nhé! 💕
              </p>
              <div className="mt-6 px-4 py-2.5 bg-primary/10 rounded-2xl">
                <p className="text-xs font-medium text-primary">
                  ⏳ Đang chờ thêm {2 - users.length} người nữa...
                </p>
              </div>
            </div>
          )}

          {!initialLoading && users.length >= 2 && activeTab === 'home' && (
            <>
              <div className="space-y-4 px-6 py-4">
                <div className="flex gap-3">
                  {summaries.map((s, i) => (
                    <BalanceCard
                      key={s.user.id}
                      name={s.user.name}
                      balance={s.balance}
                      income={s.totalIncome}
                      expense={s.totalExpense}
                      avatar={i === 0 ? 'bg-gradient-to-br from-blue-400 to-blue-600' : 'bg-gradient-to-br from-pink-400 to-pink-600'}
                      avatarInitial={s.user.avatar || '👤'}
                      avatarUrl={s.user.avatar_url}
                      bgColor={i === 0 ? 'bg-blue-50' : 'bg-pink-50'}
                    />
                  ))}
                </div>
              </div>

              <CoupleOverview
                totalBalance={totalBalance}
                monthlyIncome={totalIncome}
                monthlyExpense={totalExpense}
                onOpenHistory={() => setShowMonthlyHistory(true)}
              />

              <UncategorizedBanner categories={categories} onUpdate={() => { refreshTransactions(); refreshSummaries(); }} />

              <RecentActivities transactions={transactions} onViewAll={() => setShowHistory(true)} />
            </>
          )}

          {!initialLoading && users.length >= 2 && activeTab === 'stats' && (
            <StatisticsPanel />
          )}
          {!initialLoading && users.length >= 2 && activeTab === 'categories' && (
            <CategoryManager categories={categories} onUpdate={handleCategoryUpdate} />
          )}

          {!initialLoading && users.length >= 2 && activeTab === 'debt' && (() => {
            const myDebts = debts.filter(d => d.user_id === currentUserId);
            const otherDebts = debts.filter(d => d.user_id !== currentUserId);
            const otherUserName = users.find(u => u.id !== currentUserId)?.name || 'Đối phương';

            const renderDebtGroup = (debtList: Debt[], canResolve: boolean) => {
              const pending = debtList.filter(d => d.status === 'pending');
              const resolved = debtList.filter(d => d.status === 'resolved');
              return (
                <>
                  {pending.length > 0 && (
                    <div className="mb-3">
                      <p className="text-[10px] font-semibold text-amber-600 uppercase tracking-wider mb-1.5">
                        Chưa trả ({pending.length})
                      </p>
                      <div className="space-y-2">
                        {pending.map(debt => (
                          <DebtItem
                            key={debt.id}
                            debt={debt}
                            onResolve={canResolve ? handleResolveDebt : () => { }}
                            resolving={resolvingDebt === debt.id}
                            showResolveButton={canResolve}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                  {resolved.length > 0 && (
                    <div>
                      <p className="text-[10px] font-semibold text-green-600 uppercase tracking-wider mb-1.5">
                        Đã trả ({resolved.length})
                      </p>
                      <div className="space-y-2">
                        {resolved.map(debt => (
                          <DebtItem
                            key={debt.id}
                            debt={debt}
                            onResolve={() => { }}
                            resolving={false}
                            showResolveButton={false}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                  {debtList.length === 0 && (
                    <p className="text-xs text-muted-foreground text-center py-3 bg-muted/30 rounded-xl">
                      Chưa có khoản nợ nào
                    </p>
                  )}
                </>
              );
            };

            return (
              <div className="px-6 py-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-foreground">📒 Sổ Nợ</h2>
                  <button
                    onClick={() => setShowAddDebt(true)}
                    className="text-sm font-semibold text-primary bg-primary/10 px-3 py-1.5 rounded-full hover:bg-primary/20 transition-colors active:scale-95"
                  >
                    + Thêm nợ
                  </button>
                </div>

                <div className="mb-6">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    📌 Nợ của tôi
                  </h3>
                  <div className="bg-card rounded-2xl p-3 border border-border shadow-sm">
                    {renderDebtGroup(myDebts, true)}
                  </div>
                </div>

                <div className="mb-6">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    👀 Nợ của {otherUserName}
                  </h3>
                  <div className="bg-card rounded-2xl p-3 border border-border shadow-sm">
                    {renderDebtGroup(otherDebts, false)}
                  </div>
                </div>
              </div>
            );
          })()}

          {!initialLoading && activeTab === 'settings' && (
            <SettingsPanel users={users} onUpdate={handleSettingsUpdate} />
          )}

          <div style={{ height: 'calc(env(safe-area-inset-bottom, 0px) + 80px)' }}></div>
        </div>
      </PullToRefresh>

      <BottomNav
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onFabClick={() => setShowAddTx(true)}
      />

      <AddTransactionDrawer
        open={showAddTx}
        onClose={() => setShowAddTx(false)}
        onSuccess={handleTransactionSuccess}
        categories={categories}
        currentUserId={currentUserId}
      />

      <AddDebtDrawer
        open={showAddDebt}
        onClose={() => setShowAddDebt(false)}
        onSuccess={handleDebtSuccess}
        users={users}
        currentUserId={currentUserId}
      />

      <MonthlyHistoryDrawer
        open={showMonthlyHistory}
        onClose={() => setShowMonthlyHistory(false)}
      />
    </>
  );
}
