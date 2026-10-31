const API_URL = '/api/auth';

// Firebase Configuration (Google Auth)
const firebaseConfig = {
    apiKey: "AIzaSyA4Efxee8aHyt_6Wx0K8DLRnpp-hF-jNzo",
    authDomain: "login-shop-68cfc.firebaseapp.com",
    projectId: "login-shop-68cfc",
    storageBucket: "login-shop-68cfc.firebasestorage.app",
    messagingSenderId: "22502036606",
    appId: "1:22502036606:web:7e0cd91ad2818873a2f42f",
    measurementId: "G-MJ8E9Z82QC"
};

// Initialize Firebase safely
if (typeof firebase !== 'undefined') {
    try {
        firebase.initializeApp(firebaseConfig);
        console.log('Firebase initialized');
    } catch (error) {
        console.error('Firebase initialization error:', error);
    }
}

// Google Login Function
function googleLogin() {
    if (typeof firebase === 'undefined') {
        showNotification('Firebase SDK is not loaded.', 'error');
        return;
    }
    const provider = new firebase.auth.GoogleAuthProvider();
    firebase.auth().signInWithPopup(provider)
        .then((result) => {
            const user = result.user;
            user.getIdToken().then(async (idToken) => {
                try {
                    const res = await fetch(`${API_URL}/google`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ token: idToken })
                    });

                    const data = await res.json();

                    if (res.ok) {
                        showNotification(`Welcome back, ${data.user.username}!`, 'success');
                        handlePostAuth(data.user, data.token);
                    } else {
                        throw new Error(data.msg || 'Backend verification failed');
                    }
                } catch (error) {
                    console.error("Backend Verification Error:", error);
                    showNotification("Login Failed: " + error.message, 'error');
                }
            });
        }).catch((error) => {
            console.error("Google Login Error:", error);
            showNotification("Google Login Failed: " + error.message, 'error');
        });
}

function handlePostAuth(user, token) {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));

    // Check if there was a pending action before login (e.g. guest clicked "Add to Cart")
    const pendingRaw = localStorage.getItem('mkstore_pending_action');
    if (pendingRaw) {
        try {
            const pending = JSON.parse(pendingRaw);
            localStorage.removeItem('mkstore_pending_action');
            if (pending.action === 'add_to_cart' && pending.product) {
                const cartKey = `mkstore_cart_${user.id}`;
                let cart = JSON.parse(localStorage.getItem(cartKey)) || [];
                const pId = pending.product._id || pending.product.id;
                const exist = cart.find(i => (i._id || i.id) === pId);
                const qty = pending.product.quantity || 1;
                if (exist) {
                    exist.quantity = (exist.quantity || 1) + qty;
                } else {
                    cart.push({
                        _id: pId,
                        name: pending.product.name,
                        price: parseFloat(pending.product.price) || 0,
                        image: pending.product.image || 'assets/placeholder.png',
                        quantity: qty
                    });
                }
                localStorage.setItem(cartKey, JSON.stringify(cart));

                // Sync with backend /api/cart
                fetch('/api/cart', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
                    body: JSON.stringify({ items: cart })
                }).catch(() => {});

                showNotification(`Added ${pending.product.name} to your cart! Redirecting to cart...`, 'success');
                setTimeout(() => window.location.href = 'cart.html', 1000);
                return;
            }
        } catch (e) {
            console.error('Pending auth action error:', e);
        }
    }

    const urlParams = new URLSearchParams(window.location.search);
    const redirect = urlParams.get('redirect');
    if (redirect) {
        setTimeout(() => window.location.href = redirect, 1000);
        return;
    }

    setTimeout(() => {
        window.location.href = user.role === 'admin' ? 'admin.html' : 'index.html';
    }, 1000);
}

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');

    // Password Toggle Linkage
    const toggleBtns = document.querySelectorAll('#togglePassword, .togglePassword');
    toggleBtns.forEach(btn => {
        btn.addEventListener('click', function () {
            const input = this.closest('.form-group, .input-group, div').querySelector('input');
            const icon = this.querySelector('i');
            if (input.type === 'password') {
                input.type = 'text';
                icon.classList.replace('fa-eye', 'fa-eye-slash');
            } else {
                input.type = 'password';
                icon.classList.replace('fa-eye-slash', 'fa-eye');
            }
        });
    });

    // Check if redirected from restricted page
    const urlParams = new URLSearchParams(window.location.search);
    const redirect = urlParams.get('redirect');
    if (redirect) {
        const infoMsg = document.createElement('div');
        infoMsg.className = 'auth-redirect-notice';
        infoMsg.innerHTML = '<i class="fa-solid fa-lock"></i> Please sign in to continue with your checkout / purchase.';
        const formContainer = document.querySelector('.login-form') || document.querySelector('.register-form');
        if (formContainer) {
            formContainer.insertBefore(infoMsg, formContainer.children[1] || null);
        }
    }

    // Login Handling
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value.trim();
            const password = document.getElementById('password').value.trim();
            const btn = loginForm.querySelector('button[type="submit"]');

            try {
                setLoading(btn, true, 'Logging in...');
                const res = await fetch(`${API_URL}/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });
                const data = await res.json();

                if (res.ok) {
                    showNotification('Login Successful! Welcome back.', 'success');
                    handlePostAuth(data.user, data.token);
                } else {
                    showNotification(data.msg || 'Login failed. Check your credentials.', 'error');
                    setLoading(btn, false, 'Login');
                }
            } catch (err) {
                console.error(err);
                showNotification('Login request failed. Please check connection.', 'error');
                setLoading(btn, false, 'Login');
            }
        });
    }

    // Register Handling
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = document.getElementById('reg-name').value.trim();
            const email = document.getElementById('reg-email').value.trim();
            const password = document.getElementById('reg-password').value.trim();
            const confirmPass = document.getElementById('reg-confirm').value.trim();
            const btn = registerForm.querySelector('button[type="submit"]');

            if (password !== confirmPass) {
                showNotification('Passwords do not match', 'error');
                return;
            }

            try {
                setLoading(btn, true, 'Creating Account...');
                const res = await fetch(`${API_URL}/register`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, email, password })
                });
                const data = await res.json();

                if (res.ok) {
                    showNotification('Account Created Successfully! Welcome to M.K. Store.', 'success');
                    handlePostAuth(data.user, data.token);
                } else {
                    console.error('Registration failed:', data);
                    showNotification(data.msg || 'Registration failed', 'error');
                    setLoading(btn, false, 'Register');
                }
            } catch (err) {
                console.error(err);
                showNotification('Registration failed. Please try again.', 'error');
                setLoading(btn, false, 'Register');
            }
        });
    }
});

function setLoading(btn, isLoading, text) {
    if (!btn) return;
    btn.disabled = isLoading;
    btn.innerHTML = isLoading ? `<i class="fa fa-spinner fa-spin"></i> ${text}` : text;
}

function showNotification(msg, type = 'success') {
    if (window.showToast) {
        window.showToast(msg, type);
        return;
    }
    const div = document.createElement('div');
    div.className = `notification ${type}`;
    div.textContent = msg;
    div.style.cssText = `
        position: fixed; bottom: 30px; right: 30px; padding: 15px 30px;
        border-radius: 12px; color: white; z-index: 100000;
        box-shadow: 0 10px 25px rgba(0,0,0,0.2); font-weight: 600;
        background: ${type === 'error' ? '#ef4444' : '#10b981'};
    `;
    document.body.appendChild(div);
    setTimeout(() => {
        div.style.opacity = '0';
        div.style.transform = 'translateY(20px)';
        div.style.transition = 'all 0.3s ease';
        setTimeout(() => div.remove(), 350);
    }, 4000);
}

function logout() {
    if (window.UserAuth) {
        window.UserAuth.logout();
    } else {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = 'login.html';
    }
}
