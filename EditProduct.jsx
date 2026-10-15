import { useState } from "react";

function EditProduct({ product, onClose, onProductUpdated }) {
  const [formData, setFormData] = useState({
    sku: product.sku || "",
    name: product.name || "",
    category: product.category || "",
    cost_price: product.cost_price ?? "",
    selling_price: product.selling_price ?? "",
    quantity: product.quantity ?? 0,
    reorder_level: product.reorder_level ?? 5,
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function handleChange(event) {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      const response = await fetch(
        `http://127.0.0.1:5000/api/products/${product.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...formData,
            cost_price: Number(formData.cost_price),
            selling_price: Number(formData.selling_price),
            quantity: Number(formData.quantity),
            reorder_level: Number(formData.reorder_level),
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Could not update product.");
      }

      await onProductUpdated();
      onClose();
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Edit Product</h2>

        <form onSubmit={handleSubmit}>
          <label>SKU</label>
          <input
            name="sku"
            value={formData.sku}
            onChange={handleChange}
            required
          />

          <label>Product Name</label>
          <input
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
          />

          <label>Category</label>
          <input
            name="category"
            value={formData.category}
            onChange={handleChange}
            required
          />

          <label>Cost Price</label>
          <input
            name="cost_price"
            type="number"
            min="0"
            step="0.01"
            value={formData.cost_price}
            onChange={handleChange}
            required
          />

          <label>Selling Price</label>
          <input
            name="selling_price"
            type="number"
            min="0"
            step="0.01"
            value={formData.selling_price}
            onChange={handleChange}
            required
          />

          <label>Quantity</label>
          <input
            name="quantity"
            type="number"
            min="0"
            step="1"
            value={formData.quantity}
            onChange={handleChange}
            required
          />

          <label>Reorder Level</label>
          <input
            name="reorder_level"
            type="number"
            min="0"
            step="1"
            value={formData.reorder_level}
            onChange={handleChange}
            required
          />

          {error && <p className="form-error">{error}</p>}

          <div className="form-actions">
            <button type="button" onClick={onClose} disabled={saving}>
              Cancel
            </button>

            <button type="submit" disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditProduct;