import { Metadata } from "next";
import { notFound } from "next/navigation";
import ResetPasswordClientComponent from "./reset-password.client";

export const metadata: Metadata = {
  title: "Reset Password",
  description: "Set a new password for your account",
};

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>
}) {
  const token = (await searchParams).token;

  if (!token) {
    return notFound();
  }

  return <ResetPasswordClientComponent />;
}