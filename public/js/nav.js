// ==========================================
// M.K. STORE — Global Nav, Auth & Isolated Cart Manager
// ==========================================

const UserAuth = {
    getUser() {
        try {
            return JSON.parse(localStorage.getItem('user')) || null;
        } catch (e) {
            return null;
        }
    },
    getToken() {
        return localStorage.getItem('token') || null;
    },
    isLoggedIn() {
        return !!(this.getToken() && this.getUser());
    },
    logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('mkstore_pending_action');
        showToast('You have been signed out.', 'info');
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 600);
    }
};

const UserCart = {
    getCartKey() {
        const user = UserAuth.getUser();
        if (!user || !user.id) return null;
        // Strictly isolated dataspace per user unique ID
        return `mkstore_cart_${user.id}`;
    },

    getCart() {
        if (!UserAuth.isLoggedIn()) {
            return []; // Guests have no active cart items
        }
        const key = this.getCartKey();
        try {
            return JSON.parse(localStorage.getItem(key)) || [];
        } catch (e) {
            return [];
        }
    },

    saveCart(items) {
        if (!UserAuth.isLoggedIn()) return;
        const key = this.getCartKey();
        const validItems = Array.isArray(items) ? items : [];
        localStorage.setItem(key, JSON.stringify(validItems));
        updateCartCount();

        // Sync with backend /api/cart in background (isolated to user dataspace)
        const token = UserAuth.getToken();
        if (token) {
            fetch('/api/cart', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': token
                },
                body: JSON.stringify({ items: validItems })
            }).catch(err => console.debug('Cart background sync error:', err));
        }
    },

    async syncWithBackend() {
        if (!UserAuth.isLoggedIn()) return;
        const token = UserAuth.getToken();
        try {
            const res = await fetch('/api/cart', {
                headers: { 'x-auth-token': token }
            });
            if (res.ok) {
                const data = await res.json();
                if (data && Array.isArray(data.items)) {
                    const localItems = this.getCart();
                    // If local items exist, keep them; if local is empty and server has items, restore them
                    if (localItems.length === 0 && data.items.length > 0) {
                        localStorage.setItem(this.getCartKey(), JSON.stringify(data.items));
                        updateCartCount();
                    }
                }
            }
        } catch (err) {
            console.debug('Failed to sync cart with backend:', err);
        }
    },

    requireAuth(actionName = 'purchase or add items to cart', productToPending = null) {
        if (UserAuth.isLoggedIn()) {
            return true;
        }

        // Save pending intent so user doesn't lose context after login
        if (productToPending) {
            localStorage.setItem('mkstore_pending_action', JSON.stringify({
                action: 'add_to_cart',
                product: productToPending,
                timestamp: Date.now(),
                returnUrl: window.location.href
            }));
        }

        showAuthModal(
            'Sign In Required to Purchase',
            `You can explore and view all products freely as a guest. To ${actionName}, please sign in to your personal account or create a new one.`
        );
        return false;
    },

    addItem(product, qty = 1) {
        if (!this.requireAuth('add items to your cart', { ...product, quantity: qty })) {
            return false;
        }

        const cart = this.getCart();
        const itemId = product._id || product.id;
        const existing = cart.find(i => (i._id || i.id) === itemId);

        if (existing) {
            existing.quantity = (existing.quantity || 1) + qty;
        } else {
            cart.push({
                _id: itemId,
                name: product.name,
                price: parseFloat(product.price) || 0,
                image: product.image || 'assets/placeholder.png',
                category: product.category || 'General',
                quantity: qty
            });
        }

        this.saveCart(cart);
        showToast(`Added <b>${product.name}</b> to your cart!`, 'success');
        return true;
    },

    removeItem(productId) {
        if (!UserAuth.isLoggedIn()) return;
        let cart = this.getCart();
        cart = cart.filter(i => (i._id || i.id) !== productId);
        this.saveCart(cart);
        showToast('Item removed from cart.', 'info');
    },

    updateQty(productId, newQty) {
        if (!UserAuth.isLoggedIn()) return;
        let cart = this.getCart();
        const item = cart.find(i => (i._id || i.id) === productId);
        if (item) {
            if (newQty <= 0) {
                this.removeItem(productId);
            } else {
                item.quantity = newQty;
                this.saveCart(cart);
            }
        }
    },

    clearCart() {
        if (!UserAuth.isLoggedIn()) return;
        const key = this.getCartKey();
        localStorage.removeItem(key);
        updateCartCount();

        const token = UserAuth.getToken();
        if (token) {
            fetch('/api/cart', {
                method: 'DELETE',
                headers: { 'x-auth-token': token }
            }).catch(e => console.debug(e));
        }
    }
};

// ==========================================
// Modern Auth Modal (Guest Restriction Enforcement)
// ==========================================
function showAuthModal(title, message) {
    let modal = document.getElementById('mk-auth-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'mk-auth-modal';
        modal.className = 'mk-auth-modal-overlay';
        modal.innerHTML = `
            <div class="mk-auth-modal-card">
                <button class="mk-modal-close" onclick="closeAuthModal()" aria-label="Close">&times;</button>
                <div class="mk-modal-header">
                    <div class="mk-modal-icon"><i class="fa-solid fa-lock"></i></div>
                    <span class="mk-modal-badge">Member Feature</span>
                    <h3 id="mk-modal-title">Sign In Required</h3>
                    <p id="mk-modal-desc">Please log in to your account to add items to cart and place orders.</p>
                </div>
                <div class="mk-modal-body">
                    <div class="mk-modal-features">
                        <div class="mk-feat-item"><i class="fa-solid fa-shield-halved"></i> <span>Private Isolated Dataspace (Unique UID)</span></div>
                        <div class="mk-feat-item"><i class="fa-solid fa-truck-fast"></i> <span>Instant Order Tracking & History</span></div>
                        <div class="mk-feat-item"><i class="fa-solid fa-bag-shopping"></i> <span>Saved Personal Cart & Wishlist</span></div>
                    </div>
                    <div class="mk-modal-actions">
                        <button class="mk-btn-primary" id="mk-modal-login-btn">
                            <i class="fa-solid fa-arrow-right-to-bracket"></i> Sign In to Account
                        </button>
                        <button class="mk-btn-secondary" id="mk-modal-reg-btn">
                            <i class="fa-solid fa-user-plus"></i> Create New Account
                        </button>
                    </div>
                </div>
                <div class="mk-modal-footer">
                    <p>New to M.K. Store? It only takes 30 seconds to sign up.</p>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        // Click outside to close
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeAuthModal();
        });

        // ESC key to close
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal.classList.contains('active')) {
                closeAuthModal();
            }
        });
    }

    if (title) document.getElementById('mk-modal-title').textContent = title;
    if (message) document.getElementById('mk-modal-desc').textContent = message;

    // Attach target URLs with redirect back
    const currentUrl = encodeURIComponent(window.location.pathname + window.location.search);
    document.getElementById('mk-modal-login-btn').onclick = () => {
        window.location.href = `login.html?redirect=${currentUrl}`;
    };
    document.getElementById('mk-modal-reg-btn').onclick = () => {
        window.location.href = `register.html?redirect=${currentUrl}`;
    };

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeAuthModal() {
    const modal = document.getElementById('mk-auth-modal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

// ==========================================
// Modern Toast Notifications
// ==========================================
function showToast(message, type = 'info') {
    let container = document.getElementById('mk-toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'mk-toast-container';
        container.className = 'mk-toast-container';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `mk-toast mk-toast-${type}`;

    let icon = 'fa-info-circle';
    if (type === 'success') icon = 'fa-circle-check';
    if (type === 'error') icon = 'fa-circle-exclamation';
    if (type === 'warning') icon = 'fa-triangle-exclamation';

    toast.innerHTML = `
        <div class="mk-toast-icon"><i class="fa-solid ${icon}"></i></div>
        <div class="mk-toast-msg">${message}</div>
        <button class="mk-toast-close" onclick="this.parentElement.remove()">&times;</button>
    `;

    container.appendChild(toast);

    requestAnimationFrame(() => toast.classList.add('show'));

    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

// ==========================================
// Dynamic Navigation Bar & Profile Dropdown
// ==========================================
function updateNavigation() {
    const user = UserAuth.getUser();
    const token = UserAuth.getToken();
    const navLinks = document.querySelector('.nav-links');
    if (!navLinks) return;

    // Remove any previously rendered dynamic user menu item
    const existingUserPill = document.getElementById('nav-user-pill-container');
    if (existingUserPill) existingUserPill.remove();

    const loginLink = navLinks.querySelector('a[href*="login.html"]');
    const profileLink = navLinks.querySelector('a[href*="profile.html"]');
    const adminLink = navLinks.querySelector('a[href*="admin.html"]');

    if (token && user) {
        // User is logged in: Hide plain login and direct profile link
        if (loginLink && loginLink.parentElement) loginLink.parentElement.style.display = 'none';
        if (profileLink && profileLink.parentElement) profileLink.parentElement.style.display = 'none';
        if (adminLink && adminLink.parentElement) adminLink.parentElement.style.display = 'none';

        // Create elegant User Dropdown Pill
        const userLi = document.createElement('li');
        userLi.id = 'nav-user-pill-container';
        userLi.className = 'nav-user-item';

        const userInitial = (user.username || 'U').charAt(0).toUpperCase();
        const roleBadge = user.role === 'admin' ? '<span class="nav-role-badge">Admin</span>' : '';

        userLi.innerHTML = `
            <div class="user-dropdown-wrapper">
                <button class="user-dropdown-trigger" id="user-dropdown-btn">
                    <span class="user-avatar-circle">${userInitial}</span>
                    <span class="user-name-label">${user.username}</span>
                    ${roleBadge}
                    <i class="fa-solid fa-chevron-down caret-icon"></i>
                </button>
                <div class="user-dropdown-menu" id="user-dropdown-menu">
                    <div class="user-dropdown-header">
                        <strong>${user.username}</strong>
                        <span class="user-email-text">${user.email || ''}</span>
                    </div>
                    <div class="user-dropdown-divider"></div>
                    <a href="profile.html" class="dropdown-link"><i class="fa-solid fa-user-gear"></i> My Profile & Details</a>
                    <a href="orders.html" class="dropdown-link"><i class="fa-solid fa-box-open"></i> My Orders</a>
                    <a href="cart.html" class="dropdown-link"><i class="fa-solid fa-cart-shopping"></i> My Cart</a>
                    ${user.role === 'admin' ? '<a href="admin.html" class="dropdown-link admin-link"><i class="fa-solid fa-shield-halved"></i> Admin Dashboard</a>' : ''}
                    <div class="user-dropdown-divider"></div>
                    <button class="dropdown-link logout-link" onclick="UserAuth.logout()">
                        <i class="fa-solid fa-arrow-right-from-bracket"></i> Sign Out
                    </button>
                </div>
            </div>
        `;

        navLinks.appendChild(userLi);

        // Dropdown toggle logic
        const trigger = userLi.querySelector('#user-dropdown-btn');
        const menu = userLi.querySelector('#user-dropdown-menu');

        trigger.addEventListener('click', (e) => {
            e.stopPropagation();
            menu.classList.toggle('active');
            trigger.classList.toggle('open');
        });

        document.addEventListener('click', (e) => {
            if (!userLi.contains(e.target)) {
                menu.classList.remove('active');
                trigger.classList.remove('open');
            }
        });

    } else {
        // Guest mode
        if (loginLink && loginLink.parentElement) loginLink.parentElement.style.display = 'block';
        if (profileLink && profileLink.parentElement) profileLink.parentElement.style.display = 'none';
        if (adminLink && adminLink.parentElement) adminLink.parentElement.style.display = 'none';
    }
}

// Global Cart Count updater (Reads exclusively from current user's isolated cart)
function updateCartCount() {
    try {
        const cart = UserCart.getCart();
        const totalItems = cart.reduce((total, item) => total + (parseInt(item.quantity) || 1), 0);
        document.querySelectorAll('.cart-count').forEach(el => {
            el.textContent = totalItems > 0 ? totalItems : '';
            el.style.display = totalItems > 0 ? 'inline-flex' : 'none';
        });
    } catch (e) {
        console.error('Error updating cart count:', e);
    }
}

// Mobile Hamburger Menu Setup (Robust & Instant on Mobile/Tablet)
function setupMobileMenu() {
    const menuToggle = document.querySelector('.menu-toggle');
    const navLinks = document.querySelector('.nav-links');

    if (menuToggle && navLinks) {
        menuToggle.onclick = function (e) {
            e.preventDefault();
            e.stopPropagation();
            const isOpen = navLinks.classList.toggle('active');
            menuToggle.classList.toggle('active', isOpen);
            document.body.classList.toggle('nav-active', isOpen);
        };

        // Close menu on navigation link click
        navLinks.addEventListener('click', function (e) {
            if (e.target.tagName === 'A' || e.target.closest('a')) {
                navLinks.classList.remove('active');
                menuToggle.classList.remove('active');
                document.body.classList.remove('nav-active');
            }
        });

        // Close menu when tapping anywhere outside
        document.addEventListener('click', function (e) {
            if (!navLinks.contains(e.target) && !menuToggle.contains(e.target)) {
                navLinks.classList.remove('active');
                menuToggle.classList.remove('active');
                document.body.classList.remove('nav-active');
            }
        });
    }
}

// Global Search Bar Handler with Live Instant Suggestions
let _catalogCache = null;
async function getCatalogCached() {
    if (_catalogCache && _catalogCache.length) return _catalogCache;
    try {
        const res = await fetch('/api/products');
        if (res.ok) {
            _catalogCache = await res.json();
            return _catalogCache;
        }
    } catch (e) {
        console.debug('Catalog cache fetch err:', e);
    }
    return [];
}

function setupGlobalSearch() {
    const searchInputs = document.querySelectorAll('#search-input');
    const searchButtons = document.querySelectorAll('#search-button');

    function performSearch(query) {
        if (!query || !query.trim()) return;
        window.location.href = `search.html?q=${encodeURIComponent(query.trim())}`;
    }

    searchInputs.forEach(input => {
        const wrapper = input.closest('.search-bar') || input.parentElement;
        
        // Create suggestion dropdown container if not present
        let suggestBox = wrapper.querySelector('.search-suggestions-dropdown');
        if (!suggestBox) {
            suggestBox = document.createElement('div');
            suggestBox.className = 'search-suggestions-dropdown';
            wrapper.appendChild(suggestBox);
        }

        let debounceTimer = null;
        input.addEventListener('input', () => {
            clearTimeout(debounceTimer);
            const query = input.value.trim().toLowerCase();
            if (query.length < 2) {
                suggestBox.classList.remove('active');
                suggestBox.innerHTML = '';
                return;
            }

            debounceTimer = setTimeout(async () => {
                const products = await getCatalogCached();
                const matches = products.filter(p => {
                    const name = (p.name || '').toLowerCase();
                    const cat = (p.category || '').toLowerCase();
                    const desc = (p.description || '').toLowerCase();
                    return name.includes(query) || cat.includes(query) || desc.includes(query);
                }).slice(0, 5);

                if (matches.length === 0) {
                    suggestBox.innerHTML = `
                        <div class="suggest-empty">No quick matches for "<b>${query}</b>"</div>
                        <div class="suggest-footer" onclick="window.location.href='search.html?q=${encodeURIComponent(query)}'">
                            <span>Search all products for "${query}"</span> <i class="fa fa-arrow-right"></i>
                        </div>
                    `;
                } else {
                    suggestBox.innerHTML = `
                        <div class="suggest-header">Top Results</div>
                        ${matches.map(p => `
                            <a href="product.html?id=${p._id || p.id}" class="suggest-item">
                                <img src="${p.image || 'assets/placeholder.png'}" alt="${p.name}" onerror="this.src='assets/placeholder.png'">
                                <div class="suggest-info">
                                    <div class="suggest-title">${p.name}</div>
                                    <div class="suggest-meta">
                                        <span class="suggest-cat">${p.category}</span>
                                        <span class="suggest-price">$${Number(p.price || 0).toFixed(2)}</span>
                                    </div>
                                </div>
                            </a>
                        `).join('')}
                        <div class="suggest-footer" onclick="window.location.href='search.html?q=${encodeURIComponent(query)}'">
                            <span>View all results for "<b>${query}</b>"</span> <i class="fa fa-arrow-right"></i>
                        </div>
                    `;
                }
                suggestBox.classList.add('active');
            }, 180);
        });

        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                suggestBox.classList.remove('active');
                performSearch(input.value);
            }
        });

        // Hide on outside click
        document.addEventListener('click', (e) => {
            if (!wrapper.contains(e.target)) {
                suggestBox.classList.remove('active');
            }
        });
    });

    searchButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const wrapper = btn.closest('.search-bar') || document;
            const input = wrapper.querySelector('#search-input') || document.querySelector('#search-input');
            if (input) performSearch(input.value);
        });
    });
}

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', () => {
    updateNavigation();
    updateCartCount();
    setupMobileMenu();
    setupGlobalSearch();

    // Background sync user cart if logged in
    if (UserAuth.isLoggedIn()) {
        UserCart.syncWithBackend();
    }
});

// Expose globals for backward compatibility and cross-page use
window.UserAuth = UserAuth;
window.UserCart = UserCart;
window.showAuthModal = showAuthModal;
window.closeAuthModal = closeAuthModal;
window.showToast = showToast;
window.updateNavigation = updateNavigation;
window.updateCartCount = updateCartCount;
