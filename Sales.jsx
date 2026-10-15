import { useEffect, useState } from "react";
import "./Sales.css";

const API_URL = "http://127.0.0.1:5000/api";

function Sales() {
  const [products, setProducts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [unitPrice, setUnitPrice] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function loadData() {
    const [productsResponse, transactionsResponse] = await Promise.all([
      fetch(`${API_URL}/products`),
      fetch(`${API_URL}/transactions`),
    ]);

    if (!productsResponse.ok || !transactionsResponse.ok) {
      throw new Error("Unable to load data. Check that the backend is running.");
    }

    const productsData = await productsResponse.json();
    const transactionsData = await transactionsResponse.json();

    setProducts(productsData);

    setTransactions(
      transactionsData.filter(
        (transaction) => transaction.transaction_type === "sale"
      )
    );

    const selectedProduct = productsData.find(
      (product) => String(product.id) === productId
    );

    if (!productId && productsData.length > 0) {
      setProductId(String(productsData[0].id));
      setUnitPrice(String(productsData[0].selling_price));
    } else if (selectedProduct) {
      setUnitPrice(String(selectedProduct.selling_price));
    }
  }

  useEffect(() => {
    loadData().catch((err) => setError(err.message));
  }, []);

  function handleProductChange(event) {
    const id = event.target.value;
    setProductId(id);

    const product = products.find(
      (item) => String(item.id) === id
    );

    setUnitPrice(product ? String(product.selling_price) : "");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch(`${API_URL}/transactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transaction_type: "sale",
          product_id: Number(productId),
          quantity: Number(quantity),
          unit_price: Number(unitPrice),
          notes,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Unable to record sale.");
      }

      setMessage(
        `Sale recorded successfully! Remaining stock: ${result.updated_stock}`
      );

      setQuantity("1");
      setNotes("");

      await loadData();
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="sales-page">
      <section className="panel">
        <div className="panel-heading">
          <div>
            <h3>Record a Sale</h3>
            <p>Record products sold to customers.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="sales-form">
          <label htmlFor="sales-product">Product</label>
          <select
            id="sales-product"
            value={productId}
            onChange={handleProductChange}
            required
          >
            <option value="">Select a product</option>
            {products.map((product) => (
              <option key={product.id} value={product.id}>
                {product.name} — Available stock: {product.quantity}
              </option>
            ))}
          </select>

          <div className="sales-form-row">
            <div>
              <label htmlFor="sales-quantity">Quantity</label>
              <input
                id="sales-quantity"
                type="number"
                min="1"
                step="1"
                value={quantity}
                onChange={(event) => setQuantity(event.target.value)}
                required
              />
            </div>

            <div>
              <label htmlFor="sales-price">Selling price per unit (₹)</label>
              <input
                id="sales-price"
                type="number"
                min="0.01"
                step="0.01"
                value={unitPrice}
                onChange={(event) => setUnitPrice(event.target.value)}
                required
              />
            </div>
          </div>

          <label htmlFor="sales-notes">Customer / Notes (optional)</label>
          <input
            id="sales-notes"
            type="text"
            maxLength="255"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Customer name or order number"
          />

          <div className="sales-total">
            <span>Total sales amount</span>
            <strong>
              ₹
              {(
                (Number(quantity) || 0) * (Number(unitPrice) || 0)
              ).toLocaleString("en-IN", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </strong>
          </div>

          {message && <p className="success-message">{message}</p>}
          {error && <p className="error-message">{error}</p>}

          <button
            className="primary-button"
            type="submit"
            disabled={loading || !productId}
          >
            {loading ? "Saving..." : "Record Sale"}
          </button>
        </form>
      </section>

      <section className="panel sales-history">
        <div className="panel-heading">
          <div>
            <h3>Sales History</h3>
            <p>Review products sold to customers.</p>
          </div>
        </div>

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Product</th>
                <th>Quantity</th>
                <th>Unit Price</th>
                <th>Total Amount</th>
                <th>Notes</th>
              </tr>
            </thead>

            <tbody>
              {transactions.map((transaction) => (
                <tr key={transaction.id}>
                  <td>
                    {transaction.created_at
                      ? new Date(transaction.created_at).toLocaleString("en-IN")
                      : "—"}
                  </td>
                  <td>{transaction.product_name}</td>
                  <td>{transaction.quantity}</td>
                  <td>
                    ₹{Number(transaction.unit_price).toLocaleString("en-IN")}
                  </td>
                  <td>
                    ₹{Number(transaction.total_amount).toLocaleString("en-IN")}
                  </td>
                  <td>{transaction.notes || "—"}</td>
                </tr>
              ))}

              {transactions.length === 0 && (
                <tr>
                  <td colSpan="6">No sales recorded yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

export default Sales;