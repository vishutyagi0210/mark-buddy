class ModernGallery {
    constructor({ items, type, targetId, itemsPerView = null }) {
        this.items = items;
        this.type = type;
        this.target = document.getElementById(targetId);
        this.currentIndex = 0;
        this.itemsPerView = itemsPerView || this.getItemsPerView();
        this.isTransitioning = false;
        this.isModalTransitioning = false;
        // Touch/swipe support
        this.touchStartX = 0;
        this.touchEndX = 0;
        
        this.init();
        this.bindEvents();
    }
    
    init() {
        if (!this.target) return;
        this.render();
        this.updateNavigation();
    }
    
    getItemsPerView() {
        const width = window.innerWidth;
        
        if (width < 640) return 1;      // mobile
        if (width < 1024) return 2;     // tablet
        if (width < 1280) return 3;     // desktop
        return 4;                       // large desktop
    }
    
    bindEvents() {
        // Resize handler with debounce
        let resizeTimer;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => {
                const newItemsPerView = this.getItemsPerView();
                if (newItemsPerView !== this.itemsPerView) {
                    this.itemsPerView = newItemsPerView;
                    this.currentIndex = 0;
                    this.render();
                    this.updateNavigation();
                }
            }, 150);
        });
        
        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (this.target.contains(document.activeElement) || 
                document.activeElement === this.target) {
                if (e.key === 'ArrowLeft') {
                    e.preventDefault();
                    this.prev();
                } else if (e.key === 'ArrowRight') {
                    e.preventDefault();
                    this.next();
                }
            }
        });
    }
    
    render() {
        if (!this.target) return;
        
        this.target.innerHTML = '';
        
        // Main container
        const container = document.createElement('div');
        container.className = 'gallery-viewport relative';
        container.setAttribute('role', 'region');
        container.setAttribute('aria-label', `${this.type} gallery`);
        
        // Gallery track
        const track = document.createElement('div');
        track.className = 'gallery-track';
        track.style.transform = `translateX(-${this.currentIndex * (100 / this.itemsPerView)}%)`;
        
        // Add touch events for swipe
        track.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: true });
        track.addEventListener('touchend', (e) => this.handleTouchEnd(e), { passive: true });
        
        // Create items
        this.items.forEach((item, index) => {
            const itemElement = this.createItem(item, index);
            track.appendChild(itemElement);
        });
        
        container.appendChild(track);
        
        // Navigation buttons
        if (this.items.length > this.itemsPerView) {
            const prevBtn = this.createNavButton('prev','->');
            const nextBtn = this.createNavButton('next','<-');
            container.appendChild(prevBtn);
            container.appendChild(nextBtn);
        }
        
        this.target.appendChild(container);
        
        // Indicators
        if (this.items.length > this.itemsPerView) {
            const indicators = this.createIndicators();
            this.target.appendChild(indicators);
        }
        
        // Store references
        this.track = track;
        this.prevBtn = container.querySelector('.gallery-nav.prev');
        this.nextBtn = container.querySelector('.gallery-nav.next');
    }
    
    createItem(item, index) {
        const itemElement = document.createElement('div');
        itemElement.className = 'gallery-item';
        itemElement.style.width = `${100 / this.itemsPerView}%`;
        
        const card = document.createElement('div');
        card.className = `gallery-card ${this.type === 'video' ? 'video-card' : ''}`;
        card.setAttribute('role', 'article');
        card.setAttribute('aria-labelledby', `item-title-${index}`);
        
        if (this.type === 'photo') {
            // Image
            const img = document.createElement('img');
            img.src = item.src;
            img.alt = item.title;
            img.className = 'gallery-image';
            img.loading = 'lazy';
            img.style.cursor = 'zoom-in';
            // Add zoom icon overlay
            const zoomIcon = document.createElement('span');
            // zoomIcon.innerHTML = '<svg width="32" height="32" fill="none" stroke="#f59e0b" stroke-width="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>';
            // zoomIcon.style.position = 'absolute';
            // zoomIcon.style.bottom = '16px';
            // zoomIcon.style.right = '16px';
            // zoomIcon.style.background = 'rgba(255,255,255,0.85)';
            // zoomIcon.style.borderRadius = '50%';
            // zoomIcon.style.padding = '4px';
            // zoomIcon.style.pointerEvents = 'none';
            // zoomIcon.style.opacity = '0.85';
            // zoomIcon.style.transition = 'opacity 0.2s';
            const imgWrapper = document.createElement('div');
            imgWrapper.style.position = 'relative';
            imgWrapper.appendChild(img);
            imgWrapper.appendChild(zoomIcon);
            imgWrapper.addEventListener('mouseenter', () => { zoomIcon.style.opacity = '1'; });
            imgWrapper.addEventListener('mouseleave', () => { zoomIcon.style.opacity = '0.85'; });
            // Lightbox trigger
            imgWrapper.addEventListener('click', () => {
                this.openModal(index);
            });
            // Error handler
            img.onerror = () => {
                const placeholder = document.createElement('div');
                placeholder.className = 'gallery-image flex items-center justify-center bg-gray-100 text-gray-500';
                placeholder.innerHTML = `
                    <div class="text-center">
                        <div class="text-4xl mb-2">📷</div>
                        <div class="text-sm">Image not found</div>
                        <div class="text-xs mt-1 opacity-75">${item.title}</div>
                    </div>
                `;
                img.parentNode.replaceChild(placeholder, img);
            };
            card.appendChild(imgWrapper);
            
            // Content
            const content = document.createElement('div');
            content.className = 'gallery-content';
            
            const title = document.createElement('h4');
            title.id = `item-title-${index}`;
            title.className = 'gallery-title';
            title.textContent = item.title;
            
            content.appendChild(title);
            card.appendChild(content);
            
        } else if (this.type === 'video') {
            const content = document.createElement('div');
            content.className = 'gallery-content';
            
            const link = document.createElement('a');
            link.href = item.link;
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
            link.className = 'video-link';
            link.setAttribute('aria-label', `Watch ${item.title} (opens in new tab)`);
            
            const title = document.createElement('span');
            title.id = `item-title-${index}`;
            title.textContent = item.title;
            
            const playIcon = document.createElement('span');
            playIcon.innerHTML = ' ▶';
            playIcon.className = 'ml-2';
            
            link.appendChild(title);
            link.appendChild(playIcon);
            content.appendChild(link);
            card.appendChild(content);
        }
        
        itemElement.appendChild(card);
        return itemElement;
    }
    
    createNavButton(type, symbol) {
        const btn = document.createElement('button');
        btn.className = `gallery-nav ${type}`;
        btn.innerHTML = symbol;
        btn.setAttribute('aria-label', `${type === 'prev' ? 'Previous' : 'Next'} items`);
        btn.onclick = () => type === 'prev' ? this.prev() : this.next();
        return btn;
    }
    
    createIndicators() {
        const container = document.createElement('div');
        container.className = 'gallery-indicators';
        container.setAttribute('role', 'tablist');
        container.setAttribute('aria-label', 'Gallery navigation');
        
        const totalPages = Math.ceil(this.items.length / this.itemsPerView);
        
        for (let i = 0; i < totalPages; i++) {
            const dot = document.createElement('button');
            dot.className = `gallery-dot ${i === Math.floor(this.currentIndex / this.itemsPerView) ? 'active' : ''}`;
            dot.setAttribute('role', 'tab');
            dot.setAttribute('aria-label', `Go to page ${i + 1}`);
            dot.setAttribute('aria-selected', i === Math.floor(this.currentIndex / this.itemsPerView));
            dot.onclick = () => this.goToPage(i);
            container.appendChild(dot);
        }
        
        return container;
    }
    
    handleTouchStart(e) {
        this.touchStartX = e.changedTouches[0].screenX;
    }
    
    handleTouchEnd(e) {
        this.touchEndX = e.changedTouches[0].screenX;
        this.handleSwipe();
    }
    
    handleSwipe() {
        const swipeThreshold = 50;
        const diff = this.touchStartX - this.touchEndX;
        
        if (Math.abs(diff) > swipeThreshold) {
            if (diff > 0) {
                this.next(); // Swipe left - go to next
            } else {
                this.prev(); // Swipe right - go to previous
            }
        }
    }
    
    prev() {
        if (this.isTransitioning || this.currentIndex === 0) return;
        
        this.currentIndex = Math.max(0, this.currentIndex - this.itemsPerView);
        this.updateGallery();
    }
    
    next() {
        if (this.isTransitioning) return;
        
        const maxIndex = Math.max(0, this.items.length - this.itemsPerView);
        if (this.currentIndex >= maxIndex) return;
        
        this.currentIndex = Math.min(maxIndex, this.currentIndex + this.itemsPerView);
        this.updateGallery();
    }
    
    goToPage(pageIndex) {
        if (this.isTransitioning) return;
        
        this.currentIndex = pageIndex * this.itemsPerView;
        this.updateGallery();
    }
    
    updateGallery() {
        if (!this.track) return;
        
        this.isTransitioning = true;
        
        // Update track position
        this.track.style.transform = `translateX(-${this.currentIndex * (100 / this.itemsPerView)}%)`;
        
        // Update navigation and indicators
        this.updateNavigation();
        this.updateIndicators();
        
        // Reset transition flag
        setTimeout(() => {
            this.isTransitioning = false;
        }, 600);
    }
    
    updateNavigation() {
        if (!this.prevBtn || !this.nextBtn) return;
        
        const maxIndex = Math.max(0, this.items.length - this.itemsPerView);
        
        this.prevBtn.disabled = this.currentIndex === 0;
        this.nextBtn.disabled = this.currentIndex >= maxIndex;
    }
    
    updateIndicators() {
        const indicators = this.target.querySelectorAll('.gallery-dot');
        const currentPage = Math.floor(this.currentIndex / this.itemsPerView);
        
        indicators.forEach((dot, index) => {
            const isActive = index === currentPage;
            dot.classList.toggle('active', isActive);
            dot.setAttribute('aria-selected', isActive);
        });
    }

    openModal(index) {
        if (this.type !== 'photo') return;
        if (document.getElementById('gallery-modal-overlay')) return;
        this.modalIndex = index;
        this.isModalTransitioning = false;
        // Overlay
        const overlay = document.createElement('div');
        overlay.className = 'gallery-modal-overlay';
        overlay.id = 'gallery-modal-overlay';
        overlay.tabIndex = -1;
        // Modal content
        const modal = document.createElement('div');
        modal.className = 'gallery-modal-content';
        // Close button
        const closeBtn = document.createElement('button');
        closeBtn.className = 'gallery-modal-close';
        closeBtn.innerHTML = '×';
        closeBtn.setAttribute('aria-label', 'Close gallery');
        closeBtn.onclick = () => this.closeModal();
        modal.appendChild(closeBtn);
        // Restore left arrow button
        if (this.items.length > 1) {
            const left = document.createElement('button');
            left.className = 'gallery-modal-arrow left';
            left.setAttribute('aria-label', 'Previous image');
            left.onclick = (e) => { 
                e.stopPropagation(); 
                this.modalPrev(); 
            };
            if (this.modalIndex === 0) {
                left.style.opacity = '0.3';
                left.style.pointerEvents = 'none';
            }
            modal.appendChild(left);
        }
        // Restore right arrow button
        if (this.items.length > 1) {
            const right = document.createElement('button');
            right.className = 'gallery-modal-arrow right';
            right.setAttribute('aria-label', 'Next image');
            right.onclick = (e) => { 
                e.stopPropagation(); 
                this.modalNext(); 
            };
            if (this.modalIndex === this.items.length - 1) {
                right.style.opacity = '0.3';
                right.style.pointerEvents = 'none';
            }
            modal.appendChild(right);
        }
        // Image
        const img = document.createElement('img');
        img.className = 'gallery-modal-image';
        img.src = this.items[this.modalIndex].src;
        img.alt = this.items[this.modalIndex].title;
        modal.appendChild(img);
        // Title
        const title = document.createElement('div');
        title.className = 'gallery-modal-title';
        title.textContent = this.items[this.modalIndex].title;
        modal.appendChild(title);
        // Store references for navigation
        this.modalImg = img;
        this.modalTitle = title;
        this.modalLeftArrow = modal.querySelector('.gallery-modal-arrow.left');
        this.modalRightArrow = modal.querySelector('.gallery-modal-arrow.right');
        // Keyboard navigation
        this._modalKeyHandler = (e) => {
            if (e.key === 'Escape') this.closeModal();
            if (e.key === 'ArrowLeft') this.modalPrev();
            if (e.key === 'ArrowRight') this.modalNext();
        };
        document.addEventListener('keydown', this._modalKeyHandler);
        // Click outside to close
        overlay.onclick = (e) => {
            if (e.target === overlay) this.closeModal();
        };
        // Enhanced touch/swipe support for modal
        let modalTouchStartX = 0;
        let modalTouchEndX = 0;
        let modalTouchStartY = 0;
        let modalTouchEndY = 0;
        modal.addEventListener('touchstart', (e) => {
            modalTouchStartX = e.changedTouches[0].screenX;
            modalTouchStartY = e.changedTouches[0].screenY;
        }, { passive: true });
        modal.addEventListener('touchend', (e) => {
            modalTouchEndX = e.changedTouches[0].screenX;
            modalTouchEndY = e.changedTouches[0].screenY;
            const swipeThreshold = 50;
            const diffX = modalTouchStartX - modalTouchEndX;
            const diffY = Math.abs(modalTouchStartY - modalTouchEndY);
            if (Math.abs(diffX) > swipeThreshold && Math.abs(diffX) > diffY) {
                if (diffX > 0) {
                    this.modalNext(); // Swipe left - go to next
                } else {
                    this.modalPrev(); // Swipe right - go to previous
                }
            }
        }, { passive: true });
        // Add to DOM
        overlay.appendChild(modal);
        document.body.appendChild(overlay);
        document.body.classList.add('gallery-modal-open');
    }

    modalPrev() {
        if (this.isModalTransitioning || this.modalIndex <= 0) return;
        
        this.modalIndex--;
        this.updateModalContentWithAnimation('left');
    }

    modalNext() {
        if (this.isModalTransitioning || this.modalIndex >= this.items.length - 1) return;
        
        this.modalIndex++;
        this.updateModalContentWithAnimation('right');
    }

    updateModalContentWithAnimation(direction = 'right') {
        if (!this.modalImg || !this.modalTitle || this.isModalTransitioning) return;
        
        this.isModalTransitioning = true;
        
        // Add transitioning class for fade out
        this.modalImg.classList.add('transitioning');
        this.modalTitle.style.opacity = '0';
        this.modalTitle.style.transform = 'translateY(10px)';
        
        // Wait for fade out, then update content
        setTimeout(() => {
            // Update image and title
            this.modalImg.src = this.items[this.modalIndex].src;
            this.modalImg.alt = this.items[this.modalIndex].title;
            this.modalTitle.textContent = this.items[this.modalIndex].title;
            
            // Remove transitioning class and add slide animation
            this.modalImg.classList.remove('transitioning');
            
            // Add slide-in animation based on direction
            const animationClass = direction === 'right' ? 'slideInFromRight' : 'slideInFromLeft';
            this.modalImg.style.animation = `${animationClass} 0.5s cubic-bezier(0.25, 0.8, 0.25, 1)`;
            
            // Fade in title
            setTimeout(() => {
                this.modalTitle.style.opacity = '1';
                this.modalTitle.style.transform = 'translateY(0)';
            }, 200);
            
            // Reset animation after completion
            setTimeout(() => {
                this.modalImg.style.animation = '';
                this.isModalTransitioning = false;
            }, 500);
            
        }, 200); // Wait for fade out
    }

    updateModalContent() {
        if (this.modalImg && this.modalTitle) {
            this.modalImg.src = this.items[this.modalIndex].src;
            this.modalImg.alt = this.items[this.modalIndex].title;
            this.modalTitle.textContent = this.items[this.modalIndex].title;
        }
    }

    closeModal() {
        const overlay = document.getElementById('gallery-modal-overlay');
        if (overlay) {
            // Add fade out animation
            overlay.style.animation = 'fadeOut 0.3s ease-out forwards';
            setTimeout(() => overlay.remove(), 300);
        }
        
        if (this._modalKeyHandler) {
            document.removeEventListener('keydown', this._modalKeyHandler);
        }
        
        document.body.classList.remove('gallery-modal-open');
        
        // Clean up references
        this.modalImg = null;
        this.modalTitle = null;
        this.modalLeftArrow = null;
        this.modalRightArrow = null;
        this.isModalTransitioning = false;
    }
}

// Gallery data - URL encoded for spaces in filenames
const galleries = {
    general: [
        { src: 'photos/extract data screenshot.png', title: 'Extract Data Feature' },
        { src: 'photos/google form.png', title: 'Google Form Integration' },
    ],
    darkMode: [
        { src: 'photos/dark-mode/first.png', title: 'Dark Mode Dashboard' },
        { src: 'photos/dark-mode/second.png', title: 'Dark Mode Interface' },
        { src: 'photos/dark-mode/third.png', title: 'Dark Mode Settings' },
        { src: 'photos/dark-mode/fourth.png', title: 'Dark Mode Features' },
    ],
    lightMode: [
        { src: 'photos/light-mode/Screenshot from 2025-06-02 22-52-28.png', title: 'Light Mode Dashboard' },
        { src: 'photos/light-mode/Screenshot from 2025-06-02 22-52-07.png', title: 'Light Mode Interface' },
        { src: 'photos/light-mode/Screenshot from 2025-06-02 22-51-52.png', title: 'Light Mode Settings' },
        { src: 'photos/light-mode/Screenshot from 2025-06-02 22-51-37.png', title: 'Light Mode Features' },
    ],
    videos: [
        { link: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', title: 'Introduction to Mark Buddy' },
        { link: 'https://www.youtube.com/watch?v=3GwjfUFyY6M', title: 'How to Use Mark Buddy' },
    ]
};

// Initialize galleries when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Add staggered animation delays
    const sections = document.querySelectorAll('.animate-slide-up');
    sections.forEach((section, index) => {
        section.style.animationDelay = `${index * 0.2}s`;
    });
    
    // Initialize photo galleries
    new ModernGallery({
        items: galleries.general,
        type: 'photo',
        targetId: 'general-gallery'
    });
    
    new ModernGallery({
        items: galleries.darkMode,
        type: 'photo',
        targetId: 'dark-gallery'
    });
    
    new ModernGallery({
        items: galleries.lightMode,
        type: 'photo',
        targetId: 'light-gallery'
    });
    
    // Initialize video gallery
    new ModernGallery({
        items: galleries.videos,
        type: 'video',
        targetId: 'video-gallery'
    });
});

// Export for potential external use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ModernGallery;
} else if (typeof window !== 'undefined') {
    window.ModernGallery = ModernGallery;
}