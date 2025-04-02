import { z } from "zod";
import { catchaSchema } from "./captcha.schema";

export const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  captchaToken: catchaSchema,
});
