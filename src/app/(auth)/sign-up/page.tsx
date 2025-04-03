import { Metadata } from "next";
import SignUpClientComponent from "./sign-up.client";
import { redirect } from "next/navigation";
import { REDIRECT_AFTER_SIGN_IN } from "@/constants";
import { auth, providerMap } from "@/auth";

export const metadata: Metadata = {
  title: "Sign Up",
  description: "Create a new account",
};

const SignUpPage = async () => {
  const session = await auth();

  if (session?.user) {
    return redirect(REDIRECT_AFTER_SIGN_IN);
  }

  return <SignUpClientComponent providerMap={providerMap} />
}

export default SignUpPage;
