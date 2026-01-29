document.addEventListener("DOMContentLoaded", function () {
    const footerPlaceholder = document.getElementById("footer-placeholder");
    if (footerPlaceholder) {
        fetch("components/footer.html")
            .then(response => {
                if (!response.ok) throw new Error("Failed to load footer");
                return response.text();
            })
            .then(data => {
                footerPlaceholder.innerHTML = data;

                // Re-initialize animations for the footer
                const animatedFooter = footerPlaceholder.querySelector('[data-animate]');
                if (animatedFooter) {
                    const io = new IntersectionObserver((entries) => {
                        entries.forEach((entry) => {
                            if (entry.isIntersecting) {
                                entry.target.classList.add('in-view');
                                io.unobserve(entry.target);
                            }
                        });
                    }, { root: null, rootMargin: '0px 0px -5% 0px', threshold: 0.1 });
                    io.observe(animatedFooter);
                }
            })
            .catch(error => console.error("Error loading footer:", error));
    }
});
