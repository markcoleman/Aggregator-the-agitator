import { FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { AccountsService } from '../../domain/services/accounts.service.js';
import { FdxError } from '../../shared/errors/index.js';

const GetAccountsQuerySchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(25),
  offset: z.coerce.number().min(0).default(0),
});

const GetAccountParamsSchema = z.object({
  accountId: z.string(),
});

export class AccountsController {
  constructor(private accountsService: AccountsService) {}

  async getAccounts(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      const query = GetAccountsQuerySchema.parse(request.query);
      const { userId, payload } = request.user!;
      const scopes = payload.scope?.split(' ') || [];

      const result = await this.accountsService.getAccounts(
        userId,
        scopes,
        query.limit,
        query.offset,
      );

      reply.code(200).send(result);
    } catch (error) {
      this.handleError(error, reply);
    }
  }

  async getAccountById(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      const params = GetAccountParamsSchema.parse(request.params);
      const { userId, payload } = request.user!;
      const scopes = payload.scope?.split(' ') || [];

      const result = await this.accountsService.getAccountById(params.accountId, userId, scopes);

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
