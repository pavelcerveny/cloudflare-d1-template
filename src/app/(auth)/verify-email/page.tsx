import { Metadata } from "next";
import { auth } from "@/auth";
import Link from "next/link";
import { REDIRECT_TO_LOGIN } from "@/constants";
import { useRouter } from "next/router";
import { verifyEmailAction } from "./verify-email.action";
import { User } from "@/db/schema";

export const metadata: Metadata = {
  title: "Verify Email",
  description: "Verify your email address",
};

const VerifyEmailPage = async () => {
  const session = await auth();
  const { query } = useRouter();
  const token = query.token as string;

  if (!session?.user) {
    return (
      <div>
        <h2>You are not logged in</h2>
        <p>Please log in to verify your email address</p>
        <Link href={REDIRECT_TO_LOGIN}>Log in</Link>
      </div>
    )
  }

  const [, error] = await verifyEmailAction({
    token,
    email: (session.user as User).email!
  });

  if (error) {
    return (
      <div>
        <h2>Something went wrong</h2>
        <p>{error.message}</p>
      </div>
    )
  }

  return (
    <div>
      <h2>Email verified successfully</h2>
    </div>
  )
}

export default VerifyEmailPage;
