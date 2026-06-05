export interface IQueueAdapter<T> {
  push(job: T): Promise<void>;
  pop(): Promise<T | null>;
  size(): Promise<number>;
  clear(): Promise<void>;
}

export interface QueueTask {
  id: string;
  type: string;
  payload: any;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt?: Date;
  retryCount?: number;
}
