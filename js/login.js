// Login Functionality
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');

    // Check if already logged in
    const token = localStorage.getItem('token');
    if (token) {
        // Optional: Verify token valid? For now just redirect if visiting login page
        // window.location.href = 'index.html';
    }

    // Toggle Password Visibility
    const toggleBtn = document.getElementById('togglePassword');
    if (toggleBtn) {
        toggleBtn.addEventListener('click', function () {
            const input = document.getElementById('password');
            const icon = this.querySelector('i');
            if (input.type === 'password') {
                input.type = 'text';
                icon.classList.remove('fa-eye');
                icon.classList.add('fa-eye-slash');
            } else {
                input.type = 'password';
                icon.classList.remove('fa-eye-slash');
                icon.classList.add('fa-eye');
            }
        });
    }

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const email = document.getElementById('email').value.trim();
            const password = document.getElementById('password').value.trim();
            const btn = loginForm.querySelector('button[type="submit"]');

            try {
                btn.disabled = true;
                btn.innerHTML = '<i class="fa fa-spinner fa-spin"></i> Logging in...';

                const res = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });

                const data = await res.json();

                if (!res.ok) {
                    throw new Error(data.msg || 'Login failed');
                }

                // Success
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));

                showNotification('Login successful!', 'success');

                setTimeout(() => {
                    // Redirect based on role
                    if (data.user.role === 'admin') {
                        window.location.href = 'admin.html';
                    } else {
                        window.location.href = 'index.html';
                    }
                }, 1000);

            } catch (err) {
                console.error(err);
                showNotification(err.message, 'error');
                btn.disabled = false;
                btn.textContent = 'Login';
            }
        });
    }

    function showNotification(msg, type = 'success') {
        const div = document.createElement('div');
        div.className = `notification ${type}`;
        div.textContent = msg;
        div.style.position = 'fixed';
        div.style.bottom = '20px';
        div.style.right = '20px';
        div.style.padding = '12px 24px';
        div.style.borderRadius = '8px';
        div.style.color = '#fff';
        div.style.background = type === 'error' ? '#ef4444' : '#22c55e';
        div.style.zIndex = '10000';
        div.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
        document.body.appendChild(div);
        setTimeout(() => div.remove(), 3000);
    }
});
