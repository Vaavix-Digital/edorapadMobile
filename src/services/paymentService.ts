import { financeApi } from '../shared/api/financeApi';
import { Alert } from 'react-native';

export interface PaymentOptions {
  feeId?: string;
  courseId?: string;
  courseTitle: string;
  amount: number;
  userEmail: string;
  userName: string;
  userPhone?: string;
}

export const paymentService = {
  processFeePayment: async (
    options: PaymentOptions,
    onSuccess: (transactionId: string) => void,
    onError: (errorMessage: string) => void
  ) => {
    try {
      // 1. Create order on backend
      const orderResponse = await financeApi.createRazorpayOrder({
        feeId: options.feeId,
        courseId: options.courseId,
        amount: options.amount,
        currency: 'INR'
      });

      if (!orderResponse.success || !orderResponse.data) {
        throw new Error('Failed to initialize payment order');
      }

      const { orderId, amount, keyId } = orderResponse.data;

      // In production with custom dev-client or ejected binary, RazorpayCheckout is used.
      // We also provide a graceful fallback for Expo Go / dev mock testing.
      let RazorpayCheckout: any = null;
      try {
        RazorpayCheckout = require('react-native-razorpay').default;
      } catch {
        RazorpayCheckout = null;
      }

      if (RazorpayCheckout) {
        const checkoutOptions = {
          description: `Fee Payment - ${options.courseTitle}`,
          image: 'https://edorapad.com/logo.png',
          currency: 'INR',
          key: keyId || 'rzp_test_placeholder',
          amount: amount * 100, // amount in paise
          name: 'Edorapad Education',
          order_id: orderId,
          prefill: {
            email: options.userEmail,
            contact: options.userPhone || '9999999999',
            name: options.userName
          },
          theme: { color: '#3E7B74' }
        };

        const paymentData = await RazorpayCheckout.open(checkoutOptions);
        
        // 2. Verify payment on backend
        const verifyRes = await financeApi.verifyRazorpayPayment({
          orderId: paymentData.razorpay_order_id,
          paymentId: paymentData.razorpay_payment_id,
          signature: paymentData.razorpay_signature,
          courseId: options.courseId
        });

        if (verifyRes.success) {
          onSuccess(verifyRes.transactionId);
        } else {
          onError(verifyRes.message || 'Payment verification failed');
        }
      } else {
        // Fallback simulation for dev client without native Razorpay binary
        Alert.alert(
          'Simulate Payment (Dev Mode)',
          `Order ID: ${orderId}\nAmount: ₹${options.amount}`,
          [
            { text: 'Cancel', style: 'cancel', onPress: () => onError('Payment cancelled by user') },
            {
              text: 'Simulate Success',
              onPress: async () => {
                try {
                  const verifyRes = await financeApi.verifyRazorpayPayment({
                    orderId,
                    paymentId: `pay_mock_${Date.now()}`,
                    signature: 'mock_signature',
                    courseId: options.courseId
                  });
                  onSuccess(verifyRes.transactionId || `tx_${Date.now()}`);
                } catch {
                  onSuccess(`tx_mock_${Date.now()}`);
                }
              }
            }
          ]
        );
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Payment processing failed';
      onError(msg);
    }
  }
};
