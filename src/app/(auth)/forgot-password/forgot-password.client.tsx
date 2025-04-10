"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { Session } from "next-auth";
import { forgotPasswordAction } from "./forgot-password.action";
import { useServerAction } from "zsa-react";
import { toast } from "sonner";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { z } from "zod";
import { Captcha } from "@/components/captcha";
import { forgotPasswordSchema } from "@/schemas/forgot-password.schema";
import { CAPTCHA_ENABLED } from "@/featureFlags";
import { useMemo } from "react";

type ForgotPasswordSchema = z.infer<typeof forgotPasswordSchema>;

interface ForgotPasswordPageProps {
  session: Session | null;
}

export default function ForgotPasswordClientComponent({ session }: ForgotPasswordPageProps) {
  const router = useRouter();

  const defaultValues = useMemo(() => ({
    email: session?.user?.email || "",
  }), [session]);

  const form = useForm<ForgotPasswordSchema>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues,
    values: defaultValues
  });

  const captchaToken = useWatch({ control: form.control, name: 'captchaToken' })

  const { execute: sendResetLink, isSuccess } = useServerAction(forgotPasswordAction, {
    onError: (error) => {
      toast.dismiss();
      toast.error(error.err?.message);
    },
    onStart: () => {
      toast.loading("Sending reset instructions...");
    },
    onSuccess: () => {
      toast.dismiss();
      toast.success("Reset instructions sent");
    },
  });

  const onSubmit = async (data: ForgotPasswordSchema) => {
    await sendResetLink(data);
  };

  if (isSuccess) {
    return (
      <div className="container mx-auto px-4 flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Check your email</CardTitle>
            <CardDescription>
              If an account exists with that email, we&apos;ve sent you instructions to reset your password.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => router.push("/sign-in")}
            >
              Back to login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 flex flex-col items-center justify-center min-h-screen">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>
            {session ? "Change Password" : "Forgot Password"}
          </CardTitle>
          <CardDescription>
            Enter your email address and we&apos;ll send you instructions to reset your password.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        className="w-full px-3 py-2"
                        placeholder="name@example.com"
                        readOnly={Boolean(session?.user?.email)}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex flex-col justify-center items-center">
                <Captcha
                  onSuccess={(token) => form.setValue('captchaToken', token)}
                  validationError={form.formState.errors.captchaToken?.message}
                />

                <Button
                  type="submit"
                  className="mt-8 mb-2"
                  disabled={Boolean(CAPTCHA_ENABLED && !captchaToken)}
                >
                  Send Reset Instructions
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      <div className="mt-4 w-full">
        {session ? (
          <Button
            type="button"
            variant="link"
            className="w-full"
            onClick={() => router.push("/settings")}
          >
            Back to settings
          </Button>
        ) : (
          <Button
            type="button"
            variant="link"
            className="w-full"
            onClick={() => router.push("/sign-in")}
          >
            Back to login
          </Button>
        )}
      </div>

    </div>
  );
}