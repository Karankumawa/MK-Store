// ==========================================
// M.K. STORE — Checkout Logic (Protected, User-Scoped)
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
    // 1. Strict Auth Check
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || 'null');

    if (!token || !user) {
        if (window.showToast) {
            window.showToast('Please sign in to access checkout.', 'warning');
        } else {
            alert('Please sign in to access checkout.');
        }
        window.location.href = 'login.html?redirect=checkout.html';
        return;
    }

    // 2. Pre-fill from User Profile Data
    if (user.username) document.getElementById('chk-name').value = user.username;
    if (user.address) document.getElementById('chk-address').value = user.address;
    if (user.city) document.getElementById('chk-city').value = user.city;
    if (user.zip) document.getElementById('chk-zip').value = user.zip;
    if (user.phone) document.getElementById('chk-phone').value = user.phone;

    // 3. Load user's isolated cart
    loadCheckoutCart();

    // 4. Place order event listener
    const placeOrderBtn = document.getElementById('place-order-btn');
    if (placeOrderBtn) {
        placeOrderBtn.addEventListener('click', handlePlaceOrder);
    }
});

function getCheckoutCart() {
    if (window.UserCart) {
        return window.UserCart.getCart();
    }
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const key = user.id ? `mkstore_cart_${user.id}` : 'cart';
    return JSON.parse(localStorage.getItem(key)) || [];
}

function loadCheckoutCart() {
    const cart = getCheckoutCart();
    const container = document.getElementById('checkout-items');
    const subtotalEl = document.getElementById('checkout-subtotal');
    const shippingEl = document.getElementById('checkout-shipping');
    const totalEl = document.getElementById('checkout-total');
    let subtotal = 0;

    if (!cart || cart.length === 0) {
        alert('Your cart is empty. Please add items before checking out.');
        window.location.href = 'shop.html';
        return;
    }

    if (container) {
        container.innerHTML = cart.map(item => {
            const itemTotal = ((parseFloat(item.price) || 0) * (item.quantity || 1));
            subtotal += itemTotal;
            return `
                <div class="order-summary-item" style="align-items:center; gap:12px; padding:8px 0; border-bottom:1px solid #f1f5f9;">
                    <img src="${item.image || 'assets/placeholder.png'}" alt="${item.name}" style="width:48px;height:48px;object-fit:cover;border-radius:8px;border:1px solid #e2e8f0;" onerror="this.src='assets/placeholder.png'">
                    <div style="flex-grow:1;">
                        <div style="font-weight:600; color:#0f172a; font-size:0.95rem;">${item.name}</div>
                        <small style="color:#64748b;">Qty: ${item.quantity || 1} &times; $${(parseFloat(item.price) || 0).toFixed(2)}</small>
                    </div>
                    <span style="font-weight:700; color:#0f172a;">$${itemTotal.toFixed(2)}</span>
                </div>
            `;
        }).join('');
    }

    const shipping = subtotal > 50 ? 0 : 5;
    const total = subtotal + shipping;

    if (subtotalEl) subtotalEl.textContent = `$${subtotal.toFixed(2)}`;
    if (shippingEl) shippingEl.textContent = shipping === 0 ? 'FREE' : `$${shipping.toFixed(2)}`;
    if (totalEl) totalEl.textContent = `$${total.toFixed(2)}`;
}

function handlePlaceOrder() {
    const btn = document.getElementById('place-order-btn');
    const requiredIds = ['chk-name', 'chk-address', 'chk-city', 'chk-zip', 'chk-phone'];
    let isValid = true;

    // Validation
    requiredIds.forEach(id => {
        const input = document.getElementById(id);
        if (!input || !input.value.trim()) {
            if (input) input.style.borderColor = '#ef4444';
            isValid = false;
        } else {
            if (input) input.style.borderColor = '#cbd5e1';
        }
    });

    if (!isValid) {
        if (window.showToast) {
            window.showToast('Please fill in all required shipping details.', 'error');
        } else {
            alert('Please fill in all shipping details.');
        }
        return;
    }

    const cart = getCheckoutCart();
    if (!cart || cart.length === 0) {
        alert('Your cart is empty.');
        window.location.href = 'shop.html';
        return;
    }

    const subtotal = cart.reduce((sum, item) => sum + ((parseFloat(item.price) || 0) * (item.quantity || 1)), 0);
    const shipping = subtotal > 50 ? 0 : 5;
    const total = parseFloat((subtotal + shipping).toFixed(2));

    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Securing Order...';
    btn.disabled = true;

    const shippingDetails = {
        name: document.getElementById('chk-name').value.trim(),
        address: document.getElementById('chk-address').value.trim(),
        city: document.getElementById('chk-city').value.trim(),
        zip: document.getElementById('chk-zip').value.trim(),
        phone: document.getElementById('chk-phone').value.trim()
    };

    const token = localStorage.getItem('token');

    fetch('/api/orders', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-auth-token': token
        },
        body: JSON.stringify({ items: cart, totalAmount: total, shippingDetails })
    })
        .then(async res => {
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.msg || 'Order creation failed');
            }
            return data;
        })
        .then(data => {
            // Success
            if (window.UserCart) {
                window.UserCart.clearCart();
            } else {
                const user = JSON.parse(localStorage.getItem('user') || '{}');
                if (user.id) localStorage.removeItem(`mkstore_cart_${user.id}`);
            }

            if (window.updateCartCount) window.updateCartCount();

            // Show Success Modal
            const user = JSON.parse(localStorage.getItem('user')) || {};
            const emailEl = document.getElementById('success-email');
            const orderIdEl = document.getElementById('success-order-id');
            const modalEl = document.getElementById('success-modal');

            if (emailEl) emailEl.textContent = user.email || shippingDetails.name || 'your email';
            if (orderIdEl) orderIdEl.textContent = data._id || data.id;
            if (modalEl) modalEl.style.display = 'flex';
        })
        .catch(err => {
            console.error('Order error:', err);
            if (window.showToast) {
                window.showToast(`Order failed: ${err.message}`, 'error');
            } else {
                alert(`Order failed: ${err.message}`);
            }
            btn.disabled = false;
            btn.innerHTML = 'Pay & Place Order';
        });
}
