// Mock Stripe implementation for demo purposes
// In a real application, this would be handled by a backend server

export const mockStripe = {
  confirmCardPayment: async (clientSecret, options) => {
    // Simulate payment processing delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Mock successful payment
    return {
      error: null,
      paymentIntent: {
        id: 'pi_mock_' + Date.now(),
        status: 'succeeded',
        amount: 1000, // $10.00 in cents
        currency: 'usd'
      }
    };
  }
};

// Mock payment intent creation
export const createMockPaymentIntent = async (amount, currency, metadata) => {
  return {
    clientSecret: 'pi_mock_' + Date.now() + '_secret',
    id: 'pi_mock_' + Date.now()
  };
};

// Mock Stripe initialization
export const loadStripe = async (publishableKey) => {
  return mockStripe;
};
