// Login functionality
document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    const socialButtons = document.querySelectorAll('.social-btn');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const rememberCheckbox = document.getElementById('remember');

    // Show error message
    function showError(input, message) {
        const formGroup = input.parentElement;
        const error = formGroup.querySelector('.error-message') || document.createElement('div');
        error.className = 'error-message';
        error.textContent = message;
        if (!formGroup.querySelector('.error-message')) {
            formGroup.appendChild(error);
        }
        input.classList.add('error');
    }

    // Remove error message
    function removeError(input) {
        const formGroup = input.parentElement;
        const error = formGroup.querySelector('.error-message');
        if (error) {
            formGroup.removeChild(error);
        }
        input.classList.remove('error');
    }

    // Validate email
    function validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }

    // Show notification
    function showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fa ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-times-circle' : 'fa-info-circle'}"></i>
                <span>${message}</span>
            </div>
        `;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.classList.add('show');
        }, 100);

        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }

    // Handle form submission
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        let isValid = true;
        
        const email = emailInput.value.trim();
        const password = passwordInput.value.trim();
        const rememberMe = rememberCheckbox.checked;

        // Validate email
        if (!email) {
            showError(emailInput, 'Email is required');
            isValid = false;
        } else if (!validateEmail(email)) {
            showError(emailInput, 'Please enter a valid email');
            isValid = false;
        } else {
            removeError(emailInput);
        }

        // Validate password
        if (!password) {
            showError(passwordInput, 'Password is required');
            isValid = false;
        } else if (password.length < 6) {
            showError(passwordInput, 'Password must be at least 6 characters');
            isValid = false;
        } else {
            removeError(passwordInput);
        }

        if (isValid) {
            // Show loading state
            const submitBtn = loginForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fa fa-spinner fa-spin"></i> Logging in...';

            // Simulate API call
            setTimeout(() => {
                // Store login state if remember me is checked
                if (rememberMe) {
                    localStorage.setItem('userEmail', email);
                } else {
                    localStorage.removeItem('userEmail');
                }

                // Show success message
                showNotification('Login successful!', 'success');
                
                // Redirect to home page
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 1500);
            }, 1500);
        }
    });

    // Handle social login buttons
    socialButtons.forEach(button => {
        button.addEventListener('click', function() {
            const provider = this.classList.contains('google') ? 'Google' : 'Facebook';
            
            // Show loading state
            const originalText = this.textContent;
            this.disabled = true;
            this.innerHTML = '<i class="fa fa-spinner fa-spin"></i> Logging in...';

            // Simulate social login
            setTimeout(() => {
                showNotification(`Logging in with ${provider}...`, 'info');
                
                // Reset button state
                this.disabled = false;
                this.innerHTML = originalText;
            }, 1500);
        });
    });

    // Handle forgot password link
    const forgotPassword = document.querySelector('.forgot-password');
    forgotPassword.addEventListener('click', function(e) {
        e.preventDefault();
        const email = prompt('Please enter your email address:');
        if (email) {
            if (validateEmail(email)) {
                showNotification('Password reset instructions have been sent to your email.', 'success');
            } else {
                showNotification('Please enter a valid email address.', 'error');
            }
        }
    });

    // Handle register link
    const registerLink = document.querySelector('.register-link');
    registerLink.addEventListener('click', function(e) {
        e.preventDefault();
        showNotification('Registration page coming soon!', 'info');
    });

    // Check if there's a stored email from previous session
    const storedEmail = localStorage.getItem('userEmail');
    if (storedEmail) {
        emailInput.value = storedEmail;
        rememberCheckbox.checked = true;
    }

    // Add input event listeners for real-time validation
    emailInput.addEventListener('input', function() {
        if (this.value.trim()) {
            removeError(this);
        }
    });

    passwordInput.addEventListener('input', function() {
        if (this.value.trim()) {
            removeError(this);
        }
    });
}); 
