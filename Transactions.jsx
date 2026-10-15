import { useEffect, useState } from "react";
import "./Transactions.css";

const API_URL = "http://127.0.0.1:5000/api";

function Transactions() {
  const [products, setProducts] = useState([]);
  const [transactions, setTransactions] = useState([]);

  const [transactionType, setTransactionType] = useState("purchase");
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [unitPrice, setUnitPrice] = useState("");
  const [notes, setNotes] = useState("");

  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // Load products and transaction history
  async function loadData() {
    const [productsResponse, transactionsResponse] = await Promise.all([
      fetch(`${API_URL}/products`),
      fetch(`${API_URL}/transactions`),
    ]);

    if (!productsResponse.ok || !transactionsResponse.ok) {
      throw new Error("Could not load products or transaction history.");
    }

    const productsData = await productsResponse.json();
    const transactionsData = await transactionsResponse.json();

    setProducts(productsData);
    setTransactions(transactionsData);

    // Select the first product when no product is selected
    if (productsData.length > 0) {
      const selectedProduct =
        productsData.find(
          (product) => String(product.id) === productId
        ) || productsData[0];

      setProductId(String(selectedProduct.id));

      setUnitPrice(
        String(
          transactionType === "purchase"
            ? selectedProduct.cost_price
            : selectedProduct.selling_price
        )
      );
    } else {
      setProductId("");
      setUnitPrice("");
    }
  }

  useEffect(() => {
    async function initialize() {
      try {
        await loadData();
      } catch (err) {
        setError(err.message || "Failed to load data.");
      } finally {
        setLoadingData(false);
      }
    }

    initialize();
  }, []);

  // Update price when the selected product changes
  function handleProductChange(event) {
    const selectedId = event.target.value;
    setProductId(selectedId);

    const selectedProduct = products.find(
      (product) => String(product.id) === selectedId
    );

    if (selectedProduct) {
      setUnitPrice(
        String(
          transactionType === "purchase"
            ? selectedProduct.cost_price
            : selectedProduct.selling_price
        )
      );
    } else {
      setUnitPrice("");
    }
  }

  // Update price when transaction type changes
  function handleTypeChange(event) {
    const type = event.target.value;
    setTransactionType(type);

    const selectedProduct = products.find(
      (product) => String(product.id) === productId
    );

    if (selectedProduct) {
      setUnitPrice(
        String(
          type === "purchase"
            ? selectedProduct.cost_price
            : selectedProduct.selling_price
        )
      );
    }
  }

  // Record a purchase or sale
  async function handleSubmit(event) {
    event.preventDefault();

    setLoading(true);
    setMessage("");
    setError("");

    try {
      if (!productId) {
        throw new Error("Please select a product.");
      }

      if (!Number.isInteger(Number(quantity)) || Number(quantity) <= 0) {
        throw new Error("Quantity must be a positive whole number.");
      }

      if (!Number.isFinite(Number(unitPrice)) || Number(unitPrice) < 0) {
        throw new Error("Please enter a valid unit price.");
      }

      const response = await fetch(`${API_URL}/transactions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          transaction_type: transactionType,
          product_id: Number(productId),
          quantity: Number(quantity),
          unit_price: Number(unitPrice),
          notes: notes.trim(),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Could not save transaction.");
      }

      setMessage(
        `${result.message} Stock is now ${result.updated_stock}.`
      );

      setQuantity("1");
      setNotes("");

      // Reload current stock and transaction history
      await loadData();
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  const totalAmount =
    (Number(quantity) || 0) * (Number(unitPrice) || 0);

  return (
    <div className="transactions-page">
      {/* Record Transaction */}
      <section className="panel transaction-form">
        <div className="transaction-heading">
          <h2>Record a Transaction</h2>
          <p>
            Record purchases or sales and automatically update inventory stock.
          </p>
        </div>

        {loadingData ? (
          <p>Loading products and transactions...</p>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="transaction-form-row">
              <label>
                Transaction Type
                <select
                  value={transactionType}
                  onChange={handleTypeChange}
                >
                  <option value="purchase">Purchase</option>
                  <option value="sale">Sale</option>
                </select>
              </label>

              <label>
                Product
                <select
                  value={productId}
                  onChange={handleProductChange}
                  required
                >
                  <option value="">Select a product</option>

                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name} — Stock: {product.quantity}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Quantity
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={quantity}
                  onChange={(event) => setQuantity(event.target.value)}
                  required
                />
              </label>

              <label>
                Unit Price (₹)
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={unitPrice}
                  onChange={(event) => setUnitPrice(event.target.value)}
                  required
                />
              </label>

              <label className="transaction-notes">
                Notes (Optional)
                <input
                  type="text"
                  maxLength="255"
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  placeholder="Supplier invoice or customer order"
                />
              </label>
            </div>

            <div className="transaction-total">
              <span>Total Amount</span>
              <strong>
                ₹{totalAmount.toLocaleString("en-IN", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </strong>
            </div>

            {message && (
              <p className="success-message" role="status">
                {message}
              </p>
            )}

            {error && (
              <p className="error-message" role="alert">
                {error}
              </p>
            )}

            <button
              type="submit"
              className="primary-button"
              disabled={loading || products.length === 0 || !productId}
            >
              {loading
                ? "Saving..."
                : `Record ${transactionType === "purchase" ? "Purchase" : "Sale"}`}
            </button>

            {products.length === 0 && (
              <p>Add a product before recording a transaction.</p>
            )}
          </form>
        )}
      </section>

      {/* Transaction History */}
      <section className="panel transaction-history">
        <div className="transaction-heading">
          <h2>Transaction History</h2>
          <p>Review all recorded purchases and sales.</p>
        </div>

        {loadingData ? (
          <p>Loading transaction history...</p>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Product</th>
                  <th>Type</th>
                  <th>Quantity</th>
                  <th>Unit Price</th>
                  <th>Total</th>
                  <th>Notes</th>
                </tr>
              </thead>

              <tbody>
                {transactions.map((transaction) => (
                  <tr key={transaction.id}>
                    <td>{transaction.created_at}</td>
                    <td>{transaction.product_name}</td>
                    <td>
                      <span
                        className={`transaction-type-badge ${transaction.transaction_type}`}
                      >
                        {transaction.transaction_type}
                      </span>
                    </td>
                    <td>{transaction.quantity}</td>
                    <td>
                      ₹{Number(transaction.unit_price).toFixed(2)}
                    </td>
                    <td>
                      ₹{Number(transaction.total_amount).toFixed(2)}
                    </td>
                    <td>{transaction.notes || "—"}</td>
                  </tr>
                ))}

                {transactions.length === 0 && (
                  <tr>
                    <td colSpan="7" className="empty-transactions">
                      No transactions recorded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

export default Transactions;