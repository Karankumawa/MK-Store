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
    const main = document.querySelector('.admin-content');
    main.innerHTML = `
        <h1>Dashboard Overview</h1>
        <div class="dashboard-stats" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.5rem; margin-top: 2rem;">
             <div class="stat-card" style="background: white; padding: 1.5rem; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                <h3>Total Products</h3>
                <div class="value" id="dash-products">Loading...</div>
            </div>
            <div class="stat-card" style="background: white; padding: 1.5rem; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                <h3>Total Users</h3>
                <div class="value" id="dash-users">Loading...</div>
            </div>
             <div class="stat-card" style="background: white; padding: 1.5rem; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                <h3>Total Orders</h3>
                <div class="value" id="dash-orders">Loading...</div>
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
    const main = document.querySelector('.admin-content');

    if (section === 'dashboard') {
        loadDashboard();
    } else if (section === 'products') {
        loadProducts(main);
    } else if (section === 'orders') {
        loadOrders(main);
    } else if (section === 'users') {
        loadUsers(main);
    }
}

async function loadOrders(container) {
    container.innerHTML = `
        <div class="section-header" style="margin-bottom:2rem;">
            <h2>Order Management</h2>
        </div>
        <div class="order-table-container">
            <table class="admin-table" style="width: 100%; border-collapse: collapse; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                <thead style="background: #f1f5f9;">
                    <tr>
                        <th style="padding: 1rem; text-align: left;">Order ID</th>
                        <th style="padding: 1rem; text-align: left;">Customer</th>
                        <th style="padding: 1rem; text-align: left;">Total</th>
                        <th style="padding: 1rem; text-align: left;">Status</th>
                        <th style="padding: 1rem; text-align: left;">Date</th>
                    </tr>
                </thead>
                <tbody id="order-tbody">
                    <tr><td colspan="5" style="padding: 1rem;">Loading...</td></tr>
                </tbody>
            </table>
        </div>
    `;

    try {
        const res = await fetch('/api/orders', {
            headers: { 'x-auth-token': localStorage.getItem('token') }
        });
        const orders = await res.json();
        const tbody = document.getElementById('order-tbody');

        if (orders.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="padding: 1rem;">No orders found.</td></tr>';
            return;
        }

        tbody.innerHTML = orders.map(o => `
            <tr style="border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 1rem;">${o._id}</td>
                <td style="padding: 1rem;">${o.shippingDetails.name}</td>
                <td style="padding: 1rem;">$${o.totalAmount}</td>
                <td style="padding: 1rem;"><span class="status-badge ${o.status.toLowerCase()}">${o.status}</span></td>
                <td style="padding: 1rem;">${new Date(o.date).toLocaleDateString()}</td>
            </tr>
        `).join('');

    } catch (err) {
        container.innerHTML = `<p class="error">Error loading orders: ${err.message}</p>`;
    }
}

async function loadProducts(container) {
    container.innerHTML = `
        <div class="section-header" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:2rem;">
            <h2>Product Management</h2>
            <button class="btn-primary" onclick="showAddProductModal()">+ Add Product</button>
        </div>
        <div class="product-table-container">
            <table class="admin-table" style="width: 100%; border-collapse: collapse; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                <thead style="background: #f1f5f9;">
                    <tr>
                        <th style="padding: 1rem; text-align: left;">Image</th>
                        <th style="padding: 1rem; text-align: left;">Name</th>
                        <th style="padding: 1rem; text-align: left;">Category</th>
                        <th style="padding: 1rem; text-align: left;">Price</th>
                        <th style="padding: 1rem; text-align: left;">Actions</th>
                    </tr>
                </thead>
                <tbody id="product-tbody">
                    <tr><td colspan="5" style="padding: 1rem;">Loading...</td></tr>
                </tbody>
            </table>
        </div>
    `;

    try {
        const res = await fetch('/api/products');
        const products = await res.json();

        const tbody = document.getElementById('product-tbody');
        if (products.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="padding: 1rem;">No products found.</td></tr>';
            return;
        }

        tbody.innerHTML = products.map(p => `
            <tr style="border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 1rem;"><img src="${p.image}" alt="${p.name}" style="width:40px; height:40px; object-fit:contain;"></td>
                <td style="padding: 1rem;">${p.name}</td>
                <td style="padding: 1rem;">${p.category || '-'}</td>
                <td style="padding: 1rem;">$${p.price}</td>
                <td style="padding: 1rem;">
                    <button class="btn-sm btn-edit" onclick="editProduct('${p._id}')" style="margin-right: 5px;"><i class="fa fa-edit"></i></button>
                    <button class="btn-sm btn-delete" onclick="deleteProduct('${p._id}')"><i class="fa fa-trash"></i></button>
                </td>
            </tr>
        `).join('');

    } catch (err) {
        container.innerHTML += `<p class="error">Error loading products: ${err.message}</p>`;
    }
}

async function loadUsers(container) {
    container.innerHTML = `
        <div class="section-header" style="margin-bottom:2rem;">
            <h2>User Management</h2>
        </div>
        <div class="user-table-container">
            <table class="admin-table" style="width: 100%; border-collapse: collapse; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                <thead style="background: #f1f5f9;">
                    <tr>
                        <th style="padding: 1rem; text-align: left;">Name</th>
                        <th style="padding: 1rem; text-align: left;">Email</th>
                        <th style="padding: 1rem; text-align: left;">Role</th>
                    </tr>
                </thead>
                <tbody id="user-tbody">
                    <tr><td colspan="3" style="padding: 1rem;">Loading...</td></tr>
                </tbody>
            </table>
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
            tbody.innerHTML = '<tr><td colspan="3" style="padding: 1rem;">No users found.</td></tr>';
            return;
        }

        tbody.innerHTML = users.map(u => `
            <tr style="border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 1rem;">${u.username}</td>
                <td style="padding: 1rem;">${u.email}</td>
                <td style="padding: 1rem;"><span class="role-badge ${u.role}">${u.role}</span></td>
            </tr>
        `).join('');

    } catch (err) {
        container.innerHTML = `<p class="error">Error loading users: ${err.message}</p>`;
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
