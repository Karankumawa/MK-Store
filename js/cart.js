// Cart functionality
document.addEventListener('DOMContentLoaded', async function () {
    // Initialize cart from localStorage
    let localCart = JSON.parse(localStorage.getItem('cart')) || [];
    let cart = []; // This will hold the synced data

    const API_URL = '/api/products';

    // Fetch fresh data for cart items
    async function syncCartWithDB() {
        if (localCart.length === 0) {
            cart = [];
            displayCartItems();
            updateCartSummary();
            updateCartCount();
            return;
        }

        const cartItemsWrapper = document.querySelector('.cart-items');
        if (cartItemsWrapper) cartItemsWrapper.innerHTML = '<div class="loading-spinner"><i class="fa fa-spinner fa-spin"></i> Updating cart prices...</div>';

        try {
            // Fetch all products (Optimizable: In a real app, fetch only specific IDs)
            const res = await fetch(API_URL);
            if (!res.ok) throw new Error('Failed to fetch product data');
            const allProducts = await res.json();

            // Rebuild cart with fresh data
            const validCart = [];
            let dataChanged = false;

            localCart.forEach(localItem => {
                const liveProduct = allProducts.find(p => p._id === localItem._id);
                if (liveProduct) {
                    // Update price/image/name if changed
                    if (liveProduct.price !== localItem.price || liveProduct.image !== localItem.image || liveProduct.name !== localItem.name) {
                        dataChanged = true;
                    }

                    validCart.push({
                        _id: liveProduct._id,
                        name: liveProduct.name,
                        price: liveProduct.price, // Always use live price
                        image: liveProduct.image,
                        quantity: localItem.quantity // Keep local quantity
                    });
                } else {
                    // Product no longer exists
                    dataChanged = true;
                    // Check if we should notify user? For now just remove silentl or maybe console log
                    console.warn(`Product ${localItem.name} no longer exists in DB. Removing from cart.`);
                }
            });

            cart = validCart;

            // Update localStorage if there were changes (removed items or price updates)
            if (dataChanged || cart.length !== localCart.length) {
                localStorage.setItem('cart', JSON.stringify(cart));
                showNotification("Cart updated with latest prices and availability.");
            }

        } catch (err) {
            console.error("Error syncing cart:", err);
            // Fallback to local data if fetch fails
            cart = localCart;
            showNotification("Could not verify latest prices. Using offline data.", true);
        }

        displayCartItems();
        updateCartSummary();
        updateCartCount();
    }

    // Add checkout button functionality
    const checkoutBtn = document.querySelector('.checkout-btn');
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', () => {
            if (cart.length === 0) {
                alert('Your cart is empty!');
                return;
            }
            window.location.href = 'checkout.html';
        });
    }

    // Display cart items
    function displayCartItems() {
        const cartItems = document.querySelector('.cart-items');
        const emptyCart = document.querySelector('.empty-cart');
        const cartSummary = document.querySelector('.cart-summary');

        if (cart.length === 0) {
            if (emptyCart) emptyCart.style.display = 'block';
            if (cartItems) cartItems.style.display = 'none';
            if (cartSummary) cartSummary.style.display = 'none';
            return;
        }

        if (emptyCart) emptyCart.style.display = 'none';
        if (cartItems) cartItems.style.display = 'block';
        if (cartSummary) cartSummary.style.display = 'block';

        if (cartItems) {
            cartItems.innerHTML = '';
            cart.forEach((item, index) => {
                const cartItem = document.createElement('div');
                cartItem.className = 'cart-item';
                cartItem.innerHTML = `
                    <img src="${item.image}" alt="${item.name}" class="item-image" onerror="this.src='assets/placeholder.png'">
                    <div class="cart-item-details">
                        <div class="cart-item-title">${item.name}</div>
                        <div class="cart-item-price">$${item.price.toFixed(2)}</div>
                        <div class="quantity-control">
                            <button class="quantity-btn minus" data-index="${index}">-</button>
                            <input type="number" class="quantity-input" value="${item.quantity}" min="1" readonly>
                            <button class="quantity-btn plus" data-index="${index}">+</button>
                        </div>
                    </div>
                    <button class="remove-item" data-index="${index}">
                        <i class="fa fa-trash"></i>
                    </button>
                `;
                cartItems.appendChild(cartItem);
            });

            // Add event listeners for quantity buttons
            document.querySelectorAll('.quantity-btn').forEach(button => {
                button.addEventListener('click', function () {
                    const index = parseInt(this.dataset.index);
                    if (this.classList.contains('minus')) {
                        updateQuantity(index, -1);
                    } else {
                        updateQuantity(index, 1);
                    }
                });
            });

            // Add event listeners for remove buttons
            document.querySelectorAll('.remove-item').forEach(button => {
                button.addEventListener('click', function () {
                    const index = parseInt(this.dataset.index);
                    removeItem(index);
                });
            });
        }
    }

    // Update quantity
    function updateQuantity(index, change) {
        if (!cart[index]) return;

        cart[index].quantity += change;
        if (cart[index].quantity < 1) {
            cart[index].quantity = 1;
        }
        localStorage.setItem('cart', JSON.stringify(cart));
        displayCartItems(); // Re-render to update inputs
        updateCartSummary();
        updateCartCount();
    }

    // Remove item from cart
    function removeItem(index) {
        cart.splice(index, 1);
        localStorage.setItem('cart', JSON.stringify(cart));
        displayCartItems();
        updateCartSummary();
        updateCartCount();
    }

    // Update cart summary
    function updateCartSummary() {
        const subtotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
        const shipping = subtotal > 50 ? 0 : (subtotal === 0 ? 0 : 5);
        const total = subtotal + shipping;

        const subtotalElement = document.querySelector('.subtotal');
        const shippingElement = document.querySelector('.shipping');
        const totalElement = document.querySelector('.total-amount');

        if (subtotalElement) subtotalElement.textContent = `$${subtotal.toFixed(2)}`;
        if (shippingElement) shippingElement.textContent = shipping === 0 ? 'Free' : `$${shipping.toFixed(2)}`;
        if (totalElement) totalElement.textContent = `$${total.toFixed(2)}`;
    }

    // Update cart count in header
    function updateCartCount() {
        const cartCount = document.querySelector('.cart-count');
        if (cartCount) {
            const totalItems = cart.reduce((total, item) => total + item.quantity, 0);
            cartCount.textContent = totalItems > 0 ? `(${totalItems})` : '';
            cartCount.style.display = totalItems > 0 ? 'inline' : 'none';
        }
    }

    function showNotification(message, isError = false) {
        const existing = document.querySelector('.notification');
        if (existing) existing.remove();

        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = message;
        document.body.appendChild(notification);

        Object.assign(notification.style, {
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            background: isError ? '#dc3545' : '#28a745',
            color: 'white',
            padding: '12px 24px',
            borderRadius: '8px',
            zIndex: '9999',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            fontSize: '1rem',
            opacity: '0',
            transform: 'translateY(20px)',
            transition: 'all 0.3s ease'
        });

        requestAnimationFrame(() => {
            notification.style.opacity = '1';
            notification.style.transform = 'translateY(0)';
        });

        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateY(20px)';
            setTimeout(() => {
                if (notification.parentNode) notification.parentNode.removeChild(notification);
            }, 300);
        }, 3000);
    }

    // Start sync
    await syncCartWithDB();
});
