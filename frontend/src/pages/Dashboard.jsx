import { useEffect, useState } from "react";
import { useAuthStore } from "../store/authStore";
import toast from "react-hot-toast";
import { Eye, EyeOff } from "lucide-react";
import { format } from "date-fns";
import "./Dashboard.css";
import { Elements } from "@stripe/react-stripe-js";
import { stripePromise } from "../stripe";
import StripeCheckout from "../components/StripeCheckout";
import { useNavigate } from "react-router-dom";
export default function Dashboard() {
  const { user, balance, transactions, fetchUserData, transfer, logout } =
    useAuthStore();
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
  const navigate = useNavigate();
  const BASE_URL = import.meta.env.VITE_BASE_URL || "http://localhost:5000/";

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  useEffect(() => {
    if (!user) return;

    if (user.email === "admin@gmail.com") {
      navigate("/dashboard/admin");
    } else if (user.email === "canteen@gmail.com") {
      navigate("/dashboard/service");
    } else if (user.email === "library@gmail.com") {
      navigate("/dashboard/service");
    } else if (user.email === "events@gmail.com") {
      navigate("/dashboard/service");
    } else {
      navigate("/");
    }
  }, [user, navigate]);

  const fetchMyorderData = async () => {
    try {
      const res = await fetch(`${BASE_URL}order/getMyorders`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      const data = await res.json();
      console.log("My Orders Data:", data);

      setOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      console.log("Error fetching my orders:", err);
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
      toast.error(err.response?.data?.message || "somethig went wrong");
    }
  };

  const toggleVisibility = () => {
    setIsHidden((prev) => !prev);
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
    } catch (err) {
      toast.error("Failed to initiate payment");
    }
  };

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="header-content">
          <h1 className="app-title">MyWallet</h1>
          <button onClick={logout} className="logout-btnn">
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

            <button
              className="eye-toggle"
              onClick={toggleVisibility}
              aria-label={isHidden ? "Show balance" : "Hide balance"}
            >
              {isHidden ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          <p className="wallet-id">
            Wallet ID: {user?.walletId || "Loading..."}
          </p>

          <button
            onClick={() => setShowAddMoney(true)}
            className="add-money-btn"
          >
            Add Money
          </button>
          <button
            onClick={() => {
              fetchMyorderData();
              setShowOrders(true);
            }}
            className="add-money-btnn"
          >
            My Orders
          </button>

          <div>
            {showOrders && orders.length > 0 && (
              <div className="orders-box">
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <h3>My Orders</h3>

                  <button
                    onClick={() => setShowOrders(false)}
                    style={{
                      background: "transparent",
                      border: "none",
                      fontSize: "20px",
                      cursor: "pointer",
                    }}
                  >
                    ❌
                  </button>
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
                        <td>
                          {new Date(order.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
        {showAddMoney && (
          <div className="modal-overlay">
            <div className="modal-card">
              <h3 className="modal-title">Add Money</h3>

              {!clientSecret ? (
                <>
                  <input
                    type="number"
                    placeholder="Enter amount"
                    value={topupAmount}
                    onChange={(e) => setTopupAmount(e.target.value)}
                    className="input-field"
                  />

                  <div className="modal-actions">
                    <button onClick={handleAddMoney} className="btn-primary">
                      Proceed to Pay
                    </button>
                    <button
                      onClick={() => setShowAddMoney(false)}
                      className="btn-secondary"
                    >
                      Cancel
                    </button>
                  </div>
                </>
              ) : (
                <Elements stripe={stripePromise} options={{ clientSecret }}>
                  <StripeCheckout
                    onClose={() => {
                      setShowAddMoney(false);
                      setClientSecret(null);
                      fetchUserData(); // refresh balance after webhook
                    }}
                  />
                </Elements>
              )}
            </div>
          </div>
        )}
        {/* Send Money Button */}
        <button
          onClick={() => setShowTransfer(true)}
          className="send-money-btn"
        >
          Send Money
        </button>

        {/* Transfer Modal */}
        {showTransfer && (
          <div className="modal-overlay">
            <div className="modal-card">
              <h3 className="modal-title">Send Money</h3>
              <form onSubmit={handleTransfer} className="modal-form">
                <input
                  type="text"
                  placeholder="Receiver Wallet ID"
                  value={receiver}
                  onChange={(e) => setReceiver(e.target.value)}
                  required
                  className="input-field"
                />
                <input
                  type="number"
                  placeholder="Amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                  min="1"
                  className="input-field"
                />
                <input
                  type="password"
                  placeholder="Your PIN"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  required
                  maxLength={4}
                  className="input-field"
                />
                <div className="modal-actions">
                  <button type="submit" className="btn-primary">
                    Confirm Transfer
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowTransfer(false)}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <section className="services-section">
          <h2>Services</h2>
          <div className="services-grid">
            <div className="service-card" onClick={() => navigate("/food")}>
              Recharge
            </div>
            <div
              className="service-card"
              onClick={() => navigate("/fooditems")}
            >
              Food
            </div>
            <div className="service-card" onClick={() => navigate("/events")}>
              Events
            </div>
            <div className="service-card" onClick={() => navigate("/library")}>
              Library
            </div>
          </div>
        </section>

        {/* Transaction History */}
        <section className="transactions-card">
          <h3 className="section-title">Recent Transactions</h3>
          {transactions?.length === 0 ? (
            <p className="no-transactions">No transactions yet</p>
          ) : (
            <div className="transactions-list">
              {transactions?.map((tx) => (
                <div key={tx._id} className="transaction-item">
                  <div className="transaction-details">
                    <p className="transaction-desc">
                      {tx.type === "DEBIT" ? "Sent to" : "Received from"}{" "}
                      {tx.counterpartyWalletId}
                    </p>
                    <p className="transaction-meta">
                      {format(new Date(tx.createdAt), "dd MMM yyyy, hh:mm a")} •
                      Ref: {tx.reference}
                    </p>
                  </div>
                  <p
                    className={`transaction-amount ${
                      tx.type === "DEBIT" ? "debit" : "credit"
                    }`}
                  >
                    {tx.type === "DEBIT" ? "-" : "+"}₹{tx.amount}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
