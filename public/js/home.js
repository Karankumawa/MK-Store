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

        grid.innerHTML = featured.map(product => {
            // Replicating the Shop Page card structure for consistency
            const imageSrc = product.image || 'assets/placeholder.png';
            const rating = product.rating || 4.5;

            // Random Badges for visual interest
            let badgeHtml = '';
            if (product.price > 50 && product.price < 100) badgeHtml = '<span class="badge sale" style="position:absolute; top:1rem; left:1rem;">Sale</span>';
            else if (Math.random() > 0.8) badgeHtml = '<span class="badge new" style="position:absolute; top:1rem; left:1rem;">New</span>';

            // Generate stars
            let starsHtml = '';
            for (let i = 1; i <= 5; i++) {
                if (i <= rating) starsHtml += '<i class="fa fa-star"></i>';
                else if (i - 0.5 <= rating) starsHtml += '<i class="fa fa-star-half-stroke"></i>';
                else starsHtml += '<i class="fa-regular fa-star"></i>';
            }

            return `
            <div class="product" onclick="window.location.href = 'product.html?id=${product._id}'" style="cursor:pointer; position:relative;">
                <div class="product-image-wrapper">
                    ${badgeHtml}
                    <img src="${imageSrc}" alt="${product.name}" onerror="this.src='assets/placeholder.png'">
                    <div class="product-actions">
                         <button class="action-btn" onclick="event.stopPropagation(); console.log('Wishlist ${product._id}')">
                            <i class="fa-regular fa-heart"></i>
                         </button>
                         <button class="action-btn" onclick="event.stopPropagation(); window.location.href='product.html?id=${product._id}'">
                            <i class="fa-regular fa-eye"></i>
                         </button>
                    </div>
                </div>
                <div class="product-info">
                    <div class="product-category" style="font-size:0.75rem; text-transform:uppercase; color:#64748b; font-weight:600; margin-bottom:0.4rem;">${product.category || 'General'}</div>
                    <h3 class="product-title" style="font-size:1.1rem; font-weight:600; color:#0f172a; margin-bottom:0.5rem;">${product.name}</h3>
                    <div class="rating-stars" style="color:#fbbf24; font-size:0.85rem; margin-bottom:0.75rem; display:flex; gap:4px;">
                        ${starsHtml} <span class="rating-text" style="color:#64748b;">(${Math.floor(Math.random() * 200) + 50})</span>
                    </div>
                    <div class="price-row" style="display:flex; justify-content:space-between; items-align:center;">
                        <div class="product-price" style="font-size:1.25rem; font-weight:700; color:#0f172a;">$${product.price ? product.price.toFixed(2) : '0.00'}</div>
                        <button class="add-btn" style="background:#4f46e5; color:white; border:none; padding:0.6rem 1rem; border-radius:8px; font-weight:600; cursor:pointer;" onclick="event.stopPropagation(); addToCartHome({_id: '${product._id}', name: '${product.name.replace(/'/g, "\\'")}', price: ${product.price}, image: '${product.image}'})">
                             Add
                        </button>
                    </div>
                </div>
            </div>
            `;
        }).join('');

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

// Slider Navigation Logic
document.addEventListener('DOMContentLoaded', () => {
    const slider = document.getElementById('home-products-grid');
    const prevBtn = document.getElementById('home-prev-btn');
    const nextBtn = document.getElementById('home-next-btn');

    if (slider && prevBtn && nextBtn) {
        prevBtn.addEventListener('click', () => {
            slider.scrollBy({ left: -300, behavior: 'smooth' });
        });

        nextBtn.addEventListener('click', () => {
            slider.scrollBy({ left: 300, behavior: 'smooth' });
        });
    }
});
