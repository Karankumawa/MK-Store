// Check Admin Auth
const token = localStorage.getItem('token');
const user = JSON.parse(localStorage.getItem('user')) || {};

if (!token || user.role !== 'admin') {
    alert('Access Denied: Admins Only');
    window.location.href = 'login.html';
}

document.addEventListener('DOMContentLoaded', () => {
    // Populate Stats
    const orders = JSON.parse(localStorage.getItem('orders')) || [];
    const usersCount = Math.floor(Math.random() * 50) + 10; // Mock user count
    const totalSales = orders.reduce((sum, order) => sum + parseFloat(order.total), 0);

    document.getElementById('total-orders').textContent = orders.length;
    document.getElementById('total-users').textContent = usersCount;
    document.getElementById('total-sales').textContent = `$${totalSales.toFixed(2)}`;

    // Populate Orders Table
    const ordersTable = document.getElementById('orders-table');
    if (orders.length === 0) {
        ordersTable.innerHTML = '<tr><td colspan="5" style="text-align:center;">No orders found.</td></tr>';
    } else {
        ordersTable.innerHTML = orders.map(order => `
            <tr>
                <td>${order.id}</td>
                <td>${user.email}</td> <!-- In a real app, this would be the customer email -->
                <td>$${order.total}</td>
                <td><span class="order-status status-${order.status === 'Processing' ? 'pending' : 'completed'}">${order.status}</span></td>
                <td>${new Date(order.date).toLocaleDateString()}</td>
            </tr>
        `).join('');
    }

    // Populate Users Table (Mock Data)
    const usersTable = document.getElementById('users-table');
    usersTable.innerHTML = `
        <tr>
            <td>1</td>
            <td>Admin User</td>
            <td>mkstore5100@gmail.com</td>
            <td><span style="background:#e0e7ff; color:#3730a3; padding:2px 8px; border-radius:10px;">Admin</span></td>
        </tr>
        <tr>
            <td>2</td>
            <td>Test User</td>
            <td>user@example.com</td>
            <td>Customer</td>
        </tr>
    `;
});

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'login.html';
}
