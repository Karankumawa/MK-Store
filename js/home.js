document.addEventListener('DOMContentLoaded', () => {
    fetchFeaturedProducts();
});

async function fetchFeaturedProducts() {
    // Start Carousel
    startCarousel();

    const grid = document.getElementById('home-products-grid');
    if (!grid) return;

    grid.innerHTML = '<div class="loading-spinner"><i class="fa fa-spinner fa-spin"></i> Loading top deals...</div>';

    try {
        const res = await fetch('/api/products');
        if (!res.ok) throw new Error(`Server returned ${res.status}`);
        const products = await res.json();

        // Filter for specific categories relevant to the section title
        const targetedCategories = ['electronics', 'grocery', 'essentials', 'fashion'];
        let featured = products.filter(p =>
            p.category && targetedCategories.some(t => p.category.toLowerCase().includes(t))
        );

        // If not enough targeted items, fill with others
        if (featured.length < 5) {
            const others = products.filter(p => !featured.includes(p));
            featured = [...featured, ...others];
        }

        // Shuffle and slice
        featured = featured
            .sort(() => 0.5 - Math.random())
        // Shuffle and slice
        featured = featured
            .sort(() => 0.5 - Math.random())
            .slice(0, 8); // Show 8 items for a nice grid (2 rows of 4)

        if (featured.length === 0) {
            grid.innerHTML = '<div class="no-products">No deals active right now.</div>';
            return;
        }

        grid.innerHTML = featured.map(product => `
            <div class="product-card-enhanced" onclick="window.location.href='product.html?id=${product._id}'" style="cursor:pointer">
                <div class="wishlist-icon" onclick="event.stopPropagation()"><i class="fa fa-heart"></i></div>
                <div class="product-img-container">
                    <img src="${product.image}" alt="${product.name}" onerror="this.src='assets/placeholder.png'">
                </div>
                <h3 class="product-title">${product.name}</h3>
                <div class="product-rating">4.5 <i class="fa fa-star" style="font-size:0.7rem"></i></div>
                <div style="margin-top:5px;">
                    <span class="product-price">$${product.price}</span>
                    <span class="product-discount">20% off</span>
                </div>
                 <button class="add-to-cart-btn" style="margin-top:10px; width:100%; padding:8px; background:#ff9f00; border:none; color:white; font-weight:600; cursor:pointer;" onclick='event.stopPropagation(); addToCartHome(${JSON.stringify(product).replace(/\'/g, "''")})'>
                    ADD TO CART
                </button>
            </div>
        `).join('');

    } catch (err) {
        console.error(err);
        grid.innerHTML = '<div class="error-text">Failed to load deals. <button onclick="fetchFeaturedProducts()">Retry</button></div>';
    }
}

let slideIndex = 0;
function startCarousel() {
    const slides = document.querySelectorAll('.slide');
    if (slides.length === 0) return;

    // Auto slide every 4 seconds
    setInterval(() => {
        moveSlide(1);
    }, 4000);
}

function moveSlide(n) {
    const slides = document.querySelectorAll('.slide');
    if (!slides.length) return;

    slides[slideIndex].classList.remove('active');
    slideIndex = (slideIndex + n + slides.length) % slides.length;
    slides[slideIndex].classList.add('active');
}

// Simple Home Page Cart Logic (Synced with localStorage)
function addToCartHome(product) {
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    const existingItem = cart.find(item => item._id === product._id);

    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({ ...product, quantity: 1 });
    }

    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCountHome();
    showNotificationHome("Product added to cart! Redirecting...");

    setTimeout(() => {
        window.location.href = 'cart.html';
    }, 800);
}

function updateCartCountHome() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const count = cart.reduce((sum, item) => sum + item.quantity, 0);
    document.querySelectorAll('.cart-count').forEach(el => el.textContent = count);
}

function showNotificationHome(message) {
    const container = document.body;
    const toast = document.createElement('div');
    toast.className = 'toast-notification';
    toast.textContent = message;

    Object.assign(toast.style, {
        position: 'fixed',
        bottom: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        backgroundColor: '#2563eb', // Brand Blue
        color: 'white',
        padding: '12px 24px',
        borderRadius: '8px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        zIndex: '10000',
        fontSize: '1rem',
        fontWeight: '500',
        opacity: '0',
        transition: 'opacity 0.3s ease, transform 0.3s ease'
    });

    container.appendChild(toast);

    // Animate In
    requestAnimationFrame(() => {
        toast.style.opacity = '1';
        toast.style.transform = 'translateX(-50%) translateY(0)';
    });

    // Remove after 3s
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(-50%) translateY(20px)';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Init Cart Count on Load
document.addEventListener('DOMContentLoaded', updateCartCountHome);
