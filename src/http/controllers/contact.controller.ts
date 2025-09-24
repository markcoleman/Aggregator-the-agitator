import { FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { ContactService } from '../../domain/services/contact.service.js';
import { FdxError } from '../../shared/errors/index.js';

const GetContactParamsSchema = z.object({
  accountId: z.string(),
});

export class ContactController {
  constructor(private contactService: ContactService) {}

  async getAccountContact(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      const params = GetContactParamsSchema.parse(request.params);
      const { userId, payload } = request.user!;
      const scopes = payload.scope?.split(' ') || [];

      const result = await this.contactService.getAccountContact(params.accountId, userId, scopes);

      reply.code(200).send(result);
    } catch (error) {
      this.handleError(error, reply);
    }
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
