
import { useState, useEffect, useCallback } from "react";
import "./App.css";
import Login from "./Login.jsx";
import Register from "./Register.jsx";
import AddProduct from "./AddProduct.jsx";
import EditProduct from "./EditProduct";
import Transactions from "./Transactions.jsx";
import Purchases from "./Purchases.jsx";
import Sales from "./Sales.jsx";
import Reports from "./Reports.jsx";

const API = "http://localhost:5000/api";

async function apiFetch(url, options = {}) {
  return fetch(url, {
    ...options,
    credentials: "include",
  });
}

function normalizeCategory(category) {
  const value = String(category || "General").trim();

  if (value.toLowerCase() === "electronics") return "Electronics";
  if (value.toLowerCase() === "accessories") return "Accessories";

  return value;
}

/* ========================================
   INVENTO USER GUIDE
======================================== */

function UserGuide({ onClose }) {
  const guideSections = [
    {
      icon: "🏠",
      title: "Dashboard",
      description: "Get an overview of your inventory.",
      steps: [
        "Total Products displays the number of products in your inventory.",
        "Stock Quantity displays the total available units.",
        "Inventory Value estimates stock value using cost prices.",
        "Low Stock Alerts identifies products that may need restocking.",
        "Recent Transactions shows the latest recorded inventory activity.",
      ],
    },
    {
      icon: "📦",
      title: "Products",
      description: "Manage your inventory products.",
      steps: [
        "Click Add Product to create a product record.",
        "Enter the required product details, including SKU, name, prices, and quantity.",
        "Click Edit to update an existing product.",
        "Click Delete to remove a product after confirming.",
        "Use Linear Search to find products by name or SKU.",
        "Use the category dropdown to filter products.",
      ],
    },
    {
      icon: "🛒",
      title: "Purchases",
      description: "Record stock purchased from suppliers.",
      steps: [
        "Open Purchases from the sidebar.",
        "Enter the purchase details requested by the form.",
        "Verify the product, quantity, and amount before submitting.",
        "Check the resulting transaction and inventory quantity.",
      ],
    },
    {
      icon: "💰",
      title: "Sales",
      description: "Record products sold to customers.",
      steps: [
        "Open Sales from the sidebar.",
        "Enter the sales details requested by the form.",
        "Verify the product, quantity, and selling amount.",
        "Submit the transaction and check the updated inventory.",
      ],
    },
    {
      icon: "📋",
      title: "Transactions",
      description: "Review recorded purchases and sales.",
      steps: [
        "Open Transactions from the sidebar.",
        "Review transaction IDs, product names, and quantities.",
        "Identify whether each record represents a purchase or sale.",
        "Review the available dates and amounts to track inventory activity.",
      ],
    },
    {
      icon: "📊",
      title: "Reports",
      description: "Understand your inventory performance.",
      steps: [
        "Review the inventory summary and total stock.",
        "Check the category report to understand product distribution.",
        "Review stock levels and reorder information.",
        "Check purchase and sales summaries.",
        "Use the Export or Print button to open the browser's print dialog.",
        "Choose Save as PDF in the print dialog if available.",
      ],
    },
    {
      icon: "🔍",
      title: "DSA Tools",
      description: "Use search, sorting, and stock detection.",
      steps: [
        "Linear Search searches for products by name or SKU.",
        "Binary Search allows searching by an exact SKU.",
        "Sort products by quantity from low to high or high to low.",
        "Low-Stock Detection identifies products at or below their reorder level.",
        "Reset Filters clears the product search and filtering options.",
      ],
    },
    {
      icon: "🔐",
      title: "Account and Security",
      description: "Use your account safely.",
      steps: [
        "Log in with your registered account.",
        "All logged-in users can access the shared workspace features.",
        "Log out when you finish using a shared computer.",
        "Verify information before saving product or transaction changes.",
      ],
    },
  ];

  return (
    <div
      className="guide-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <section
        className="guide-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="guide-title"
      >
        <header className="guide-header">
          <div>
            <span className="guide-eyebrow">INVENTO HELP CENTER</span>
            <h2 id="guide-title">User Guide</h2>
            <p>Learn how to manage your inventory efficiently.</p>
          </div>

          <button
            type="button"
            className="guide-close"
            onClick={onClose}
            aria-label="Close user guide"
          >
            ×
          </button>
        </header>

        <div className="guide-welcome">
          <div className="guide-welcome-icon">I</div>

          <div>
            <h3>Welcome to Invento!</h3>
            <p>
              Your inventory workspace helps you manage products, record
              purchases and sales, track transactions, and review reports.
              Explore the guide below to learn about each feature.
            </p>
          </div>
        </div>

        <div className="guide-sections">
          {guideSections.map((section) => (
            <article className="guide-section" key={section.title}>
              <div className="guide-section-heading">
                <span className="guide-section-icon">
                  {section.icon}
                </span>

                <h3>{section.title}</h3>
              </div>

              <p>{section.description}</p>

              <ol>
                {section.steps.map((step, index) => (
                  <li key={index}>{step}</li>
                ))}
              </ol>
            </article>
          ))}
        </div>

        <footer className="guide-footer">
          <p>
            <strong>Helpful tip:</strong> Always verify product quantities
            and transaction details before saving changes.
          </p>

          <button
            type="button"
            className="guide-done-button"
            onClick={onClose}
          >
            Got it — let's start
          </button>
        </footer>
      </section>
    </div>
  );
}

function App() {
  const [activePage, setActivePage] = useState("Dashboard");

  // Controls the Help Guide modal.
  const [showUserGuide, setShowUserGuide] = useState(false);

  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState("");
  const [loggedInUser, setLoggedInUser] = useState(null);
  const [showRegister, setShowRegister] = useState(false);

  const [transactions, setTransactions] = useState([]);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [products, setProducts] = useState([]);
  const [editingProduct, setEditingProduct] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [productError, setProductError] = useState("");

  const [searchResults, setSearchResults] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [dsaError, setDsaError] = useState("");

  const [skuSearch, setSkuSearch] = useState("");
  const [skuResult, setSkuResult] = useState(null);
  const [skuLoading, setSkuLoading] = useState(false);

  const [sortOrder, setSortOrder] = useState("");
  const [lowStockResults, setLowStockResults] = useState(null);
  const [lowStockLoading, setLowStockLoading] = useState(false);

  // Verify the existing login session.
  useEffect(() => {
    let cancelled = false;

    async function checkSession() {
      try {
        const response = await apiFetch(`${API}/me`);

        if (!response.ok) {
          if (response.status !== 401) {
            throw new Error("Unable to verify your login session.");
          }

          if (!cancelled) setLoggedInUser(null);
          return;
        }

        const data = await response.json();

        if (!cancelled) {
          setLoggedInUser(data.user);
          setAuthError("");
        }
      } catch (error) {
        console.error("Session verification error:", error);

        if (!cancelled) {
          setLoggedInUser(null);
          setAuthError(
            "Unable to connect to the server. Please check that the backend is running."
          );
        }
      } finally {
        if (!cancelled) setAuthLoading(false);
      }
    }

    checkSession();

    return () => {
      cancelled = true;
    };
  }, []);

  function handleLogin(user) {
    setLoggedInUser(user);
    setAuthError("");
    setProductError("");
    setActivePage("Dashboard");
    setShowUserGuide(false);
  }

  async function handleLogout() {
    try {
      const response = await apiFetch(`${API}/logout`, {
        method: "POST",
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || "Logout failed.");
      }

      setLoggedInUser(null);
      setProducts([]);
      setTransactions([]);
      setSearchResults(null);
      setSkuResult(null);
      setLowStockResults(null);
      setShowAddProduct(false);
      setEditingProduct(null);
      setActivePage("Dashboard");
      setProductError("");
      setAuthError("");
      setShowRegister(false);
      setShowUserGuide(false);
      resetProductTools();
    } catch (error) {
      console.error("Logout error:", error);
      setAuthError(error.message || "Unable to log out. Please try again.");
    }
  }

  const refreshProducts = useCallback(async () => {
    const response = await apiFetch(`${API}/products`);

    if (response.status === 401) {
      setLoggedInUser(null);
      throw new Error("Your session has expired. Please log in again.");
    }

    const data = await response.json().catch(() => []);

    if (!response.ok) {
      throw new Error(data.message || "Could not refresh products.");
    }

    if (!Array.isArray(data)) {
      throw new Error("The server returned an invalid products response.");
    }

    setProducts(data);
    return data;
  }, []);

  // Load products for every authenticated account.
  useEffect(() => {
    if (!loggedInUser) {
      setLoadingProducts(false);
      setProducts([]);
      return;
    }

    let cancelled = false;

    async function fetchProducts() {
      setLoadingProducts(true);
      setProductError("");

      try {
        const response = await apiFetch(`${API}/products`);

        if (response.status === 401) {
          setLoggedInUser(null);
          throw new Error("Your session has expired. Please log in again.");
        }

        const data = await response.json().catch(() => []);

        if (!response.ok) {
          throw new Error(data.message || "Could not load products.");
        }

        if (!Array.isArray(data)) {
          throw new Error("The server returned an invalid products response.");
        }

        if (!cancelled) setProducts(data);
      } catch (error) {
        console.error("Product loading error:", error);

        if (!cancelled) {
          setProductError(
            error.message || "Could not load products. Please check the backend."
          );
        }
      } finally {
        if (!cancelled) setLoadingProducts(false);
      }
    }

    fetchProducts();

    return () => {
      cancelled = true;
    };
  }, [loggedInUser]);

  const refreshTransactions = useCallback(async () => {
    const response = await apiFetch(`${API}/transactions`);

    if (response.status === 401) {
      setLoggedInUser(null);
      throw new Error("Your session has expired. Please log in again.");
    }

    const data = await response.json().catch(() => []);

    if (!response.ok) {
      throw new Error(data.message || "Unable to load transactions.");
    }

    if (!Array.isArray(data)) {
      throw new Error("The server returned an invalid transactions response.");
    }

    const formattedTransactions = data.map((transaction) => {
      const quantity = Number(transaction.quantity || 0);
      const type = String(
        transaction.transaction_type || transaction.type || ""
      ).toLowerCase();

      const totalAmount =
        transaction.total_amount ??
        quantity * Number(transaction.unit_price || 0);

      return {
        id: transaction.id,
        product:
          transaction.product_name || transaction.product || "Unknown Product",
        type: type.charAt(0).toUpperCase() + type.slice(1),
        quantity: type === "sale" ? `-${quantity}` : `+${quantity}`,
        amount: `₹${Number(totalAmount).toLocaleString("en-IN", {
          maximumFractionDigits: 2,
        })}`,
        status: "Completed",
        created_at: transaction.created_at || transaction.date || "",
      };
    });

    const sortedTransactions = formattedTransactions
      .sort(
        (a, b) =>
          new Date(b.created_at || 0) - new Date(a.created_at || 0)
      )
      .slice(0, 5);

    setTransactions(sortedTransactions);
    return sortedTransactions;
  }, []);

  // Load recent transactions for every authenticated account.
  useEffect(() => {
    if (!loggedInUser) {
      setTransactions([]);
      return;
    }

    let cancelled = false;

    async function fetchTransactions() {
      try {
        const response = await apiFetch(`${API}/transactions`);

        if (response.status === 401) {
          setLoggedInUser(null);
          return;
        }

        const data = await response.json().catch(() => []);

        if (!response.ok || !Array.isArray(data)) return;

        const formattedTransactions = data.map((transaction) => {
          const quantity = Number(transaction.quantity || 0);
          const type = String(
            transaction.transaction_type || transaction.type || ""
          ).toLowerCase();

          const totalAmount =
            transaction.total_amount ??
            quantity * Number(transaction.unit_price || 0);

          return {
            id: transaction.id,
            product:
              transaction.product_name ||
              transaction.product ||
              "Unknown Product",
            type: type.charAt(0).toUpperCase() + type.slice(1),
            quantity: type === "sale" ? `-${quantity}` : `+${quantity}`,
            amount: `₹${Number(totalAmount).toLocaleString("en-IN", {
              maximumFractionDigits: 2,
            })}`,
            status: "Completed",
            created_at: transaction.created_at || transaction.date || "",
          };
        });

        const sortedTransactions = formattedTransactions
          .sort(
            (a, b) =>
              new Date(b.created_at || 0) - new Date(a.created_at || 0)
          )
          .slice(0, 5);

        if (!cancelled) setTransactions(sortedTransactions);
      } catch (error) {
        console.error("Transaction loading error:", error);
      }
    }

    fetchTransactions();

    return () => {
      cancelled = true;
    };
  }, [loggedInUser]);

  const categories = [
    "All",
    ...new Set(
      products
        .map((product) => normalizeCategory(product.category))
        .filter(Boolean)
        .filter((category) => category !== "All")
    ),
  ];

  const categoryCounts = products.reduce((counts, product) => {
    const category = normalizeCategory(product.category);
    counts[category] = (counts[category] || 0) + 1;
    return counts;
  }, {});

  const categoryEntries = Object.entries(categoryCounts).sort(
    (a, b) => b[1] - a[1]
  );

  const categoryColors = ["electronics", "accessories", "office", "other"];

  // Linear search is available to all authenticated users.
  useEffect(() => {
    if (!loggedInUser || activePage !== "Products") return;

    if (!searchTerm.trim()) {
      setSearchResults(null);
      setSearchLoading(false);
      setDsaError("");
      return;
    }

    let cancelled = false;

    const timer = setTimeout(async () => {
      setSearchLoading(true);
      setDsaError("");

      try {
        const response = await apiFetch(
          `${API}/products/search?q=${encodeURIComponent(searchTerm.trim())}`
        );

        const data = await response.json().catch(() => []);

        if (cancelled) return;

        if (response.status === 401) {
          setLoggedInUser(null);
          return;
        }

        if (response.status === 404) {
          setSearchResults([]);
        } else if (!response.ok) {
          throw new Error(data.message || "Unable to search products.");
        } else {
          setSearchResults(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        if (!cancelled) {
          setSearchResults([]);
          setDsaError(error.message || "Search failed.");
        }
      } finally {
        if (!cancelled) setSearchLoading(false);
      }
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [searchTerm, activePage, loggedInUser]);

  async function handleBinarySearch(event) {
    event.preventDefault();

    if (!skuSearch.trim()) {
      setDsaError("Enter a SKU to search.");
      setSkuResult(null);
      return;
    }

    setSkuLoading(true);
    setDsaError("");
    setSkuResult(null);

    try {
      const response = await apiFetch(
        `${API}/products/search-by-sku?sku=${encodeURIComponent(
          skuSearch.trim()
        )}`
      );

      const data = await response.json().catch(() => ({}));

      if (response.status === 401) {
        setLoggedInUser(null);
        return;
      }

      if (!response.ok) {
        throw new Error(data.message || "Product not found.");
      }

      setSkuResult(data);
    } catch (error) {
      setDsaError(error.message || "Binary search failed.");
    } finally {
      setSkuLoading(false);
    }
  }

  async function handleSort(order) {
    setDsaError("");
    setSortOrder(order);
    setLowStockResults(null);
    setSearchResults(null);
    setSearchTerm("");
    setSelectedCategory("All");

    try {
      const response = await apiFetch(
        `${API}/products/sort?order=${order}`
      );

      const data = await response.json().catch(() => []);

      if (response.status === 401) {
        setLoggedInUser(null);
        return;
      }

      if (!response.ok || !Array.isArray(data)) {
        throw new Error(data.message || "Sorting failed.");
      }

      setProducts(data);
    } catch (error) {
      setDsaError(error.message || "Could not sort products.");
    }
  }

  async function handleLowStock() {
    setLowStockLoading(true);
    setDsaError("");
    setSearchTerm("");
    setSearchResults(null);
    setSelectedCategory("All");
    setSortOrder("");

    try {
      const response = await apiFetch(`${API}/products/low-stock`);
      const data = await response.json().catch(() => []);

      if (response.status === 401) {
        setLoggedInUser(null);
        return;
      }

      if (!response.ok || !Array.isArray(data)) {
        throw new Error(data.message || "Could not load low-stock products.");
      }

      setLowStockResults(data);
    } catch (error) {
      setDsaError(error.message || "Low-stock detection failed.");
    } finally {
      setLowStockLoading(false);
    }
  }

  function resetProductTools() {
    setSearchTerm("");
    setSelectedCategory("All");
    setSearchResults(null);
    setSkuSearch("");
    setSkuResult(null);
    setLowStockResults(null);
    setSortOrder("");
    setDsaError("");
  }

  const baseProducts =
    lowStockResults !== null
      ? lowStockResults
      : searchResults !== null
        ? searchResults
        : products;

  const filteredProducts = baseProducts.filter((product) => {
    const productCategory = normalizeCategory(product.category);

    return (
      selectedCategory === "All" ||
      productCategory.toLowerCase() === selectedCategory.toLowerCase()
    );
  });

  const menuItems = [
    { name: "Dashboard", icon: "▦" },
    { name: "Products", icon: "□" },
    { name: "Purchases", icon: "↓" },
    { name: "Sales", icon: "↑" },
    { name: "Transactions", icon: "↔" },
    { name: "Reports", icon: "▤" },
  ];

  const totalProducts = products.length;

  const totalStockQuantity = products.reduce(
    (total, product) => total + Number(product.quantity || 0),
    0
  );

  const inventoryValue = products.reduce(
    (total, product) =>
      total +
      Number(product.quantity || 0) * Number(product.cost_price || 0),
    0
  );

  const lowStockProducts = products.filter(
    (product) =>
      Number(product.quantity || 0) <= Number(product.reorder_level || 0)
  );

  const stats = [
    {
      title: "Total Products",
      value: totalProducts.toLocaleString("en-IN"),
      change: "Products in inventory",
      icon: "□",
      color: "purple",
    },
    {
      title: "Stock Quantity",
      value: totalStockQuantity.toLocaleString("en-IN"),
      change: "Total units available",
      icon: "▦",
      color: "blue",
    },
    {
      title: "Inventory Value",
      value: `₹${inventoryValue.toLocaleString("en-IN", {
        maximumFractionDigits: 2,
      })}`,
      change: "Value at cost price",
      icon: "₹",
      color: "green",
    },
    {
      title: "Low Stock Items",
      value: String(lowStockProducts.length).padStart(2, "0"),
      change: "Products needing attention",
      icon: "!",
      color: "orange",
    },
  ];

  if (authLoading) {
    return (
      <div className="auth-loading">
        <h2>Invento</h2>
        <p>Checking your login session...</p>
      </div>
    );
  }

  if (!loggedInUser) {
    if (showRegister) {
      return (
        <>
          {authError && (
            <p role="alert" style={{ color: "#c0392b", padding: "12px" }}>
              {authError}
            </p>
          )}

          <Register
            onRegister={() => {
              setShowRegister(false);
              setAuthError("");
            }}
            onBackToLogin={() => {
              setShowRegister(false);
              setAuthError("");
            }}
          />
        </>
      );
    }

    return (
      <>
        {authError && (
          <div
            role="alert"
            style={{
              color: "#c0392b",
              padding: "12px",
              textAlign: "center",
            }}
          >
            {authError}
          </div>
        )}

        <Login
          onLogin={handleLogin}
          onCreateAccount={() => {
            setShowRegister(true);
            setAuthError("");
          }}
        />
      </>
    );
  }

  // All logged-in accounts use the same workspace.
  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-logo">I</div>
          <div>
            <h2>Invento</h2>
            <p>INVENTORY MANAGER</p>
          </div>
        </div>

        <div className="menu-heading">WORKSPACE</div>

        <nav className="sidebar-menu">
          {menuItems.map((item) => (
            <button
              type="button"
              key={item.name}
              className={`menu-item ${
                activePage === item.name ? "active" : ""
              }`}
              onClick={() => setActivePage(item.name)}
            >
              <span className="menu-icon">{item.icon}</span>
              <span>{item.name}</span>

              {item.name === "Products" && (
                <span className="menu-count">{totalProducts}</span>
              )}
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="help-box">
            <div className="help-icon">?</div>
            <h4>Need some help?</h4>
            <p>Learn how to manage your inventory efficiently.</p>

            <button
              type="button"
              onClick={() => setShowUserGuide(true)}
            >
              View help guide →
            </button>
          </div>

          <div className="profile">
            <div className="avatar">
              {(loggedInUser.name || "U").charAt(0).toUpperCase()}
            </div>

            <div className="profile-details">
              <strong>{loggedInUser.name || "User"}</strong>
              <span>Inventory User</span>
            </div>

            <button
              type="button"
              className="profile-menu"
              onClick={handleLogout}
              title="Log out"
              aria-label="Log out"
            >
              ↪
            </button>
          </div>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div className="breadcrumb">
            Workspace <span>/</span> <strong>{activePage}</strong>
          </div>

          <div className="topbar-right">
            <div className="today-label">● System online</div>

            <button
              type="button"
              className="secondary-button"
              onClick={() => window.print()}
            >
              ↧ Export
            </button>

            <div className="top-avatar">
              {(loggedInUser.name || "U").charAt(0).toUpperCase()}
            </div>

            <button
              type="button"
              className="secondary-button"
              onClick={handleLogout}
            >
              Log out
            </button>
          </div>
        </header>

        {authError && (
          <p role="alert" style={{ color: "#c0392b", padding: "12px" }}>
            {authError}
          </p>
        )}

        <section className="page-content">
          <div className="welcome-row">
            <div>
              <p className="eyebrow">INVENTO WORKSPACE</p>
              <h1>{activePage}</h1>
              <p className="subtitle">
                Welcome, {loggedInUser.name || "User"}! Here's what's happening
                with your inventory.
              </p>
            </div>

            <div className="header-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={() => window.print()}
              >
                ↧ Export
              </button>

              {activePage === "Products" && (
                <button
                  type="button"
                  className="primary-button"
                  onClick={() => setShowAddProduct(true)}
                >
                  + Add Product
                </button>
              )}
            </div>
          </div>

          {activePage === "Reports" ? (
            <Reports />
          ) : activePage === "Purchases" ? (
            <Purchases />
          ) : activePage === "Sales" ? (
            <Sales />
          ) : activePage === "Transactions" ? (
            <Transactions />
          ) : activePage === "Products" ? (
            <section className="panel products-panel">
              <div className="product-filters">
                <input
                  type="text"
                  placeholder="Linear Search: product name or SKU..."
                  value={searchTerm}
                  onChange={(event) => {
                    setSearchTerm(event.target.value);
                    setLowStockResults(null);
                    setSortOrder("");
                    setDsaError("");
                  }}
                />

                <select
                  value={selectedCategory}
                  onChange={(event) =>
                    setSelectedCategory(event.target.value)
                  }
                >
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              <form
                onSubmit={handleBinarySearch}
                className="product-filters"
                style={{ marginTop: "12px" }}
              >
                <input
                  type="text"
                  placeholder="Binary Search: enter exact SKU..."
                  value={skuSearch}
                  onChange={(event) => setSkuSearch(event.target.value)}
                />

                <button
                  type="submit"
                  className="primary-button"
                  disabled={skuLoading}
                >
                  {skuLoading ? "Searching..." : "Search SKU"}
                </button>

                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => {
                    setSkuSearch("");
                    setSkuResult(null);
                    setDsaError("");
                  }}
                >
                  Clear SKU
                </button>
              </form>

              {skuResult && (
                <div
                  className="panel"
                  style={{ marginTop: "16px", padding: "16px" }}
                >
                  <h3>Binary Search Result</h3>
                  <p>
                    <strong>Product:</strong> {skuResult.name}
                  </p>
                  <p>
                    <strong>SKU:</strong> {skuResult.sku}
                  </p>
                  <p>
                    <strong>Category:</strong>{" "}
                    {normalizeCategory(skuResult.category)}
                  </p>
                  <p>
                    <strong>Quantity:</strong> {skuResult.quantity}
                  </p>
                  <p>
                    <strong>Reorder Level:</strong> {skuResult.reorder_level}
                  </p>
                </div>
              )}

              <div
                className="header-actions"
                style={{
                  marginTop: "16px",
                  marginBottom: "16px",
                  flexWrap: "wrap",
                  gap: "10px",
                }}
              >
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => handleSort("asc")}
                >
                  ↑ Quantity: Low to High
                </button>

                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => handleSort("desc")}
                >
                  ↓ Quantity: High to Low
                </button>

                <button
                  type="button"
                  className="secondary-button"
                  onClick={handleLowStock}
                  disabled={lowStockLoading}
                >
                  {lowStockLoading ? "Checking..." : "⚠ Low-Stock Detection"}
                </button>

                <button
                  type="button"
                  className="secondary-button"
                  onClick={resetProductTools}
                >
                  Reset Filters
                </button>
              </div>

              {searchLoading && <p>Searching products...</p>}

              {dsaError && (
                <p
                  role="alert"
                  style={{ color: "#c0392b", margin: "12px 0" }}
                >
                  {dsaError}
                </p>
              )}

              {sortOrder && (
                <p>
                  Products sorted by quantity:{" "}
                  <strong>
                    {sortOrder === "asc"
                      ? "Lowest to highest"
                      : "Highest to lowest"}
                  </strong>
                </p>
              )}

              {lowStockResults !== null && (
                <p>
                  <strong>Low-Stock Detection:</strong> Found{" "}
                  {lowStockResults.length} product(s) requiring restocking.
                </p>
              )}

              {searchResults !== null && searchTerm.trim() && (
                <p>
                  <strong>Linear Search:</strong> {searchResults.length}{" "}
                  matching product(s) found.
                </p>
              )}

              <div className="panel-heading">
                <div>
                  <h3>
                    {lowStockResults !== null
                      ? "Low-Stock Products"
                      : searchResults !== null && searchTerm.trim()
                        ? "Search Results"
                        : "All Products"}
                  </h3>
                  <p>Products saved in your inventory database</p>
                </div>
              </div>

              <div className="table-wrapper">
                {loadingProducts ? (
                  <p>Loading products...</p>
                ) : productError ? (
                  <p role="alert">{productError}</p>
                ) : filteredProducts.length === 0 ? (
                  <p>
                    No products found. Try another search or reset the filters.
                  </p>
                ) : (
                  <table>
                    <thead>
                      <tr>
                        <th>SKU</th>
                        <th>PRODUCT NAME</th>
                        <th>CATEGORY</th>
                        <th>COST PRICE</th>
                        <th>SELLING PRICE</th>
                        <th>QUANTITY</th>
                        <th>STOCK STATUS</th>
                        <th>ACTIONS</th>
                      </tr>
                    </thead>

                    <tbody>
                      {filteredProducts.map((product) => (
                        <tr key={product.id}>
                          <td>{product.sku}</td>
                          <td>{product.name}</td>
                          <td>{normalizeCategory(product.category)}</td>
                          <td>
                            ₹
                            {Number(product.cost_price || 0).toLocaleString(
                              "en-IN"
                            )}
                          </td>
                          <td>
                            ₹
                            {Number(product.selling_price || 0).toLocaleString(
                              "en-IN"
                            )}
                          </td>
                          <td>{Number(product.quantity || 0)}</td>
                          <td>
                            {Number(product.quantity || 0) <=
                            Number(product.reorder_level || 0) ? (
                              <span className="type-badge sale">
                                Low Stock
                              </span>
                            ) : (
                              <span className="status-badge">
                                <span></span>In Stock
                              </span>
                            )}
                          </td>
                          <td>
                            <button
                              type="button"
                              onClick={() => setEditingProduct(product)}
                            >
                              Edit
                            </button>

                            <button
                              type="button"
                              onClick={async () => {
                                if (
                                  !window.confirm(
                                    `Are you sure you want to delete ${product.name}?`
                                  )
                                ) {
                                  return;
                                }

                                try {
                                  const response = await apiFetch(
                                    `${API}/products/${product.id}`,
                                    { method: "DELETE" }
                                  );

                                  const result = await response
                                    .json()
                                    .catch(() => ({}));

                                  if (response.status === 401) {
                                    setLoggedInUser(null);
                                    return;
                                  }

                                  if (!response.ok) {
                                    throw new Error(
                                      result.message ||
                                        "Could not delete product."
                                    );
                                  }

                                  alert("Product deleted successfully!");

                                  await refreshProducts();
                                  setSearchResults(null);
                                  setLowStockResults(null);
                                  setSearchTerm("");
                                  setSelectedCategory("All");
                                } catch (error) {
                                  alert(
                                    error.message || "Something went wrong."
                                  );
                                }
                              }}
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </section>
          ) : (
            <>
              <div className="stats-grid">
                {stats.map((stat) => (
                  <div className="stat-card" key={stat.title}>
                    <div className="stat-top">
                      <span>{stat.title}</span>
                      <div className={`stat-icon ${stat.color}`}>
                        {stat.icon}
                      </div>
                    </div>
                    <h2>{stat.value}</h2>
                    <p className={`stat-change ${stat.color}`}>
                      <span>↗</span> {stat.change}
                    </p>
                  </div>
                ))}
              </div>

              <div className="dashboard-grid">
                <section className="panel inventory-panel">
                  <div className="panel-heading">
                    <div>
                      <h3>Inventory Overview</h3>
                      <p>Stock distribution across categories</p>
                    </div>

                    <button
                      type="button"
                      className="text-button"
                      onClick={() => setActivePage("Products")}
                    >
                      View products →
                    </button>
                  </div>

                  <div className="inventory-chart">
                    <div className="donut-chart">
                      <div className="donut-center">
                        <strong>{products.length}</strong>
                        <span>Products</span>
                      </div>
                    </div>

                    <div className="chart-legend">
                      {categoryEntries.map(([category, count], index) => (
                        <div key={category}>
                          <span
                            className={`legend-dot ${
                              categoryColors[index % categoryColors.length]
                            }`}
                          ></span>
                          <span>{category}</span>
                          <strong>
                            {products.length
                              ? Math.round((count / products.length) * 100)
                              : 0}
                            %
                          </strong>
                        </div>
                      ))}
                    </div>
                  </div>
                </section>

                <section className="panel low-stock-panel">
                  <div className="panel-heading">
                    <div>
                      <h3>Low Stock Alerts</h3>
                      <p>Products that need restocking</p>
                    </div>

                    <span className="alert-count">
                      {lowStockProducts.length} items
                    </span>
                  </div>

                  {lowStockProducts.length === 0 ? (
                    <p className="empty-state">
                      All products have sufficient stock.
                    </p>
                  ) : (
                    lowStockProducts.slice(0, 5).map((product) => (
                      <div className="stock-item" key={product.id}>
                        <div className="product-symbol purple-bg">
                          {(product.name || "P").slice(0, 2).toUpperCase()}
                        </div>

                        <div className="stock-details">
                          <strong>{product.name}</strong>
                          <span>SKU: {product.sku || "N/A"}</span>
                        </div>

                        <div className="stock-level">
                          <strong>
                            {Number(product.quantity || 0)} left
                          </strong>
                          <span>
                            Min. {Number(product.reorder_level || 0)}
                          </span>
                        </div>
                      </div>
                    ))
                  )}

                  <button
                    type="button"
                    className="restock-button"
                    onClick={() => setActivePage("Purchases")}
                  >
                    Manage restocking →
                  </button>
                </section>
              </div>

              <section className="panel transactions-panel">
                <div className="panel-heading transaction-heading">
                  <div>
                    <h3>Recent Transactions</h3>
                    <p>Track the latest purchases and sales</p>
                  </div>

                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => setActivePage("Transactions")}
                  >
                    View all transactions →
                  </button>
                </div>

                <div className="table-wrapper">
                  <table>
                    <thead>
                      <tr>
                        <th>TRANSACTION ID</th>
                        <th>PRODUCT</th>
                        <th>TYPE</th>
                        <th>QUANTITY</th>
                        <th>AMOUNT</th>
                        <th>STATUS</th>
                      </tr>
                    </thead>

                    <tbody>
                      {transactions.map((transaction) => (
                        <tr key={transaction.id}>
                          <td className="transaction-id">
                            {transaction.id}
                          </td>
                          <td>{transaction.product}</td>
                          <td>
                            <span
                              className={`type-badge ${transaction.type.toLowerCase()}`}
                            >
                              {transaction.type}
                            </span>
                          </td>
                          <td
                            className={
                              transaction.quantity.startsWith("+")
                                ? "quantity-positive"
                                : "quantity-negative"
                            }
                          >
                            {transaction.quantity}
                          </td>
                          <td className="amount">{transaction.amount}</td>
                          <td>
                            <span className="status-badge">
                              <span></span>
                              {transaction.status}
                            </span>
                          </td>
                        </tr>
                      ))}

                      {transactions.length === 0 && (
                        <tr>
                          <td colSpan="6">No transactions available yet.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            </>
          )}

          <footer className="page-footer">
            <span>© 2026 Invento Inventory Management System</span>
            <span>Made for smarter inventory management</span>
          </footer>
        </section>
      </main>

      {showAddProduct && (
        <AddProduct
          onClose={() => setShowAddProduct(false)}
          onProductAdded={async () => {
            try {
              await refreshProducts();
              await refreshTransactions();
              setProductError("");
              setShowAddProduct(false);
            } catch (error) {
              setProductError(error.message);
            }
          }}
        />
      )}

      {editingProduct && (
        <EditProduct
          product={editingProduct}
          onClose={() => setEditingProduct(null)}
          onProductUpdated={async () => {
            try {
              await refreshProducts();
              setEditingProduct(null);
              setProductError("");
            } catch (error) {
              setProductError(error.message);
            }
          }}
        />
      )}

      {/* Help Guide modal */}
      {showUserGuide && (
        <UserGuide onClose={() => setShowUserGuide(false)} />
      )}
    </div>
  );
}

export default App;

