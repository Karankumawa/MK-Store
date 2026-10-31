document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const searchQuery = urlParams.get('search');
    const termDisplay = document.getElementById('search-term-display');
    const countDisplay = document.getElementById('result-count');
    const grid = document.getElementById('search-results-grid');

    if (!searchQuery || !searchQuery.trim()) {
        if (termDisplay) termDisplay.textContent = '""';
        if (countDisplay) countDisplay.textContent = 'Please enter a search term above.';
        if (grid) grid.innerHTML = '<div class="no-results"><i class="fa fa-search"></i><h2>No search term entered</h2><p>Use the search bar above to look for products.</p><a href="shop.html" class="btn" style="margin-top:1rem;display:inline-block;">Browse Shop</a></div>';
        return;
    }

    const cleanQuery = searchQuery.trim();
    if (termDisplay) termDisplay.textContent = `"${cleanQuery}"`;

    try {
        const res = await fetch('/api/products');
        if (!res.ok) throw new Error('Failed to fetch products');

        const products = await res.json();
        window.searchResults = products;

        const filtered = products.filter(p =>
            (p.name && p.name.toLowerCase().includes(cleanQuery.toLowerCase())) ||
            (p.category && p.category.toLowerCase().includes(cleanQuery.toLowerCase()))
        );

        if (countDisplay) countDisplay.textContent = `Found ${filtered.length} product${filtered.length === 1 ? '' : 's'}`;

        if (filtered.length === 0) {
            grid.innerHTML = `
                <div class="no-results">
                    <i class="fa fa-search"></i>
                    <h2>No products found for "${cleanQuery}"</h2>
                    <p>Try checking your spelling or use different keywords like "groceries", "mobiles", "shoes".</p>
                    <a href="shop.html" class="btn" style="margin-top:1rem; display:inline-block;">Browse Shop</a>
                </div>
            `;
            return;
        }

        grid.innerHTML = filtered.map(product => {
            const rating = product.rating || 4.5;
            let starsHtml = '';
            for (let i = 1; i <= 5; i++) {
                if (i <= rating) starsHtml += '<i class="fa fa-star"></i>';
                else if (i - 0.5 <= rating) starsHtml += '<i class="fa fa-star-half-stroke"></i>';
                else starsHtml += '<i class="fa-regular fa-star"></i>';
            }

            return `
            <div class="product" onclick="window.location.href='product.html?id=${product._id}'">
                <div class="product-image-wrapper">
                    <img src="${product.image || 'assets/placeholder.png'}" alt="${product.name}" onerror="this.src='assets/placeholder.png'">
                    <div class="product-actions">
                         <button class="action-btn" title="View details" onclick="event.stopPropagation(); window.location.href='product.html?id=${product._id}'">
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
                        <button class="add-btn" id="search-add-${product._id}" onclick="event.stopPropagation(); addToCartSearch('${product._id}')">
                            Add to Cart
                        </button>
                    </div>
                </div>
            </div>
            `;
        }).join('');

    } catch (err) {
        console.error(err);
        if (grid) grid.innerHTML = '<p class="error-text" style="color:red; text-align:center;">Error loading search results. Please try again.</p>';
    }
});

function addToCartSearch(productId) {
    const product = (window.searchResults || []).find(p => (p._id || p.id) === productId);
    if (!product) return;

    if (window.UserCart) {
        const added = window.UserCart.addItem(product, 1);
        if (!added) return; // Auth modal opened
    } else {
        alert('Please log in to add items to cart.');
        window.location.href = 'login.html';
        return;
    }

    const btn = document.getElementById(`search-add-${productId}`);
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
            btn.style.background = '';
            btn.style.borderColor = '';
        }, 1200);
    }
}

window.addToCartSearch = addToCartSearch;
