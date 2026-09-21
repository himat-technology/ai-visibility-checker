import { z } from "zod";

export const auditRequestSchema = z.object({
  url: z
    .string()
    .trim()
    .min(1, "URL is required")
    .max(2048, "URL is too long"),
});

export type AuditRequestInput = z.infer<typeof auditRequestSchema>;
