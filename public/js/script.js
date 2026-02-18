// Main functionality
document.addEventListener('DOMContentLoaded', function () {
    // Initialize cart from localStorage
    let cart = JSON.parse(localStorage.getItem('cart')) || [];

    // Add to cart functionality
    const addToCartButtons = document.querySelectorAll('.add-to-cart');
    addToCartButtons.forEach(button => {
        button.addEventListener('click', function () {
            const productData = JSON.parse(this.dataset.product);
            let cart = JSON.parse(localStorage.getItem('cart')) || [];

            // Check if product already exists in cart
            const existingProduct = cart.find(item => item.name === productData.name);
            if (existingProduct) {
                existingProduct.quantity = (existingProduct.quantity || 1) + 1;
            } else {
                productData.quantity = 1;
                cart.push(productData);
            }

            localStorage.setItem('cart', JSON.stringify(cart));
            updateCartCount();

            // Show notification
            showNotification('Product added to cart!');
        });
    });

    // Update cart count in header
    function updateCartCount() {
        const cartCount = document.querySelector('.cart-count');
        if (cartCount) {
            const totalItems = cart.reduce((total, item) => total + item.quantity, 0);
            cartCount.textContent = totalItems > 0 ? `(${totalItems})` : '';
            cartCount.style.display = totalItems > 0 ? 'inline-flex' : 'none';
        }
    }

    // Show notification
    function showNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.classList.add('show');
        }, 100);

        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 3000);
    }

    // Initialize cart count on page load
    updateCartCount();

    // Mobile menu toggle
    const menuToggle = document.querySelector('.menu-toggle');
    const navLinks = document.querySelector('.nav-links');

    if (menuToggle) {
        menuToggle.addEventListener('click', function () {
            navLinks.classList.toggle('active');
            menuToggle.classList.toggle('active');
        });
    }

    // Close mobile menu when clicking outside
    document.addEventListener('click', function (event) {
        if (!event.target.closest('.nav-links') && !event.target.closest('.menu-toggle')) {
            navLinks.classList.remove('active');
            menuToggle.classList.remove('active');
        }
    });

    // Search functionality
    const searchInput = document.getElementById('search-input');
    const searchButton = document.getElementById('search-button');

    const performSearch = () => {
        const searchTerm = (searchInput?.value || '').trim();
        if (searchTerm) {
            window.location.href = `search.html?search=${encodeURIComponent(searchTerm)}`;
        }
    };

    if (searchButton) {
        searchButton.addEventListener('click', performSearch);
    }
    if (searchInput) {
        searchInput.addEventListener('keydown', function (e) {
            if (e.key === 'Enter') performSearch();
        });
    }

    // Scroll-triggered animations
    const animatedNodes = document.querySelectorAll('[data-animate]');
    if (animatedNodes.length) {
        const io = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('in-view');
                    io.unobserve(entry.target);
                }
            });
        }, { root: null, rootMargin: '0px 0px -10% 0px', threshold: 0.15 });

        animatedNodes.forEach((el) => io.observe(el));
    }
});
