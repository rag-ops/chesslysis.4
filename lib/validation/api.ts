import { z } from "zod";

export const usernameSchema = z.object({
  username: z.string().trim().min(1).max(50),
});

export const analysisSchema = z.object({
  depth: z.number().int().min(8).max(30).optional(),
});
