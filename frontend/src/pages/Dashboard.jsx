// src/pages/Dashboard.jsx
import { useEffect, useState } from "react";
import { useAuthStore } from "../store/authStore";
import GoPro from "../components/GoPro";
import toast from "react-hot-toast";
import { Eye, EyeOff } from "lucide-react";
import { format } from "date-fns";
import "./Dashboard.css";
import { Elements } from "@stripe/react-stripe-js";
import { stripePromise } from "../stripe";
import StripeCheckout from "../components/StripeCheckout";
import { useNavigate } from "react-router-dom";
import axios from "axios"
function getPlanLimit(plan, type = "meals") {
  const limits = {
    CANTEEN_MONTHLY: { meals: 30 }
  };
  return limits[plan]?.[type] ?? Infinity;
}

export default function Dashboard() {
  const { user, balance, transactions, fetchUserData, transfer, logout } = useAuthStore();
  const navigate = useNavigate();
  const BASE_URL = import.meta.env.VITE_BASE_URL || "http://localhost:5000/";

  const [showTransfer, setShowTransfer] = useState(false);
  const [receiver, setReceiver] = useState("");
  const [amount, setAmount] = useState("");
  const [pin, setPin] = useState("");
  const [isHidden, setIsHidden] = useState(true);
  const [showAddMoney, setShowAddMoney] = useState(false);
  const [topupAmount, setTopupAmount] = useState("");
  const [clientSecret, setClientSecret] = useState(null);
  const [orders, setOrders] = useState([]);
  const [showOrders, setShowOrders] = useState(false);
  const [rewards, setRewards] = useState(0);
  const [monthlyUsed, setMonthlyUsed] = useState(0);    
  const [showGoPro, setShowGoPro] = useState(false);
  const [walletId, setWalletId] = useState("");
  const [points, setPoints] = useState("");
  const [loading, setLoading] = useState(false);
  const [showGiftpoints , setshowGiftpoints] = useState("false")


  const isSubscriptionActive =
    user?.subscription &&
    new Date(user.subscription.endDate) > new Date();

  const currentPlan = user?.subscription?.plan;
  const mealLimit = getPlanLimit(currentPlan, "meals");
  const limitReached = isSubscriptionActive && mealLimit !== Infinity && monthlyUsed >= mealLimit;

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  useEffect(() => {
    if (!user) return;

    if (user.email === "admin@gmail.com") {
      navigate("/dashboard/admin");
    } else if (["canteen@gmail.com", "library@gmail.com", "events@gmail.com"].includes(user.email)) {
      navigate("/dashboard/service");
    } else {
      navigate("/");
    }
  }, [user, navigate]);

  const fetchRewardsPoints = async () => {
    try {
      const res = await fetch(`${BASE_URL}rewards/rewardsPoints`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      const data = await res.json();
      setRewards(data.rewardsPoints || 0);
    } catch (err) {
      console.error("Rewards fetch error:", err);
    }
  };

  // Fetch user's orders
  const fetchMyorderData = async () => {
    try {
      const res = await fetch(`${BASE_URL}order/getMyorders`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      const data = await res.json();
      setOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Orders fetch error:", err);
    }
  };

  const fetchPlanUsage = async () => {
    if (!isSubscriptionActive || !currentPlan) return;

    try {
      const res = await fetch(`${BASE_URL}wallet/usage/meals`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      if (!res.ok) throw new Error("Usage fetch failed");
      const data = await res.json();
      setMonthlyUsed(data.used || 0);
    } catch (err) {
      console.error("Plan usage fetch error:", err);
    }
  };

  useEffect(() => {
    if (!user) return;
    fetchRewardsPoints();
    if (isSubscriptionActive) {
      fetchPlanUsage();
    }
  }, [user, isSubscriptionActive]);

  const redeemRewardsPoints = async () => {
    try {
      const res = await fetch(`${BASE_URL}rewards/redeemPoints`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ pointsToRedeem: rewards }),
      });
      const data = await res.json();
      toast.success(data.message || "Points redeemed!");
      fetchUserData();
      fetchRewardsPoints();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Redeem failed");
    }
  };

  const handleTransfer = async (e) => {
    e.preventDefault();
    try {
      const res = await transfer(receiver, amount, pin);
      toast.success(`${res.message} - Ref: ${res.reference}`);
      setShowTransfer(false);
      setReceiver("");
      setAmount("");
      setPin("");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Transfer failed");
    }
  };

  const handleAddMoney = async () => {
    try {
      const res = await fetch(`${BASE_URL}stripe/add-money`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ amount: Number(topupAmount) }),
      });
      const data = await res.json();
      setClientSecret(data.clientSecret);
    } catch {
      toast.error("Failed to start payment");
    }
  };
  const handleGift = async () => {
    if (!walletId || !points) {
      return toast.error("Enter wallet ID and points");
    }

    try {
      setLoading(true);

      const res = await axios.post(
        "http://localhost:5000/rewards/giftpoints",
        {
          receiverWalletId: walletId,
          amount: Number(points),
        }
      );

      toast.success(res.data.message);
      setWalletId("");
      setPoints("");
      setshowGiftpoints("false")
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to gift points");
      setshowGiftpoints("false")
      console.log(err)
    } finally {
      setLoading(false);
    }
  };
  const toggleVisibility = () => setIsHidden((p) => !p);

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="header-content">
          <h1 className="app-title">MyWallet</h1>
          <button onClick={logout} className="logout-btn">
            Logout
          </button>
        </div>
      </header>

      <main className="dashboard-main">
        <div className="balance-card">
          <p className="balance-label">Available Balance</p>
          <div className="balance-amount">
            {balance === null ? (
              <span className="loading">Loading...</span>
            ) : (
              <span className={isHidden ? "blurred" : ""}>₹{balance}</span>
            )}
            <button className="eye-toggle" onClick={toggleVisibility} aria-label={isHidden ? "Show" : "Hide"}>
              {isHidden ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          <p className="rewards-line">Reward Points: {rewards}</p>
          <p className="wallet-id">Wallet ID: {user?.walletId || "Loading..."}</p>

         
          {isSubscriptionActive ? (
            <div className="subscription-info">
              <div className="plan-details">
                <strong>{currentPlan?.replace("_", " ")}</strong>
                <span className="valid-until">
                  Valid till {new Date(user.subscription.endDate).toLocaleDateString()}
                </span>
              </div>

              {currentPlan === "CANTEEN_MONTHLY" && (
                <div className={`limit-status ${limitReached ? "limit-reached" : ""}`}>
                  <div className="progress-text">
                    <span>Meals this month: {monthlyUsed} / {mealLimit}</span>
                  </div>
                  {limitReached ? (
                    <div className="limit-warning">
                      Monthly limit reached • Regular purchase needed
                    </div>
                  ) : (
                    <div className="remaining">
                      {mealLimit - monthlyUsed} meals remaining
                    </div>
                  )}
                </div>
              )}

              <button className="status-btn active" disabled>
                Active
              </button>
            </div>
          ) : (
            <div className="no-subscription">
              <GoPro show={showGoPro} setShow={setShowGoPro} />
            </div>
          )}

          <div className="action-buttons">
            <button onClick={() => setShowAddMoney(true)} className="btn add-money">
              Add Money
            </button>
            <button
              onClick={() => {
                fetchMyorderData();
                setShowOrders(true);
              }}
              className="btn my-orders"
            >
              My Orders
            </button>
            <button onClick={redeemRewardsPoints} className="btn redeem">
              Redeem Rewards
            </button>
          </div>

          {showOrders && orders.length > 0 && (
            <div className="orders-modal">
              <div className="modal-header">
                <h3>My Orders</h3>
                <button onClick={() => setShowOrders(false)} className="close-btn">×</button>
              </div>
              <table className="orders-table">
                <thead>
                  <tr>
                    <th>Service</th>
                    <th>Item</th>
                    <th>Qty</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order._id}>
                      <td>{order.service}</td>
                      <td>{order.itemName}</td>
                      <td>{order.quantity}</td>
                      <td>₹{order.totalAmount}</td>
                      <td>{order.status}</td>
                      <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Send Money Button */}
        <button onClick={() => setShowTransfer(true)} className="send-money-btn">
          Send Money
        </button>

        {/* Transfer Modal */}
        {showTransfer && (
          <div className="modal-overlay">
            <div className="modal-card">
              <h3>Send Money</h3>
              <form onSubmit={handleTransfer}>
                <input
                  type="text"
                  className="input"
                  placeholder="Receiver Wallet ID"
                  value={receiver}
                  onChange={(e) => setReceiver(e.target.value)}
                  required
                />
                <input
                  type="number"
                  className="input"
                  placeholder="Amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                  min="1"
                />
                <input
                  type="password"
                  className="input"
                  placeholder="PIN (4 digits)"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  required
                  maxLength={4}
                />
                <div className="modal-buttons">
                  <button type="submit" className="btn primary">Confirm</button>
                  <button type="button" className="btn secondary" onClick={() => setShowTransfer(false)}>
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Add Money Modal */}
        {showAddMoney && (
          <div className="modal-overlay">
            <div className="modal-card">
              <h3>Add Money</h3>
              {!clientSecret ? (
                <>
                  <input
                    type="number"
                    placeholder="Amount (₹)"
                    value={topupAmount}
                    onChange={(e) => setTopupAmount(e.target.value)}
                    className="input"
                  />
                  <div className="modal-buttons">
                    <button onClick={handleAddMoney} className="btn primary">Proceed</button>
                    <button onClick={() => setShowAddMoney(false)} className="btn secondary">Cancel</button>
                  </div>
                </>
              ) : (
                <Elements stripe={stripePromise} options={{ clientSecret }}>
                  <StripeCheckout
                    onClose={() => {
                      setShowAddMoney(false);
                      setClientSecret(null);
                      fetchUserData();
                    }}
                  />
                </Elements>
              )}
            </div>
          </div>
        )}
      <h3>🎁 Gift Reward Points</h3>
         {showGiftpoints && (
          <div>
              <input
        type="text"
        className="input"
        placeholder="Receiver Wallet ID"
        value={walletId}
        onChange={(e) => setWalletId(e.target.value)}
      />

      <input
        type="number"
        className="input"
        placeholder="Points to Gift"
        value={points}
        onChange={(e) => setPoints(e.target.value)}
      />

      <button  className="btn primary "  onClick={handleGift} disabled={loading}>
        {loading ? "Sending..." : "Send Points"}
      </button>
          </div>
          )}
           <div className="gift-box">


    
    </div>
        {/* Services */}
        <section className="services-section">
          <h2>Services</h2>
          <div className="services-grid">
            <div className="service-card" onClick={() => navigate("/food")}>
              Recharge
            </div>
            <div
              className={`service-card }`}
              onClick={() => {
                navigate("/fooditems");
              }}
            >
              Food {limitReached && <small>(limit reached)</small>}
            </div>
            <div className="service-card" onClick={() => navigate("/events")}>
              Events
            </div>
            <div className="service-card" onClick={() => navigate("/library")}>
              Library
            </div>
          </div>
        </section>

        {/* Transactions */}
        <section className="transactions-section">
          <h3>Recent Transactions</h3>
          {transactions?.length === 0 ? (
            <p className="no-data">No transactions yet</p>
          ) : (
            <div className="transactions-list">
              {transactions.map((tx) => (
                <div key={tx._id} className="transaction-item">
                  <div>
                    <div className="tx-desc">
                      {tx.type === "DEBIT" ? "Sent to" : "Received from"} {tx.counterpartyWalletId}
                    </div>
                    <div className="tx-meta">
                      {format(new Date(tx.createdAt), "dd MMM yyyy • hh:mm a")} • Ref: {tx.reference}
                    </div>
                  </div>
                  <div className={`tx-amount ${tx.type === "DEBIT" ? "debit" : "credit"}`}>
                    {tx.type === "DEBIT" ? "-" : "+"}
                    ₹{tx.amount}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}