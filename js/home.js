document.addEventListener('DOMContentLoaded', () => {
    fetchFeaturedProducts();
});

async function fetchFeaturedProducts() {
    // More specific selector to avoid targeting the About Us grid
    const grid = document.querySelector('.featured-products .product-grid');
    if (!grid) {
        console.warn('Home page product grid not found');
        return;
    }

    grid.innerHTML = '<div class="loading-spinner"><i class="fa fa-spinner fa-spin"></i> Loading essentials...</div>';

    try {
        const res = await fetch('http://localhost:5000/api/products');
        if (!res.ok) throw new Error('Failed to fetch products');
        const products = await res.json();

        // Pick 4 random products for "Everyday Essentials"
        const featured = products.sort(() => 0.5 - Math.random()).slice(0, 4);

        if (featured.length === 0) {
            grid.innerHTML = '<p class="no-products">No essentials found today. Check back soon!</p>';
            return;
        }

        grid.innerHTML = featured.map(product => `
            <div class="product" data-animate="zoom-in">
                <div class="product-image-wrapper">
                    <img src="${product.image}" alt="Image of ${product.name}" onerror="this.onerror=null;this.src='assets/placeholder.png';">
                    <div class="product-actions">
                        <button class="btn" style="padding:0.5rem 1rem; border-radius:8px; font-size:0.9rem;"
                            onclick="location.href='product-detail.html?id=${product._id}'"><i class="fa-regular fa-eye"></i> View</button>
                    </div>
                </div>
                <div class="product-info">
                    <h3>${product.name}</h3>
                    <span class="price">$${product.price}</span>
                    <div style="margin-top:0.5rem;">
                         <button class="add-to-cart" onclick='addToCartHome(${JSON.stringify(product).replace(/'/g, "&#39;")})'>
                            <i class="fa-solid fa-cart-plus"></i> Add
                        </button>
                    </div>
                </div>
            </div>
        `).join('');

    } catch (err) {
        console.error('Error loading home products:', err);
        grid.innerHTML = '<p class="error-text">Unable to load recommended products.</p>';
    }
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
    showNotificationHome("Product added to cart!");
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
