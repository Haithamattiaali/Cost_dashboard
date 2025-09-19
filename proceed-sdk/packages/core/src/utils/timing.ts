/**
 * Timing utilities for debounce, throttle, and performance measurement
 */

/**
 * Debounce function execution
 */
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number,
  options: { leading?: boolean; trailing?: boolean; maxWait?: number } = {}
): T & { cancel: () => void; flush: () => void; pending: () => boolean } {
  const { leading = false, trailing = true, maxWait } = options;

  let timerId: NodeJS.Timeout | undefined;
  let maxTimerId: NodeJS.Timeout | undefined;
  let lastCallTime: number | undefined;
  let lastInvokeTime = 0;
  let lastArgs: any[] | undefined;
  let lastThis: any;
  let result: any;

  function invokeFunc(time: number) {
    const args = lastArgs;
    const thisArg = lastThis;

    lastArgs = lastThis = undefined;
    lastInvokeTime = time;
    result = fn.apply(thisArg, args!);
    return result;
  }

  function startTimer(pendingFunc: () => void, wait: number) {
    return setTimeout(pendingFunc, wait);
  }

  function cancelTimer(id: NodeJS.Timeout | undefined) {
    if (id !== undefined) {
      clearTimeout(id);
    }
  }

  function leadingEdge(time: number) {
    lastInvokeTime = time;
    timerId = startTimer(timerExpired, delay);
    return leading ? invokeFunc(time) : result;
  }

  function remainingWait(time: number) {
    const timeSinceLastCall = time - (lastCallTime || 0);
    const timeSinceLastInvoke = time - lastInvokeTime;
    const timeWaiting = delay - timeSinceLastCall;

    return maxWait !== undefined
      ? Math.min(timeWaiting, maxWait - timeSinceLastInvoke)
      : timeWaiting;
  }

  function shouldInvoke(time: number) {
    const timeSinceLastCall = time - (lastCallTime || 0);
    const timeSinceLastInvoke = time - lastInvokeTime;

    return (
      lastCallTime === undefined ||
      timeSinceLastCall >= delay ||
      timeSinceLastCall < 0 ||
      (maxWait !== undefined && timeSinceLastInvoke >= maxWait)
    );
  }

  function timerExpired() {
    const time = Date.now();
    if (shouldInvoke(time)) {
      return trailingEdge(time);
    }
    timerId = startTimer(timerExpired, remainingWait(time));
  }

  function trailingEdge(time: number) {
    timerId = undefined;

    if (trailing && lastArgs) {
      return invokeFunc(time);
    }
    lastArgs = lastThis = undefined;
    return result;
  }

  function cancel() {
    if (timerId !== undefined) {
      cancelTimer(timerId);
    }
    if (maxTimerId !== undefined) {
      cancelTimer(maxTimerId);
    }
    lastInvokeTime = 0;
    lastArgs = lastCallTime = lastThis = maxTimerId = timerId = undefined;
  }

  function flush() {
    return timerId === undefined ? result : trailingEdge(Date.now());
  }

  function pending() {
    return timerId !== undefined;
  }

  function debounced(this: any, ...args: any[]) {
    const time = Date.now();
    const isInvoking = shouldInvoke(time);

    lastArgs = args;
    lastThis = this;
    lastCallTime = time;

    if (isInvoking) {
      if (timerId === undefined) {
        return leadingEdge(lastCallTime);
      }
      if (maxWait !== undefined) {
        timerId = startTimer(timerExpired, delay);
        return invokeFunc(lastCallTime);
      }
    }
    if (timerId === undefined) {
      timerId = startTimer(timerExpired, delay);
    }
    return result;
  }

  debounced.cancel = cancel;
  debounced.flush = flush;
  debounced.pending = pending;

  return debounced as T & { cancel: () => void; flush: () => void; pending: () => boolean };
}

/**
 * Throttle function execution
 */
export function throttle<T extends (...args: any[]) => any>(
  fn: T,
  wait: number,
  options: { leading?: boolean; trailing?: boolean } = {}
): T & { cancel: () => void; flush: () => void } {
  const { leading = true, trailing = true } = options;

  let lastArgs: any[] | undefined;
  let lastThis: any;
  let result: any;
  let timerId: NodeJS.Timeout | undefined;
  let lastCallTime: number | undefined;
  let lastInvokeTime = 0;

  function invokeFunc(time: number) {
    const args = lastArgs;
    const thisArg = lastThis;

    lastArgs = lastThis = undefined;
    lastInvokeTime = time;
    result = fn.apply(thisArg, args!);
    return result;
  }

  function startTimer(pendingFunc: () => void, wait: number) {
    return setTimeout(pendingFunc, wait);
  }

  function cancelTimer(id: NodeJS.Timeout | undefined) {
    if (id !== undefined) {
      clearTimeout(id);
    }
  }

  function leadingEdge(time: number) {
    lastInvokeTime = time;
    timerId = startTimer(timerExpired, wait);
    return leading ? invokeFunc(time) : result;
  }

  function remainingWait(time: number) {
    const timeSinceLastCall = time - (lastCallTime || 0);
    const timeSinceLastInvoke = time - lastInvokeTime;
    const timeWaiting = wait - timeSinceLastCall;

    return timeWaiting;
  }

  function shouldInvoke(time: number) {
    const timeSinceLastCall = time - (lastCallTime || 0);
    const timeSinceLastInvoke = time - lastInvokeTime;

    return (
      lastCallTime === undefined ||
      timeSinceLastCall >= wait ||
      timeSinceLastCall < 0
    );
  }

  function timerExpired() {
    const time = Date.now();
    if (shouldInvoke(time)) {
      return trailingEdge(time);
    }
    timerId = startTimer(timerExpired, remainingWait(time));
  }

  function trailingEdge(time: number) {
    timerId = undefined;

    if (trailing && lastArgs) {
      return invokeFunc(time);
    }
    lastArgs = lastThis = undefined;
    return result;
  }

  function cancel() {
    if (timerId !== undefined) {
      cancelTimer(timerId);
    }
    lastInvokeTime = 0;
    lastArgs = lastCallTime = lastThis = timerId = undefined;
  }

  function flush() {
    return timerId === undefined ? result : trailingEdge(Date.now());
  }

  function throttled(this: any, ...args: any[]) {
    const time = Date.now();
    const isInvoking = shouldInvoke(time);

    lastArgs = args;
    lastThis = this;
    lastCallTime = time;

    if (isInvoking) {
      if (timerId === undefined) {
        return leadingEdge(lastCallTime);
      }
    }
    if (timerId === undefined) {
      timerId = startTimer(timerExpired, remainingWait(time));
    }
    return result;
  }

  throttled.cancel = cancel;
  throttled.flush = flush;

  return throttled as T & { cancel: () => void; flush: () => void };
}

/**
 * Delay execution for specified milliseconds
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Create a timeout promise
 */
export function timeout<T>(promise: Promise<T>, ms: number, message?: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(
        () => reject(new Error(message || `Operation timed out after ${ms}ms`)),
        ms
      )
    ),
  ]);
}

/**
 * Measure function execution time
 */
export async function measureTime<T>(
  fn: () => T | Promise<T>,
  label?: string
): Promise<{ result: T; duration: number }> {
  const start = performance.now();

  try {
    const result = await fn();
    const duration = performance.now() - start;

    if (label) {
      console.log(`${label}: ${duration.toFixed(2)}ms`);
    }

    return { result, duration };
  } catch (error) {
    const duration = performance.now() - start;

    if (label) {
      console.error(`${label} failed after ${duration.toFixed(2)}ms`);
    }

    throw error;
  }
}

/**
 * Create a rate limiter
 */
export class RateLimiter {
  private queue: Array<() => void> = [];
  private running = 0;

  constructor(
    private maxConcurrent: number = 5,
    private interval: number = 1000,
    private maxPerInterval: number = 10
  ) {
    this.startIntervalProcessor();
  }

  private startIntervalProcessor() {
    setInterval(() => {
      this.processQueue();
    }, this.interval);
  }

  private processQueue() {
    const toProcess = Math.min(
      this.queue.length,
      this.maxPerInterval - this.running,
      this.maxConcurrent - this.running
    );

    for (let i = 0; i < toProcess; i++) {
      const fn = this.queue.shift();
      if (fn) {
        this.running++;
        fn();
      }
    }
  }

  async execute<T>(fn: () => T | Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await fn();
          resolve(result);
        } catch (error) {
          reject(error);
        } finally {
          this.running--;
        }
      });
    });
  }

  clear() {
    this.queue = [];
  }

  get queueSize() {
    return this.queue.length;
  }

  get runningCount() {
    return this.running;
  }
}

/**
 * Schedule periodic execution
 */
export class Scheduler {
  private timers = new Map<string, NodeJS.Timeout>();

  schedule(
    id: string,
    fn: () => void | Promise<void>,
    interval: number,
    immediate: boolean = false
  ): void {
    this.cancel(id);

    if (immediate) {
      Promise.resolve(fn()).catch(console.error);
    }

    const timer = setInterval(() => {
      Promise.resolve(fn()).catch(console.error);
    }, interval);

    this.timers.set(id, timer);
  }

  scheduleOnce(
    id: string,
    fn: () => void | Promise<void>,
    delay: number
  ): void {
    this.cancel(id);

    const timer = setTimeout(() => {
      Promise.resolve(fn())
        .catch(console.error)
        .finally(() => this.timers.delete(id));
    }, delay);

    this.timers.set(id, timer);
  }

  cancel(id: string): boolean {
    const timer = this.timers.get(id);
    if (timer) {
      clearInterval(timer);
      clearTimeout(timer);
      this.timers.delete(id);
      return true;
    }
    return false;
  }

  cancelAll(): void {
    for (const timer of this.timers.values()) {
      clearInterval(timer);
      clearTimeout(timer);
    }
    this.timers.clear();
  }

  has(id: string): boolean {
    return this.timers.has(id);
  }

  get size(): number {
    return this.timers.size;
  }
}