'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { BottomNav } from '@/components/bottom-nav';
import { AddTransactionDrawer } from '@/components/add-transaction-drawer';
import { AddDebtDrawer, DebtItem } from '@/components/debt-tracker';
import { SettingsPanel } from '@/components/settings-panel';
import { HistoryPage } from '@/components/history-page';
import { getUsersSummary, getRecentTransactions, getDebts, deleteDebt } from '@/lib/actions';
import { getUserProfile, getAppSettings } from '@/lib/auth-actions';
import type { UserFinanceSummary, Transaction, Debt, User, AppSettings } from '@/lib/types';

export interface DashboardProps {
  initialSummaries: UserFinanceSummary[];
  initialTransactions: Transaction[];
  initialDebts: Debt[];
  initialCurrentUser: User | null;
  initialAppSettings: AppSettings;
}

function fv(v: number) {
  if (Math.abs(v) >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (Math.abs(v) >= 1_000) return `${(v / 1_000).toFixed(0)}K`;
  return v.toLocaleString('vi-VN');
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
}

function formatDate(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return 'Hôm nay';
  if (d.toDateString() === yesterday.toDateString()) return 'Hôm qua';
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export default function Dashboard({
  initialSummaries,
  initialTransactions,
  initialDebts,
  initialCurrentUser,
  initialAppSettings,
}: DashboardProps) {
  const [activeTab, setActiveTab] = useState('home');
  const [showAddTx, setShowAddTx] = useState(false);
  const [showAddDebt, setShowAddDebt] = useState(false);

  const [summaries, setSummaries] = useState(initialSummaries);
  const [transactions, setTransactions] = useState(initialTransactions);
  const [debts, setDebts] = useState(initialDebts);
  const [users, setUsers] = useState<User[]>(initialSummaries.map(s => s.user));
  const [currentUserId] = useState(initialCurrentUser?.id || '');
  const [currentUser, setCurrentUser] = useState<User | null>(initialCurrentUser);
  const [appSettings, setAppSettings] = useState(initialAppSettings);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const chatRef = useRef<HTMLDivElement>(null);

  const refreshSummaries = useCallback(async () => {
    const r = await getUsersSummary();
    if (r.success && r.data) { setSummaries(r.data); setUsers(r.data.map(s => s.user)); }
  }, []);

  const refreshTransactions = useCallback(async () => {
    const r = await getRecentTransactions(40);
    if (r.success && r.data) setTransactions(r.data);
  }, []);

  const refreshDebts = useCallback(async () => {
    const r = await getDebts();
    if (r.success && r.data) setDebts(r.data);
  }, []);

  const refreshProfile = useCallback(async () => {
    const r = await getUserProfile();
    if (r.success && r.data) setCurrentUser(r.data);
  }, []);

  const refreshAppSettings = useCallback(async () => {
    const r = await getAppSettings();
    if (r.success && r.data) setAppSettings(r.data);
  }, []);

  const handleTxSuccess = useCallback(() => {
    Promise.all([refreshSummaries(), refreshTransactions()]);
  }, [refreshSummaries, refreshTransactions]);

  const handleDebtSuccess = useCallback(() => refreshDebts(), [refreshDebts]);

  const handleDeleteDebt = useCallback(async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa?')) return;
    await deleteDebt(id);
    refreshDebts();
  }, [refreshDebts]);

  const handleRefreshData = useCallback(async () => {
    setIsRefreshing(true);
    await Promise.all([
      refreshSummaries(),
      refreshTransactions(),
      refreshDebts(),
      refreshProfile(),
      refreshAppSettings()
    ]);
    setIsRefreshing(false);
  }, [refreshSummaries, refreshTransactions, refreshDebts, refreshProfile, refreshAppSettings]);

  useEffect(() => {
    if (activeTab === 'home' && chatRef.current) {
      const snapToBottom = () => {
        if (chatRef.current) {
          chatRef.current.scrollTop = chatRef.current.scrollHeight;
        }
      };
      snapToBottom();
      const t = setTimeout(snapToBottom, 100);
      return () => clearTimeout(t);
    }
  }, [transactions, activeTab]);

  const currentSummary = summaries.find(s => s.user.id === currentUserId);
  const otherSummary = summaries.find(s => s.user.id !== currentUserId);

  const myDebts = debts.filter(d => d.user_id === currentUserId);
  const otherDebts = debts.filter(d => d.user_id !== currentUserId);

  const currentMonthTx = transactions.filter(tx => {
    const now = new Date();
    const txDate = new Date(tx.created_at);
    return txDate.getMonth() === now.getMonth() && txDate.getFullYear() === now.getFullYear();
  });

  const groupedTx = (() => {
    const groups: { date: string; items: Transaction[] }[] = [];
    for (const tx of [...currentMonthTx].reverse()) {
      const d = formatDate(tx.created_at);
      const last = groups[groups.length - 1];
      if (last && last.date === d) last.items.push(tx);
      else groups.push({ date: d, items: [tx] });
    }
    return groups;
  })();

  const onFabClick = () => {
    if (activeTab === 'home') setShowAddTx(true);
    else if (activeTab === 'debt') setShowAddDebt(true);
  };

  if (users.length < 2 && activeTab !== 'settings') {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 text-center">
        <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mb-6 shadow-xl shadow-primary/5 border border-primary/20">
          <span className="text-5xl animate-bounce" style={{ animationDuration: '2s' }}>👫</span>
        </div>
        <h2 className="text-2xl font-black tracking-tight mb-3 bg-gradient-to-br from-foreground to-muted-foreground bg-clip-text text-transparent">Cần 2 người dùng</h2>
        <p className="text-sm font-medium text-muted-foreground max-w-[260px] leading-relaxed">Hãy mời người còn lại tạo tài khoản để có thể bắt đầu ghi chép nhé! 💕</p>
        <BottomNav activeTab={activeTab} onTabChange={setActiveTab} onFabClick={onFabClick} />
      </div>
    );
  }

  return (
    <>
      {activeTab === 'home' && (
        <div className="h-screen max-w-md mx-auto relative overflow-hidden bg-[#FFF9FA] dark:bg-background">
          {/* Floating Header */}
          <div className="absolute top-0 left-0 right-0 z-20 pt-[calc(env(safe-area-inset-top)+1rem)] px-4 pb-2 w-full pointer-events-none">
            <div className="flex items-stretch bg-card/90 dark:bg-card/80 backdrop-blur-2xl rounded-[28px] overflow-hidden border border-rose-100/80 dark:border-border/50 shadow-lg shadow-rose-100/30 dark:shadow-black/20 pointer-events-auto">
              {/* Left: other user */}
              <div className="flex-1 px-4 py-3.5 text-left relative overflow-hidden transition-colors">
                <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-transparent pointer-events-none" />
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-9 h-9 rounded-full bg-amber-500/10 shadow-inner flex items-center justify-center overflow-hidden flex-shrink-0 border border-amber-500/20">
                      {otherSummary?.user.avatar_url ? (
                        <img src={otherSummary.user.avatar_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-sm font-bold text-amber-600">{otherSummary?.user.avatar || 'U'}</span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground font-semibold truncate uppercase tracking-wider">
                      {otherSummary?.user.name || '—'}
                    </p>
                  </div>
                  <p className="text-xl font-bold text-foreground leading-tight tracking-tight">
                    {fv(otherSummary?.balance ?? 0)}
                    <span className="text-[11px] font-medium text-muted-foreground ml-0.5">₫</span>
                  </p>
                  <p className="text-[10px] sm:text-xs font-semibold text-muted-foreground mt-1.5 tracking-tight flex items-center gap-1 opacity-90">
                    <span className="text-emerald-500 bg-emerald-500/10 px-1 py-0.5 rounded text-[9px] sm:text-[10px]">+{fv(otherSummary?.totalIncome ?? 0)}</span>
                    <span className="text-rose-500 bg-rose-500/10 px-1 py-0.5 rounded text-[9px] sm:text-[10px]">-{fv(otherSummary?.totalExpense ?? 0)}</span>
                  </p>
                </div>
              </div>

              {/* Divider with Refresh Button */}
              <div className="w-px bg-border/40 my-4 relative flex items-center justify-center">
                <button
                  onClick={handleRefreshData}
                  disabled={isRefreshing}
                  className="absolute p-2 rounded-full bg-card border border-rose-100/50 dark:border-border/50 shadow-sm text-muted-foreground hover:bg-muted/50 active:scale-90 transition-transform z-10"
                >
                  <svg className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-primary' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
              </div>

              {/* Right: current user */}
              <div className="flex-1 px-4 py-3.5 text-right relative overflow-hidden transition-colors">
                <div className="absolute inset-0 bg-gradient-to-bl from-primary/10 to-transparent pointer-events-none" />
                <div className="relative z-10 flex flex-col items-end">
                  <div className="flex items-center gap-2 mb-2 flex-row-reverse">
                    <div className="w-9 h-9 rounded-full bg-primary/10 shadow-inner flex items-center justify-center overflow-hidden flex-shrink-0 border border-primary/20">
                      {currentSummary?.user.avatar_url ? (
                        <img src={currentSummary.user.avatar_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-sm font-bold text-primary">{currentSummary?.user.avatar || 'U'}</span>
                      )}
                    </div>
                    <p className="text-sm text-primary font-bold truncate uppercase tracking-wider">
                      {currentSummary?.user.name || '—'}
                    </p>
                  </div>
                  <p className="text-xl font-bold text-foreground leading-tight tracking-tight">
                    {fv(currentSummary?.balance ?? 0)}
                    <span className="text-[11px] font-medium text-muted-foreground ml-0.5">₫</span>
                  </p>
                  <p className="text-[10px] sm:text-xs font-semibold text-muted-foreground mt-1.5 tracking-tight flex items-center gap-1 flex-row-reverse opacity-90">
                    <span className="text-emerald-500 bg-emerald-500/10 px-1 py-0.5 rounded text-[9px] sm:text-[10px]">+{fv(currentSummary?.totalIncome ?? 0)}</span>
                    <span className="text-rose-500 bg-rose-500/10 px-1 py-0.5 rounded text-[9px] sm:text-[10px]">-{fv(currentSummary?.totalExpense ?? 0)}</span>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Scrollable chat area */}
          <div ref={chatRef} className="h-full overflow-y-auto px-4 space-y-4 pt-[150px]" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom,0px) + 90px)' }}>
            {currentMonthTx.length === 0 && (
              <div className="flex flex-col items-center justify-center h-[70%] gap-3 text-muted-foreground">
                <div className="w-20 h-20 rounded-full bg-primary/5 flex items-center justify-center mb-2 animate-pulse">
                  <span className="text-4xl opacity-50">💬</span>
                </div>
                <p className="text-sm font-semibold tracking-wide text-foreground/70">Chưa có giao dịch tháng này</p>
                <p className="text-xs font-medium opacity-60">Hãy bắt đầu ghi chép chi tiêu nhé!</p>
              </div>
            )}

            {groupedTx.map(group => (
              <div key={group.date} className="pt-2">
                <div className="flex items-center justify-center mb-5 sticky top-2 z-10">
                  <span className="text-[10px] text-muted-foreground bg-background/80 backdrop-blur-md px-3.5 py-1.5 rounded-full font-bold shadow-sm border border-border/40 uppercase tracking-widest">
                    {group.date}
                  </span>
                </div>
                <div className="space-y-3">
                  {group.items.map((tx, idx) => {
                    const isMe = tx.user_id === currentUserId;
                    const isIncome = tx.type === 'income';
                    const isFirstInGroup = idx === 0 || group.items[idx - 1].user_id !== tx.user_id;
                    const isLastInGroup = idx === group.items.length - 1 || group.items[idx + 1].user_id !== tx.user_id;

                    return (
                      <div key={tx.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[78%] px-4 py-3 shadow-sm relative transition-all duration-200 active:scale-[0.98] ${isMe
                          ? `bg-gradient-to-br from-primary to-rose-400 text-white rounded-[20px] ${isLastInGroup ? 'rounded-br-[4px]' : ''} ${isFirstInGroup ? 'rounded-tr-[20px]' : 'rounded-tr-[8px]'} shadow-primary/25`
                          : `bg-card/95 backdrop-blur-sm border border-rose-100/50 dark:border-border/50 text-foreground rounded-[20px] ${isLastInGroup ? 'rounded-bl-[4px]' : ''} ${isFirstInGroup ? 'rounded-tl-[20px]' : 'rounded-tl-[8px]'}`
                          }`}>
                          <p className={`text-[17px] font-bold tracking-tight mb-1 ${isMe ? 'text-white drop-shadow-sm' : isIncome ? 'text-emerald-500' : 'text-foreground'}`}>
                            {isIncome ? '+' : '-'}{fv(tx.amount)}
                            <span className="text-[12px] font-medium ml-0.5 opacity-80">₫</span>
                          </p>
                          {tx.note && (
                            <p className={`text-[14px] font-medium leading-[1.4] ${isMe ? 'text-white/95' : 'text-muted-foreground/90'}`}>
                              {tx.note}
                            </p>
                          )}
                          <p className={`text-[9px] mt-1.5 font-semibold ${isMe ? 'text-white/70 text-right' : 'text-muted-foreground/50 text-left'}`}>
                            {formatTime(tx.created_at)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'history' && (
        <HistoryPage currentUserId={currentUserId} />
      )}

      {activeTab === 'debt' && (
        <div className="min-h-screen bg-background text-foreground pb-20">
          <div className="px-5 pb-4 pt-[calc(env(safe-area-inset-top)+1rem)] bg-background/80 backdrop-blur-md sticky top-0 z-10 flex justify-between items-center border-b border-rose-100/50 dark:border-border/50">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-foreground">Sổ Nợ</h2>
            </div>
          </div>

          <div className="px-5 mt-5">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">� Ghi chép của tôi</h3>
            <div className="space-y-3">
              {myDebts.length === 0
                ? <div className="border border-dashed border-border rounded-2xl py-8 text-center text-muted-foreground text-sm font-medium">Chưa có khoản nợ nào</div>
                : myDebts.map(d => (
                  <DebtItem
                    key={d.id}
                    debt={d}
                    isOwner={true}
                    onDelete={handleDeleteDebt}
                    onUpdate={refreshDebts}
                  />
                ))
              }
            </div>

            {otherSummary && (
              <div className="mt-8 mb-8">
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <div className="w-4 h-4 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                    <span className="text-[8px]">{otherSummary.user.avatar || 'U'}</span>
                  </div>
                  Ghi chép của {otherSummary.user.name}
                </h3>
                <div className="space-y-3">
                  {otherDebts.length === 0
                    ? <div className="border border-dashed border-border rounded-2xl py-6 text-center text-muted-foreground text-sm font-medium">Trống</div>
                    : otherDebts.map(d => (
                      <DebtItem key={d.id} debt={d} isOwner={false} onDelete={() => { }} onUpdate={() => { }} />
                    ))
                  }
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="min-h-screen bg-background pb-24 max-w-md mx-auto">
          <div className="px-4 pt-4">
            <SettingsPanel
              users={users}
              currentUser={currentUser}
              appSettings={appSettings}
              onUpdate={() => Promise.all([refreshSummaries(), refreshProfile(), refreshAppSettings()])}
              onProfileRefresh={refreshProfile}
              onSettingsRefresh={refreshAppSettings}
            />
          </div>
        </div>
      )}

      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} onFabClick={onFabClick} />

      <AddTransactionDrawer
        open={showAddTx}
        onClose={() => setShowAddTx(false)}
        onSuccess={handleTxSuccess}
        currentUserId={currentUserId}
      />

      <AddDebtDrawer
        open={showAddDebt}
        onClose={() => setShowAddDebt(false)}
        onSuccess={handleDebtSuccess}
        users={users}
        currentUserId={currentUserId}
      />
    </>
  );
}
