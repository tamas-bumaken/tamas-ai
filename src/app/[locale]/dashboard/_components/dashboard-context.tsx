import { RecentTransactions } from "./recent-transactions";
import { BalanceCard } from "./balance-card";
import { CategorySpendingCard } from "./category-spending-card";
import { SavingsCard } from "./savings-card";

export default function DashboardContent() {
  return (
    <section id="content" className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-2">
        <BalanceCard />
        <SavingsCard />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <CategorySpendingCard />
        <RecentTransactions />
      </div>
    </section>
  );
}
