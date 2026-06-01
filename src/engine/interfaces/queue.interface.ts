export interface IQueueAdapter<T> {
  push(job: T): Promise<void>;
  pop(): Promise<T | null>;
  size(): Promise<number>;
  clear(): Promise<void>;
}
