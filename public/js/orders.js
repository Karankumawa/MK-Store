// ==========================================
// M.K. STORE — Dedicated Orders History & Tracking
// ==========================================

document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('token');

    if (!token) {
        showOrdersLoginPrompt();
        return;
    }

    try {
        // Fetch current user details
        const meRes = await fetch('/api/auth/me', {
            headers: { 'x-auth-token': token }
        });

        if (meRes.ok) {
            const user = await meRes.json();
            renderOrdersSidebar(user);
        } else {
            const localUser = JSON.parse(localStorage.getItem('user')) || {};
            renderOrdersSidebar(localUser);
        }

        // Fetch user's orders
        await loadUserOrders();

    } catch (err) {
        console.error('Error initializing orders page:', err);
        showOrdersLoginPrompt();
    }
});

function showOrdersLoginPrompt() {
    const loading = document.getElementById('loading-orders');
    const content = document.getElementById('orders-content');
    const prompt = document.getElementById('orders-login-prompt');

    if (loading) loading.style.display = 'none';
    if (content) content.style.display = 'none';
    if (prompt) prompt.style.display = 'block';
}

function renderOrdersSidebar(user) {
    const userNameEl = document.getElementById('orders-user-name');
    if (userNameEl) userNameEl.textContent = user.username || 'Valued Customer';

    const avatarEl = document.getElementById('orders-user-avatar');
    if (avatarEl) {
        if (user.profilePicture) {
            avatarEl.innerHTML = `<img src="${user.profilePicture}" alt="Avatar" onerror="this.src='assets/placeholder.png'">`;
            avatarEl.style.backgroundColor = 'transparent';
        } else {
            const initial = (user.username || 'U')[0].toUpperCase();
            avatarEl.textContent = initial;
            avatarEl.style.backgroundColor = '#4f46e5';
        }
    }

    const roleBadge = document.getElementById('orders-role-badge');
    if (roleBadge) {
        if (user.role === 'admin') {
            roleBadge.textContent = 'Admin';
            roleBadge.style.background = '#fef3c7';
            roleBadge.style.color = '#92400e';

            // Add Admin link to sidebar if not present
            if (!document.getElementById('orders-admin-link')) {
                const adminBtn = document.createElement('a');
                adminBtn.id = 'orders-admin-link';
                adminBtn.href = 'admin.html';
                adminBtn.className = 'profile-nav-link';
                adminBtn.style.color = '#d97706';
                adminBtn.style.fontWeight = '700';
                adminBtn.innerHTML = '<i class="fa fa-shield-halved"></i> Admin Panel';
                const navStack = document.querySelector('.orders-sidebar-card .sidebar-nav-stack');
                const logoutBtn = navStack?.querySelector('.logout-btn');
                if (navStack && logoutBtn) {
                    navStack.insertBefore(adminBtn, logoutBtn);
                }
            }
        } else {
            roleBadge.textContent = 'Customer';
        }
    }
}

async function loadUserOrders() {
    const loadingEl = document.getElementById('loading-orders');
    const contentEl = document.getElementById('orders-content');
    const container = document.getElementById('orders-list-container');
    const token = localStorage.getItem('token');

    if (!container || !token) return;

    try {
        const res = await fetch('/api/orders/myorders', {
            headers: { 'x-auth-token': token }
        });

        if (!res.ok) throw new Error(`Orders fetch returned ${res.status}`);

        const orders = await res.json();

        if (loadingEl) loadingEl.style.display = 'none';
        if (contentEl) contentEl.style.display = 'grid';

        if (!Array.isArray(orders) || orders.length === 0) {
            container.innerHTML = `
                <div class="empty-orders-card">
                    <div class="empty-icon-box">
                        <i class="fa-solid fa-box-open"></i>
                    </div>
                    <h2>No Orders Found</h2>
                    <p>You haven't placed any orders yet. Discover our curated collection of organic groceries, smartphones, electronics, and designer fashion!</p>
                    <a href="shop.html" class="mk-btn-primary" style="display:inline-flex; align-items:center; gap:8px;">
                        <i class="fa-solid fa-compass"></i> Explore Store Catalog
                    </a>
                </div>
            `;
            return;
        }

        container.innerHTML = orders.map(order => {
            const orderIdShort = (order._id || order.id || 'ORDER').slice(-6).toUpperCase();
            const orderDateStr = order.date ? new Date(order.date).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            }) : 'Recent Order';

            const status = order.status || 'Processing';
            const statusClass = `status-${status.toLowerCase()}`;

            let statusIcon = 'fa-clock';
            if (status === 'Shipped') statusIcon = 'fa-truck-fast';
            if (status === 'Delivered') statusIcon = 'fa-circle-check';
            if (status === 'Cancelled') statusIcon = 'fa-circle-xmark';

            const items = Array.isArray(order.items) ? order.items : [];
            const ship = order.shippingDetails || {};
            const destinationStr = [ship.address, ship.city, ship.zip].filter(Boolean).join(', ') || 'Saved Delivery Address';

            const grandTotal = Number(order.totalAmount || 0).toFixed(2);

            return `
            <div class="order-card" id="order-card-${order._id}">
                <div class="order-card-header">
                    <div class="order-meta-info">
                        <div class="meta-col">
                            <small>Order Number</small>
                            <span>#MK-${orderIdShort}</span>
                        </div>
                        <div class="meta-col">
                            <small>Placed On</small>
                            <span>${orderDateStr}</span>
                        </div>
                        <div class="meta-col">
                            <small>Total Amount</small>
                            <span style="color:#4f46e5; font-size:1.05rem;">$${grandTotal}</span>
                        </div>
                    </div>
                    <div>
                        <span class="order-status-pill ${statusClass}">
                            <i class="fa-solid ${statusIcon}"></i> ${status}
                        </span>
                    </div>
                </div>

                <div class="order-items-stack">
                    ${items.map(item => {
                        const price = Number(item.price || 0).toFixed(2);
                        const qty = item.quantity || 1;
                        const sub = (Number(item.price || 0) * qty).toFixed(2);
                        const img = item.image || 'assets/placeholder.png';
                        const pId = item._id || item.id;

                        return `
                        <div class="order-item-row">
                            <img src="${img}" alt="${item.name}" class="order-item-thumb" onerror="this.src='assets/placeholder.png'">
                            <div class="order-item-details">
                                <a href="product.html?id=${pId}" class="order-item-title">${item.name}</a>
                                <div class="order-item-meta">
                                    <span>Quantity: <b>${qty}</b></span> &bull; <span>Price: $${price}</span>
                                </div>
                            </div>
                            <div class="order-item-price">
                                <div>$${sub}</div>
                                <button class="btn-reorder" style="padding:4px 10px; font-size:0.75rem; margin-top:4px;" onclick="reorderItem('${pId}', '${encodeURIComponent(item.name)}', ${item.price}, '${img}')">
                                    <i class="fa fa-cart-plus"></i> Buy Again
                                </button>
                            </div>
                        </div>
                        `;
                    }).join('')}
                </div>

                <div class="order-card-footer">
                    <div class="shipping-destination">
                        <i class="fa-solid fa-location-dot" style="color:#4f46e5;"></i>
                        <span><b>Ship to:</b> ${ship.name || 'Recipient'} (${destinationStr})</span>
                    </div>
                    <div class="order-actions-group">
                        ${status === 'Processing' ? `
                            <button class="btn-cancel-order" onclick="cancelOrderAction('${order._id}')">
                                <i class="fa-solid fa-ban"></i> Cancel Order
                            </button>
                        ` : ''}
                        <a href="contact.html?orderId=${order._id}" class="profile-nav-link" style="padding:6px 12px; font-size:0.85rem; width:auto; border:1px solid #e2e8f0; border-radius:8px;">
                            <i class="fa-solid fa-headset"></i> Support
                        </a>
                    </div>
                </div>
            </div>
            `;
        }).join('');

    } catch (err) {
        console.error('Error rendering orders:', err);
        if (loadingEl) loadingEl.style.display = 'none';
        if (contentEl) contentEl.style.display = 'grid';
        container.innerHTML = '<p style="color:#ef4444; text-align:center; padding:2rem;">Failed to load order history. Please check your network and refresh.</p>';
    }
}

async function cancelOrderAction(orderId) {
    if (!confirm('Are you sure you want to cancel this order?')) return;

    try {
        const token = localStorage.getItem('token');
        const res = await fetch(`/api/orders/${orderId}/cancel`, {
            method: 'PUT',
            headers: { 'x-auth-token': token }
        });

        const data = await res.json();

        if (res.ok) {
            if (window.showToast) {
                window.showToast('Order has been cancelled.', 'info');
            } else {
                alert('Order has been cancelled.');
            }
            loadUserOrders(); // Reload orders list
        } else {
            alert(data.msg || 'Unable to cancel order.');
        }
    } catch (err) {
        console.error('Cancellation error:', err);
        alert('Server error while cancelling order.');
    }
}

function reorderItem(productId, name, price, image) {
    if (window.UserCart) {
        window.UserCart.addItem({
            _id: productId,
            name: decodeURIComponent(name),
            price: price,
            image: image
        }, 1);
    }
}

window.cancelOrderAction = cancelOrderAction;
window.reorderItem = reorderItem;
