import { useState } from "react";
import axios from "axios";
import { useAuthStore } from "../store/authStore";
import toast from "react-hot-toast";
import "../Css/GoPro.css";

const PLANS = [
  { key: "CANTEEN_MONTHLY", name: "Canteen Plan", price: 1000 }
];


export default function GoPro() {
  const { user, fetchUserData } = useAuthStore();
  const API_BASE =  import.meta.env.VITE_BASE_URL;

  const [showModal, setShowModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async () => {
    if (!selectedPlan || !pin) {
      return toast.error("Select plan and enter PIN");
    }

    try {
      setLoading(true);

      const res = await axios.post(
        `${API_BASE}/wallet/subscribe`,
        {
          plan: selectedPlan,
          pin,
        }
      );

      toast.success(res.data.message);
      setShowModal(false);
      setPin("");
      setSelectedPlan(null);
      fetchUserData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Subscription failed");
    } finally {
      setLoading(false);
    }
  };


  if (user?.subscription?.endDate > new Date()) {
    return (
      <button className="btn-secondary" disabled>
       {user.subscription.plan} Active
      </button>
    );
  }

  return (
    <>
      <button className="btn-primary" onClick={() => setShowModal(true)}>
        🚀 Go Pro
      </button>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-card">
            <h3>Choose Subscription</h3>

            {PLANS.map((plan) => (
              <div
                key={plan.key}
                className={`plan-card ${
                  selectedPlan === plan.key ? "active" : ""
                }`}
                onClick={() => setSelectedPlan(plan.key)}
              >
                <h4>{plan.name}</h4>
                <p>₹{plan.price} / month</p>
              </div>
            ))}

            <input
              type="password"
              placeholder="Enter PIN"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              className="input"
            />

            <div className="modal-actions">
              <button
                onClick={handleSubscribe}
                disabled={loading}
                className="btn-primary"
              >
                {loading ? "Processing..." : "Subscribe"}
              </button>

              <button
                onClick={() => setShowModal(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
