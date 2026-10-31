// ==========================================
// M.K. STORE — Advanced Multi-Field Search Engine
// ==========================================

document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const rawQuery = urlParams.get('q') || urlParams.get('search') || '';
    const cleanQuery = rawQuery.trim();

    const termDisplay = document.getElementById('search-term-display');
    const countDisplay = document.getElementById('result-count');
    const grid = document.getElementById('search-results-grid');

    // Sync input in navbar
    const headerSearchInputs = document.querySelectorAll('#search-input');
    headerSearchInputs.forEach(inp => {
        if (cleanQuery) inp.value = cleanQuery;
    });

    if (!cleanQuery) {
        if (termDisplay) termDisplay.textContent = '""';
        if (countDisplay) countDisplay.textContent = 'Please enter a search term above.';
        if (grid) {
            grid.innerHTML = `
                <div class="no-results-panel">
                    <i class="fa fa-search"></i>
                    <h2>Ready to explore?</h2>
                    <p>Enter any keyword in the search bar above (e.g., "iphone", "coffee", "sneakers", "organic", "chair").</p>
                    <a href="shop.html" class="mk-btn-primary" style="display:inline-flex; align-items:center; gap:8px;">
                        <i class="fa fa-compass"></i> Browse Full Catalog
                    </a>
                </div>
            `;
        }
        return;
    }

    if (termDisplay) termDisplay.textContent = `"${cleanQuery}"`;
    if (grid) {
        grid.innerHTML = '<div style="grid-column:1/-1; text-align:center; padding:3rem;"><i class="fa fa-spinner fa-spin fa-2x" style="color:var(--brand-primary);"></i><p style="margin-top:10px; color:#64748b;">Searching catalog...</p></div>';
    }

    try {
        const res = await fetch('/api/products');
        if (!res.ok) throw new Error('Failed to fetch products');

        const products = await res.json();
        window.searchResults = products;

        const qLower = cleanQuery.toLowerCase();
        const searchTokens = qLower.split(/\s+/).filter(Boolean);

        const filtered = products.filter(p => {
            const name = (p.name || '').toLowerCase();
            const category = (p.category || '').toLowerCase();
            const desc = (p.description || '').toLowerCase();
            const detailsStr = p.details ? JSON.stringify(p.details).toLowerCase() : '';

            const fullText = `${name} ${category} ${desc} ${detailsStr}`;

            // Matches if whole query is included or every search token matches
            if (fullText.includes(qLower)) return true;
            return searchTokens.every(tok => fullText.includes(tok));
        });

        if (countDisplay) {
            countDisplay.textContent = `Found ${filtered.length} product${filtered.length === 1 ? '' : 's'}`;
        }

        if (filtered.length === 0) {
            grid.innerHTML = `
                <div class="no-results-panel">
                    <i class="fa fa-magnifying-glass"></i>
                    <h2>No matching products found for "${cleanQuery}"</h2>
                    <p>We couldn't find any products matching your query. Try checking your spelling or search by general categories like "Groceries", "Mobiles", "Fashion", "Electronics", or "Appliances".</p>
                    <div style="display:flex; gap:12px; justify-content:center; flex-wrap:wrap; margin-top:1.5rem;">
                        <a href="shop.html" class="mk-btn-primary">
                            <i class="fa fa-compass"></i> Browse All Products
                        </a>
                        <a href="index.html" class="mk-btn-secondary">
                            <i class="fa fa-house"></i> Return Home
                        </a>
                    </div>
                </div>
            `;
            return;
        }

        grid.innerHTML = filtered.map(product => {
            const rating = Number(product.rating || 4.5);
            let starsHtml = '';
            for (let i = 1; i <= 5; i++) {
                if (i <= rating) starsHtml += '<i class="fa fa-star"></i>';
                else if (i - 0.5 <= rating) starsHtml += '<i class="fa fa-star-half-stroke"></i>';
                else starsHtml += '<i class="fa-regular fa-star"></i>';
            }

            const imageSrc = product.image || 'assets/placeholder.png';
            const priceFormatted = Number(product.price || 0).toFixed(2);
            const itemId = product._id || product.id;

            return `
            <div class="product" onclick="window.location.href='product.html?id=${itemId}'">
                <div class="product-image-wrapper">
                    <img src="${imageSrc}" alt="${product.name}" onerror="this.src='assets/placeholder.png'">
                    <div class="product-actions">
                        <button class="action-btn" title="View details" onclick="event.stopPropagation(); window.location.href='product.html?id=${itemId}'">
                            <i class="fa-regular fa-eye"></i>
                        </button>
                    </div>
                </div>
                <div class="product-info">
                    <div class="product-category">${product.category || 'General'}</div>
                    <h3 class="product-title">${product.name}</h3>
                    <div class="rating-stars">
                        ${starsHtml} <span class="rating-text">(${rating.toFixed(1)})</span>
                    </div>
                    <div class="price-row">
                        <div class="product-price">$${priceFormatted}</div>
                        <button class="add-btn" id="search-add-${itemId}" onclick="event.stopPropagation(); addToCartSearch('${itemId}')">
                            <i class="fa fa-cart-plus"></i> Add
                        </button>
                    </div>
                </div>
            </div>
            `;
        }).join('');

    } catch (err) {
        console.error('Search error:', err);
        if (grid) {
            grid.innerHTML = '<p class="error-text" style="color:#ef4444; text-align:center; padding:2rem;">Error executing search. Please refresh or try again.</p>';
        }
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
        btn.style.color = '#ffffff';
        setTimeout(() => {
            btn.innerHTML = originalText;
            btn.style.background = '';
            btn.style.borderColor = '';
            btn.style.color = '';
        }, 1200);
    }
}

window.addToCartSearch = addToCartSearch;
