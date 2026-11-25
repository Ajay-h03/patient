export function loadRazorpay() {
  return new Promise((resolve, reject) => {
    if (window.Razorpay) {
      resolve(window.Razorpay);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(window.Razorpay);
    script.onerror = () => reject(new Error('Could not load Razorpay Checkout'));
    document.body.appendChild(script);
  });
}

export async function openRazorpayCheckout({ order, onSuccess, onFailure, onDismiss }) {
  const Razorpay = await loadRazorpay();
  const checkout = new Razorpay({
    key: order.keyId,
    amount: order.amount,
    currency: order.currency || 'INR',
    name: 'MediCore PMS',
    description: order.bill?.serviceDescription || 'Patient bill',
    order_id: order.orderId,
    prefill: {
      name: order.bill?.patient?.name || '',
      email: order.bill?.patient?.email || '',
      contact: order.bill?.patient?.phone || '',
    },
    theme: { color: '#0f766e' },
    handler: (response) => onSuccess(response),
    modal: {
      ondismiss: () => onDismiss?.(),
    },
  });

  checkout.on('payment.failed', (response) => {
    onFailure?.(response?.error?.description || 'Payment failed');
  });

  checkout.open();
}
