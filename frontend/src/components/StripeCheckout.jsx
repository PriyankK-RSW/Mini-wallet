import { useStripe, useElements, PaymentElement } from "@stripe/react-stripe-js";
import toast from "react-hot-toast";

export default function StripeCheckout({ onClose }) {
  const stripe = useStripe();
  const elements = useElements();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) {
      toast.error("Stripe not loaded");
      return;
    }

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: window.location.origin + "/dashboard",
      },
    });

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Payment processing...");
      onClose();
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <PaymentElement />
      <button type="submit" className="btn-primary" disabled={!stripe}>
        Pay
      </button>
    </form>
  );
}