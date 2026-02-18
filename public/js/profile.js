document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('token');

    if (!token) {
        showLoginPrompt();
        return;
    }

    try {
        // Fetch user data from backend
        const res = await fetch('/api/auth/me', {
            headers: { 'x-auth-token': token }
        });

        let userData;
        if (res.ok) {
            userData = await res.json();
        } else {
            console.warn('Failed to fetch profile, using local data if available');
            userData = {};
        }

        // Load saved shipping info if available locally (fallback/merge)
        const savedUser = JSON.parse(localStorage.getItem('user')) || {};

        // Merge backend data with local overrides (backend takes precedence for profile fields)
        const fullProfile = { ...savedUser, ...userData };

        renderProfile(fullProfile);

        // Save Handling
        const shippingForm = document.getElementById('shipping-form');
        if (shippingForm) {
            shippingForm.addEventListener('submit', async (e) => {
                e.preventDefault();

                const updatedFields = {
                    address: document.getElementById('address').value,
                    city: document.getElementById('city').value,
                    zip: document.getElementById('zip').value,
                    phone: document.getElementById('phone').value
                };

                // Optimistic UI Update
                const updatedProfile = { ...fullProfile, ...updatedFields };
                renderProfile(updatedProfile);

                try {
                    // Send update to backend
                    const updateRes = await fetch('/api/auth/me', {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                            'x-auth-token': token
                        },
                        body: JSON.stringify(updatedFields)
                    });

                    if (updateRes.ok) {
                        const savedData = await updateRes.json();
                        localStorage.setItem('user', JSON.stringify(savedData));
                        alert('Profile details saved successfully!');
                    } else {
                        throw new Error('Failed to save to server');
                    }
                } catch (error) {
                    console.error('Save error:', error);
                    alert('Failed to save profile. Please try again.');
                }
            });
        }

    } catch (err) {
        console.error(err);
        showLoginPrompt();
    }
});

function showLoginPrompt() {
    const loading = document.getElementById('loading-profile');
    const content = document.getElementById('profile-content');
    const prompt = document.getElementById('login-prompt');

    if (loading) loading.style.display = 'none';
    if (content) content.style.display = 'none';
    if (prompt) prompt.style.display = 'block';
}

function renderProfile(user) {
    document.getElementById('loading-profile').style.display = 'none';
    document.getElementById('profile-content').style.display = 'grid'; // Use grid for dashboard

    // Sidebar Updates
    const sidebarName = document.getElementById('user-name-sidebar');
    if (sidebarName) sidebarName.textContent = user.username || 'User';

    // Avatar
    const avatarSmall = document.getElementById('user-avatar-small');
    if (avatarSmall) {
        if (user.profilePicture) {
            avatarSmall.innerHTML = `<img src="${user.profilePicture}" alt="Avatar">`;
            avatarSmall.style.backgroundColor = 'transparent';
        } else {
            const initial = (user.username || 'U')[0].toUpperCase();
            avatarSmall.textContent = initial;
            avatarSmall.style.backgroundColor = 'var(--brand)';
        }
    }

    // Main Content Updates
    const infoName = document.getElementById('info-name');
    if (infoName) infoName.textContent = user.username || 'Valued Customer';

    const infoEmail = document.getElementById('info-email');
    if (infoEmail) infoEmail.textContent = user.email || 'No email provided';

    // Pre-fill Forms
    if (user.address) document.getElementById('address').value = user.address;
    if (user.city) document.getElementById('city').value = user.city;
    if (user.zip) document.getElementById('zip').value = user.zip;
    if (user.phone) document.getElementById('phone').value = user.phone;

    // Render Orders
    renderOrders();
}

// Render Orders from Backend
async function renderOrders() {
    const ordersContainer = document.getElementById('recent-orders-list');
    if (!ordersContainer) return;

    ordersContainer.innerHTML = '<p style="text-align:center; padding:1rem;">Loading orders...</p>';

    try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const res = await fetch('/api/orders/myorders', {
            headers: { 'x-auth-token': token }
        });

        if (!res.ok) throw new Error('Failed to fetch orders');

        const orders = await res.json();

        if (orders.length === 0) {
            ordersContainer.innerHTML = `
                <div class="info-card" style="text-align:center; padding:3rem; color:var(--text-muted);">
                    <i class="fa fa-box-open" style="font-size:2rem; margin-bottom:1rem; display:block;"></i>
                    No recent orders found.
                </div>`;
            return;
        }

        ordersContainer.innerHTML = orders.map(order => `
            <div class="info-card" style="margin-bottom:1rem; border-left: 5px solid ${getStatusColor(order.status)};">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                    <div>
                        <strong>Order #${order._id.slice(-6).toUpperCase()}</strong> <br>
                        <small style="color:var(--text-muted);">${new Date(order.date).toLocaleDateString()}</small>
                    </div>
                    <div>
                        <span style="padding: 4px 10px; border-radius: 12px; font-size: 0.85rem; background: ${getStatusBg(order.status)}; color: ${getStatusTextColor(order.status)}; font-weight: 600;">
                            ${order.status}
                        </span>
                    </div>
                </div>
                
                <div style="margin-bottom: 10px; border-top:1px solid #eee; border-bottom:1px solid #eee; padding:10px 0;">
                    ${order.items.map(item => `
                        <div style="display: flex; gap: 10px; margin-bottom: 5px; align-items:center;">
                            <img src="${item.image || 'https://via.placeholder.com/40'}" alt="${item.name}" style="width: 40px; height: 40px; object-fit: cover; border-radius: 4px;">
                            <div style="flex-grow:1;">
                                <div style="font-size:0.9rem;">${item.name}</div>
                                <small style="color:var(--text-muted);">x${item.quantity}</small>
                            </div>
                            <div style="font-weight:600;">₹${item.price}</div>
                        </div>
                    `).join('')}
                </div>

                <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 5px;">
                    <div style="font-size: 1.1rem; font-weight: 700; color: var(--brand);">
                        Total: ₹${order.totalAmount}
                    </div>
                    ${order.status === 'Processing' ? `
                        <button onclick="cancelOrder('${order._id}')" style="background: #ef4444; color: white; border: none; padding: 6px 14px; border-radius: 6px; cursor: pointer; font-size: 0.9em; font-weight: 600; transition: 0.2s;">
                            Cancel Order
                        </button>
                    ` : ''}
                </div>
            </div>
        `).join('');

    } catch (err) {
        console.error(err);
        ordersContainer.innerHTML = '<p style="color:red; text-align:center;">Error loading orders.</p>';
    }
}

function getStatusColor(status) {
    switch (status) {
        case 'Processing': return '#eab308'; // Yellow
        case 'Shipped': return '#3b82f6';    // Blue
        case 'Delivered': return '#22c55e';  // Green
        case 'Cancelled': return '#ef4444';  // Red
        default: return '#9ca3af';
    }
}

function getStatusBg(status) {
    switch (status) {
        case 'Processing': return '#fef9c3';
        case 'Shipped': return '#dbeafe';
        case 'Delivered': return '#dcfce7';
        case 'Cancelled': return '#fee2e2';
        default: return '#f3f4f6';
    }
}

function getStatusTextColor(status) {
    switch (status) {
        case 'Processing': return '#854d0e';
        case 'Shipped': return '#1e40af';
        case 'Delivered': return '#166534';
        case 'Cancelled': return '#991b1b';
        default: return '#374151';
    }
}

async function cancelOrder(orderId) {
    if (!confirm('Are you sure you want to cancel this order?')) return;

    try {
        const token = localStorage.getItem('token');
        const res = await fetch(`/api/orders/${orderId}/cancel`, {
            method: 'PUT',
            headers: { 'x-auth-token': token }
        });

        const data = await res.json();

        if (res.ok) {
            alert('Order cancelled successfully');
            renderOrders(); // Refresh list
        } else {
            alert(data.msg || 'Failed to cancel order');
        }
    } catch (err) {
        console.error(err);
        alert('Error cancelling order');
    }
}

// Tab Switching Logic
function switchTab(tabName) {
    // Hide all contents
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    // Deactivate all nav items
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));

    // Show target
    const target = document.getElementById(`tab-${tabName}`);
    if (target) target.classList.add('active');

    // Activate nav item
    const navItem = Array.from(document.querySelectorAll('.nav-item')).find(el => el.getAttribute('onclick')?.includes(tabName));
    if (navItem) navItem.classList.add('active');
}

// Make globally available
window.switchTab = switchTab;
window.cancelOrder = cancelOrder;

// Logout
const logoutBtn = document.getElementById('logout-btn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user'); // if we stored it
        window.location.href = 'login.html';
    });
}
