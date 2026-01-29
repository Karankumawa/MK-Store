// Shop functionality
document.addEventListener('DOMContentLoaded', function () {
    // API URL
    const PRODUCT_API = '/api/products';

    // Initialize variables
    let products = [];
    let filteredProducts = [];
    let currentPage = 1;
    const productsPerPage = 8;

    // DOM Elements
    const productGrid = document.querySelector('.product-grid');
    const filterOptions = document.querySelectorAll('.filter-option input');
    const sortSelect = document.querySelector('.sort-options select');
    const filterToggle = document.querySelector('.filter-toggle');
    const filters = document.querySelector('.filters');
    const closeFilters = document.querySelector('.close-filters');
    const prevPageBtn = document.querySelector('.prev-page');
    const nextPageBtn = document.querySelector('.next-page');
    const pageNumbers = document.querySelector('.page-numbers');

    // Initialize the shop
    async function initShop() {
        await fetchProducts();

        // Check for search OR category query in URL
        const urlParams = new URLSearchParams(window.location.search);
        const searchQuery = urlParams.get('search');
        const categoryQuery = urlParams.get('category') || window.pageCategory;

        if (searchQuery) {
            applySearchFilter(searchQuery);
            const header = document.querySelector('.shop-header h1');
            if (header) header.innerHTML = `Search Results: "${searchQuery}" <a href="shop.html" style="font-size:0.8rem; color:var(--brand); margin-left:10px;">(Clear)</a>`;
        } else if (categoryQuery) {
            applyCategoryFilter(categoryQuery);
            const header = document.querySelector('.shop-header h1');
            if (header) header.innerHTML = `Category: "${categoryQuery}" <a href="shop.html" style="font-size:0.8rem; color:var(--brand); margin-left:10px;">(Clear)</a>`;

            // Highlight active pill
            document.querySelectorAll('.cat-pill').forEach(pill => {
                pill.classList.remove('active');
                if (pill.dataset.cat && pill.dataset.cat.toLowerCase() === categoryQuery.toLowerCase()) {
                    pill.classList.add('active');
                }
            });
        } else {
            // No queries - Show all products
            displayProducts();
        }

        updateCartCount();
        setupEventListeners();
    }

    // Apply Search Filter
    function applySearchFilter(query) {
        const lowerQuery = query.toLowerCase();
        filteredProducts = products.filter(p =>
            p.name.toLowerCase().includes(lowerQuery) ||
            (p.category && p.category.toLowerCase().includes(lowerQuery))
        );
        currentPage = 1;
        displayProducts();
    }

    // Apply Category Filter
    function applyCategoryFilter(cat) {
        const lowerCat = cat.toLowerCase();
        filteredProducts = products.filter(p =>
            p.category && p.category.toLowerCase().includes(lowerCat)
        );
        currentPage = 1;
        displayProducts();
    }

    // Fetch Products from API
    async function fetchProducts() {
        if (!productGrid) return;

        productGrid.innerHTML = '<p class="loading-text">Loading products...</p>';

        try {
            const res = await fetch(PRODUCT_API);
            if (!res.ok) throw new Error('Failed to fetch products');

            products = await res.json();
            // Default: Show all unless searched
            filteredProducts = [...products];

            // Note: displayProducts() is called after search check in initShop()

        } catch (err) {
            console.error(err);
            productGrid.innerHTML = '<p class="error-text">Error loading products. Please try again later.</p>';
        }
    }

    // Setup event listeners
    function setupEventListeners() {
        // Filter toggle for mobile
        if (filterToggle) {
            filterToggle.addEventListener('click', () => {
                filters.classList.add('active');
            });
        }

        if (closeFilters) {
            closeFilters.addEventListener('click', () => {
                filters.classList.remove('active');
            });
        }

        // Filter change events - Support both shop.html (chips) and category pages (options)
        const allFilterInputs = document.querySelectorAll('.filter-chips input, .filter-option input');
        allFilterInputs.forEach(option => {
            option.addEventListener('change', applyFilters);
        });

        // Sort change event
        if (sortSelect) {
            sortSelect.addEventListener('change', applySorting);
        }

        // Pagination events
        if (prevPageBtn) {
            prevPageBtn.addEventListener('click', () => {
                if (currentPage > 1) {
                    currentPage--;
                    displayProducts();
                }
            });
        }

        if (nextPageBtn) {
            nextPageBtn.addEventListener('click', () => {
                const totalPages = Math.ceil(filteredProducts.length / productsPerPage);
                if (currentPage < totalPages) {
                    currentPage++;
                    displayProducts();
                }
            });
        }
    }

    // Apply filters
    function applyFilters() {
        let selectedCategories = [];

        // Check URL param OR page context
        const urlParams = new URLSearchParams(window.location.search);
        const currentCategory = urlParams.get('category') || window.pageCategory;
        if (currentCategory) selectedCategories.push(currentCategory);

        // Get selected price and rating from either input type
        const selectedPriceRange = document.querySelector('input[name="price"]:checked')?.value;
        const selectedRating = document.querySelector('input[name="rating"]:checked')?.value;

        filteredProducts = products.filter(product => {
            // Category filter
            if (selectedCategories.length > 0) {
                const productCat = (product.category || '').toLowerCase();
                const matches = selectedCategories.some(cat => productCat.includes(cat.toLowerCase()));
                if (!matches) return false;
            }

            // Price range filter
            if (selectedPriceRange) {
                // Handle "100+" or "6+" format
                if (selectedPriceRange.includes('+')) {
                    const min = parseFloat(selectedPriceRange.replace('+', ''));
                    if (product.price < min) return false;
                } else {
                    const [min, max] = selectedPriceRange.split('-').map(Number);
                    if (product.price < min || product.price > max) {
                        return false;
                    }
                }
            }

            // Rating filter
            const rating = product.rating || 0;
            if (selectedRating && rating < Number(selectedRating.replace('+', ''))) {
                return false;
            }

            return true;
        });

        currentPage = 1;
        displayProducts();
    }

    // Apply sorting
    function applySorting() {
        const sortValue = sortSelect.value;

        filteredProducts.sort((a, b) => {
            switch (sortValue) {
                case 'price-low':
                    return a.price - b.price;
                case 'price-high':
                    return b.price - a.price;
                case 'rating':
                    return (b.rating || 0) - (a.rating || 0);
                default:
                    return 0;
            }
        });

        displayProducts();
    }

    function generateStars(rating) {
        let starsHtml = '';
        for (let i = 1; i <= 5; i++) {
            if (i <= rating) {
                starsHtml += '<i class="fa fa-star"></i>';
            } else if (i - 0.5 <= rating) {
                starsHtml += '<i class="fa fa-star-half-stroke"></i>';
            } else {
                starsHtml += '<i class="fa-regular fa-star"></i>';
            }
        }
        return starsHtml;
    }

    // Display products
    function displayProducts() {
        if (!productGrid) return;

        // Determine if we are in "Default View" (No search, no category filter selected, first page)
        const urlParams = new URLSearchParams(window.location.search);
        const searchQuery = urlParams.get('search');
        // Note: filteredProducts might be filtered by sidebar options even if URL is clean
        // We check if we are filtering.

        // Simple heuristic: If filteredProducts.length === products.length, we are likely in default view.
        // BUT, we want to allow sidebar filtering to trigger Grid View.
        // So we check our internal state variables or URL.
        const activeCategory = urlParams.get('category') || window.pageCategory;
        const isFiltering = searchQuery || activeCategory ||
            document.querySelector('input[name="price"]:checked') ||
            document.querySelector('input[name="rating"]:checked') ||
            (sortSelect && sortSelect.value !== 'default');

        if (!isFiltering && currentPage === 1) {
            displayCategorySliders();
        } else {
            displayGridView();
        }
    }

    function displayCategorySliders() {
        productGrid.innerHTML = '';
        productGrid.classList.add('view-mode-slider');
        // Hide pagination in slider view
        if (pageNumbers) pageNumbers.parentElement.style.display = 'none';

        if (products.length === 0) {
            productGrid.innerHTML = '<p class="no-products">No products found.</p>';
            return;
        }

        // Group products by category
        const categories = {};
        products.forEach(p => {
            const cat = p.category || 'Other';
            if (!categories[cat]) categories[cat] = [];
            categories[cat].push(p);
        });

        // Sort categories if needed, or just iterate properties
        Object.keys(categories).sort().forEach(catName => {
            const catProducts = categories[catName];
            if (catProducts.length === 0) return;

            const section = document.createElement('div');
            section.className = 'category-section';

            const productCardsHtml = catProducts.map(product => createProductCardHtml(product)).join('');

            section.innerHTML = `
                <div class="category-title-row">
                    <h2 class="category-title">${catName}</h2>
                    <a href="shop.html?category=${encodeURIComponent(catName)}" class="view-all-link">View All</a>
                </div>
                <div class="product-slider">
                    ${productCardsHtml}
                </div>
            `;
            productGrid.appendChild(section);
        });

        attachAddToCartListeners();
    }

    function displayGridView() {
        productGrid.classList.remove('view-mode-slider');
        // Show pagination
        if (pageNumbers) pageNumbers.parentElement.style.display = 'flex';

        const start = (currentPage - 1) * productsPerPage;
        const end = start + productsPerPage;
        const productsToShow = filteredProducts.slice(start, end);

        productGrid.innerHTML = '';

        if (productsToShow.length === 0) {
            productGrid.innerHTML = '<p class="no-products">No products found matching your criteria.</p>';
            if (pageNumbers) pageNumbers.textContent = '0 / 0';
            return;
        }

        productsToShow.forEach(product => {
            const productElement = document.createElement('div');
            productElement.className = 'product';
            productElement.onclick = () => window.location.href = `product.html?id=${product._id}`;
            productElement.innerHTML = createProductCardInnerHtml(product);
            productGrid.appendChild(productElement);
        });

        // Update pagination
        if (pageNumbers) {
            const totalPages = Math.ceil(filteredProducts.length / productsPerPage);
            pageNumbers.textContent = totalPages > 0 ? `${currentPage} / ${totalPages}` : '0 / 0';
        }

        if (prevPageBtn) {
            prevPageBtn.disabled = currentPage === 1;
        }

        if (nextPageBtn) {
            const totalPages = Math.ceil(filteredProducts.length / productsPerPage);
            nextPageBtn.disabled = currentPage >= totalPages || totalPages === 0;
        }

        attachAddToCartListeners();
    }

    // Helper to generate full card HTML string (for slider)
    function createProductCardHtml(product) {
        return `
            <div class="product" onclick="window.location.href = 'product.html?id=${product._id}'">
                ${createProductCardInnerHtml(product)}
            </div>
        `;
    }

    // Helper for inner content (reused)
    function createProductCardInnerHtml(product) {
        // Image & Badges
        const imageSrc = product.image || 'assets/placeholder.png';
        const rating = product.rating || 4.5;

        let badgeHtml = '';
        if (product.price > 50 && product.price < 100) badgeHtml = '<span class="badge sale">Sale</span>';
        else if (Math.random() > 0.8) badgeHtml = '<span class="badge new">New</span>';

        return `
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
                <div class="product-category">${product.category || 'General'}</div>
                <h3 class="product-title">${product.name}</h3>
                <div class="rating-stars">
                    ${generateStars(rating)} <span class="rating-text">(${Math.floor(Math.random() * 200) + 50})</span>
                </div>
                <div class="price-row">
                    <div class="product-price">$${product.price ? product.price.toFixed(2) : '0.00'}</div>
                    <button class="add-btn add-to-cart-btn" data-product-id="${product._id}" onclick="event.stopPropagation()">
                            Add
                    </button>
                </div>
            </div>
        `;
    }

    function attachAddToCartListeners() {
        document.querySelectorAll('.add-to-cart-btn').forEach(button => {
            button.addEventListener('click', function () {
                const productId = this.getAttribute('data-product-id');
                const product = products.find(p => p._id === productId);
                if (product) {
                    addToCart(product);
                    showNotification(`${product.name} added to cart!`);
                }
            });
        });
    }

    // Add to cart functionality
    function addToCart(product) {
        let cart = JSON.parse(localStorage.getItem('cart')) || [];
        // Use _id for uniqueness since we have it now
        const existingItem = cart.find(item => item._id === product._id);

        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            cart.push({
                _id: product._id,
                name: product.name,
                price: product.price,
                image: product.image,
                quantity: 1
            });
        }

        localStorage.setItem('cart', JSON.stringify(cart));
        updateCartCount();

        // Redirect to Cart Page as requested
        window.location.href = 'cart.html';
    }

    // Update cart count
    function updateCartCount() {
        const cartCount = document.querySelector('.cart-count');
        if (cartCount) {
            const cart = JSON.parse(localStorage.getItem('cart')) || [];
            const totalItems = cart.reduce((total, item) => total + item.quantity, 0);
            cartCount.textContent = totalItems > 0 ? `(${totalItems})` : '';
            // Make sure it's visible if items exist
            if (totalItems > 0) cartCount.style.display = 'inline';
        }
    }

    // Show notification
    function showNotification(message) {
        const existing = document.querySelector('.notification');
        if (existing) existing.remove();

        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = message;
        document.body.appendChild(notification);

        // Inline styles for reliability
        Object.assign(notification.style, {
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            background: '#28a745',
            color: 'white',
            padding: '12px 24px',
            borderRadius: '8px',
            zIndex: '9999',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            fontSize: '1rem',
            opacity: '0',
            transform: 'translateY(20px)',
            transition: 'all 0.3s ease'
        });

        // Trigger animation
        requestAnimationFrame(() => {
            notification.style.opacity = '1';
            notification.style.transform = 'translateY(0)';
        });

        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateY(20px)';
            setTimeout(() => {
                if (notification.parentNode) notification.parentNode.removeChild(notification);
            }, 300);
        }, 3000);
    }

    // Initialize the shop when the DOM is loaded
    initShop();
});
