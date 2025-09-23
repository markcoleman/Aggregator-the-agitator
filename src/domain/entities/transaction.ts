import { z } from 'zod';
import { AmountSchema, PaginationSchema } from './account.js';

export const TransactionStatusEnum = z.enum(['PENDING', 'POSTED', 'CANCELLED']);

export const TransactionSchema = z.object({
  transactionId: z.string(),
  accountId: z.string(),
  amount: AmountSchema,
  description: z.string(),
  merchantName: z.string().optional(),
  transactionDate: z.string(),
  postedDate: z.string().optional(),
  status: TransactionStatusEnum,
  category: z.string().optional(),
});

export const TransactionsResponseSchema = z.object({
  transactions: z.array(TransactionSchema),
  pagination: PaginationSchema,
});

export type TransactionStatus = z.infer<typeof TransactionStatusEnum>;
export type Transaction = z.infer<typeof TransactionSchema>;
export type TransactionsResponse = z.infer<typeof TransactionsResponseSchema>;