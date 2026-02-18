document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('token');

    if (!token) {
        showLoginPrompt();
        return;
    }

    // Try to get user data from localStorage first for speed
    // If you were storing full user object on login, you could use it.
    // Assuming we might need to fetch it or decode it.

    // For now, let's try to fetch user details from an API endpoint if it exists, 
    // or just assume we have some stored info. 
    // Since the original auth.js didn't store full user info, we'll try to decode the token 
    // or just show a generic "User" if we can't verify.

    // NOTE: In a real app, you would hit /api/auth/me using the token.
    // We will simulate a fetch or use decoded values.

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
        document.getElementById('shipping-form').addEventListener('submit', async (e) => {
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

    } catch (err) {
        console.error(err);
        showLoginPrompt();
    }
});

function showLoginPrompt() {
    document.getElementById('loading-profile').style.display = 'none';
    document.getElementById('profile-content').style.display = 'none';
    document.getElementById('login-prompt').style.display = 'block';
}

function renderProfile(user) {
    document.getElementById('loading-profile').style.display = 'none';
    document.getElementById('profile-content').style.display = 'block';

    // Update Text Info
    document.getElementById('user-name').textContent = user.username || 'Valued Customer';
    document.getElementById('user-email').textContent = user.email || 'No email provided';
    document.getElementById('info-name').textContent = user.username || 'Valued Customer';
    document.getElementById('info-email').textContent = user.email || 'No email provided';

    // Pre-fill Forms
    if (user.address) document.getElementById('address').value = user.address;
    if (user.city) document.getElementById('city').value = user.city;
    if (user.zip) document.getElementById('zip').value = user.zip;
    if (user.phone) document.getElementById('phone').value = user.phone;

    // Avatar
    if (user.profilePicture) {
        document.getElementById('user-avatar').innerHTML = `<img src="${user.profilePicture}" alt="Avatar" style="width:100%; height:100%; object-fit:cover; border-radius:50%;">`;
        document.getElementById('user-avatar').style.backgroundColor = 'transparent';
    } else {
        const initial = (user.username || 'U')[0].toUpperCase();
        document.getElementById('user-avatar').textContent = initial;
        document.getElementById('user-avatar').style.backgroundColor = 'var(--brand)';
    }

    // Render Orders
    renderOrders();
}

function renderOrders() {
    const orders = JSON.parse(localStorage.getItem('orders')) || [];
    const container = document.getElementById('recent-orders-list');

    if (orders.length === 0) {
        container.innerHTML = `
            <div class="info-card" style="text-align:center; padding:3rem; color:var(--text-muted);">
                <i class="fa fa-box-open" style="font-size:2rem; margin-bottom:1rem; display:block;"></i>
                No recent orders found.
            </div>`;
        return;
    }

    container.innerHTML = orders.map(order => `
        <div class="info-card" style="margin-bottom:1rem; display:flex; justify-content:space-between; align-items:center;">
            <div>
                <strong style="display:block;">Order #${order.id}</strong>
                <span style="font-size:0.9rem; color:var(--text-muted);">${new Date(order.date).toLocaleDateString()}</span>
            </div>
            <div style="text-align:right;">
                <strong style="display:block; color:var(--brand);">$${order.total}</strong>
                <span style="font-size:0.8rem; padding:0.2rem 0.6rem; border-radius:10px; background:#dcfce7; color:#166534;">${order.status}</span>
            </div>
        </div>
    `).join('');
}

// Logout
document.getElementById('logout-btn').addEventListener('click', () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user'); // if we stored it
    window.location.href = 'login.html';
});
