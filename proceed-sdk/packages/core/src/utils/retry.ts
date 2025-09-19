/**
 * Retry utility with exponential backoff
 */

import { Result, SDKError } from '../contracts';

export interface RetryOptions {
  attempts?: number;
  delay?: number;
  maxDelay?: number;
  factor?: number;
  onRetry?: (error: Error, attempt: number) => void;
  shouldRetry?: (error: Error) => boolean;
  signal?: AbortSignal;
}

/**
 * Retry a function with exponential backoff
 */
export async function retry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<Result<T>> {
  const {
    attempts = 3,
    delay = 1000,
    maxDelay = 30000,
    factor = 2,
    onRetry,
    shouldRetry = () => true,
    signal,
  } = options;

  let lastError: Error | undefined;
  let currentDelay = delay;

  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      // Check if aborted
      if (signal?.aborted) {
        return {
          success: false,
          error: {
            code: 'OPERATION_ABORTED',
            message: 'Operation was aborted',
            solution: 'Retry the operation if needed',
          },
        };
      }

      const result = await fn();
      return { success: true, data: result };
    } catch (error) {
      lastError = error as Error;

      // Check if we should retry
      if (!shouldRetry(lastError)) {
        break;
      }

      // Don't retry on last attempt
      if (attempt === attempts) {
        break;
      }

      // Call retry callback if provided
      if (onRetry) {
        onRetry(lastError, attempt);
      }

      // Wait before retrying
      await sleep(currentDelay, signal);

      // Calculate next delay with exponential backoff
      currentDelay = Math.min(currentDelay * factor, maxDelay);
    }
  }

  return {
    success: false,
    error: {
      code: 'RETRY_EXHAUSTED',
      message: `Operation failed after ${attempts} attempts: ${lastError?.message}`,
      details: lastError,
      solution: 'Check the error details and retry later',
    },
  };
}

/**
 * Retry with specific error handling
 */
export async function retryWithErrorHandling<T>(
  fn: () => Promise<T>,
  options: RetryOptions & {
    errorCodes?: string[];
    errorMessages?: RegExp[];
  } = {}
): Promise<Result<T>> {
  const { errorCodes = [], errorMessages = [], ...retryOptions } = options;

  const shouldRetry = (error: Error): boolean => {
    // Check if error code matches
    if ('code' in error && errorCodes.includes((error as any).code)) {
      return true;
    }

    // Check if error message matches patterns
    if (errorMessages.some((pattern) => pattern.test(error.message))) {
      return true;
    }

    // Check for network errors
    if (isNetworkError(error)) {
      return true;
    }

    // Check for timeout errors
    if (isTimeoutError(error)) {
      return true;
    }

    return false;
  };

  return retry(fn, { ...retryOptions, shouldRetry });
}

/**
 * Sleep for specified milliseconds
 */
export function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(resolve, ms);

    if (signal) {
      signal.addEventListener('abort', () => {
        clearTimeout(timeout);
        reject(new Error('Sleep aborted'));
      });
    }
  });
}

/**
 * Check if error is a network error
 */
export function isNetworkError(error: Error): boolean {
  const networkErrorPatterns = [
    /network/i,
    /fetch/i,
    /connect/i,
    /ECONNREFUSED/,
    /ENOTFOUND/,
    /ETIMEDOUT/,
    /EHOSTUNREACH/,
    /ENETUNREACH/,
  ];

  return networkErrorPatterns.some((pattern) => pattern.test(error.message));
}

/**
 * Check if error is a timeout error
 */
export function isTimeoutError(error: Error): boolean {
  const timeoutErrorPatterns = [/timeout/i, /timed out/i, /ETIMEDOUT/];

  return timeoutErrorPatterns.some((pattern) => pattern.test(error.message));
}

/**
 * Create a retry decorator
 */
export function withRetry<T extends (...args: any[]) => Promise<any>>(
  options: RetryOptions = {}
): (target: any, propertyKey: string, descriptor: PropertyDescriptor) => void {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const fn = () => originalMethod.apply(this, args);
      const result = await retry(fn, options);

      if (!result.success) {
        throw new Error(result.error?.message || 'Operation failed');
      }

      return result.data;
    };

    return descriptor;
  };
}

/**
 * Retry with circuit breaker pattern
 */
export class CircuitBreaker {
  private failures = 0;
  private lastFailureTime = 0;
  private state: 'closed' | 'open' | 'half-open' = 'closed';

  constructor(
    private threshold: number = 5,
    private timeout: number = 60000,
    private resetTimeout: number = 30000
  ) {}

  async execute<T>(fn: () => Promise<T>): Promise<Result<T>> {
    // Check if circuit is open
    if (this.state === 'open') {
      const now = Date.now();
      if (now - this.lastFailureTime > this.resetTimeout) {
        this.state = 'half-open';
      } else {
        return {
          success: false,
          error: {
            code: 'CIRCUIT_OPEN',
            message: 'Circuit breaker is open',
            solution: 'Wait for circuit to reset',
          },
        };
      }
    }

    try {
      const result = await Promise.race([
        fn(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Operation timeout')), this.timeout)
        ),
      ]);

      // Reset on success
      if (this.state === 'half-open') {
        this.state = 'closed';
        this.failures = 0;
      }

      return { success: true, data: result };
    } catch (error) {
      this.failures++;
      this.lastFailureTime = Date.now();

      if (this.failures >= this.threshold) {
        this.state = 'open';
      }

      return {
        success: false,
        error: {
          code: 'CIRCUIT_BREAKER_ERROR',
          message: `Operation failed: ${(error as Error).message}`,
          details: error,
          solution: 'Check service health',
        },
      };
    }
  }

  reset(): void {
    this.state = 'closed';
    this.failures = 0;
    this.lastFailureTime = 0;
  }

  getState(): 'closed' | 'open' | 'half-open' {
    return this.state;
  }
}