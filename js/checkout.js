document.addEventListener('DOMContentLoaded', () => {
    // 1. Check Auth
    const token = localStorage.getItem('token');
    if (!token) {
        alert('Please log in to checkout.');
        window.location.href = 'login.html';
        return;
    }

    // 2. Load User Info for Pre-fill
    const user = JSON.parse(localStorage.getItem('user')) || {};
    if (user.username) document.getElementById('chk-name').value = user.username;
    if (user.address) document.getElementById('chk-address').value = user.address;
    if (user.city) document.getElementById('chk-city').value = user.city;
    if (user.zip) document.getElementById('chk-zip').value = user.zip;
    if (user.phone) document.getElementById('chk-phone').value = user.phone;

    // 3. Load Cart
    loadCheckoutCart();

    // 4. Handle Place Order
    document.getElementById('place-order-btn').addEventListener('click', handlePlaceOrder);
});

function loadCheckoutCart() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const container = document.getElementById('checkout-items');
    const totalEl = document.getElementById('checkout-total');
    let total = 0;

    if (cart.length === 0) {
        alert('Your cart is empty.');
        window.location.href = 'shop.html';
        return;
    }

    container.innerHTML = cart.map(item => {
        const itemTotal = item.price * item.quantity;
        total += itemTotal;
        return `
            <div class="order-summary-item">
                <span>${item.quantity}x ${item.name}</span>
                <span>$${itemTotal.toFixed(2)}</span>
            </div>
        `;
    }).join('');

    totalEl.textContent = `$${total.toFixed(2)}`;
}

function handlePlaceOrder() {
    const btn = document.getElementById('place-order-btn');
    const requiredIds = ['chk-name', 'chk-address', 'chk-city', 'chk-zip', 'chk-phone'];
    let isValid = true;

    // Basic Validation
    requiredIds.forEach(id => {
        const input = document.getElementById(id);
        if (!input.value.trim()) {
            input.style.borderColor = 'red';
            isValid = false;
        } else {
            input.style.borderColor = 'var(--border)';
        }
    });

    if (!isValid) {
        alert('Please fill in all shipping details.');
        return;
    }

    // Simulate Processing
    btn.innerHTML = '<i class="fa fa-spinner fa-spin"></i> Processing...';
    btn.disabled = true;

    setTimeout(() => {
        // Success Logic
        const cart = JSON.parse(localStorage.getItem('cart')) || [];
        const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2);
        const orderId = Math.random().toString(36).substr(2, 9).toUpperCase();

        // Save Order to History
        const orders = JSON.parse(localStorage.getItem('orders')) || [];
        orders.unshift({
            id: orderId,
            date: new Date().toISOString(),
            total: total,
            status: 'Processing',
            items: cart
        });
        localStorage.setItem('orders', JSON.stringify(orders));

        // Clear Cart
        localStorage.removeItem('cart');

        // Show Success Modal
        const user = JSON.parse(localStorage.getItem('user')) || {};
        document.getElementById('success-email').textContent = user.email || 'your email';
        document.getElementById('success-order-id').textContent = orderId;
        document.getElementById('success-modal').style.display = 'flex';

        // Confetti effect or sound could go here
    }, 2000); // 2s simulated delay
}
