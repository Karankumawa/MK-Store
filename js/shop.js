// Shop functionality
document.addEventListener('DOMContentLoaded', function () {
    // API URL
    const PRODUCT_API = 'http://localhost:5000/api/products';

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

        // Check for search query in URL
        const urlParams = new URLSearchParams(window.location.search);
        const searchQuery = urlParams.get('search');

        if (searchQuery) {
            applySearchFilter(searchQuery);
            // Update UI to show search term
            const header = document.querySelector('.shop-header h1');
            if (header) header.innerHTML = `Search Results: "${searchQuery}" <a href="shop.html" style="font-size:0.8rem; color:var(--brand); margin-left:10px;">(Clear)</a>`;
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

        // Filter change events
        filterOptions.forEach(option => {
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
        const selectedCategories = Array.from(document.querySelectorAll('.filter-option input[name="category"]:checked'))
            .map(input => input.value);

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
                if (selectedPriceRange === '6+') {
                    if (product.price < 6) return false;
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
            // Use API image or placeholder
            const imageSrc = product.image || 'assets/placeholder.png';
            const rating = product.rating || 4.5; // Mock rating if missing

            productElement.innerHTML = `
                <div class="product-image-wrapper">
                    <img src="${imageSrc}" alt="${product.name}" onerror="this.src='assets/placeholder.png'">
                    <div class="product-actions">
                         <button class="btn-view" onclick="console.log('View product ${product._id}')"><i class="fa-regular fa-eye"></i></button>
                    </div>
                </div>
                <div class="product-info">
                    <h3 class="product-title">${product.name}</h3>
                    <div class="product-price">$${product.price ? product.price.toFixed(2) : '0.00'}</div>
                    <div class="product-rating">
                        ${generateStars(rating)}
                    </div>
                    <button class="add-to-cart" data-product-id="${product._id}">
                         Add to Cart
                    </button>
                </div>
            `;
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

        // Attach event listeners to new buttons
        attachAddToCartListeners();
    }

    function attachAddToCartListeners() {
        document.querySelectorAll('.add-to-cart').forEach(button => {
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
