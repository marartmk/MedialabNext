import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL;

export interface CreateSaleRequest {
  saleType: string;
  deviceId?: string;
  deviceRegistryId?: number;
  accessoryId?: number;
  brand: string;
  model: string;
  serialNumber?: string;
  imei?: string;
  customerId: string;
  companyId: string;
  multitenantId: string;
  salePrice: number;
  originalPrice?: number;
  discount?: number;
  vatRate: number;
  totalAmount: number;
  paymentType: string;
  paymentStatus: string;
  paidAmount: number;
  remainingAmount: number;
  installmentsCount?: number;
  installmentAmount?: number;
  saleStatus: string;
  saleStatusCode: string;
  invoiceId?: number;
  invoiceNumber?: string;
  invoiceDate?: string;
  receiptId?: number;
  receiptNumber?: string;
  receiptDate?: string;
  sellerCode?: string;
  sellerName?: string;
  notes?: string;
  includedAccessories?: string;
  hasWarranty: boolean;
  warrantyMonths?: number;
  warrantyExpiryDate?: string;
  saleDate?: string;
  deliveryDate?: string;
  createdBy?: string;
}

export interface CreateSaleResponse {
  id: number;
  saleId: string;
  saleCode: string;
  message: string;
  createdAt: string;
  brand: string;
  model: string;
  totalAmount: number;
  saleStatus: string;
  paymentStatus: string;
}

export const saleService = {
  createSale: async (data: CreateSaleRequest): Promise<CreateSaleResponse> => {
    const token = sessionStorage.getItem('token');
    const response = await axios.post(`${API_BASE_URL}/api/Sale`, data, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  },

  getSaleById: async (id: number) => {
    const token = sessionStorage.getItem('token');
    const response = await axios.get(`${API_BASE_URL}/api/Sale/${id}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return response.data;
  },

  getSaleBySaleId: async (saleId: string) => {
    const token = sessionStorage.getItem('token');
    const response = await axios.get(`${API_BASE_URL}/api/Sale/guid/${saleId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return response.data;
  },

  searchSales: async (filters: any) => {
    const token = sessionStorage.getItem('token');
    const response = await axios.post(`${API_BASE_URL}/api/Sale/search`, filters, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return response.data;
  },

  updateSale: async (saleId: string, data: Partial<CreateSaleRequest>) => {
    const token = sessionStorage.getItem('token');
    const response = await axios.put(`${API_BASE_URL}/api/Sale/${saleId}`, data, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return response.data;
  },

  deleteSale: async (saleId: string) => {
    const token = sessionStorage.getItem('token');
    const response = await axios.delete(`${API_BASE_URL}/api/Sale/${saleId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return response.data;
  }
};