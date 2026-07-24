import { z } from "zod";

export const createUserSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  username: z.string().regex(/^@?[a-z0-9_]{3,30}$/),
});

export const updateUserProfileSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  avatarUrl: z.string().optional(),
  description: z.string().max(500).optional(),
});
