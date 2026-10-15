from flask import Flask, jsonify, request, session
from werkzeug.security import generate_password_hash, check_password_hash
from functools import wraps
import os
from flask_cors import CORS
from decimal import Decimal, InvalidOperation
from datetime import date, datetime

from db import get_db_connection

from dsa_algorithms import (
    linear_search_all,
    binary_search_by_sku,
    find_low_stock_products,
    sort_products_by_quantity
)


# ==========================================================
# FLASK APPLICATION CONFIGURATION
# ==========================================================

app = Flask(__name__)

app.config["SECRET_KEY"] = os.getenv("FLASK_SECRET_KEY")

if not app.config["SECRET_KEY"]:
    raise RuntimeError(
        "FLASK_SECRET_KEY is missing from the backend .env file."
    )

app.config["SESSION_COOKIE_HTTPONLY"] = True
app.config["SESSION_COOKIE_SAMESITE"] = "Lax"

CORS(
    app,
    origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:5175",
        "http://localhost:5176",
        "http://localhost:5177",
        "http://localhost:5178",
    ],
    supports_credentials=True,
)


# ==========================================================
# AUTHENTICATION DECORATOR
# ==========================================================

def login_required(function):
    """Allow access only to authenticated users."""

    @wraps(function)
    def wrapper(*args, **kwargs):
        if "user_id" not in session:
            return jsonify({
                "message": "Please log in to continue."
            }), 401

        return function(*args, **kwargs)

    return wrapper


# ==========================================================
# HELPER FUNCTIONS
# ==========================================================

def serialize_value(value):
    """Convert database values into JSON-compatible values."""

    if isinstance(value, Decimal):
        return float(value)

    if isinstance(value, (datetime, date)):
        return value.isoformat()

    return value


def serialize_products(products):
    """Convert product records into JSON-compatible dictionaries."""

    return [
        {
            key: serialize_value(value)
            for key, value in product.items()
        }
        for product in products
    ]


def fetch_all_products():
    """Fetch complete product information."""

    connection = None
    cursor = None

    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        cursor.execute("""
            SELECT
                id,
                sku,
                name,
                category,
                description,
                cost_price,
                selling_price,
                quantity,
                reorder_level,
                created_at,
                updated_at
            FROM products
            ORDER BY id DESC
        """)

        products = cursor.fetchall()
        return serialize_products(products)

    finally:
        if cursor:
            cursor.close()

        if connection and connection.is_connected():
            connection.close()


# ==========================================================
# AUTHENTICATION - LOGIN
# ==========================================================

@app.route("/api/login", methods=["POST"])
def login():
    data = request.get_json(silent=True)

    if not isinstance(data, dict):
        return jsonify({
            "message": "Please provide your email and password."
        }), 400

    email = data.get("email")
    password = data.get("password")

    if not isinstance(email, str) or not isinstance(password, str):
        return jsonify({
            "message": "Please provide your email and password."
        }), 400

    email = email.strip().lower()

    if not email or not password:
        return jsonify({
            "message": "Please provide your email and password."
        }), 400

    connection = None
    cursor = None

    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        cursor.execute("""
            SELECT id, name, email, password_hash
            FROM users
            WHERE email = %s
            LIMIT 1
        """, (email,))

        user = cursor.fetchone()

        if not user or not check_password_hash(
            user["password_hash"], password
        ):
            return jsonify({
                "message": "Invalid email or password."
            }), 401

        # Create a fresh authenticated session.
        session.clear()

        session["user_id"] = user["id"]
        session["name"] = user["name"]
        session["email"] = user["email"]

        return jsonify({
            "message": "Login successful.",
            "user": {
                "id": user["id"],
                "name": user["name"],
                "email": user["email"],
            }
        }), 200

    except Exception:
        app.logger.exception("Login failed")

        return jsonify({
            "message": "Unable to log in right now."
        }), 500

    finally:
        if cursor:
            cursor.close()

        if connection and connection.is_connected():
            connection.close()


# ==========================================================
# AUTHENTICATION - REGISTER
# ==========================================================

@app.route("/api/register", methods=["POST"])
def register():
    data = request.get_json(silent=True)

    if not isinstance(data, dict):
        return jsonify({
            "message": "Please provide your name, email, and password."
        }), 400

    name = data.get("name")
    email = data.get("email")
    password = data.get("password")

    if not all(
        isinstance(value, str)
        for value in (name, email, password)
    ):
        return jsonify({
            "message": "Please provide your name, email, and password."
        }), 400

    name = name.strip()
    email = email.strip().lower()

    if not name or not email or not password:
        return jsonify({
            "message": "All fields are required."
        }), 400

    if len(name) > 100:
        return jsonify({
            "message": "Name must be 100 characters or fewer."
        }), 400

    if (
        len(email) > 150
        or "@" not in email
        or email.startswith("@")
        or email.endswith("@")
    ):
        return jsonify({
            "message": "Please enter a valid email address."
        }), 400

    if len(password) < 8:
        return jsonify({
            "message": "Password must contain at least 8 characters."
        }), 400

    connection = None
    cursor = None

    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        cursor.execute("""
            SELECT id
            FROM users
            WHERE email = %s
            LIMIT 1
        """, (email,))

        if cursor.fetchone():
            return jsonify({
                "message": "An account with this email already exists."
            }), 409

        password_hash = generate_password_hash(password)

        # Every new account receives the same application access.
        # The existing role column is retained for database compatibility.
        cursor.execute("""
            INSERT INTO users (name, email, password_hash, role)
            VALUES (%s, %s, %s, 'user')
        """, (name, email, password_hash))

        connection.commit()

        return jsonify({
            "message": "Account created successfully. Please log in."
        }), 201

    except Exception:
        if connection:
            connection.rollback()

        app.logger.exception("Registration failed")

        return jsonify({
            "message": "Unable to create your account right now."
        }), 500

    finally:
        if cursor:
            cursor.close()

        if connection and connection.is_connected():
            connection.close()


# ==========================================================
# AUTHENTICATION - CURRENT USER
# ==========================================================

@app.route("/api/me", methods=["GET"])
@login_required
def current_user():
    return jsonify({
        "user": {
            "id": session["user_id"],
            "name": session["name"],
            "email": session["email"],
        }
    }), 200


# ==========================================================
# AUTHENTICATION - LOGOUT
# ==========================================================

@app.route("/api/logout", methods=["POST"])
@login_required
def logout():
    session.clear()

    return jsonify({
        "message": "Logged out successfully."
    }), 200


# ==========================================================
# HOME AND HEALTH
# ==========================================================

@app.route("/", methods=["GET"])
def home():
    return jsonify({
        "message": "Invento Inventory Management System API is running!"
    }), 200


@app.route("/api/health", methods=["GET"])
def health_check():
    connection = None
    cursor = None

    try:
        connection = get_db_connection()
        cursor = connection.cursor()

        cursor.execute("SELECT DATABASE()")
        database_name = cursor.fetchone()[0]

        return jsonify({
            "status": "success",
            "message": "Backend connected to MySQL!",
            "database": database_name
        }), 200

    except Exception:
        app.logger.exception("Database health check failed")

        return jsonify({
            "status": "error",
            "message": "Database connection failed"
        }), 500

    finally:
        if cursor:
            cursor.close()

        if connection and connection.is_connected():
            connection.close()


# ==========================================================
# PRODUCTS - GET ALL
# ==========================================================

@app.route("/api/products", methods=["GET"])
@login_required
def get_products():
    try:
        products = fetch_all_products()
        return jsonify(products), 200

    except Exception:
        app.logger.exception("Could not retrieve products")

        return jsonify({
            "message": "Could not retrieve products."
        }), 500


# ==========================================================
# PRODUCTS - ADD
# ==========================================================

@app.route("/api/products", methods=["POST"])
@login_required
def add_product():
    data = request.get_json(silent=True)

    if not isinstance(data, dict):
        return jsonify({
            "message": "Send product details as JSON."
        }), 400

    sku = data.get("sku")
    name = data.get("name")
    category = data.get("category", "")
    description = data.get("description", "")
    quantity = data.get("quantity", 0)
    reorder_level = data.get("reorder_level", 5)

    if not isinstance(sku, str) or not sku.strip():
        return jsonify({"message": "SKU is required."}), 400

    if not isinstance(name, str) or not name.strip():
        return jsonify({"message": "Product name is required."}), 400

    if (
        not isinstance(category, str)
        or not isinstance(description, str)
    ):
        return jsonify({
            "message": "Category and description must be text."
        }), 400

    try:
        cost_price = Decimal(str(data.get("cost_price", 0)))
        selling_price = Decimal(str(data.get("selling_price", 0)))

        if not cost_price.is_finite() or not selling_price.is_finite():
            raise InvalidOperation()

        if cost_price < 0 or selling_price < 0:
            return jsonify({
                "message": "Prices cannot be negative."
            }), 400

        if type(quantity) is not int or quantity < 0:
            return jsonify({
                "message": "Quantity must be a non-negative integer."
            }), 400

        if type(reorder_level) is not int or reorder_level < 0:
            return jsonify({
                "message": "Reorder level must be a non-negative integer."
            }), 400

    except (InvalidOperation, ValueError, TypeError):
        return jsonify({
            "message": "Enter valid prices, quantity, and reorder level."
        }), 400

    connection = None
    cursor = None

    try:
        connection = get_db_connection()
        cursor = connection.cursor()

        cursor.execute("""
            INSERT INTO products (
                sku, name, category, description,
                cost_price, selling_price, quantity, reorder_level
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        """, (
            sku.strip(),
            name.strip(),
            category.strip(),
            description.strip(),
            cost_price,
            selling_price,
            quantity,
            reorder_level
        ))

        product_id = cursor.lastrowid
        connection.commit()

        return jsonify({
            "message": "Product added successfully.",
            "id": product_id
        }), 201

    except Exception as error:
        if connection:
            connection.rollback()

        app.logger.exception("Could not add product")

        if getattr(error, "errno", None) == 1062:
            return jsonify({
                "message": "This SKU already exists. Use a unique SKU."
            }), 409

        return jsonify({"message": "Could not add product."}), 500

    finally:
        if cursor:
            cursor.close()

        if connection and connection.is_connected():
            connection.close()


# ==========================================================
# PRODUCTS - UPDATE
# ==========================================================

@app.route("/api/products/<int:product_id>", methods=["PUT"])
@login_required
def update_product(product_id):
    data = request.get_json(silent=True)

    if not isinstance(data, dict):
        return jsonify({
            "message": "Send product details as JSON."
        }), 400

    sku = data.get("sku")
    name = data.get("name")
    category = data.get("category", "")
    cost_price = data.get("cost_price")
    selling_price = data.get("selling_price")
    quantity = data.get("quantity")
    reorder_level = data.get("reorder_level")

    if not isinstance(sku, str) or not sku.strip():
        return jsonify({"message": "SKU is required."}), 400

    if not isinstance(name, str) or not name.strip():
        return jsonify({"message": "Product name is required."}), 400

    if not isinstance(category, str):
        return jsonify({"message": "Category must be text."}), 400

    try:
        cost_price = Decimal(str(cost_price))
        selling_price = Decimal(str(selling_price))

        if not cost_price.is_finite() or not selling_price.is_finite():
            raise InvalidOperation()

        if cost_price < 0 or selling_price < 0:
            return jsonify({
                "message": "Prices cannot be negative."
            }), 400

        if type(quantity) is not int or quantity < 0:
            return jsonify({
                "message": "Quantity must be a non-negative integer."
            }), 400

        if type(reorder_level) is not int or reorder_level < 0:
            return jsonify({
                "message": "Reorder level must be a non-negative integer."
            }), 400

    except (InvalidOperation, ValueError, TypeError):
        return jsonify({
            "message": "Enter valid prices, quantity, and reorder level."
        }), 400

    connection = None
    cursor = None

    try:
        connection = get_db_connection()
        cursor = connection.cursor()

        cursor.execute("""
            UPDATE products
            SET sku = %s,
                name = %s,
                category = %s,
                cost_price = %s,
                selling_price = %s,
                quantity = %s,
                reorder_level = %s
            WHERE id = %s
        """, (
            sku.strip(),
            name.strip(),
            category.strip(),
            cost_price,
            selling_price,
            quantity,
            reorder_level,
            product_id
        ))

        if cursor.rowcount == 0:
            cursor.execute(
                "SELECT id FROM products WHERE id = %s",
                (product_id,)
            )

            if cursor.fetchone() is None:
                return jsonify({"message": "Product not found."}), 404

        connection.commit()

        return jsonify({
            "message": "Product updated successfully.",
            "id": product_id
        }), 200

    except Exception as error:
        if connection:
            connection.rollback()

        app.logger.exception("Could not update product")

        if getattr(error, "errno", None) == 1062:
            return jsonify({
                "message": "This SKU already exists. Use a unique SKU."
            }), 409

        return jsonify({"message": "Could not update product."}), 500

    finally:
        if cursor:
            cursor.close()

        if connection and connection.is_connected():
            connection.close()


# ==========================================================
# PRODUCTS - DELETE
# ==========================================================

@app.route("/api/products/<int:product_id>", methods=["DELETE"])
@login_required
def delete_product(product_id):
    connection = None
    cursor = None

    try:
        connection = get_db_connection()
        cursor = connection.cursor()

        cursor.execute(
            "SELECT id FROM products WHERE id = %s",
            (product_id,)
        )

        if cursor.fetchone() is None:
            return jsonify({"message": "Product not found."}), 404

        cursor.execute(
            "DELETE FROM products WHERE id = %s",
            (product_id,)
        )

        connection.commit()

        return jsonify({
            "message": "Product deleted successfully.",
            "id": product_id
        }), 200

    except Exception:
        if connection:
            connection.rollback()

        app.logger.exception("Could not delete product")

        return jsonify({"message": "Could not delete product."}), 500

    finally:
        if cursor:
            cursor.close()

        if connection and connection.is_connected():
            connection.close()


# ==========================================================
# TRANSACTIONS - CREATE PURCHASE OR SALE
# ==========================================================

@app.route("/api/transactions", methods=["POST"])
@login_required
def create_transaction():
    data = request.get_json(silent=True)

    if not isinstance(data, dict):
        return jsonify({
            "message": "Send transaction details as JSON."
        }), 400

    transaction_type = data.get("transaction_type")
    product_id = data.get("product_id")
    quantity = data.get("quantity")
    notes = data.get("notes", "")

    if transaction_type not in ("purchase", "sale"):
        return jsonify({
            "message": "Transaction type must be purchase or sale."
        }), 400

    if type(product_id) is not int or product_id <= 0:
        return jsonify({"message": "Select a valid product."}), 400

    if type(quantity) is not int or quantity <= 0:
        return jsonify({
            "message": "Quantity must be a positive integer."
        }), 400

    try:
        unit_price = Decimal(str(data.get("unit_price")))

        if not unit_price.is_finite() or unit_price < 0:
            raise InvalidOperation()

    except (InvalidOperation, ValueError, TypeError):
        return jsonify({"message": "Enter a valid unit price."}), 400

    if notes is None:
        notes = ""

    if not isinstance(notes, str):
        return jsonify({"message": "Notes must be text."}), 400

    connection = None
    cursor = None

    try:
        connection = get_db_connection()
        connection.start_transaction()

        cursor = connection.cursor(dictionary=True)

        cursor.execute("""
            SELECT id, name, quantity
            FROM products
            WHERE id = %s
            FOR UPDATE
        """, (product_id,))

        product = cursor.fetchone()

        if product is None:
            connection.rollback()
            return jsonify({"message": "Product not found."}), 404

        current_stock = product["quantity"]

        if transaction_type == "sale" and quantity > current_stock:
            connection.rollback()
            return jsonify({
                "message": (
                    f"Insufficient stock. Available quantity: "
                    f"{current_stock}."
                )
            }), 400

        if transaction_type == "purchase":
            new_stock = current_stock + quantity
        else:
            new_stock = current_stock - quantity

        total_amount = unit_price * quantity

        cursor.execute("""
            UPDATE products
            SET quantity = %s
            WHERE id = %s
        """, (new_stock, product_id))

        cursor.execute("""
            INSERT INTO transactions (
                transaction_type,
                product_id,
                quantity,
                unit_price,
                total_amount,
                notes
            )
            VALUES (%s, %s, %s, %s, %s, %s)
        """, (
            transaction_type,
            product_id,
            quantity,
            unit_price,
            total_amount,
            notes.strip() or None
        ))

        transaction_id = cursor.lastrowid
        connection.commit()

        return jsonify({
            "message": (
                "Purchase recorded successfully."
                if transaction_type == "purchase"
                else "Sale recorded successfully."
            ),
            "transaction_id": transaction_id,
            "product_id": product_id,
            "product_name": product["name"],
            "transaction_type": transaction_type,
            "quantity": quantity,
            "updated_stock": new_stock,
            "total_amount": float(total_amount)
        }), 201

    except Exception:
        if connection:
            connection.rollback()

        app.logger.exception("Could not create transaction")

        return jsonify({
            "message": "Could not record transaction."
        }), 500

    finally:
        if cursor:
            cursor.close()

        if connection and connection.is_connected():
            connection.close()


# ==========================================================
# TRANSACTIONS - GET HISTORY
# ==========================================================

@app.route("/api/transactions", methods=["GET"])
@login_required
def get_transactions():
    connection = None
    cursor = None

    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        cursor.execute("""
            SELECT
                t.id,
                t.transaction_type,
                t.product_id,
                p.name AS product_name,
                p.sku,
                t.quantity,
                t.unit_price,
                t.total_amount,
                t.notes,
                t.created_at
            FROM transactions t
            JOIN products p ON t.product_id = p.id
            ORDER BY t.created_at DESC, t.id DESC
        """)

        transactions = cursor.fetchall()

        for transaction in transactions:
            for field in ("unit_price", "total_amount"):
                if transaction[field] is not None:
                    transaction[field] = float(transaction[field])

            if transaction["created_at"] is not None:
                transaction["created_at"] = transaction[
                    "created_at"
                ].isoformat(sep=" ", timespec="seconds")

        return jsonify(transactions), 200

    except Exception:
        app.logger.exception("Could not retrieve transactions")

        return jsonify({
            "message": "Could not retrieve transactions."
        }), 500

    finally:
        if cursor:
            cursor.close()

        if connection and connection.is_connected():
            connection.close()


# ==========================================================
# DSA 1 - LINEAR SEARCH
# GET /api/products/search?q=search-term
# ==========================================================

@app.route("/api/products/search", methods=["GET"])
@login_required
def search_products():
    search_term = request.args.get("q", "").strip()

    if not search_term:
        return jsonify({
            "message": "Please enter a product name or SKU."
        }), 400

    try:
        products = fetch_all_products()
        results = linear_search_all(products, search_term)

        if not results:
            return jsonify({
                "message": "No matching products found."
            }), 404

        return jsonify(results), 200

    except Exception:
        app.logger.exception("Linear search failed")

        return jsonify({
            "message": "Unable to search products."
        }), 500


# ==========================================================
# DSA 2 - BINARY SEARCH BY SKU
# GET /api/products/search-by-sku?sku=exact-sku
# ==========================================================

@app.route("/api/products/search-by-sku", methods=["GET"])
@login_required
def search_product_by_sku():
    sku = request.args.get("sku", "").strip()

    if not sku:
        return jsonify({
            "message": "Please provide a product SKU."
        }), 400

    try:
        products = fetch_all_products()
        result = binary_search_by_sku(products, sku)

        if result is None:
            return jsonify({
                "message": "Product not found."
            }), 404

        return jsonify(result), 200

    except Exception:
        app.logger.exception("Binary search failed")

        return jsonify({
            "message": "Unable to search for the product."
        }), 500


# ==========================================================
# DSA 3 - SORT BY QUANTITY
# GET /api/products/sort?order=asc
# GET /api/products/sort?order=desc
# ==========================================================

@app.route("/api/products/sort", methods=["GET"])
@login_required
def sort_products():
    order = request.args.get("order", "asc").lower()

    if order not in ("asc", "desc"):
        return jsonify({
            "message": "Order must be 'asc' or 'desc'."
        }), 400

    try:
        products = fetch_all_products()

        sorted_products = sort_products_by_quantity(
            products,
            descending=(order == "desc")
        )

        return jsonify(sorted_products), 200

    except Exception:
        app.logger.exception("Product sorting failed")

        return jsonify({
            "message": "Unable to sort products."
        }), 500


# ==========================================================
# DSA 4 - LOW-STOCK DETECTION
# GET /api/products/low-stock
# ==========================================================

@app.route("/api/products/low-stock", methods=["GET"])
@login_required
def get_low_stock_products():
    try:
        products = fetch_all_products()
        low_stock = find_low_stock_products(products)

        return jsonify(low_stock), 200

    except Exception:
        app.logger.exception("Low-stock detection failed")

        return jsonify({
            "message": "Unable to retrieve low-stock products."
        }), 500


# ==========================================================
# RUN SERVER
# ==========================================================

if __name__ == "__main__":
    app.run(debug=True, port=5000)