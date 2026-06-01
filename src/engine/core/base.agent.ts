export abstract class BaseAgent<TInput, TOutput> {
  protected agentName: string;

  constructor(name: string) {
    this.agentName = name;
  }

  abstract execute(input: TInput): Promise<TOutput>;

  protected log(message: string): void {
    console.log(`[${this.agentName}] ${message}`);
  }

  protected error(message: string, error?: any): void {
    console.error(`[${this.agentName}] ❌ ${message}`, error || '');
  }
}
