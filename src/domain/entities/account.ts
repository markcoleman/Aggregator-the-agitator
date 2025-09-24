import { z } from 'zod';

export const AccountTypeEnum = z.enum(['CHECKING', 'SAVINGS', 'CREDIT_CARD', 'LOAN', 'INVESTMENT']);
export const AccountStatusEnum = z.enum(['ACTIVE', 'INACTIVE', 'CLOSED']);

export const AmountSchema = z.object({
  amount: z.number(),
  currency: z.string(),
});

export const AccountSchema = z.object({
  accountId: z.string(),
  accountType: AccountTypeEnum,
  accountNumber: z.string(),
  accountName: z.string(),
  status: AccountStatusEnum,
  balance: AmountSchema,
  availableBalance: AmountSchema.optional(),
  openedDate: z.string().optional(),
});

export const PaginationSchema = z.object({
  totalCount: z.number(),
  offset: z.number(),
  limit: z.number(),
  hasMore: z.boolean(),
});

export const AccountsResponseSchema = z.object({
  accounts: z.array(AccountSchema),
  pagination: PaginationSchema,
});

export type AccountType = z.infer<typeof AccountTypeEnum>;
export type AccountStatus = z.infer<typeof AccountStatusEnum>;
export type Amount = z.infer<typeof AmountSchema>;
export type Account = z.infer<typeof AccountSchema>;
export type Pagination = z.infer<typeof PaginationSchema>;
export type AccountsResponse = z.infer<typeof AccountsResponseSchema>;
