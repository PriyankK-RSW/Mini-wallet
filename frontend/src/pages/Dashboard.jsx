import { useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';
import { Eye, EyeOff } from 'lucide-react'; // or any icon library you use
import { format } from 'date-fns';
import "./Dashboard.css"

export default function Dashboard() {
  const { user, balance, transactions, fetchUserData, transfer, logout } = useAuthStore();
  const [showTransfer, setShowTransfer] = useState(false);
  const [receiver, setReceiver] = useState('');
  const [amount, setAmount] = useState('');
  const [pin, setPin] = useState('');
  const [isHidden, setIsHidden] = useState(true);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  const handleTransfer = async (e) => {
    e.preventDefault();
    try {
      const res = await transfer(receiver, amount, pin);
      toast.success(`${res.message} - Ref: ${res.reference}`);
      setShowTransfer(false);
      setReceiver(''); setAmount(''); setPin('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'somethig went wrong');
    }
  };

  const toggleVisibility = () => {
    setIsHidden(prev => !prev);
  };

  return (
    <div className="dashboard-container">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-content">
          <h1 className="app-title">MyWallet</h1>
          <button onClick={logout} className="logout-btn">Logout</button>
        </div>
      </header>

      <main className="dashboard-main">
       <div className="balance-card">
      <p className="balance-label">Available Balance</p>
      
      <div className="balance-amount">
        {balance === null ? (
          <span className="loading">Loading...</span>
        ) : (
          <span className={isHidden ? 'blurred' : ''}>
            ₹{balance}
          </span>
        )}
        
        <button 
          className="eye-toggle" 
          onClick={toggleVisibility}
          aria-label={isHidden ? 'Show balance' : 'Hide balance'}
        >
          {isHidden ? <EyeOff size={20} /> : <Eye size={20} />}
        </button>
      </div>

      <p className="wallet-id">
        Wallet ID: {user?.walletId || 'Loading...'}
      </p>
    </div>

        {/* Send Money Button */}
        <button onClick={() => setShowTransfer(true)} className="send-money-btn">
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
                  <button type="submit" className="btn-primary">Confirm Transfer</button>
                  <button type="button" onClick={() => setShowTransfer(false)} className="btn-secondary">
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

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
                      {tx.type === 'DEBIT' ? 'Sent to' : 'Received from'} {tx.counterpartyWalletId}
                    </p>
                    <p className="transaction-meta">
                      {format(new Date(tx.createdAt), 'dd MMM yyyy, hh:mm a')} • Ref: {tx.reference}
                    </p>
                  </div>
                  <p className={`transaction-amount ${tx.type === 'DEBIT' ? 'debit' : 'credit'}`}>
                    {tx.type === 'DEBIT' ? '-' : '+'}₹{tx.amount}
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