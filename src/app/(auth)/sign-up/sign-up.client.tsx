"use client";

import { signUpAction } from "./sign-up.actions";
import { type SignUpSchema, signUpSchema } from "@/schemas/signup.schema";

import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import SeparatorWithText from "@/components/separator-with-text";
import { Captcha } from "@/components/captcha";

import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useServerAction } from "zsa-react";
import Link from "next/link";
import { redirect, useRouter } from "next/navigation";
import { REDIRECT_AFTER_SIGN_IN, SIGNIN_ERROR_URL } from "@/constants";
import { signIn } from "next-auth/react"
import { AuthError } from "next-auth";
import { CAPTCHA_ENABLED } from "@/featureFlags";

interface SignUpPageProps {
  providerMap: {
    id: string;
    name: string;
}[]
}

const SignUpPage = ({providerMap}: SignUpPageProps) => {
  const router = useRouter();

  const { execute: signUp } = useServerAction(signUpAction, {
    onError: (error) => {
      toast.dismiss()
      toast.error(error.err?.message)
    },
    onStart: () => {
      toast.loading("Creating your account...")
    },
    onSuccess: () => {
      toast.dismiss()
      toast.success("Account created successfully")
      router.push(REDIRECT_AFTER_SIGN_IN)
    }
  })


  const form = useForm<SignUpSchema>({
    resolver: zodResolver(signUpSchema),
  });

  const captchaToken = useWatch({ control: form.control, name: 'captchaToken' });

  const onSubmit = async (data: SignUpSchema) => {
    signUp(data)
  }

  const onSubmitProvider = async (providerId: string) => {
    try {
      await signIn(providerId, {
        redirectTo: REDIRECT_AFTER_SIGN_IN,
      })
    } catch (error) {
      // Signin can fail for a number of reasons, such as the user
      // not existing, or the user not having the correct role.
      // In some cases, you may want to redirect to a custom error
      if (error instanceof AuthError) {
        return redirect(`${SIGNIN_ERROR_URL}?error=${error.type}`)
      }

      // Otherwise if a redirects happens Next.js can handle it
      // so you can just re-thrown the error and let Next.js handle it.
      // Docs:
      // https://nextjs.org/docs/app/api-reference/functions/redirect#server-component
      throw error
    }
  }

  return (
    <div className="min-h-[90vh] flex items-center px-4 justify-center bg-background my-6 md:my-10">
      <div className="w-full max-w-md space-y-8 p-6 md:p-10 bg-card rounded-xl shadow-lg border border-border">
        <div className="text-center">
          <h2 className="mt-6 text-2xl md:text-3xl font-bold tracking-tight text-foreground">
            Create your account
          </h2>
          <p className="mt-2 text-muted-foreground">
            Already have an account?{" "}
            <Link href="/sign-in" className="font-medium text-primary hover:text-primary/90 underline">
              Sign in
            </Link>
          </p>
        </div>

        <div className="space-y-4">
        {Object.values(providerMap).map((provider) => (
          <form
            action={() => onSubmitProvider(provider.id)}
          >
            <button type="submit">
              <span>Sign in with {provider.name}</span>
            </button>
          </form>
        ))}
        </div>

        <SeparatorWithText>
          <span className="uppercase text-muted-foreground">Or</span>
        </SeparatorWithText>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="mt-8 space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="Email address"
                      className="w-full px-3 py-2"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="firstName"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      placeholder="First Name"
                      className="w-full px-3 py-2"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="lastName"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      placeholder="Last Name"
                      className="w-full px-3 py-2"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="Password"
                      className="w-full px-3 py-2"
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
                className="w-full flex justify-center py-2.5 mt-8"
                disabled={Boolean(CAPTCHA_ENABLED && !captchaToken)}
              >
                Create Account with Password
              </Button>
            </div>
          </form>
        </Form>

        <div className="mt-6">
          <p className="text-xs text-center text-muted-foreground">
            By signing up, you agree to our{" "}
            <Link href="/terms" className="font-medium text-primary hover:text-primary/90 underline">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="font-medium text-primary hover:text-primary/90 underline">
              Privacy Policy
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignUpPage;
