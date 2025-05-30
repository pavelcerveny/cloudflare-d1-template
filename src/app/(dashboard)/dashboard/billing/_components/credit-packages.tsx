"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CREDIT_PACKAGES, FREE_MONTHLY_CREDITS } from "@/constants";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { StripePaymentForm } from "./stripe-payment-form";
import { createPaymentIntent } from "@/actions/credits.action";
import { Coins, Sparkles, Zap } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import { CurrentSession } from "@/utils/auth";
type CreditPackage = typeof CREDIT_PACKAGES[number];

export const getPackageIcon = (index: number) => {
  if (index === 2) return <Zap className="h-6 w-6 text-yellow-500" />;
  if (index === 1) return <Sparkles className="h-6 w-6 text-blue-500" />;
  return <Coins className="h-6 w-6 text-green-500" />;
};

// Calculate savings percentage compared to the first package
const calculateSavings = (pkg: CreditPackage) => {
  const basePackage = CREDIT_PACKAGES[0];
  const basePrice = basePackage.price / basePackage.credits;
  const currentPrice = pkg.price / pkg.credits;
  const savings = ((basePrice - currentPrice) / basePrice) * 100;
  return Math.round(savings);
};

export function CreditPackages() {
  const router = useRouter();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<CreditPackage | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);

  const {data, status} = useSession();

  const handlePurchase = async (pkg: CreditPackage) => {
    try {
      const { clientSecret } = await createPaymentIntent({
        packageId: pkg.id,
      });
      setClientSecret(clientSecret);
      setSelectedPackage(pkg);
      setIsDialogOpen(true);
    } catch (error) {
      console.error("Error creating payment intent:", error);
    }
  };

  const handleSuccess = () => {
    setIsDialogOpen(false);
    setSelectedPackage(null);
    setClientSecret(null);
    router.refresh();
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Credits</CardTitle>
        </CardHeader>
        <CardContent className="space-y-8">
          <div className="space-y-2">
            <div className="flex items-baseline gap-2">
              {status === "loading" ? (
                <>
                  <Skeleton className="h-9 w-16" />
                  <Skeleton className="h-9 w-24" />
                </>
              ) : (
                <div className="text-3xl font-bold">
                  {(data as CurrentSession)?.user?.currentCredits?.toLocaleString()} credits
                </div>
              )}
            </div>
            <div className="text-sm text-muted-foreground">
              You get {FREE_MONTHLY_CREDITS} free credits every month.
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <div>
              <h2 className="text-2xl font-semibold">Top up your credits</h2>
              <p className="text-sm text-muted-foreground mt-3">
                Purchase additional credits to use our services. The more credits you buy, the better the value.
              </p>
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
              {CREDIT_PACKAGES.map((pkg, index) => (
                <Card key={pkg.id} className="relative overflow-hidden transition-all hover:shadow-lg">
                  <CardContent className="flex flex-col h-full pt-4 gap-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {getPackageIcon(index)}
                        <div>
                          <div className="text-2xl font-bold">
                            {pkg.credits.toLocaleString()}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            credits
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end">
                        <div className="text-2xl font-bold text-primary">
                          ${pkg.price}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          one-time payment
                        </div>
                        {index > 0 ? (
                          <Badge variant="secondary" className="mt-1 bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                            Save {calculateSavings(pkg)}%
                          </Badge>
                        ) : (
                          <div className="h-[26px]" /> /* Placeholder for badge height */
                        )}
                      </div>
                    </div>
                    <div className="flex-grow" />
                    <Button
                      onClick={() => {
                        if (process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
                          handlePurchase(pkg)
                        } else {
                          toast.error("Something went wrong with our payment provider. Please try again later.")
                        }
                      }}
                      className="w-full"
                    >
                      Purchase Now
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Purchase Credits</DialogTitle>
          </DialogHeader>
          {(clientSecret && selectedPackage) && (
            <StripePaymentForm
              packageId={selectedPackage.id}
              clientSecret={clientSecret}
              onSuccess={handleSuccess}
              onCancel={() => setIsDialogOpen(false)}
              credits={selectedPackage.credits}
              price={selectedPackage.price}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
