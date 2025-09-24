import { FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { ConsentService } from '../../domain/services/consent.service.js';
import {
  CreateConsentRequestSchema,
  UpdateConsentRequestSchema,
} from '../../domain/entities/consent.js';
import { FdxError } from '../../shared/errors/index.js';

const GetConsentParamsSchema = z.object({
  consentId: z.string(),
});

const UpdateConsentParamsSchema = z.object({
  consentId: z.string(),
});

export class ConsentController {
  constructor(private consentService: ConsentService) {}

  async createConsent(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      const body = CreateConsentRequestSchema.parse(request.body);
      const { userId } = request.user!;

      const result = await this.consentService.createConsent(body, userId);

      reply.code(201).send(result);
    } catch (error) {
      this.handleError(error, reply);
    }
  }

  async updateConsent(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      const params = UpdateConsentParamsSchema.parse(request.params);
      const body = UpdateConsentRequestSchema.parse(request.body);
      const { userId, payload } = request.user!;

      // Determine actor type based on request context
      // In a real implementation, this would come from JWT claims or request headers
      const actorType = this.determineActorType(payload);

      const result = await this.consentService.updateConsent(
        params.consentId,
        body,
        userId,
        actorType,
      );

      reply.code(200).send(result);
    } catch (error) {
      this.handleError(error, reply);
    }
  }

  async getConsent(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      const params = GetConsentParamsSchema.parse(request.params);
      const { userId, payload } = request.user!;

      // Determine requester type based on request context
      const requesterType = this.determineActorType(payload);

      const result = await this.consentService.getConsent(params.consentId, userId, requesterType);

      reply.code(200).send(result);
    } catch (error) {
      this.handleError(error, reply);
    }
  }

  private determineActorType(payload: any): 'subject' | 'client' | 'admin' {
    // Check for admin scope first
    const scopes = payload.scope?.split(' ') || [];
    if (scopes.includes('admin')) {
      return 'admin';
    }

    // If this is a client-credentials flow (no user sub), it's a client
    // If this is an authorization code flow (has user sub), it's usually a subject
    // For this simple implementation, assume if we have a 'sub' field, it represents a subject (end user)
    if (payload.sub) {
      return 'subject';
    }

    // Fallback to client if no sub (pure client credentials)
    return 'client';
  }

  private handleError(error: unknown, reply: FastifyReply): void {
    if (error instanceof FdxError) {
      reply.code(error.statusCode).send({
        code: error.code,
        message: error.message,
        details: error.details,
      });
    } else if (error instanceof z.ZodError) {
      reply.code(400).send({
        code: 'VALIDATION_ERROR',
        message: 'Invalid request parameters',
        details: error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', '),
      });
    } else {
      reply.code(500).send({
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      });
    }
  }
}
