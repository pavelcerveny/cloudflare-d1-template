"use client";
import { type ReactNode } from "react";
import { FormField, FormItem, FormControl, FormMessage } from "@/components/ui/form";
import { type SignInSchema, signInSchema } from "@/schemas/signin.schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@react-email/components";
import { useForm, Form } from "react-hook-form";
import { Input } from "@/components/ui/input";

export const SignInForm = ({ onSubmit }: { onSubmit: (data: SignInSchema) => void }) => {

    const form = useForm<SignInSchema>({
        resolver: zodResolver(signInSchema),
      });

  return (
    <Form {...form}>
    <form onSubmit={form.handleSubmit(onSubmit)} className="mt-8 space-y-6">
      <FormField
        control={form.control}
        name="email"
        render={({ field }) => (
          <FormItem>
            <FormControl>
              <Input
                placeholder="Email address"
                type="email"
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

      <Button
        type="submit"
        className="w-full flex justify-center py-2.5"
      >
        Sign In with Password
      </Button>
    </form>
  </Form>
  );
};

export default SignInForm;
