import { TransactionHistory } from "./_components/transaction-history";
import { CreditPackages } from "./_components/credit-packages";

export default async function BillingPage() {


  return (
    <>
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <CreditPackages />
        <div className="mt-4">
          <TransactionHistory />
        </div>
      </div>
    </>
  );
}
