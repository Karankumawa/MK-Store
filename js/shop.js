// Shop functionality
document.addEventListener('DOMContentLoaded', function() {
    // Initialize products
    const products = [
        {
            id: 1,
            name: "Sail Sugar",
            price: 1,
            image: "assets/sail,suger&jaggery.webp",
            category: "daily-items",
            rating: 4.5
        },
        {
            id: 2,
            name: "Atta & Flour",
            price: 2,
            image: "assets/atta.webp",
            category: "daily-items",
            rating: 4.2
        },
        {
            id: 3,
            name: "Rice & Rice Products",
            price: 3,
            image: "assets/rice & rice product.webp",
            category: "daily-items",
            rating: 4.8
        },
        {
            id: 4,
            name: "Dals & Pulses",
            price: 5,
            image: "assets/Dals & Pulses.webp",
            category: "daily-items",
            rating: 4.3
        },
        {
            id: 5,
            name: "Morning Starters",
            price: 1,
            image: "assets/Morning Starters.webp",
            category: "snacks",
            rating: 4.6
        },
        {
            id: 6,
            name: "Chai Snacks",
            price: 2,
            image: "assets/Chai Snacks.webp",
            category: "snacks",
            rating: 4.4
        },
        {
            name: "Sweets",
            price: 3,
            image: "assets/Sweets.webp",
            category: "snacks",
            rating: 4
        },
        {
            name: "Pasta & More",
            price: 4,
            image: "assets/Pasta & More.webp",
            category: "snacks",
            rating: 4
        },
        {
            name: "Tea & Coffee",
            price: 3,
            image: "assets/tea-coffee.webp",
            category: "beverages",
            rating: 4
        },
        {
            name: "Soft Drinks",
            price: 2,
            image: "assets/soft-drinks.webp",
            category: "beverages",
            rating: 4
        },
        {
            name: "Shampoo",
            price: 5,
            image: "assets/shampoo.webp",
            category: "personal-care",
            rating: 4
        },
        {
            name: "Soap",
            price: 2,
            image: "assets/soap.webp",
            category: "personal-care",
            rating: 4
        },
        {
            name: "Cleaning Supplies",
            price: 4,
            image: "assets/cleaning.webp",
            category: "household",
            rating: 4
        },
        {
            name: "Fresh Fruits",
            price: 3,
            image: "assets/fruits.webp",
            category: "fruits-vegetables",
            rating: 4
        },
        {
            name: "Fresh Vegetables",
            price: 2,
            image: "assets/vegetables.webp",
            category: "fruits-vegetables",
            rating: 4
        },
        {
            name: "Milk",
            price: 3,
            image: "assets/milk.webp",
            category: "dairy",
            rating: 4
        },
        {
            name: "Bread",
            price: 2,
            image: "assets/bread.webp",
            category: "bakery",
            rating: 4
        }
    ];

    // Initialize variables
    let currentPage = 1;
    const productsPerPage = 8;
    let filteredProducts = [...products];

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
    function initShop() {
        displayProducts();
        updateCartCount();
        setupEventListeners();
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
        const selectedCategories = Array.from(document.querySelectorAll('.filter-option input[type="checkbox"]:checked'))
            .map(input => input.value);
        
        const selectedPriceRange = document.querySelector('input[name="price"]:checked')?.value;
        const selectedRating = document.querySelector('input[name="rating"]:checked')?.value;

        filteredProducts = products.filter(product => {
            // Category filter
            if (selectedCategories.length > 0 && !selectedCategories.includes(product.category)) {
                return false;
            }

            // Price range filter
            if (selectedPriceRange) {
                const [min, max] = selectedPriceRange.split('-').map(Number);
                if (product.price < min || product.price > max) {
                    return false;
                }
            }

            // Rating filter
            if (selectedRating && product.rating < Number(selectedRating)) {
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
            switch(sortValue) {
                case 'price-low':
                    return a.price - b.price;
                case 'price-high':
                    return b.price - a.price;
                case 'name-asc':
                    return a.name.localeCompare(b.name);
                case 'name-desc':
                    return b.name.localeCompare(a.name);
                case 'rating-high':
                    return b.rating - a.rating;
                default:
                    return 0;
            }
        });

        displayProducts();
    }

    // Display products
    function displayProducts() {
        if (!productGrid) return;

        const start = (currentPage - 1) * productsPerPage;
        const end = start + productsPerPage;
        const productsToShow = filteredProducts.slice(start, end);

        productGrid.innerHTML = '';
        productsToShow.forEach(product => {
            const productElement = document.createElement('div');
            productElement.className = 'product';
            productElement.innerHTML = `
                <img src="${product.image}" alt="${product.name}">
                <div class="product-info">
                    <h3 class="product-title">${product.name}</h3>
                    <div class="product-price">$${product.price}</div>
                    <div class="product-rating">
                        ${'<i class="fa fa-star"></i>'.repeat(Math.floor(product.rating))}
                        ${product.rating % 1 ? '<i class="fa fa-star-half-o"></i>' : ''}
                    </div>
                    <button class="add-to-cart" data-product='${JSON.stringify(product)}'>
                        Add to Cart
                    </button>
                </div>
            `;
            productGrid.appendChild(productElement);
        });

        // Update pagination
        if (pageNumbers) {
            const totalPages = Math.ceil(filteredProducts.length / productsPerPage);
            pageNumbers.textContent = `${currentPage} / ${totalPages}`;
        }

        if (prevPageBtn) {
            prevPageBtn.disabled = currentPage === 1;
        }

        if (nextPageBtn) {
            const totalPages = Math.ceil(filteredProducts.length / productsPerPage);
            nextPageBtn.disabled = currentPage === totalPages;
        }

        // Add event listeners to new add-to-cart buttons
        document.querySelectorAll('.add-to-cart').forEach(button => {
            button.addEventListener('click', function() {
                const product = JSON.parse(this.dataset.product);
                addToCart(product);
                updateCartCount();
                showNotification('Product added to cart!');
            });
        });
    }

    // Add to cart functionality
    function addToCart(product) {
        let cart = JSON.parse(localStorage.getItem('cart')) || [];
        const existingItem = cart.find(item => item.name === product.name);
        
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            cart.push({
                name: product.name,
                price: product.price,
                image: product.image,
                quantity: 1
            });
        }
        
        localStorage.setItem('cart', JSON.stringify(cart));
    }

    // Update cart count
    function updateCartCount() {
        const cartCount = document.querySelector('.cart-count');
        if (cartCount) {
            const cart = JSON.parse(localStorage.getItem('cart')) || [];
            const totalItems = cart.reduce((total, item) => total + item.quantity, 0);
            cartCount.textContent = totalItems > 0 ? `(${totalItems})` : '';
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
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }

    // Initialize the shop when the DOM is loaded
    initShop();
}); 
