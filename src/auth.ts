import NextAuth from "next-auth"
import { DrizzleAdapter } from "@auth/drizzle-adapter"
import { getDB } from "@/db"
import Credentials from "next-auth/providers/credentials"
import { hashPassword, verifyPassword } from "./utils/password-hasher";
import { SignInSchema } from "./schemas/signin.schema";
import { accounts, sessions, users, verificationTokens } from "./db/schema";
import { eq } from 'drizzle-orm';
import { canSignUp, generateSessionToken } from "./utils/auth";
import { getIP } from "./utils/get-IP";
import { sendVerificationEmail } from "./utils/email";
import { createId } from "@paralleldrive/cuid2";
import { EMAIL_VERIFICATION_TOKEN_EXPIRATION_SECONDS } from "./constants";

const authResult = async () => {
    return NextAuth({
      providers: [
        Credentials({
          credentials: {
            email: {},
            password: {},
          },
          authorize: async (data) => {
            let user = null
            const {email, password, flow} = data as SignInSchema;

            const db = await getDB();

            let returnUserData: Record<string, string | null> = {};
     
            user = await db.query.users.findFirst({
              where: eq(users.email, email)
            });

            if (flow === 'login') {

              if (!user) {
                throw new Error("Invalid credentials.");
              }

              const isValid = await verifyPassword({
                storedHash: user.hashedPassword,
                passwordAttempt: password
              });

              if (!isValid) {
                throw new Error("Invalid credentials.");
              }

              returnUserData = {
                id: user.id,
                email: user.email,
              }
            } else {
              if (user) {
                throw new Error("Invalid credentials.");
              }

              await canSignUp({ email });

              const hashedPassword = await hashPassword({ password });

              // Create the user
              const [createdUser] = await db.insert(users)
                .values({
                  email,
                  hashedPassword,
                  signUpIpAddress: await getIP(),
                })
                .returning();

                if (!createdUser || !createdUser.email) {
                  throw new Error("Failed to register user.");
                }

                const verificationToken = createId();
                const expiresAt = new Date(Date.now() + EMAIL_VERIFICATION_TOKEN_EXPIRATION_SECONDS * 1000);

                await db.insert(verificationTokens)
                  .values({
                    identifier: createId(),
                    token: verificationToken,
                    expires: expiresAt,
                  });

                await sendVerificationEmail({
                  email: createdUser.email,
                  verificationToken,
                  username: createdUser.name || createdUser.email
                });

                returnUserData = {
                  id: createdUser.id,
                  email: createdUser.email,
                }
            }

            return returnUserData;
          },
        }),
      ],
      adapter: DrizzleAdapter(await getDB(), {
        usersTable: users,
        accountsTable: accounts,
        sessionsTable: sessions,
        verificationTokensTable: verificationTokens,
      }),
      callbacks: {
        async jwt({ token, user, account }) {
          if (account?.provider === "credentials") {
            const expires = new Date(Date.now() + 60 * 60 * 24 * 30 * 1000);
            const sessionToken = generateSessionToken();
  
            const db = await getDB();

            await db.insert(sessions)
            .values({
              userId: user.id!,
              sessionToken,
              expires,
            })
            .returning();

            token.sessionId = sessionToken;
          }
  
          return token;
        },
      },
      jwt: {
        async encode({ token }) {
          return token?.sessionId as string
        },
    }
    });
  };
  
  export const { handlers, signIn, signOut, auth } = await authResult();