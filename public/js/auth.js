const API_URL = '/api/auth';

// Firebase Configuration
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
        showNotification('Firebase not loaded', 'error');
        return;
    }
    const provider = new firebase.auth.GoogleAuthProvider();
    firebase.auth().signInWithPopup(provider)
        .then((result) => {
            const user = result.user;

            // Get ID token
            user.getIdToken().then(async (idToken) => {
                try {
                    // Send token to backend for verification
                    const res = await fetch(`${API_URL}/google`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ token: idToken })
                    });

                    const data = await res.json();

                    if (res.ok) {
                        localStorage.setItem('token', data.token);
                        localStorage.setItem('user', JSON.stringify(data.user));
                        showNotification(`Welcome, ${data.user.username}!`, 'success');
                        setTimeout(() => window.location.href = 'index.html', 1000);
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
                    localStorage.setItem('token', data.token);
                    localStorage.setItem('user', JSON.stringify(data.user));
                    showNotification('Login Successful', 'success');
                    setTimeout(() => {
                        window.location.href = data.user.role === 'admin' ? 'admin.html' : 'index.html';
                    }, 1000);
                } else {
                    showNotification(data.msg || 'Login failed', 'error');
                    setLoading(btn, false, 'Login');
                }
            } catch (err) {
                console.error(err);
                showNotification('Login failed. Please try again.', 'error');
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
                setLoading(btn, true, 'Creating...');
                const res = await fetch(`${API_URL}/register`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, email, password })
                });
                const data = await res.json();

                if (res.ok) {
                    localStorage.setItem('token', data.token);
                    localStorage.setItem('user', JSON.stringify(data.user));
                    showNotification('Registration Successful! Redirecting...', 'success');
                    setTimeout(() => window.location.href = 'index.html', 1500);
                } else {
                    console.error('Registration failed:', data);
                    showNotification(data.msg || 'Registration failed', 'error');
                    setLoading(btn, false, 'Register');
                }
            } catch (err) {
                console.error(err);
                showNotification('Registration failed', 'error');
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
    const div = document.createElement('div');
    div.className = `notification ${type}`;
    div.textContent = msg;
    div.style.cssText = `
        position: fixed; bottom: 30px; right: 30px; padding: 15px 30px;
        border-radius: 12px; color: white; z-index: 100000;
        box-shadow: 0 10px 25px rgba(0,0,0,0.2); font-weight: 600;
        background: ${type === 'error' ? '#ef4444' : '#10b981'};
        animation: slideIn 0.3s ease-out;
    `;
    document.body.appendChild(div);
    setTimeout(() => {
        div.style.opacity = '0';
        div.style.transform = 'translateY(20px)';
        div.style.transition = 'all 0.3s ease';
        setTimeout(() => div.remove(), 350);
    }, 4000);
}

// Add CSS animation for notification
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
`;
document.head.appendChild(style);

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'login.html';
}
