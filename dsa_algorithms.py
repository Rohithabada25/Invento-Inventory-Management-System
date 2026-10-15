# ==========================================================
# INVENTO - DATA STRUCTURES AND ALGORITHMS
# Inventory Management System
# ==========================================================


# 1. LINEAR SEARCH
# Searches for the first product matching a name or SKU.
# Time Complexity: O(n)
def linear_search(products, search_term):
    search_term = search_term.strip().lower()

    for product in products:
        name = str(product.get("name", "")).lower()
        sku = str(product.get("sku", "")).lower()

        if search_term in name or search_term in sku:
            return product

    return None


# 2. LINEAR SEARCH - FIND ALL MATCHES
# Returns all products matching the name or SKU.
# Time Complexity: O(n)
def linear_search_all(products, search_term):
    search_term = search_term.strip().lower()

    if not search_term:
        return products

    matching_products = []

    for product in products:
        name = str(product.get("name", "")).lower()
        sku = str(product.get("sku", "")).lower()

        if search_term in name or search_term in sku:
            matching_products.append(product)

    return matching_products


# 3. BINARY SEARCH BY EXACT SKU
# Sorts products by SKU, then uses binary search.
# Sorting: O(n log n)
# Binary search: O(log n)
# Overall: O(n log n)
def binary_search_by_sku(products, target_sku):
    target_sku = target_sku.strip().lower()

    if not target_sku:
        return None

    sorted_products = sorted(
        products,
        key=lambda product: str(
            product.get("sku", "")
        ).lower()
    )

    left = 0
    right = len(sorted_products) - 1

    while left <= right:
        middle = (left + right) // 2

        current_sku = str(
            sorted_products[middle].get("sku", "")
        ).lower()

        if current_sku == target_sku:
            return sorted_products[middle]

        if current_sku < target_sku:
            left = middle + 1
        else:
            right = middle - 1

    return None


# 4. FIND LOW-STOCK PRODUCTS
# Finds products at or below their reorder level.
# Time Complexity: O(n)
def find_low_stock_products(products):
    low_stock = []

    for product in products:
        quantity = int(product.get("quantity", 0) or 0)
        reorder_level = int(
            product.get("reorder_level", 0) or 0
        )

        if quantity <= reorder_level:
            low_stock.append(product)

    return low_stock


# 5. SORT PRODUCTS BY QUANTITY
# ascending: lowest quantity first
# descending: highest quantity first
# Time Complexity: O(n log n)
def sort_products_by_quantity(products, descending=False):
    return sorted(
        products,
        key=lambda product: int(
            product.get("quantity", 0) or 0
        ),
        reverse=descending
    )