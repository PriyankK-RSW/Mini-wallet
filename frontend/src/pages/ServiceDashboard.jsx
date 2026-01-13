import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { format } from "date-fns";
import "../Css/ServiceDashboard.css";

export default function ServiceDashboard({ service }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`http://localhost:5000/order/Dashboard/service`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
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

  const totalRevenue = orders.reduce((acc, order) => acc + order.totalAmount, 0);

  return (
    <div className="service-dashboard">
      <h2>{service} Orders</h2>
      <p>Total Orders: {orders.length}</p>
      <p>Total Revenue: ₹{totalRevenue}</p>

      {loading ? (
        <p>Loading orders...</p>
      ) : orders.length === 0 ? (
        <p>No orders found.</p>
      ) : (
        <table className="orders-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Item</th>
              <th>Price</th>
              <th>Quantity</th>
              <th>Total</th>
              <th>Status</th>
              <th>Created At</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order, index) => (
              <tr key={order._id}>
                <td>{index + 1}</td>
                <td>{order.itemName}</td>
                <td>₹{order.itemPrice}</td>
                <td>{order.quantity}</td>
                <td>₹{order.totalAmount}</td>
                <td>{order.status}</td>
                <td>{format(new Date(order.createdAt), "dd MMM yyyy, hh:mm a")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
