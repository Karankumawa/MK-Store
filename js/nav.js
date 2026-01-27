document.addEventListener('DOMContentLoaded', () => {
    updateNavigation();
});

function updateNavigation() {
    const token = localStorage.getItem('token');
    const navLinks = document.querySelector('.nav-links');
    if (!navLinks) return;

    // specific links
    const loginLink = navLinks.querySelector('a[href="login.html"]');
    const profileLink = navLinks.querySelector('a[href="profile.html"]');

    if (token) {
        // User is logged in
        if (loginLink) loginLink.parentElement.style.display = 'none';
        if (profileLink) profileLink.parentElement.style.display = 'block';
    } else {
        // User is logged out
        if (loginLink) loginLink.parentElement.style.display = 'block';
        if (profileLink) profileLink.parentElement.style.display = 'none';
    }
}
