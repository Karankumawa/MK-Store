document.addEventListener('DOMContentLoaded', () => {
    // Auth Check
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    if (!token || user.role !== 'admin') {
        window.location.href = 'login.html';
        return;
    }

    // Set Welcome Msg
    const welcome = document.querySelector('.welcome-text');
    if (welcome) welcome.textContent = `Welcome, ${user.username}`;

    // Sidebar toggle (if exists)
    // ...

    // Content Loading
    loadDashboard();

    // Event Listeners for Nav
    document.querySelectorAll('.admin-nav a').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            document.querySelectorAll('.admin-nav a').forEach(l => l.classList.remove('active'));
            link.classList.add('active');

            const section = link.getAttribute('href').substring(1); // #products -> products
            loadSection(section);
        });
    });

    // Logout
    document.getElementById('logoutBtn')?.addEventListener('click', () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = 'login.html';
    });
});

async function loadDashboard() {
    const dynamicContent = document.getElementById('dynamic-content');
    dynamicContent.innerHTML = `
        <div class="page-header">
            <h2>Dashboard Overview</h2>
        </div>
        <div class="dashboard-stats">
             <div class="stat-card">
                <div class="stat-card-header">
                    <h3>Total Products</h3>
                    <div class="icon-box"><i class="fa fa-box"></i></div>
                </div>
                <div class="value" id="dash-products">...</div>
            </div>
            <div class="stat-card">
                <div class="stat-card-header">
                    <h3>Total Users</h3>
                    <div class="icon-box"><i class="fa fa-users"></i></div>
                </div>
                <div class="value" id="dash-users">...</div>
            </div>
             <div class="stat-card">
                <div class="stat-card-header">
                    <h3>Total Orders</h3>
                    <div class="icon-box"><i class="fa fa-shopping-cart"></i></div>
                </div>
                <div class="value" id="dash-orders">...</div>
            </div>
        </div>
    `;

    try {
        const token = localStorage.getItem('token');
        const [pRes, uRes, oRes] = await Promise.all([
            fetch('/api/products'),
            fetch('/api/auth/users', { headers: { 'x-auth-token': token } }),
            fetch('/api/orders', { headers: { 'x-auth-token': token } })
        ]);

        const products = await pRes.json();
        const users = await uRes.json();
        const orders = await oRes.json();

        document.getElementById('dash-products').textContent = products.length || 0;
        document.getElementById('dash-users').textContent = users.length || 0;
        document.getElementById('dash-orders').textContent = orders.length || 0;
    } catch (err) {
        console.error(err);
    }
}

function loadSection(section) {
    const dynamicContent = document.getElementById('dynamic-content');

    // Smooth transition out
    dynamicContent.style.opacity = '0';
    dynamicContent.style.transform = 'translateY(10px)';

    setTimeout(async () => {
        if (section === 'dashboard') {
            await loadDashboard();
        } else if (section === 'products') {
            await loadProducts(dynamicContent);
        } else if (section === 'orders') {
            await loadOrders(dynamicContent);
        } else if (section === 'users') {
            await loadUsers(dynamicContent);
        }

        // Smooth transition in
        dynamicContent.style.opacity = '1';
        dynamicContent.style.transform = 'translateY(0)';
    }, 200);
}

// Ensure dynamicContent starts with transition properties
document.addEventListener('DOMContentLoaded', () => {
    const dynamicContent = document.getElementById('dynamic-content');
    if (dynamicContent) {
        dynamicContent.style.transition = 'all 0.4s ease';
    }
});

async function loadOrders(container) {
    container.innerHTML = `
        <div class="page-header">
            <h2>Order Management</h2>
        </div>
        <div class="content-section">
            <div class="table-container">
                <table class="admin-table">
                    <thead>
                        <tr>
                            <th>Order ID</th>
                            <th>Customer</th>
                            <th>Total</th>
                            <th>Status</th>
                            <th>Date</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody id="order-tbody">
                        <tr><td colspan="6" style="text-align:center; padding: 2rem;">Loading orders...</td></tr>
                    </tbody>
                </table>
            </div>
        </div>
    `;

    try {
        const res = await fetch('/api/orders', {
            headers: { 'x-auth-token': localStorage.getItem('token') }
        });
        const orders = await res.json();
        const tbody = document.getElementById('order-tbody');

        if (orders.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 2rem;">No orders found.</td></tr>';
            return;
        }

        tbody.innerHTML = orders.map(o => `
            <tr>
                <td style="font-family: var(--font-mono); font-size: 0.8rem; color: var(--admin-text-muted); opacity: 0.6; letter-spacing: 0.1em;">#${o._id.slice(-6)}</td>
                <td>
                    <div style="font-weight:700; font-size: 1rem; color: var(--admin-text);">${o.shippingDetails.name}</div>
                    <div style="font-size: 0.75rem; color: var(--admin-text-muted); font-weight: 500;">${o.shippingDetails.city}</div>
                </td>
                <td><div style="color: var(--admin-brand); font-weight:800; font-size: 1.2rem; letter-spacing: -0.02em;">$${o.totalAmount}</div></td>
                <td>
                    <span class="status-badge status-${o.status.toLowerCase()}" style="font-family: var(--font-heading); font-size: 0.7rem; letter-spacing: 0.05em;">${o.status}</span>
                </td>
                <td style="color: var(--admin-text-muted); font-size: 0.85rem; line-height: 1.4;">
                    <div style="font-weight: 600; color: var(--admin-text);">${new Date(o.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                    <small style="opacity: 0.7;">${new Date(o.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</small>
                </td>
                <td>
                    <div class="action-group">
                        <div class="status-select-wrapper">
                            <select onchange="updateOrderStatus('${o._id}', this.value)">
                                <option value="" disabled selected>Change Status</option>
                                <option value="Processing" ${o.status === 'Processing' ? 'selected' : ''}>⏳ Processing</option>
                                <option value="Shipped" ${o.status === 'Shipped' ? 'selected' : ''}>🚀 Shipped</option>
                                <option value="Delivered" ${o.status === 'Delivered' ? 'selected' : ''}>✅ Delivered</option>
                                <option value="Cancelled" ${o.status === 'Cancelled' ? 'selected' : ''}>❌ Cancelled</option>
                            </select>
                        </div>
                        <button class="btn-action btn-action-view" onclick="alert('Order Details Loading...')">
                            <i class="fa fa-eye"></i>
                        </button>
                        <button class="btn-action btn-action-delete" onclick="deleteOrder('${o._id}')">
                            <i class="fa fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');

    } catch (err) {
        container.innerHTML = `<p class="error" style="color:var(--admin-danger); margin-top:1rem;">Error loading orders: ${err.message}</p>`;
    }
}

async function loadProducts(container) {
    container.innerHTML = `
        <div class="page-header">
            <h2>Product Management</h2>
            <button class="btn-primary" onclick="showAddProductModal()">
                <i class="fa fa-plus"></i> Add Product
            </button>
        </div>
        <div class="content-section">
            <div class="table-container">
                <table class="admin-table">
                    <thead>
                        <tr>
                            <th>Image</th>
                            <th>Name</th>
                            <th>Category</th>
                            <th>Price</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody id="product-tbody">
                        <tr><td colspan="5" style="text-align:center; padding: 2rem;">Loading products...</td></tr>
                    </tbody>
                </table>
            </div>
        </div>
    `;

    try {
        const res = await fetch('/api/products');
        const products = await res.json();

        const tbody = document.getElementById('product-tbody');
        if (products.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding: 2rem;">No products found.</td></tr>';
            return;
        }

        tbody.innerHTML = products.map(p => `
            <tr>
                <td>
                    <div style="width: 50px; height: 50px; background: white; border-radius: 12px; display: flex; align-items: center; justify-content: center; padding: 5px; box-shadow: 0 4px 10px rgba(0,0,0,0.2);">
                        <img src="${p.image}" alt="${p.name}" style="max-width: 100%; max-height: 100%; object-fit: contain;">
                    </div>
                </td>
                <td><div style="font-weight:700; font-size: 1.05rem; color: var(--admin-text);">${p.name}</div></td>
                <td><span style="background: rgba(255,255,255,0.05); padding: 5px 12px; border-radius: 8px; font-size: 0.75rem; color: var(--admin-text-muted); font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">${p.category || 'General'}</span></td>
                <td><div style="color: var(--admin-brand); font-weight:800; font-size: 1.25rem; letter-spacing: -0.03em;">$${p.price}</div></td>
                <td>
                    <div style="display: flex; gap: 8px;">
                        <button class="btn-sm" onclick="editProduct('${p._id}')" 
                            style="background: rgba(59, 130, 246, 0.1); color: #3b82f6; border: none; padding: 10px; border-radius: 12px; cursor: pointer; transition: all 0.3s ease;">
                            <i class="fa fa-edit"></i>
                        </button>
                        <button class="btn-sm" onclick="deleteProduct('${p._id}')" 
                            style="background: rgba(239, 68, 68, 0.1); color: #ef4444; border: none; padding: 10px; border-radius: 12px; cursor: pointer; transition: all 0.3s ease;">
                            <i class="fa fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');

    } catch (err) {
        container.innerHTML += `<p class="error" style="color:var(--admin-danger);">Error loading products: ${err.message}</p>`;
    }
}

async function loadUsers(container) {
    container.innerHTML = `
        <div class="page-header">
            <h2>User Management</h2>
        </div>
        <div class="content-section">
            <div class="table-container">
                <table class="admin-table">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Role</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody id="user-tbody">
                        <tr><td colspan="4" style="text-align:center; padding: 2rem;">Loading users...</td></tr>
                    </tbody>
                </table>
            </div>
        </div>
    `;

    try {
        const res = await fetch('/api/auth/users', {
            headers: { 'x-auth-token': localStorage.getItem('token') }
        });

        if (!res.ok) throw new Error('Failed to fetch users');

        const users = await res.json();
        const tbody = document.getElementById('user-tbody');

        if (users.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding: 2rem;">No users found.</td></tr>';
            return;
        }

        tbody.innerHTML = users.map(u => `
            <tr>
                <td>
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <div style="width: 40px; height: 40px; border-radius: 50%; background: linear-gradient(135deg, #3b82f6, #8b5cf6); display: flex; align-items: center; justify-content: center; font-weight: 700; color: white; text-transform: uppercase;">
                            ${u.username.charAt(0)}
                        </div>
                        <div style="font-weight:700; font-size: 1.1rem; color: var(--admin-text);">${u.username}</div>
                    </div>
                </td>
                <td><div style="color: var(--admin-text-muted); font-weight: 500; font-size: 0.95rem;">${u.email}</div></td>
                <td>
                    <span class="role-badge role-${u.role}" style="text-transform: uppercase; padding: 6px 12px; font-size: 0.7rem; font-weight: 800; letter-spacing: 0.05em; font-family: var(--font-heading);">${u.role}</span>
                </td>
                <td>
                    <div style="display: flex; gap: 8px; align-items: center;">
                        <select class="role-select" onchange="updateUserRole('${u._id}', this.value)" 
                            style="background: var(--admin-glass); color: var(--admin-text); border: 1px solid var(--admin-glass-border); padding: 6px 12px; border-radius: 10px; outline: none; font-size: 0.85rem;">
                            <option value="user" ${u.role === 'user' ? 'selected' : ''}>Role: User</option>
                            <option value="admin" ${u.role === 'admin' ? 'selected' : ''}>Role: Admin</option>
                        </select>
                        <button class="btn-sm" onclick="deleteUser('${u._id}')" 
                            ${u.email === 'karankumawat303@gmail.com' ? 'disabled style="opacity:0.2; cursor:not-allowed;"' : 'style="background: rgba(239, 68, 68, 0.1); color: #ef4444; border: none; padding: 10px; border-radius: 12px; cursor: pointer; transition: all 0.3s ease;"'}>
                            <i class="fa fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');

    } catch (err) {
        container.innerHTML = `<p class="error" style="color:var(--admin-danger);">Error loading users: ${err.message}</p>`;
    }
}

// Action Helper Functions
async function updateOrderStatus(id, status) {
    try {
        const res = await fetch(`/api/orders/${id}/status`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'x-auth-token': localStorage.getItem('token')
            },
            body: JSON.stringify({ status })
        });

        const contentType = res.headers.get("content-type");
        let data;
        if (contentType && contentType.indexOf("application/json") !== -1) {
            data = await res.json();
        } else {
            const text = await res.text();
            throw new Error('Server error: ' + text);
        }

        if (res.ok) {
            alert('Order status updated!');
            loadSection('orders');
        } else {
            alert('Failed: ' + (data.msg || 'Unknown error') + (data.error ? '\nDetails: ' + data.error : ''));
        }
    } catch (err) {
        console.error('Update Order Status Error:', err);
        alert('Critical Error: ' + err.message);
    }
}

async function deleteOrder(id) {
    if (!confirm('Are you sure you want to delete this order?')) return;
    try {
        const res = await fetch(`/api/orders/${id}`, {
            method: 'DELETE',
            headers: { 'x-auth-token': localStorage.getItem('token') }
        });
        if (res.ok) {
            alert('Order deleted!');
            loadSection('orders');
        } else alert('Failed to delete order');
    } catch (err) {
        console.error(err);
    }
}

async function updateUserRole(id, role) {
    try {
        const res = await fetch(`/api/auth/users/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'x-auth-token': localStorage.getItem('token')
            },
            body: JSON.stringify({ role })
        });
        if (res.ok) alert('User role updated!');
        else alert('Failed to update role');
    } catch (err) {
        console.error(err);
    }
}

async function deleteUser(id) {
    if (!confirm('Are you sure you want to delete this user?')) return;
    try {
        const res = await fetch(`/api/auth/users/${id}`, {
            method: 'DELETE',
            headers: { 'x-auth-token': localStorage.getItem('token') }
        });
        if (res.ok) {
            alert('User deleted!');
            loadSection('users');
        } else alert('Failed to delete user');
    } catch (err) {
        console.error(err);
    }
}

function showAddProductModal() {
    alert('Add Product Modal (Feature under construction - Requires API endpoint)');
}

function editProduct(id) {
    alert(`Edit Product ${id} (Feature under construction)`);
}

function deleteProduct(id) {
    if (confirm('Are you sure you want to delete this product?')) {
        alert('Delete API call placeholder');
        // fetch(`/api/products/${id}`, { method: 'DELETE' })...
    }
}

