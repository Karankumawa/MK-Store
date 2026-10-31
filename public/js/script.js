// Main script helpers
document.addEventListener('DOMContentLoaded', function () {
    // Add to cart delegation for any generic .add-to-cart buttons
    const addToCartButtons = document.querySelectorAll('.add-to-cart');
    addToCartButtons.forEach(button => {
        button.addEventListener('click', function () {
            try {
                const productData = JSON.parse(this.dataset.product || '{}');
                if (window.UserCart) {
                    window.UserCart.addItem(productData, 1);
                } else {
                    alert('Please log in to add items to cart.');
                    window.location.href = 'login.html';
                }
            } catch (e) {
                console.error('Error adding to cart:', e);
            }
        });
    });

    // Mobile menu toggle
    const menuToggle = document.querySelector('.menu-toggle');
    const navLinks = document.querySelector('.nav-links');

    if (menuToggle && navLinks) {
        menuToggle.addEventListener('click', function (e) {
            e.stopPropagation();
            navLinks.classList.toggle('active');
            menuToggle.classList.toggle('active');
        });

        document.addEventListener('click', function (event) {
            if (!navLinks.contains(event.target) && !menuToggle.contains(event.target)) {
                navLinks.classList.remove('active');
                menuToggle.classList.remove('active');
            }
        });
    }

    // Initialize cart count
    if (window.updateCartCount) {
        window.updateCartCount();
    }
});
