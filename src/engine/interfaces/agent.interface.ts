export interface BaseAgent<TInput = any, TOutput = any> {
  name: string;
  status: 'idle' | 'running' | 'error';
  initialize(): Promise<void>;
  processTask?(task: any): Promise<TOutput>;
  execute?(input?: TInput): Promise<TOutput>;
}
