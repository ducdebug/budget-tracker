import {
  getUsersSummary,
  getRecentTransactions,
  getCategories,
  getDebts,
} from '@/lib/actions';
import { getUserProfile, getAppSettings } from '@/lib/auth-actions';
import Dashboard from '@/components/dashboard';
import type { AppSettings } from '@/lib/types';

export default async function Page() {
  const [summaryRes, txRes, profileRes, catRes, debtRes, settingsRes] = await Promise.all([
    getUsersSummary(),
    getRecentTransactions(10),
    getUserProfile(),
    getCategories(),
    getDebts(),
    getAppSettings(),
  ]);

  const summaries = summaryRes.success && summaryRes.data ? summaryRes.data : [];
  const transactions = txRes.success && txRes.data ? txRes.data : [];
  const currentUser = profileRes.success && profileRes.data ? profileRes.data : null;
  const categories = catRes.success && catRes.data ? catRes.data : [];
  const debts = debtRes.success && debtRes.data ? debtRes.data : [];
  const appSettings: AppSettings = settingsRes.success && settingsRes.data
    ? settingsRes.data
    : { registration_enabled: true, allow_balance_edit: true };

  return (
    <Dashboard
      initialSummaries={summaries}
      initialTransactions={transactions}
      initialCategories={categories}
      initialDebts={debts}
      initialCurrentUser={currentUser}
      initialAppSettings={appSettings}
    />
  );
}
