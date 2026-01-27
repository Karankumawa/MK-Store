// Register Functionality
document.addEventListener('DOMContentLoaded', () => {
    const registerForm = document.getElementById('registerForm');
    const togglePasswordVideo = document.querySelectorAll('.togglePassword');

    // Toggle Password Visibility
    togglePasswordVideo.forEach(btn => {
        btn.addEventListener('click', function () {
            const input = this.previousElementSibling;
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
    });

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

            if (password.length < 6) {
                showNotification('Password must be at least 6 characters', 'error');
                return;
            }

            try {
                btn.disabled = true;
                btn.innerHTML = '<i class="fa fa-spinner fa-spin"></i> creating...';

                const res = await fetch('/api/auth/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, email, password })
                });

                const data = await res.json();

                if (!res.ok) {
                    throw new Error(data.msg || 'Registration failed');
                }

                // Success
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));

                showNotification('Registration successful! Redirecting...', 'success');
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 1500);

            } catch (err) {
                console.error(err);
                showNotification(err.message, 'error');
                btn.disabled = false;
                btn.textContent = 'Register';
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
