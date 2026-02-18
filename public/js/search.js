document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const searchQuery = urlParams.get('search');
    const termDisplay = document.getElementById('search-term-display');
    const countDisplay = document.getElementById('result-count');
    const grid = document.getElementById('search-results-grid');

    if (!searchQuery) {
        termDisplay.textContent = ' " "';
        countDisplay.textContent = 'Please enter a search term.';
        grid.innerHTML = '';
        return;
    }

    termDisplay.textContent = `"${searchQuery}"`;

    try {
        const res = await fetch('/api/products');
        if (!res.ok) throw new Error('Failed to fetch products');

        const products = await res.json();

        const filtered = products.filter(p =>
            p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (p.category && p.category.toLowerCase().includes(searchQuery.toLowerCase()))
        );

        countDisplay.textContent = `Found ${filtered.length} result(s)`;

        if (filtered.length === 0) {
            grid.innerHTML = `
                <div class="no-results">
                    <i class="fa fa-search"></i>
                    <h2>No products found</h2>
                    <p>Try checking your spelling or use different keywords.</p>
                    <a href="shop.html" class="btn" style="margin-top:1rem; display:inline-block;">Browse Shop</a>
                </div>
            `;
            return;
        }

        grid.innerHTML = filtered.map(product => `
            <div class="product">
                <div class="product-image-wrapper">
                    <img src="${product.image || 'assets/placeholder.png'}" alt="${product.name}" onerror="this.src='assets/placeholder.png'">
                    <div class="product-actions">
                         <button class="action-btn" onclick="window.location.href='product.html?id=${product._id}'">
                            <i class="fa-regular fa-eye"></i>
                        </button>
                    </div>
                </div>
                <div class="product-info">
                    <div class="product-category">${product.category || 'General'}</div>
                    <h3 class="product-title">${product.name}</h3>
                    <div class="rating-stars">
                        <i class="fa fa-star"></i> <span class="rating-text">${product.rating || 4.5}</span>
                    </div>
                    <div class="price-row">
                        <div class="product-price">$${product.price ? product.price.toFixed(2) : '0.00'}</div>
                        <button class="btn" onclick="window.location.href='product.html?id=${product._id}'" style="padding:0.5rem 1rem; font-size:0.9rem;">
                            Shop Now
                        </button>
                    </div>
                </div>
            </div>
        `).join('');

    } catch (err) {
        console.error(err);
        grid.innerHTML = '<p class="error-text" style="color:red; text-align:center;">Error loading search results.</p>';
    }
});
