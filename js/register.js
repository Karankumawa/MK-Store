document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('registerForm');

    // Toggle Password Visibility
    document.querySelectorAll('.togglePassword').forEach(btn => {
        btn.addEventListener('click', function () {
            const input = this.previousElementSibling;
            const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
            input.setAttribute('type', type);
            this.querySelector('i').classList.toggle('fa-eye');
            this.querySelector('i').classList.toggle('fa-eye-slash');
        });
    });

    form.addEventListener('submit', (e) => {
        e.preventDefault();

        const name = document.getElementById('reg-name').value.trim();
        const email = document.getElementById('reg-email').value.trim();
        const password = document.getElementById('reg-password').value;
        const confirm = document.getElementById('reg-confirm').value;

        // Basic Validation
        if (password !== confirm) {
            alert('Passwords do not match!');
            return;
        }

        if (password.length < 6) {
            alert('Password must be at least 6 characters.');
            return;
        }

        // Simulate API Registration
        const submitBtn = form.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fa fa-spinner fa-spin"></i> Creating Account...';

        setTimeout(() => {
            // Success
            alert('Registration Successful! Please login.');

            // Optional: Auto-login logic could go here, but usually redirect to login is safer
            window.location.href = 'login.html';
        }, 1500);
    });
});
