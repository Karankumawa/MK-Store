// Cart functionality
document.addEventListener('DOMContentLoaded', function () {
    // Initialize cart from localStorage
    let cart = JSON.parse(localStorage.getItem('cart')) || [];

    // Add checkout button functionality
    const checkoutBtn = document.querySelector('.checkout-btn'); // Assuming a button with class 'checkout-btn' exists
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', () => {
            const currentCart = JSON.parse(localStorage.getItem('cart')) || [];
            if (currentCart.length === 0) {
                alert('Your cart is empty!');
                return;
            }
            window.location.href = 'checkout.html';
        });
    }

    // Display cart items
    function displayCartItems() {
        const cartItems = document.querySelector('.cart-items');
        const emptyCart = document.querySelector('.empty-cart');
        const cartSummary = document.querySelector('.cart-summary');

        if (cart.length === 0) {
            if (emptyCart) emptyCart.style.display = 'block';
            if (cartItems) cartItems.style.display = 'none';
            if (cartSummary) cartSummary.style.display = 'none';
            return;
        }

        if (emptyCart) emptyCart.style.display = 'none';
        if (cartItems) cartItems.style.display = 'block';
        if (cartSummary) cartSummary.style.display = 'block';

        if (cartItems) {
            cartItems.innerHTML = '';
            cart.forEach((item, index) => {
                const cartItem = document.createElement('div');
                cartItem.className = 'cart-item';
                cartItem.innerHTML = `
                    <img src="${item.image}" alt="${item.name}" class="item-image" onerror="this.src='assets/placeholder.png'">
                    <div class="cart-item-details">
                        <div class="cart-item-title">${item.name}</div>
                        <div class="cart-item-price">$${item.price}</div>
                        <div class="quantity-control">
                            <button class="quantity-btn minus" data-index="${index}">-</button>
                            <input type="number" class="quantity-input" value="${item.quantity}" min="1">
                            <button class="quantity-btn plus" data-index="${index}">+</button>
                        </div>
                    </div>
                    <button class="remove-item" data-index="${index}">
                        <i class="fa fa-trash"></i>
                    </button>
                `;
                cartItems.appendChild(cartItem);
            });

            // Add event listeners for quantity buttons
            document.querySelectorAll('.quantity-btn').forEach(button => {
                button.addEventListener('click', function () {
                    const index = this.dataset.index;
                    if (this.classList.contains('minus')) {
                        updateQuantity(index, -1);
                    } else {
                        updateQuantity(index, 1);
                    }
                });
            });

            // Add event listeners for remove buttons
            document.querySelectorAll('.remove-item').forEach(button => {
                button.addEventListener('click', function () {
                    const index = this.dataset.index;
                    removeItem(index);
                });
            });

            // Add event listeners for quantity inputs
            document.querySelectorAll('.quantity-input').forEach((input, idx) => {
                input.addEventListener('change', function () {
                    const newQuantity = parseInt(this.value);
                    if (newQuantity > 0) {
                        cart[idx].quantity = newQuantity;
                        localStorage.setItem('cart', JSON.stringify(cart));
                        updateCartSummary();
                        updateCartCount();
                    }
                });
            });
        }
    }

    // Update quantity
    function updateQuantity(index, change) {
        index = parseInt(index);
        cart[index].quantity += change;
        if (cart[index].quantity < 1) {
            cart[index].quantity = 1;
        }
        localStorage.setItem('cart', JSON.stringify(cart));
        displayCartItems();
        updateCartSummary();
        updateCartCount();
    }

    // Remove item from cart
    function removeItem(index) {
        index = parseInt(index);
        cart.splice(index, 1);
        localStorage.setItem('cart', JSON.stringify(cart));
        displayCartItems();
        updateCartSummary();
        updateCartCount();
    }

    // Update cart summary
    function updateCartSummary() {
        const subtotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
        const shipping = subtotal > 50 ? 0 : (subtotal === 0 ? 0 : 5);
        const total = subtotal + shipping;

        const subtotalElement = document.querySelector('.subtotal');
        const shippingElement = document.querySelector('.shipping');
        const totalElement = document.querySelector('.total-amount');

        if (subtotalElement) subtotalElement.textContent = `$${subtotal.toFixed(2)}`;
        if (shippingElement) shippingElement.textContent = shipping === 0 ? 'Free' : `$${shipping.toFixed(2)}`;
        if (totalElement) totalElement.textContent = `$${total.toFixed(2)}`;
    }

    // Update cart count in header
    function updateCartCount() {
        const cartCount = document.querySelector('.cart-count');
        if (cartCount) {
            const totalItems = cart.reduce((total, item) => total + item.quantity, 0);
            cartCount.textContent = totalItems > 0 ? `(${totalItems})` : '';
            cartCount.style.display = totalItems > 0 ? 'inline' : 'none';
        }
    }

    // Initialize cart display and summary
    displayCartItems();
    updateCartSummary();
    updateCartCount();
});
