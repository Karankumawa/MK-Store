// ==========================================
// M.K. STORE — User Profile & Address Manager
// ==========================================

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
            // Sync updated role / info to localStorage
            const localUser = JSON.parse(localStorage.getItem('user')) || {};
            const merged = { ...localUser, ...userData };
            localStorage.setItem('user', JSON.stringify(merged));
        } else {
            console.warn('Failed to fetch profile from server, using local fallback');
            userData = {};
        }

        const savedUser = JSON.parse(localStorage.getItem('user')) || {};
        const fullProfile = { ...savedUser, ...userData };

        renderProfile(fullProfile);

        // Address Form Save Handling
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

                try {
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
                        const current = JSON.parse(localStorage.getItem('user')) || {};
                        localStorage.setItem('user', JSON.stringify({ ...current, ...savedData }));
                        if (window.showToast) {
                            window.showToast('Delivery address saved successfully!', 'success');
                        } else {
                            alert('Delivery address saved successfully!');
                        }
                    } else {
                        throw new Error('Failed to save to server');
                    }
                } catch (error) {
                    console.error('Save error:', error);
                    if (window.showToast) {
                        window.showToast('Failed to save profile. Please try again.', 'error');
                    } else {
                        alert('Failed to save profile. Please try again.');
                    }
                }
            });
        }

    } catch (err) {
        console.error('Profile loading error:', err);
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
    const loadingEl = document.getElementById('loading-profile');
    const contentEl = document.getElementById('profile-content');
    if (loadingEl) loadingEl.style.display = 'none';
    if (contentEl) contentEl.style.display = 'grid';

    // Sidebar User Info
    const sidebarName = document.getElementById('user-name-sidebar');
    if (sidebarName) sidebarName.textContent = user.username || 'User';

    const roleBadge = document.getElementById('user-role-badge');
    if (roleBadge) {
        if (user.role === 'admin') {
            roleBadge.textContent = 'Admin';
            roleBadge.style.background = '#fef3c7';
            roleBadge.style.color = '#92400e';
            roleBadge.style.fontWeight = '700';

            // Add Admin link to sidebar if not present
            if (!document.getElementById('sidebar-admin-link')) {
                const adminBtn = document.createElement('a');
                adminBtn.id = 'sidebar-admin-link';
                adminBtn.href = 'admin.html';
                adminBtn.className = 'profile-nav-link';
                adminBtn.style.color = '#d97706';
                adminBtn.style.fontWeight = '700';
                adminBtn.innerHTML = '<i class="fa fa-shield-halved"></i> Admin Panel';
                const dashNav = document.querySelector('.dashboard-nav');
                const logoutBtn = document.getElementById('logout-btn');
                if (dashNav && logoutBtn) {
                    dashNav.insertBefore(adminBtn, logoutBtn);
                }
            }
        } else {
            roleBadge.textContent = 'Customer';
        }
    }

    // Avatar
    const avatarSmall = document.getElementById('user-avatar-small');
    if (avatarSmall) {
        if (user.profilePicture) {
            avatarSmall.innerHTML = `<img src="${user.profilePicture}" alt="Avatar" onerror="this.src='assets/placeholder.png'">`;
            avatarSmall.style.backgroundColor = 'transparent';
        } else {
            const initial = (user.username || 'U')[0].toUpperCase();
            avatarSmall.textContent = initial;
            avatarSmall.style.backgroundColor = '#4f46e5';
        }
    }

    // Personal Info Card
    const infoName = document.getElementById('info-name');
    if (infoName) infoName.textContent = user.username || 'Valued Member';

    const infoEmail = document.getElementById('info-email');
    if (infoEmail) infoEmail.textContent = user.email || 'No email provided';

    const memberSinceEl = document.getElementById('info-member-since');
    if (memberSinceEl) {
        if (user.createdAt) {
            memberSinceEl.textContent = new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        } else {
            memberSinceEl.textContent = 'Active Member';
        }
    }

    const infoStatus = document.getElementById('info-status');
    if (infoStatus) {
        infoStatus.innerHTML = '<i class="fa-solid fa-circle-check"></i> Verified Member';
    }

    // Pre-fill Forms
    if (user.address) document.getElementById('address').value = user.address;
    if (user.city) document.getElementById('city').value = user.city;
    if (user.zip) document.getElementById('zip').value = user.zip;
    if (user.phone) document.getElementById('phone').value = user.phone;
}
