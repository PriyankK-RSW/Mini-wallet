import { useEffect, useState } from "react";
import { useAuthStore } from "../store/authStore";
import toast from "react-hot-toast";
import { Eye, EyeOff, Download } from "lucide-react";
import { format, startOfDay, endOfDay, subDays, startOfMonth, endOfMonth, subMonths } from "date-fns";
import jsPDF from "jspdf";
import "jspdf-autotable";
import "./Dashboard.css";
import { autoTable } from "jspdf-autotable";  // ← This is the key change


export default function Dashboard() {
  const { user, balance, transactions, fetchUserData, transfer, logout } = useAuthStore();

  
  const [dateFilter, setDateFilter] = useState("all"); // 'all', 'today', 'last7', 'last30', 'thisMonth', 'lastMonth'

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  const getFilteredTransactions = () => {
    if (!transactions || transactions.length === 0) return [];

    const now = new Date();
    let start, end;

    switch (dateFilter) {
      case "today":
        start = startOfDay(now);
        end = endOfDay(now);
        break;
      case "last7":
        start = startOfDay(subDays(now, 6)); // 7 days including today
        end = endOfDay(now);
        break;
      case "last30":
        start = startOfDay(subDays(now, 29));
        end = endOfDay(now);
        break;
      case "thisMonth":
        start = startOfMonth(now);
        end = endOfMonth(now);
        break;
      case "lastMonth":
        const lastMonthDate = subMonths(now, 1);
        start = startOfMonth(lastMonthDate);
        end = endOfMonth(lastMonthDate);
        break;
      default:
        return transactions; // all time
    }

    return transactions.filter((tx) => {
      const txDate = new Date(tx.createdAt);
      return txDate >= start && txDate <= end;
    });
  };

  const filteredTransactions = getFilteredTransactions();
const exportToPDF = () => {
  if (filteredTransactions.length === 0) {
    toast.error("No transactions to export");
    return;
  }

  const doc = new jsPDF("p", "mm", "a4");

  // Title
  doc.setFontSize(18);
  doc.text("MyWallet Transaction Statement", 14, 22);

  // User info
  doc.setFontSize(12);
  doc.text(`Wallet ID: ${user?.walletId || "N/A"}`, 14, 32);
  doc.text(`Current Balance: ₹${balance ?? "0"}`, 14, 40);

  // === Calculate dateRangeText here (inside the function) ===
  const now = new Date();
  let dateRangeText = "All Time";

  if (dateFilter !== "all") {
    switch (dateFilter) {
      case "today":
        dateRangeText = `Today: ${format(now, "dd MMM yyyy")}`;
        break;
      case "last7":
        dateRangeText = `Last 7 Days: ${format(subDays(now, 6), "dd MMM")} - ${format(now, "dd MMM yyyy")}`;
        break;
      case "last30":
        dateRangeText = `Last 30 Days: ${format(subDays(now, 29), "dd MMM")} - ${format(now, "dd MMM yyyy")}`;
        break;
      case "thisMonth":
        dateRangeText = `This Month: ${format(startOfMonth(now), "MMM yyyy")}`;
        break;
      case "lastMonth":
        const lastM = subMonths(now, 1);
        dateRangeText = `Last Month: ${format(startOfMonth(lastM), "MMM yyyy")}`;
        break;
      default:
        dateRangeText = "All Time";
    }
  }

  doc.text(`Period: ${dateRangeText}`, 14, 48);

  // Table data
  const tableData = filteredTransactions.map((tx) => [
    format(new Date(tx.createdAt), "dd MMM yyyy, hh:mm a"),
    tx.type === "DEBIT" || tx.type === "WITHDRAW" ? "Sent" : "Received",
    tx.counterpartyWalletId,
    `₹${tx.amount}`,
    tx.type === "DEBIT" || tx.type === "WITHDRAW" ? `-₹${tx.amount}` : `+₹${tx.amount}`,
    tx.reference,
  ]);

  // AutoTable (make sure you imported it correctly!)
  autoTable(doc, {
    head: [["Date & Time", "Type", "To/From", "Amount", "Debit/Credit", "Reference"]],
    body: tableData,
    startY: 60,
    theme: "grid",
    styles: { fontSize: 10 },
    headStyles: { fillColor: [41, 128, 185] },
  });

  // Footer
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(10);
    doc.text(`Generated on ${format(new Date(), "dd MMM yyyy, hh:mm a")}`, 14, doc.internal.pageSize.height - 10);
  }

  // Save with clean filename
  const fileName = `MyWallet_Transactions_${dateRangeText.replace(/[^a-zA-Z0-9]/g, "_")}.pdf`;
  doc.save(fileName);
  toast.success("PDF exported successfully!");
};
  return (
    <div className="dashboard-container">
      <section className="transactions-card">
        <div className="section-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <h3 className="section-title">Recent Transactions</h3>
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="input-field"
              style={{ padding: "8px", borderRadius: "4px" }}
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="last7">Last 7 Days</option>
              <option value="last30">Last 30 Days</option>
              <option value="thisMonth">This Month</option>
              <option value="lastMonth">Last Month</option>
            </select>

            <button onClick={exportToPDF} className="btn-primary" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <Download size={18} />
              Export PDF
            </button>
          </div>
        </div>

        {filteredTransactions.length === 0 ? (
          <p className="no-transactions">No transactions in selected period</p>
        ) : (
          <div className="transactions-list">
            {filteredTransactions.map((tx) => (
              <div key={tx._id} className="transaction-item">
                <div className="transaction-details">
                  <p className="transaction-desc">
                    {tx.type === "DEBIT" || tx.type === "WITHDRAW" ? "Sent to" : "Received from"} {tx.counterpartyWalletId}
                  </p>
                  <p className="transaction-meta">
                    {format(new Date(tx.createdAt), "dd MMM yyyy, hh:mm a")} • Ref: {tx.reference}
                  </p>
                </div>
                <p className={`transaction-amount ${tx.type === "DEBIT" || tx.type === "WITHDRAW" ? "debit" : "credit"}`}>
                  {tx.type === "DEBIT" || tx.type === "WITHDRAW" ? "-" : "+"}₹{tx.amount}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}