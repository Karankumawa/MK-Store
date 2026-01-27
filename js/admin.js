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
    loadSection('products'); // Default
}

function loadSection(section) {
    const main = document.querySelector('.admin-content');

    if (section === 'products') {
        loadProducts(main);
    } else if (section === 'orders') {
        main.innerHTML = '<h2>Orders</h2><p>Order management coming soon.</p>';
    } else if (section === 'users') {
        main.innerHTML = '<h2>Users</h2><p>User management coming soon.</p>';
    }
}

async function loadProducts(container) {
    container.innerHTML = `
        <div class="section-header" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:2rem;">
            <h2>Product Management</h2>
            <button class="btn-primary" onclick="showAddProductModal()">+ Add Product</button>
        </div>
        <div class="product-table-container">
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
                    <tr><td colspan="5">Loading...</td></tr>
                </tbody>
            </table>
        </div>
    `;

    try {
        const res = await fetch('/api/products');
        const products = await res.json();

        const tbody = document.getElementById('product-tbody');
        if (products.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5">No products found.</td></tr>';
            return;
        }

        tbody.innerHTML = products.map(p => `
            <tr>
                <td><img src="${p.image}" alt="${p.name}" style="width:40px; height:40px; object-fit:contain;"></td>
                <td>${p.name}</td>
                <td>${p.category || '-'}</td>
                <td>$${p.price}</td>
                <td>
                    <button class="btn-sm btn-edit" onclick="editProduct('${p._id}')"><i class="fa fa-edit"></i></button>
                    <button class="btn-sm btn-delete" onclick="deleteProduct('${p._id}')"><i class="fa fa-trash"></i></button>
                </td>
            </tr>
        `).join('');

    } catch (err) {
        container.innerHTML += `<p class="error">Error loading products: ${err.message}</p>`;
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
