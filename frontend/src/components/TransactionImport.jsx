// components/TransactionImport.jsx
import { useState } from "react";
import toast from "react-hot-toast";
import { Upload, X, FileText } from "lucide-react";

export default function TransactionImport({ onSuccess }) {
  const [isOpen, setIsOpen] = useState(false);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (!selectedFile.name.endsWith(".csv")) {
        toast.error("Please select a CSV file");
        return;
      }
      if (selectedFile.size > 10 * 1024 * 1024) {
        toast.error("File size should be less than 10MB");
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error("Please select a file first");
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append("csv", file);

    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:5000/import-transactions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Import failed");
      }

      toast.success(`Successfully imported ${data.count} transactions!`);
      setFile(null);
      setIsOpen(false);
      if (onSuccess) onSuccess(); // refresh dashboard data
    } catch (err) {
      console.error(err);
      const errorMsg = err.message.includes("Validation failed")
        ? err.message + "\n" + (err.errors?.join("\n") || "")
        : err.message;
      toast.error(errorMsg);
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFileChange({ target: { files: [droppedFile] } });
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="btn-primary"
        style={{ display: "flex", alignItems: "center", gap: "8px" }}
      >
        <Upload size={18} />
        Import Transactions (CSV)
      </button>
    );
  }

  return (
    <div className="modal-overlay" onClick={() => setIsOpen(false)}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 className="modal-title">Import Transactions from CSV</h3>
          <button onClick={() => setIsOpen(false)} className="btn-secondary">
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          <p style={{ marginBottom: "16px", color: "#666" }}>
            Upload a CSV file with columns: <strong>userId, amount, type, counterpartyWalletId (optional), createdAt (optional)</strong>
          </p>

          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            style={{
              border: "2px dashed #ccc",
              borderRadius: "8px",
              padding: "32px",
              textAlign: "center",
              backgroundColor: "#f9f9f9",
              cursor: "pointer",
            }}
          >
            {file ? (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "10px" }}>
                <FileText size={32} color="#4CAF50" />
                <div>
                  <p style={{ margin: 0, fontWeight: "bold" }}>{file.name}</p>
                  <p style={{ margin: "4px 0 0", color: "#666" }}>
                    {(file.size / 1024).toFixed(2)} KB
                  </p>
                </div>
                <button
                  onClick={() => setFile(null)}
                  style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer" }}
                >
                  <X size={20} color="#999" />
                </button>
              </div>
            ) : (
              <>
                <Upload size={48} color="#999" />
                <p style={{ margin: "16px 0 8px" }}>Drag & drop your CSV file here</p>
                <p style={{ margin: 0, color: "#666" }}>or</p>
              </>
            )}

            <input
              type="file"
              accept=".csv,text/csv"
              onChange={handleFileChange}
              style={{ display: "none" }}
              id="csv-upload"
            />
            {!file && (
              <label
                htmlFor="csv-upload"
                style={{
                  display: "inline-block",
                  marginTop: "16px",
                  padding: "10px 20px",
                  backgroundColor: "#007bff",
                  color: "white",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
              >
                Choose File
              </label>
            )}
          </div>

          <div className="modal-actions" style={{ marginTop: "24px" }}>
            <button
              onClick={handleUpload}
              disabled={uploading || !file}
              className="btn-primary"
              style={{ flex: 1 }}
            >
              {uploading ? "Uploading..." : "Upload & Import"}
            </button>
            <button onClick={() => setIsOpen(false)} className="btn-secondary">
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}