import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { format } from "date-fns";
import "../Css/AdminDashboard.css";

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const API_BASE =  import.meta.env.VITE_BASE_URL;

const logout = () => {
    localStorage.removeItem("token");
    window.location.href = "/login";
  };
  useEffect(() => { 
    const fetchAdminDashboard = async () => {
      try {
        const res = await fetch(`${API_BASE}/order/Dashboard/admin`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });

        const result = await res.json();
        if (!res.ok) throw new Error(result.message || "Failed to load dashboard");

        setData(result);
      } catch (err) {
        toast.error(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAdminDashboard();
  }, []);

  if (loading) return <p className="loading">Loading dashboard...</p>;
  if (!data) return null;

  const { totalOrders, totalRevenue, serviceStats, orders } = data;

  return (
    <div className="admin-dashboard">
      <h1>Admin Dashboard</h1>
     <button onClick={logout}  className="logout-btn">
             Logout
           </button> 
      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total Orders</h3>
          <p>{totalOrders}</p>
        </div>

        <div className="stat-card">
          <h3>Total Revenue</h3>
          <p>₹{totalRevenue}</p>
          
        </div>
      </div>

      <h2> ALl Service </h2>
      <div className="stats-grid">
        {Object.entries(serviceStats).map(([service, stats]) => (
          <div key={service} className="stat-card">
            <h3>{service}</h3>
            <p>Orders: {stats.totalOrders}</p>
            <p>Revenue: ₹{stats.revenue}</p>
              
          </div>
        ))}
      </div>

      <h2>All Orders</h2>

      <div className="table-wrapper">
        <table className="orders-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Service</th>
              <th>Item</th>
              <th>Qty</th>
              <th>Price</th>
              <th>Total</th>
              <th>Status</th>
              <th>Created At</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order, index) => (
              <tr key={order._id}>
                <td>{index + 1}</td>
                <td>{order.service}</td>
                <td>{order.itemName}</td>
                <td>{order.quantity}</td>
                <td>₹{order.itemPrice}</td>
                <td>₹{order.totalAmount}</td>
                <td>{order.status}</td>
                <td>
                  {format(new Date(order.createdAt), "dd MMM yyyy, hh:mm a")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
