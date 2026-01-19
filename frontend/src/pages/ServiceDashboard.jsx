import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { format } from "date-fns";
import "../Css/ServiceDashboard.css";

export default function ServiceDashboard({ service }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const logout = () => {
    localStorage.removeItem("token");
    window.location.href = "/login";
  };

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`http://localhost:5000/order/Dashboard/service`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed to fetch orders");

        setOrders(data.orders || []);
      } catch (err) {
        toast.error(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [service]);

  const totalRevenue = orders.reduce((acc, o) => acc + o.totalAmount, 0);

  return (
    <div className="service-dashboard">
      <div className="dashboard-header">
        <h1>{service} Dashboard</h1>
        <button onClick={logout} className="logout-btn">
          Logout
        </button>
      </div>

      <div className="overview-cards">
        <div className="overview-card">
          <div className="card-label">Total Orders</div>
          <div className="card-value">{orders.length}</div>
        </div>

        <div className="overview-card revenue">
          <div className="card-label">Total Revenue</div>
          <div className="card-value">
            ₹{totalRevenue.toLocaleString("en-IN")}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="loading-state">Loading your orders...</div>
      ) : orders.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📭</div>
          <h3>No orders yet</h3>
          <p>When customers place orders, they'll appear here.</p>
        </div>
      ) : (
        <div className="orders-section">
          <h2>Recent Orders</h2>
          <div className="table-wrapper">
            <table className="orders-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Item</th>
                  <th>Price</th>
                  <th>Qty</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Address</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order, index) => (
                  <tr key={order._id}>
                    <td>{index + 1}</td>
                    <td className="item-name">{order.itemName}</td>
                    <td>₹{order.itemPrice.toLocaleString("en-IN")}</td>
                    <td>{order.quantity}</td>
                    <td>₹{order.totalAmount.toLocaleString("en-IN")}</td>
                    <td>
                      <span className={`status-badge ${order.status.toLowerCase()}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="address-cell">{order.address}</td>
                    <td>{format(new Date(order.createdAt), "dd MMM yyyy")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}   
