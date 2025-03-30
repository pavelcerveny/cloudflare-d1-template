import { z } from "zod";

export const signInSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(4, "Password must be at least 4 characters"),
  //flow: z.string().min(1),
});

export type SignInSchema = z.infer<typeof signInSchema>;
