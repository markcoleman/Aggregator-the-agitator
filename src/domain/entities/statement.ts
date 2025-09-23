import { z } from 'zod';
import { PaginationSchema } from './account.js';

export const StatementStatusEnum = z.enum(['AVAILABLE', 'PROCESSING', 'UNAVAILABLE']);

export const StatementSchema = z.object({
  statementId: z.string(),
  accountId: z.string(),
  statementDate: z.string(),
  status: StatementStatusEnum,
  beginDate: z.string().optional(),
  endDate: z.string().optional(),
  downloadUrl: z.string().url().optional(),
});

export const StatementsResponseSchema = z.object({
  statements: z.array(StatementSchema),
  pagination: PaginationSchema,
});

export type StatementStatus = z.infer<typeof StatementStatusEnum>;
export type Statement = z.infer<typeof StatementSchema>;
export type StatementsResponse = z.infer<typeof StatementsResponseSchema>;