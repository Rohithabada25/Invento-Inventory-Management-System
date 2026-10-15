
import { useCallback, useEffect, useState } from "react";
import "./Reports.css";

const API = "http://localhost:5000/api";

async function fetchJson(endpoint) {
  const response = await fetch(`${API}${endpoint}`, {
    method: "GET",
    credentials: "include",
    headers: {
      Accept: "application/json",
    },
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      data?.message ||
      data?.error ||
      `Request failed (${response.status}) for ${endpoint}`;

    throw new Error(message);
  }

  return data;
}

function getArray(data, endpoint) {
  // Support APIs that return either an array directly or an object
  // containing the array.
  if (Array.isArray(data)) return data;

  if (endpoint === "/products" && Array.isArray(data?.products)) {
    return data.products;
  }

  if (
    endpoint === "/transactions" &&
    Array.isArray(data?.transactions)
  ) {
    return data.transactions;
  }

  throw new Error(
    `The ${endpoint} endpoint did not return a list. Check the backend response.`
  );
}

function Reports() {
  const [products, setProducts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchReportData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [productsData, transactionsData] = await Promise.all([
        fetchJson("/products"),
        fetchJson("/transactions"),
      ]);

      setProducts(getArray(productsData, "/products"));
      setTransactions(getArray(transactionsData, "/transactions"));
    } catch (err) {
      console.error("Reports loading error:", err);
      setError(
        err.message ||
          "Could not load reports. Please check the backend and your login session."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReportData();
  }, [fetchReportData]);

  const totalProducts = products.length;

  const totalStock = products.reduce(
    (sum, product) => sum + Number(product.quantity || 0),
    0
  );

  const inventoryValue = products.reduce(
    (sum, product) =>
      sum +
      Number(product.quantity || 0) *
        Number(product.cost_price || 0),
    0
  );

  const lowStockProducts = products.filter(
    (product) =>
      Number(product.quantity || 0) <=
      Number(product.reorder_level || 0)
  );

  const categoryCounts = products.reduce((counts, product) => {
    const rawCategory = String(product.category || "General").trim();
    const category = rawCategory
      ? rawCategory.charAt(0).toUpperCase() +
        rawCategory.slice(1).toLowerCase()
      : "General";

    counts[category] = (counts[category] || 0) + 1;

    return counts;
  }, {});

  const purchaseTransactions = transactions.filter(
    (transaction) =>
      String(transaction.type || "").toLowerCase() === "purchase"
  );

  const saleTransactions = transactions.filter(
    (transaction) =>
      String(transaction.type || "").toLowerCase() === "sale"
  );

  const formatCurrency = (amount) =>
    `₹${Number(amount || 0).toLocaleString("en-IN", {
      maximumFractionDigits: 2,
    })}`;

  const formatDate = (value) => {
    if (!value) return "—";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return String(value);

    return date.toLocaleDateString("en-IN");
  };

  const getTransactionAmount = (transaction) => {
    if (transaction.total_amount != null) {
      return Number(transaction.total_amount) || 0;
    }

    return (
      Number(transaction.quantity || 0) *
      Number(transaction.unit_price || 0)
    );
  };

  const purchaseValue = purchaseTransactions.reduce(
    (sum, transaction) =>
      sum + getTransactionAmount(transaction),
    0
  );

  const salesValue = saleTransactions.reduce(
    (sum, transaction) =>
      sum + getTransactionAmount(transaction),
    0
  );

  const exportReport = () => {
    window.print();
  };

  if (loading) {
    return (
      <section className="reports-page" aria-live="polite">
        <p className="report-message">Loading reports...</p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="reports-page">
        <div className="report-panel">
          <h3>Unable to load reports</h3>
          <p className="report-error">{error}</p>

          <button
            type="button"
            className="report-export-button"
            onClick={fetchReportData}
          >
            Retry
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="reports-page">
      <div className="reports-header">
        <div>
          <h2>Inventory Reports</h2>
          <p>
            Review inventory levels, categories, purchases, and sales.
          </p>
        </div>

        <button
          type="button"
          className="report-export-button"
          onClick={exportReport}
        >
          ⬇ Export / Print Report
        </button>
      </div>

      {/* Inventory Summary */}
      <div className="report-summary-grid">
        <div className="report-summary-card">
          <span>Total Products</span>
          <h3>{totalProducts.toLocaleString("en-IN")}</h3>
          <p>Products in inventory</p>
        </div>

        <div className="report-summary-card">
          <span>Total Stock Quantity</span>
          <h3>{totalStock.toLocaleString("en-IN")}</h3>
          <p>Total units available</p>
        </div>

        <div className="report-summary-card">
          <span>Inventory Value</span>
          <h3>{formatCurrency(inventoryValue)}</h3>
          <p>Calculated using cost price</p>
        </div>

        <div className="report-summary-card warning-card">
          <span>Low Stock Products</span>
          <h3>{lowStockProducts.length}</h3>
          <p>Products needing attention</p>
        </div>
      </div>

      {/* Category Report */}
      <div className="report-panel">
        <div className="report-panel-heading">
          <div>
            <h3>Category Report</h3>
            <p>Number and percentage of products in each category</p>
          </div>
        </div>

        {Object.keys(categoryCounts).length === 0 ? (
          <p className="report-message">No categories available.</p>
        ) : (
          <div className="category-report-list">
            {Object.entries(categoryCounts)
              .sort((a, b) => b[1] - a[1])
              .map(([category, count]) => {
                const percentage = totalProducts
                  ? Math.round((count / totalProducts) * 100)
                  : 0;

                return (
                  <div className="category-report-item" key={category}>
                    <div className="category-report-label">
                      <strong>{category}</strong>
                      <span>
                        {count} products · {percentage}%
                      </span>
                    </div>

                    <div className="category-progress-track">
                      <div
                        className="category-progress-fill"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </div>

      {/* Stock Report */}
      <div className="report-panel">
        <div className="report-panel-heading">
          <div>
            <h3>Stock Report</h3>
            <p>Current quantities and reorder levels</p>
          </div>
        </div>

        <div className="report-table-wrapper">
          <table className="report-table">
            <thead>
              <tr>
                <th>SKU</th>
                <th>Product</th>
                <th>Category</th>
                <th>Quantity</th>
                <th>Reorder Level</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>
              {products.length === 0 ? (
                <tr>
                  <td colSpan="6">No products available.</td>
                </tr>
              ) : (
                products.map((product, index) => {
                  const quantity = Number(product.quantity || 0);
                  const reorderLevel = Number(
                    product.reorder_level || 0
                  );
                  const isLowStock = quantity <= reorderLevel;

                  return (
                    <tr key={product.id ?? product.sku ?? index}>
                      <td>{product.sku || "—"}</td>
                      <td>{product.name || "—"}</td>
                      <td>{product.category || "General"}</td>
                      <td>{quantity}</td>
                      <td>{reorderLevel}</td>
                      <td>
                        <span
                          className={`report-stock-badge ${
                            isLowStock ? "low" : "normal"
                          }`}
                        >
                          {isLowStock ? "Low Stock" : "In Stock"}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Purchase and Sales Summary */}
      <div className="report-summary-grid transaction-summary-grid">
        <div className="report-summary-card">
          <span>Total Purchase Transactions</span>
          <h3>{purchaseTransactions.length}</h3>
          <p>Total recorded purchases</p>
        </div>

        <div className="report-summary-card">
          <span>Total Sales Transactions</span>
          <h3>{saleTransactions.length}</h3>
          <p>Total recorded sales</p>
        </div>

        <div className="report-summary-card">
          <span>Total Purchase Value</span>
          <h3>{formatCurrency(purchaseValue)}</h3>
          <p>Based on recorded transactions</p>
        </div>

        <div className="report-summary-card">
          <span>Total Sales Value</span>
          <h3>{formatCurrency(salesValue)}</h3>
          <p>Based on recorded transactions</p>
        </div>
      </div>

      {/* Transaction History */}
      <div className="report-panel">
        <div className="report-panel-heading">
          <div>
            <h3>Transaction History</h3>
            <p>Recorded purchases and sales</p>
          </div>
        </div>

        <div className="report-table-wrapper">
          <table className="report-table">
            <thead>
              <tr>
                <th>Transaction ID</th>
                <th>Product</th>
                <th>Type</th>
                <th>Quantity</th>
                <th>Amount</th>
                <th>Date</th>
              </tr>
            </thead>

            <tbody>
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan="6">No transactions recorded yet.</td>
                </tr>
              ) : (
                transactions.map((transaction, index) => {
                  const type = String(
                    transaction.type || ""
                  ).toLowerCase();

                  return (
                    <tr key={transaction.id ?? index}>
                      <td>{transaction.id ?? "—"}</td>
                      <td>
                        {transaction.product_name ||
                          transaction.product ||
                          "—"}
                      </td>
                      <td>
                        <span
                          className={`report-stock-badge ${
                            type === "sale" ? "normal" : "low"
                          }`}
                        >
                          {type
                            ? type.charAt(0).toUpperCase() +
                              type.slice(1)
                            : "—"}
                        </span>
                      </td>
                      <td>{Number(transaction.quantity || 0)}</td>
                      <td>
                        {formatCurrency(
                          getTransactionAmount(transaction)
                        )}
                      </td>
                      <td>
                        {formatDate(
                          transaction.created_at || transaction.date
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

export default Reports;
