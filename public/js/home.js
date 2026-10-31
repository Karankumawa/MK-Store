document.addEventListener('DOMContentLoaded', () => {
    fetchFeaturedProducts();
    initSliderControls();
});

let slideIndex = 0;

async function fetchFeaturedProducts() {
    startCarousel();

    const grid = document.getElementById('home-products-grid');
    if (!grid) return;

    grid.innerHTML = '<div class="loading-spinner"><i class="fa fa-spinner fa-spin"></i> Loading top deals...</div>';

    try {
        const res = await fetch('/api/products');
        if (!res.ok) throw new Error(`Server returned ${res.status}`);
        const products = await res.json();

        // Filter for specific categories relevant to deals
        const targetedCategories = ['electronics', 'grocery', 'groceries', 'essentials', 'fashion'];
        let featured = products.filter(p =>
            p.category && targetedCategories.some(t => p.category.toLowerCase().includes(t))
        );

        if (featured.length < 5) {
            const others = products.filter(p => !featured.includes(p));
            featured = [...featured, ...others];
        }

        // Shuffle and slice 8 items
        featured = featured
            .sort(() => 0.5 - Math.random())
            .slice(0, 8);

        window.homeFeaturedProducts = featured;

        if (featured.length === 0) {
            grid.innerHTML = '<div class="no-products">No deals active right now.</div>';
            return;
        }

        grid.innerHTML = featured.map(product => {
            const imageSrc = product.image || 'assets/placeholder.png';
            const rating = product.rating || 4.5;

            // Badges
            let badgeHtml = '';
            if (product.price > 50 && product.price < 100) {
                badgeHtml = '<span class="badge sale" style="position:absolute; top:1rem; left:1rem;">Sale</span>';
            } else if (rating >= 4.7) {
                badgeHtml = '<span class="badge new" style="position:absolute; top:1rem; left:1rem;">Top Rated</span>';
            }

            // Generate stars
            let starsHtml = '';
            for (let i = 1; i <= 5; i++) {
                if (i <= rating) starsHtml += '<i class="fa fa-star"></i>';
                else if (i - 0.5 <= rating) starsHtml += '<i class="fa fa-star-half-stroke"></i>';
                else starsHtml += '<i class="fa-regular fa-star"></i>';
            }

            return `
            <div class="product" onclick="window.location.href = 'product.html?id=${product._id}'">
                <div class="product-image-wrapper">
                    ${badgeHtml}
                    <img src="${imageSrc}" alt="${product.name}" onerror="this.src='assets/placeholder.png'">
                    <div class="product-actions">
                         <button class="action-btn" title="View Details" onclick="event.stopPropagation(); window.location.href='product.html?id=${product._id}'">
                            <i class="fa-regular fa-eye"></i>
                         </button>
                    </div>
                </div>
                <div class="product-info">
                    <div class="product-category">${product.category || 'General'}</div>
                    <h3 class="product-title">${product.name}</h3>
                    <div class="rating-stars">
                        ${starsHtml} <span class="rating-text">(${rating})</span>
                    </div>
                    <div class="price-row">
                        <div class="product-price">$${product.price ? product.price.toFixed(2) : '0.00'}</div>
                        <button class="add-btn" id="home-add-${product._id}" onclick="event.stopPropagation(); addToCartHome('${product._id}')">
                             Add
                        </button>
                    </div>
                </div>
            </div>
            `;
        }).join('');

    } catch (err) {
        console.error(err);
        grid.innerHTML = '<div class="error-text">Failed to load deals. <button class="btn" style="margin-top:10px;" onclick="fetchFeaturedProducts()">Retry</button></div>';
    }
}

function startCarousel() {
    const slides = document.querySelectorAll('.slide');
    if (slides.length === 0) return;

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

// Add to Cart from Home Page (Restricted to logged-in users; prompts modal for guests)
function addToCartHome(productId) {
    const product = (window.homeFeaturedProducts || []).find(p => (p._id || p.id) === productId);
    if (!product) return;

    // Use global isolated UserCart manager
    if (window.UserCart) {
        const added = window.UserCart.addItem(product, 1);
        if (!added) return; // Prompted guest modal
    } else {
        // Fallback
        alert('Please log in to add items to cart.');
        window.location.href = 'login.html';
        return;
    }

    // Button visual feedback
    const btn = document.getElementById(`home-add-${productId}`);
    if (btn) {
        const originalText = btn.innerHTML;
        btn.innerHTML = '<i class="fa fa-check"></i> Added';
        btn.style.background = '#16a34a';
        btn.style.borderColor = '#16a34a';
        setTimeout(() => {
            btn.innerHTML = originalText;
            btn.style.background = '';
            btn.style.borderColor = '';
        }, 1200);
    }
}

function showNotificationHome(message) {
    const existing = document.querySelector('.toast-notification');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = 'toast-notification';
    toast.innerHTML = message;

    Object.assign(toast.style, {
        position: 'fixed',
        bottom: '24px',
        left: '50%',
        transform: 'translateX(-50%) translateY(20px)',
        backgroundColor: '#1e293b',
        color: '#ffffff',
        padding: '12px 24px',
        borderRadius: '12px',
        boxShadow: '0 10px 25px rgba(0,0,0,0.25)',
        zIndex: '10000',
        fontSize: '0.95rem',
        fontWeight: '500',
        opacity: '0',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
    });

    document.body.appendChild(toast);

    requestAnimationFrame(() => {
        toast.style.opacity = '1';
        toast.style.transform = 'translateX(-50%) translateY(0)';
    });

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(-50%) translateY(20px)';
        setTimeout(() => toast.remove(), 300);
    }, 3500);
}

function initSliderControls() {
    const slider = document.getElementById('home-products-grid');
    const prevBtn = document.getElementById('home-prev-btn');
    const nextBtn = document.getElementById('home-next-btn');

    if (slider && prevBtn && nextBtn) {
        prevBtn.addEventListener('click', () => {
            slider.scrollBy({ left: -320, behavior: 'smooth' });
        });

        nextBtn.addEventListener('click', () => {
            slider.scrollBy({ left: 320, behavior: 'smooth' });
        });
    }
}

window.addToCartHome = addToCartHome;
window.moveSlide = moveSlide;
