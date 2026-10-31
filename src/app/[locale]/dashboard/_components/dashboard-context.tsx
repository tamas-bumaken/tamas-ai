import { RecentTransactions } from "./recent-transactions";
import { CashCard } from "./cash-card";
import { CategorySpendingCard } from "./category-spending-card";
import { ProfitCard } from "./profit-card";

export default function DashboardContent() {
  return (
    <section id="content" className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-2">
        <ProfitCard />
        <CashCard />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <CategorySpendingCard />
        <RecentTransactions />
      </div>
    </section>
  );
}
