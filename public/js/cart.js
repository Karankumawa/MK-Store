// ==========================================
// M.K. STORE — Shopping Cart (User Dataspace Isolated)
// ==========================================

document.addEventListener('DOMContentLoaded', async function () {
    const cartContainer = document.querySelector('.cart-container');
    const cartContent = document.querySelector('.cart-content');
    const emptyCart = document.querySelector('.empty-cart');
    const cartItemsWrapper = document.querySelector('.cart-items');
    const checkoutBtn = document.querySelector('.checkout-btn');

    // 1. Check if user is logged in
    if (!window.UserAuth || !window.UserAuth.isLoggedIn()) {
        renderGuestGuard();
        return;
    }

    // 2. Logged-in user: Render their isolated cart
    await syncAndDisplayCart();

    // 3. Checkout button handler
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', () => {
            const currentCart = window.UserCart ? window.UserCart.getCart() : [];
            if (currentCart.length === 0) {
                alert('Your cart is empty! Add products before checking out.');
                window.location.href = 'shop.html';
                return;
            }
            window.location.href = 'checkout.html';
        });
    }

    function renderGuestGuard() {
        if (cartContent) cartContent.style.display = 'none';
        if (emptyCart) emptyCart.style.display = 'none';

        let guard = document.getElementById('cart-guest-guard-box');
        if (!guard) {
            guard = document.createElement('div');
            guard.id = 'cart-guest-guard-box';
            guard.className = 'cart-guest-guard';
            guard.innerHTML = `
                <div class="cart-guest-icon">
                    <i class="fa-solid fa-shield-halved"></i>
                </div>
                <h2>Sign In Required to View Cart</h2>
                <p>
                    Guests can browse and view all products freely. In M.K. Store, your shopping cart, orders, and saved addresses are strictly isolated to your own secure user space (UID).
                </p>
                <div class="cart-guest-actions">
                    <a href="login.html?redirect=cart.html" class="mk-btn-primary">
                        <i class="fa-solid fa-arrow-right-to-bracket"></i> Sign In to Account
                    </a>
                    <a href="register.html?redirect=cart.html" class="mk-btn-secondary">
                        <i class="fa-solid fa-user-plus"></i> Create New Account
                    </a>
                    <a href="shop.html" class="mk-btn-secondary">
                        <i class="fa-solid fa-compass"></i> Explore Store
                    </a>
                </div>
            `;
            if (cartContainer) {
                cartContainer.appendChild(guard);
            }
        }
    }

    async function syncAndDisplayCart() {
        let cart = window.UserCart ? window.UserCart.getCart() : [];

        if (cart.length === 0) {
            if (emptyCart) emptyCart.style.display = 'block';
            if (cartContent) cartContent.style.display = 'none';
            if (window.updateCartCount) window.updateCartCount();
            return;
        }

        if (cartItemsWrapper) {
            cartItemsWrapper.innerHTML = '<div class="loading-spinner"><i class="fa fa-spinner fa-spin"></i> Checking live prices & inventory...</div>';
        }

        try {
            // Validate prices against live database
            const res = await fetch('/api/products');
            if (res.ok) {
                const liveProducts = await res.json();
                let updated = false;

                const validCart = [];
                cart.forEach(item => {
                    const itemId = item._id || item.id;
                    const live = liveProducts.find(p => (p._id || p.id) === itemId);
                    if (live) {
                        if (live.price !== item.price || live.name !== item.name) {
                            updated = true;
                        }
                        validCart.push({
                            _id: live._id || live.id,
                            name: live.name,
                            price: live.price,
                            image: live.image || item.image || 'assets/placeholder.png',
                            category: live.category || 'General',
                            quantity: item.quantity || 1
                        });
                    } else {
                        // Product removed from store
                        updated = true;
                    }
                });

                cart = validCart;
                if (updated && window.UserCart) {
                    window.UserCart.saveCart(cart);
                }
            }
        } catch (e) {
            console.debug('Using cached cart items:', e);
        }

        renderCartItems(cart);
    }

    function renderCartItems(cart) {
        if (!cart || cart.length === 0) {
            if (emptyCart) emptyCart.style.display = 'block';
            if (cartContent) cartContent.style.display = 'none';
            if (window.updateCartCount) window.updateCartCount();
            return;
        }

        if (emptyCart) emptyCart.style.display = 'none';
        if (cartContent) cartContent.style.display = 'grid';

        if (cartItemsWrapper) {
            cartItemsWrapper.innerHTML = cart.map((item, idx) => {
                const itemTotal = ((parseFloat(item.price) || 0) * (item.quantity || 1)).toFixed(2);
                return `
                    <div class="cart-item" data-id="${item._id || item.id}">
                        <img src="${item.image || 'assets/placeholder.png'}" alt="${item.name}" class="item-image" onerror="this.src='assets/placeholder.png'">
                        <div class="cart-item-details">
                            <div class="cart-item-title">${item.name}</div>
                            <div class="cart-item-price">$${(parseFloat(item.price) || 0).toFixed(2)} each <span style="color:#64748b; font-size:0.85rem;">(Total: $${itemTotal})</span></div>
                            <div class="quantity-control">
                                <button class="quantity-btn minus" data-id="${item._id || item.id}" onclick="changeItemQty('${item._id || item.id}', -1)">-</button>
                                <input type="number" class="quantity-input" value="${item.quantity || 1}" min="1" readonly>
                                <button class="quantity-btn plus" data-id="${item._id || item.id}" onclick="changeItemQty('${item._id || item.id}', 1)">+</button>
                            </div>
                        </div>
                        <button class="remove-item" onclick="deleteItem('${item._id || item.id}')" title="Remove from cart">
                            <i class="fa-solid fa-trash-can"></i>
                        </button>
                    </div>
                `;
            }).join('');
        }

        updateSummary(cart);
    }

    function updateSummary(cart) {
        const subtotal = cart.reduce((sum, item) => sum + ((parseFloat(item.price) || 0) * (item.quantity || 1)), 0);
        const shipping = subtotal > 50 ? 0 : (subtotal === 0 ? 0 : 5);
        const total = subtotal + shipping;

        const subtotalEl = document.querySelector('.subtotal');
        const shippingEl = document.querySelector('.shipping');
        const totalEl = document.querySelector('.total-amount');

        if (subtotalEl) subtotalEl.textContent = `$${subtotal.toFixed(2)}`;
        if (shippingEl) shippingEl.textContent = shipping === 0 ? 'FREE (Over $50)' : `$${shipping.toFixed(2)}`;
        if (totalEl) totalEl.textContent = `$${total.toFixed(2)}`;
    }

    window.changeItemQty = function (productId, delta) {
        if (!window.UserCart) return;
        const cart = window.UserCart.getCart();
        const item = cart.find(i => (i._id || i.id) === productId);
        if (item) {
            const newQty = (item.quantity || 1) + delta;
            if (newQty <= 0) {
                window.UserCart.removeItem(productId);
            } else {
                window.UserCart.updateQty(productId, newQty);
            }
            renderCartItems(window.UserCart.getCart());
        }
    };

    window.deleteItem = function (productId) {
        if (!window.UserCart) return;
        window.UserCart.removeItem(productId);
        renderCartItems(window.UserCart.getCart());
    };
});
