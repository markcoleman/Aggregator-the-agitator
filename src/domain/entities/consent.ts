import { z } from 'zod';

// Consent status enum following the state machine requirements
export const ConsentStatusEnum = z.enum([
  'PENDING',
  'ACTIVE', 
  'SUSPENDED',
  'REVOKED',
  'EXPIRED'
]);

// Data scopes enum for FDX permissions
export const DataScopeEnum = z.enum([
  'accounts:read',
  'transactions:read',
  'contact:read',
  'payment_networks:read',
  'statements:read'
]);

// Audit entry for tracking consent changes
export const AuditEntrySchema = z.object({
  timestamp: z.string(),
  action: z.string(),
  actor: z.string(),
  actorType: z.enum(['subject', 'client', 'admin']),
  previousStatus: ConsentStatusEnum.optional(),
  newStatus: ConsentStatusEnum.optional(),
  reason: z.string().optional(),
});

// Core consent schema
export const ConsentSchema = z.object({
  id: z.string(),
  subjectId: z.string(),
  clientId: z.string(),
  dataScopes: z.array(DataScopeEnum),
  accountIds: z.array(z.string()),
  purpose: z.string(),
  status: ConsentStatusEnum,
  createdAt: z.string(),
  updatedAt: z.string(),
  expiresAt: z.string(),
  auditTrail: z.array(AuditEntrySchema),
});

// Request schemas
export const CreateConsentRequestSchema = z.object({
  subjectId: z.string(),
  clientId: z.string(),
  dataScopes: z.array(DataScopeEnum).min(1),
  accountIds: z.array(z.string()).min(1),
  purpose: z.string().min(1),
  expiry: z.string(), // ISO 8601 datetime
});

export const UpdateConsentRequestSchema = z.object({
  action: z.enum(['approve', 'suspend', 'resume', 'revoke']),
  reason: z.string().optional(),
});

// Response schemas
export const ConsentResponseSchema = ConsentSchema;

export const CreateConsentResponseSchema = z.object({
  id: z.string(),
  status: z.literal('PENDING'),
  subjectId: z.string(),
  clientId: z.string(),
  dataScopes: z.array(DataScopeEnum),
  accountIds: z.array(z.string()),
  purpose: z.string(),
  createdAt: z.string(),
  expiresAt: z.string(),
});

// Type exports
export type ConsentStatus = z.infer<typeof ConsentStatusEnum>;
export type DataScope = z.infer<typeof DataScopeEnum>;
export type AuditEntry = z.infer<typeof AuditEntrySchema>;
export type Consent = z.infer<typeof ConsentSchema>;
export type CreateConsentRequest = z.infer<typeof CreateConsentRequestSchema>;
export type UpdateConsentRequest = z.infer<typeof UpdateConsentRequestSchema>;
export type ConsentResponse = z.infer<typeof ConsentResponseSchema>;
export type CreateConsentResponse = z.infer<typeof CreateConsentResponseSchema>;