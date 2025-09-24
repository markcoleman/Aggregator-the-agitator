import { FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { TransactionsService } from '../../domain/services/transactions.service.js';
import { FdxError } from '../../shared/errors/index.js';

const GetTransactionsParamsSchema = z.object({
  accountId: z.string(),
});

const GetTransactionsQuerySchema = z.object({
  fromDate: z.string().optional(),
  toDate: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).default(25),
  offset: z.coerce.number().min(0).default(0),
});

export class TransactionsController {
  constructor(private transactionsService: TransactionsService) {}

  async getTransactions(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      const params = GetTransactionsParamsSchema.parse(request.params);
      const query = GetTransactionsQuerySchema.parse(request.query);
      const { userId, payload } = request.user!;
      const scopes = payload.scope?.split(' ') || [];

      const result = await this.transactionsService.getTransactions(
        params.accountId,
        userId,
        scopes,
        query.fromDate,
        query.toDate,
        query.limit,
        query.offset,
      );

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
