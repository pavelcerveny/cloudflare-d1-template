import { PageHeader } from "@/components/page-header"
import { COMPONENTS } from "./components-catalog"
import { MarketplaceCard } from "@/components/marketplace-card"
import { getSessionFromCookie } from "@/utils/auth"
import { getUserPurchasedItems } from "@/utils/credits"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

export default async function MarketplacePage() {
  const session = await getSessionFromCookie();
  const purchasedItems = session ? await getUserPurchasedItems(session.userId) : new Set();

  return (
    <>
      <PageHeader
        items={[
          {
            href: "/dashboard/marketplace",
            label: "Marketplace"
          }
        ]}
      />
      <div className="container mx-auto px-5 pb-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mt-4">Component Marketplace</h1>
          <p className="text-muted-foreground mt-2">
            Purchase and use our premium components using your credits
          </p>
        </div>

        <Alert variant="warning">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Demo Template Feature</AlertTitle>
          <AlertDescription>
          This marketplace page demonstrates how to implement a credit-based billing system in your SaaS application. Feel free to use this as a starting point and customize it for your specific needs.
          </AlertDescription>
        </Alert>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {COMPONENTS.map((component) => (
            <MarketplaceCard
              key={component.id}
              id={component.id}
              name={component.name}
              description={component.description}
              credits={component.credits}
              containerClass={component.containerClass}
              isPurchased={purchasedItems.has(`COMPONENT:${component.id}`)}
            />
          ))}
        </div>
      </div>
    </>
  )
}
