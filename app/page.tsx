import {
  getUsersSummary,
  getRecentTransactions,
  getDebts,
} from '@/lib/actions';
import { getUserProfile, getAppSettings } from '@/lib/auth-actions';
import Dashboard from '@/components/dashboard';
import type { AppSettings } from '@/lib/types';

export default async function Page() {
  const [summaryRes, txRes, profileRes, debtRes, settingsRes] = await Promise.all([
    getUsersSummary(),
    getRecentTransactions(40),
    getUserProfile(),
    getDebts(),
    getAppSettings(),
  ]);

  const summaries = summaryRes.success && summaryRes.data ? summaryRes.data : [];
  const transactions = txRes.success && txRes.data ? txRes.data : [];
  const currentUser = profileRes.success && profileRes.data ? profileRes.data : null;
  const debts = debtRes.success && debtRes.data ? debtRes.data : [];
  const appSettings: AppSettings = settingsRes.success && settingsRes.data
    ? settingsRes.data
    : { registration_enabled: true, allow_balance_edit: true, stash_name: 'Két sắt' };

  return (
    <Dashboard
      initialSummaries={summaries}
      initialTransactions={transactions}
      initialDebts={debts}
      initialCurrentUser={currentUser}
      initialAppSettings={appSettings}
    />
  );
}
