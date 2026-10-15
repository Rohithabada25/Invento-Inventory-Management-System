import { useState } from "react";
import "./AddProduct.css";

function AddProduct({ onClose, onProductAdded }) {
  const [formData, setFormData] = useState({
    sku: "",
    name: "",
    category: "",
    description: "",
    cost_price: "",
    selling_price: "",
    quantity: "",
    reorder_level: "5",
  });

  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  function handleChange(event) {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage("");

    const product = {
      ...formData,
      cost_price: Number(formData.cost_price),
      selling_price: Number(formData.selling_price),
      quantity: Number(formData.quantity),
      reorder_level: Number(formData.reorder_level),
    };

    setSaving(true);

    try {
      const response = await fetch(
        "http://127.0.0.1:5000/api/products",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(product),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Could not add product.");
      }

      setMessage("Product added successfully!");

      await onProductAdded();

      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (error) {
      setMessage(error.message || "Could not connect to the backend.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-overlay">
      <div className="add-product-modal">
        <div className="modal-header">
          <div>
            <h2>Add New Product</h2>
            <p>Enter the details of your inventory item.</p>
          </div>

          <button
            type="button"
            className="close-button"
            onClick={onClose}
            aria-label="Close form"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="product-form-grid">
            <label>
              Product Name *
              <input
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g. Wireless Mouse"
                required
              />
            </label>

            <label>
              SKU *
              <input
                name="sku"
                value={formData.sku}
                onChange={handleChange}
                placeholder="e.g. ELEC009"
                required
              />
            </label>

            <label>
              Category
              <input
                name="category"
                value={formData.category}
                onChange={handleChange}
                placeholder="e.g. Electronics"
              />
            </label>

            <label>
              Description
              <input
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Product details"
              />
            </label>

            <label>
              Cost Price (₹) *
              <input
                type="number"
                name="cost_price"
                value={formData.cost_price}
                onChange={handleChange}
                min="0"
                step="0.01"
                required
              />
            </label>

            <label>
              Selling Price (₹) *
              <input
                type="number"
                name="selling_price"
                value={formData.selling_price}
                onChange={handleChange}
                min="0"
                step="0.01"
                required
              />
            </label>

            <label>
              Initial Quantity *
              <input
                type="number"
                name="quantity"
                value={formData.quantity}
                onChange={handleChange}
                min="0"
                step="1"
                required
              />
            </label>

            <label>
              Low Stock Alert Level *
              <input
                type="number"
                name="reorder_level"
                value={formData.reorder_level}
                onChange={handleChange}
                min="0"
                step="1"
                required
              />
            </label>
          </div>

          {message && (
            <p className="form-message" role="status">
              {message}
            </p>
          )}

          <div className="form-actions">
            <button
              type="button"
              className="cancel-button"
              onClick={onClose}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="primary-button"
              disabled={saving}
            >
              {saving ? "Saving..." : "Save Product"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddProduct;