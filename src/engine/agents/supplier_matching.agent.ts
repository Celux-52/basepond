import { BaseAgent } from '../core/base.agent';

export interface SupplierMatchOutput {
  primary_supplier_type: string;
  secondary_supplier_type: string | null;
}

export class SupplierMatchingAgent extends BaseAgent<string, SupplierMatchOutput> {
  constructor() {
    super('SupplierMatchingAgent');
  }

  async execute(category: string): Promise<SupplierMatchOutput> {
    const cat = category.toLowerCase();

    if (cat.includes('bayan kuaför') || cat.includes('kadın kuaför')) {
      return { primary_supplier_type: 'Kozmetik & Saç Boyası Toptancısı', secondary_supplier_type: 'Kuaför Ekipmanları' };
    }
    
    if (cat.includes('erkek kuaför') || cat.includes('berber')) {
      return { primary_supplier_type: 'Erkek Bakım Ürünleri & Jöle', secondary_supplier_type: 'Berber Ekipmanları' };
    }
    
    if (cat.includes('güzellik') || cat.includes('beauty')) {
      return { primary_supplier_type: 'Cilt Bakım Ürünleri & Cihazları', secondary_supplier_type: 'Lazer & Epilasyon Sistemleri' };
    }
    
    if (cat.includes('tırnak') || cat.includes('nail')) {
      return { primary_supplier_type: 'Protez Tırnak & Oje Toptancısı', secondary_supplier_type: null };
    }

    return { primary_supplier_type: 'Genel Salon Sarf Malzemeleri', secondary_supplier_type: null };
  }
}
