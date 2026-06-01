export interface IDataProvider {
  name: string;
  search(query: string, limit?: number): Promise<any[]>;
  getDetails(id: string): Promise<any>;
}
