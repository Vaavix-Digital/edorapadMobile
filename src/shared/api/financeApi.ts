import { api } from './client';
import { API_ENDPOINTS } from '../constants/endpoints';

export const financeApi = {
  createRazorpayOrder: async (orderData: {
    feeId?: string;
    courseId?: string;
    amount: number;
    currency?: string;
  }): Promise<{ success: boolean; data: { orderId: string; amount: number; currency: string; keyId: string } }> => {
    const response = await api.post(API_ENDPOINTS.PAYMENTS.CREATE_ORDER, orderData);
    return response.data;
  },

  verifyRazorpayPayment: async (paymentData: {
    orderId: string;
    paymentId: string;
    signature: string;
    courseId?: string;
  }): Promise<{ success: boolean; message: string; transactionId: string }> => {
    const response = await api.post(API_ENDPOINTS.PAYMENTS.VERIFY, paymentData);
    return response.data;
  },

  getInvoiceData: async (transactionId: string): Promise<any> => {
    const response = await api.get(API_ENDPOINTS.PAYMENTS.INVOICE_DATA(transactionId));
    return response.data;
  }
};
