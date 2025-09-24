import { describe, it, expect } from 'vitest';
import {
  FdxError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
  ConflictError,
} from '../../src/shared/errors/index.js';

describe('Error Classes', () => {
  describe('FdxError', () => {
    it('should create error with all properties', () => {
      const error = new FdxError('TEST_CODE', 'Test message', 400, 'Test details');

      expect(error.name).toBe('FdxError');
      expect(error.code).toBe('TEST_CODE');
      expect(error.message).toBe('Test message');
      expect(error.statusCode).toBe(400);
      expect(error.details).toBe('Test details');
    });

    it('should use default status code when not provided', () => {
      const error = new FdxError('TEST_CODE', 'Test message');

      expect(error.statusCode).toBe(500);
      expect(error.details).toBeUndefined();
    });
  });

  describe('UnauthorizedError', () => {
    it('should create 401 error with default message', () => {
      const error = new UnauthorizedError();

      expect(error.name).toBe('FdxError');
      expect(error.code).toBe('UNAUTHORIZED');
      expect(error.message).toBe('Authentication required');
      expect(error.statusCode).toBe(401);
    });

    it('should create 401 error with custom message', () => {
      const error = new UnauthorizedError('Custom auth message');

      expect(error.message).toBe('Custom auth message');
      expect(error.statusCode).toBe(401);
    });
  });

  describe('ForbiddenError', () => {
    it('should create 403 error with default message', () => {
      const error = new ForbiddenError();

      expect(error.name).toBe('FdxError');
      expect(error.code).toBe('FORBIDDEN');
      expect(error.message).toBe('Insufficient permissions');
      expect(error.statusCode).toBe(403);
    });

    it('should create 403 error with custom message', () => {
      const error = new ForbiddenError('Custom forbidden message');

      expect(error.message).toBe('Custom forbidden message');
      expect(error.statusCode).toBe(403);
    });
  });

  describe('NotFoundError', () => {
    it('should create 404 error with default message', () => {
      const error = new NotFoundError();

      expect(error.name).toBe('FdxError');
      expect(error.code).toBe('NOT_FOUND');
      expect(error.message).toBe('Resource not found');
      expect(error.statusCode).toBe(404);
    });

    it('should create 404 error with custom message', () => {
      const error = new NotFoundError('Custom not found message');

      expect(error.message).toBe('Custom not found message');
      expect(error.statusCode).toBe(404);
    });
  });

  describe('ValidationError', () => {
    it('should create 400 error with default message', () => {
      const error = new ValidationError();

      expect(error.name).toBe('FdxError');
      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.message).toBe('Invalid request data');
      expect(error.statusCode).toBe(400);
    });

    it('should create 400 error with custom message and details', () => {
      const error = new ValidationError('Custom validation message', 'Field is required');

      expect(error.message).toBe('Custom validation message');
      expect(error.details).toBe('Field is required');
      expect(error.statusCode).toBe(400);
    });
  });

  describe('ConflictError', () => {
    it('should create 409 error with default message', () => {
      const error = new ConflictError();

      expect(error.name).toBe('FdxError');
      expect(error.code).toBe('CONFLICT');
      expect(error.message).toBe('Request conflicts with current state');
      expect(error.statusCode).toBe(409);
    });

    it('should create 409 error with custom message', () => {
      const error = new ConflictError('Custom conflict message');

      expect(error.message).toBe('Custom conflict message');
      expect(error.statusCode).toBe(409);
    });
  });
});