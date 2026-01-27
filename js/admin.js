// Check Admin Token
const token = localStorage.getItem('token');
const user = JSON.parse(localStorage.getItem('user'));

if (!token || !user || user.role !== 'admin') {
    alert('Access Denied. Admins only.');
    window.location.href = 'login.html';
}

document.addEventListener('DOMContentLoaded', async () => {
    // Placeholder for actual API calls
    // In a real app, we would have /api/admin/stats endpoints

    // For now, let's mock the dashboard data if API fails or is not implemented fully
    document.getElementById('total-orders').innerText = '12';
    document.getElementById('total-users').innerText = '5';
    document.getElementById('total-sales').innerText = '$1,240';

    const ordersTable = document.getElementById('orders-table');
    // Mock Orders
    const orders = [
        { id: '#ORD-001', user: 'Test User', total: '$45.00', status: 'Completed', date: '2024-01-20' },
        { id: '#ORD-002', user: 'Jane Doe', total: '$12.50', status: 'Pending', date: '2024-01-21' }
    ];

    orders.forEach(order => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${order.id}</td>
            <td>${order.user}</td>
            <td>${order.total}</td>
            <td><span class="order-status ${order.status === 'Completed' ? 'status-completed' : 'status-pending'}">${order.status}</span></td>
            <td>${order.date}</td>
        `;
        ordersTable.appendChild(tr);
    });

    const usersTable = document.getElementById('users-table');
    // Mock Users (or fetch from API if available)
    // We could add an API endpoint for users in a future step
    const users = [
        { id: '1', username: 'karankumawat', email: 'admin@mkstore.com', role: 'admin' },
        { id: '2', username: 'testuser', email: 'test@example.com', role: 'user' }
    ];

    users.forEach(u => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${u.id}</td>
            <td>${u.username}</td>
            <td>${u.email}</td>
            <td>${u.role}</td>
        `;
        usersTable.appendChild(tr);
    });
});
