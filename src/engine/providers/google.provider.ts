import { IDataProvider } from '../interfaces/provider.interface';
import { searchPlaces, getPlaceDetails } from '../../lib/services/google-maps';

export class GoogleProvider implements IDataProvider {
  name = 'GoogleMaps';

  async search(query: string, limit: number = 10): Promise<any[]> {
    return await searchPlaces(query, limit);
  }

  async getDetails(id: string): Promise<any> {
    return await getPlaceDetails(id);
  }
}
