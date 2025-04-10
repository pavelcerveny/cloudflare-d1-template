import { Metadata } from "next";
import { auth } from "@/auth";
import ForgotPasswordClientComponent from "./forgot-password.client";

export const metadata: Metadata = {
  title: "Forgot Password",
  description: "Reset your password",
};

export default async function ForgotPasswordPage() {
  const session = await auth();
    
  return <ForgotPasswordClientComponent session={session} />;
}