import { IQueueAdapter } from '../interfaces/queue.interface';

export class MemoryQueue<T> implements IQueueAdapter<T> {
  private queue: T[] = [];

  async push(job: T): Promise<void> {
    this.queue.push(job);
  }

  async pop(): Promise<T | null> {
    return this.queue.shift() || null;
  }

  async size(): Promise<number> {
    return this.queue.length;
  }

  async clear(): Promise<void> {
    this.queue = [];
  }
}
