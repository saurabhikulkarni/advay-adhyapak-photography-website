/* ==========================================================================
   Advay Adhyapak Photography Main Controller - Locus Redesign JS
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {

  // --- Theme Toggler (Dark/Light Mode) ---
  const themeToggleBtn = document.getElementById('theme-toggle');
  const themeIcon = themeToggleBtn.querySelector('i');
  
  // Load saved theme or default to dark
  const currentTheme = localStorage.getItem('theme') || 'dark';
  document.documentElement.setAttribute('data-theme', currentTheme);
  updateThemeIcon(currentTheme);

  themeToggleBtn.addEventListener('click', () => {
    let theme = document.documentElement.getAttribute('data-theme');
    let newTheme = theme === 'dark' ? 'light' : 'dark';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeIcon(newTheme);
    
    showToast(`Switched to ${newTheme} mode!`, 'info');
  });

  function updateThemeIcon(theme) {
    if (theme === 'dark') {
      themeIcon.className = 'fa-solid fa-sun';
    } else {
      themeIcon.className = 'fa-solid fa-moon';
    }
  }


  // --- Header Scrolled Background ---
  const header = document.querySelector('.navbar-header');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  });


  // --- Mobile Off-Canvas Menu ---
  const menuToggle = document.getElementById('menu-toggle');
  const mobileMenu = document.getElementById('mobile-menu');
  const mobileLinks = document.querySelectorAll('.mobile-nav-link');

  menuToggle.addEventListener('click', () => {
    menuToggle.classList.toggle('open');
    mobileMenu.classList.toggle('open');
  });

  // Close mobile menu on clicking any link
  mobileLinks.forEach(link => {
    link.addEventListener('click', () => {
      menuToggle.classList.remove('open');
      mobileMenu.classList.remove('open');
    });
  });


  // --- Fixed Background Slideshow Cycler (Locus Aesthetic) ---
  const bgSlides = document.querySelectorAll('.bg-slide');
  let currentBgSlide = 0;
  let bgSlideInterval;

  function nextBgSlide() {
    bgSlides[currentBgSlide].classList.remove('active');
    currentBgSlide = (currentBgSlide + 1) % bgSlides.length;
    bgSlides[currentBgSlide].classList.add('active');
  }

  function startBgSlideshow() {
    stopBgSlideshow();
    bgSlideInterval = setInterval(nextBgSlide, 6500);
  }

  function stopBgSlideshow() {
    if (bgSlideInterval) clearInterval(bgSlideInterval);
  }

  // Init Background Slideshow
  if (bgSlides.length > 0) {
    startBgSlideshow();
  }


  // --- Scroll-Spy active navigation highlighting ---
  const sections = document.querySelectorAll('section');
  const navLinks = document.querySelectorAll('.nav-link');

  window.addEventListener('scroll', () => {
    let current = '';
    const scrollPos = window.scrollY + 150; // offset for nav header height

    sections.forEach(section => {
      const sectionTop = section.offsetTop;
      const sectionHeight = section.clientHeight;
      if (scrollPos >= sectionTop && scrollPos < sectionTop + sectionHeight) {
        current = section.getAttribute('id');
      }
    });

    navLinks.forEach(link => {
      link.classList.remove('active');
      const href = link.getAttribute('href').substring(1);
      if (href === current || (current === '' && href === '')) {
        link.classList.add('active');
      }
    });
  });


  // --- Intersection Observer for Scroll Animations ---
  const animatedElements = document.querySelectorAll('.animate-on-scroll');

  const animationObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target); // Trigger only once
      }
    });
  }, {
    threshold: 0.15, // trigger when 15% is visible
    rootMargin: '0px 0px -50px 0px' // offset trigger slightly
  });

  animatedElements.forEach(el => {
    animationObserver.observe(el);
  });


  // --- Portfolio Filtering & Custom Lightbox ---
  const filterButtons = document.querySelectorAll('.filter-btn');
  const portfolioItems = document.querySelectorAll('.portfolio-item');
  let visibleItems = Array.from(portfolioItems);

  filterButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      filterButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const filterVal = btn.getAttribute('data-filter');

      portfolioItems.forEach(item => {
        const category = item.getAttribute('data-category');
        if (filterVal === 'all' || category === filterVal) {
          item.classList.remove('hidden');
        } else {
          item.classList.add('hidden');
        }
      });

      // Update active items list
      visibleItems = Array.from(portfolioItems).filter(item => !item.classList.contains('hidden'));
    });
  });

  // Lightbox references
  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightbox-img');
  const lightboxTitle = document.getElementById('lightbox-title');
  const lightboxDesc = document.getElementById('lightbox-desc');
  const lightboxClose = document.getElementById('lightbox-close');
  const lightboxPrev = document.getElementById('lightbox-prev');
  const lightboxNext = document.getElementById('lightbox-next');
  let currentLightboxIndex = 0;

  portfolioItems.forEach(item => {
    const card = item.querySelector('.portfolio-card');
    card.addEventListener('click', () => {
      currentLightboxIndex = visibleItems.indexOf(item);
      openLightbox();
    });
  });

  function openLightbox() {
    if (currentLightboxIndex < 0 || currentLightboxIndex >= visibleItems.length) return;
    
    const targetItem = visibleItems[currentLightboxIndex];
    const imgSrc = targetItem.getAttribute('data-src');
    const title = targetItem.getAttribute('data-title');
    const desc = targetItem.getAttribute('data-desc');

    lightboxImg.src = imgSrc;
    lightboxTitle.textContent = title;
    lightboxDesc.textContent = desc;

    lightbox.classList.add('show');
    lightbox.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden'; 
    stopBgSlideshow(); // Pause slideshow cycler
  }

  function closeLightbox() {
    lightbox.classList.remove('show');
    lightbox.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = ''; 
    startBgSlideshow(); // Resume background slideshow
  }

  function navigateLightbox(direction) {
    if (visibleItems.length <= 1) return;
    
    if (direction === 'next') {
      currentLightboxIndex = (currentLightboxIndex + 1) % visibleItems.length;
    } else if (direction === 'prev') {
      currentLightboxIndex = (currentLightboxIndex - 1 + visibleItems.length) % visibleItems.length;
    }
    openLightbox();
  }

  lightboxClose.addEventListener('click', closeLightbox);
  lightboxNext.addEventListener('click', () => navigateLightbox('next'));
  lightboxPrev.addEventListener('click', () => navigateLightbox('prev'));

  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox || e.target.classList.contains('lightbox-content-wrapper')) {
      closeLightbox();
    }
  });

  document.addEventListener('keydown', (e) => {
    if (!lightbox.classList.contains('show')) return;
    
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowRight') navigateLightbox('next');
    if (e.key === 'ArrowLeft') navigateLightbox('prev');
  });


  // --- Booking Interactive Pricing Calculator ---
  const bookingCategorySelect = document.getElementById('booking-category');
  const addonCheckboxes = document.querySelectorAll('input[name="addons"]');
  const priceDisplay = document.getElementById('price-calc-val');
  const summaryCategory = document.getElementById('summary-category');
  const summaryDeliverables = document.getElementById('summary-deliverables');

  function calculatePackagePrice() {
    const selectedOption = bookingCategorySelect.options[bookingCategorySelect.selectedIndex];
    const basePrice = parseInt(selectedOption.getAttribute('data-price')) || 0;
    const baseDesc = selectedOption.getAttribute('data-desc') || '';
    const baseName = selectedOption.text.split(' ($')[0];

    let addonsTotal = 0;
    addonCheckboxes.forEach(checkbox => {
      if (checkbox.checked) {
        addonsTotal += parseInt(checkbox.getAttribute('data-price')) || 0;
      }
    });

    const finalPrice = basePrice + addonsTotal;
    priceDisplay.textContent = finalPrice.toLocaleString();
    summaryCategory.textContent = baseName;
    summaryDeliverables.textContent = baseDesc;
  }

  bookingCategorySelect.addEventListener('change', calculatePackagePrice);
  addonCheckboxes.forEach(checkbox => {
    checkbox.addEventListener('change', calculatePackagePrice);
  });

  if (bookingCategorySelect) {
    calculatePackagePrice();
  }


  // --- Toast Custom Notifications System ---
  function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    let iconClass = 'fa-circle-check';
    if (type === 'error') iconClass = 'fa-circle-exclamation';
    if (type === 'info') iconClass = 'fa-circle-info';

    toast.innerHTML = `
      <i class="fa-solid ${iconClass} toast-icon"></i>
      <span class="toast-msg">${message}</span>
      <button class="toast-close">&times;</button>
    `;

    container.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('show');
    }, 50);

    const autoClose = setTimeout(() => {
      dismissToast(toast);
    }, 4000);

    toast.querySelector('.toast-close').addEventListener('click', () => {
      clearTimeout(autoClose);
      dismissToast(toast);
    });
  }

  function dismissToast(toast) {
    toast.classList.remove('show');
    toast.addEventListener('transitionend', () => {
      toast.remove();
    });
  }


  // --- Async Forms Submissions ---
  
  // 1. Booking Form
  const bookingForm = document.getElementById('booking-form');
  bookingForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = new FormData(bookingForm);
    const addons = [];
    addonCheckboxes.forEach(cb => {
      if (cb.checked) {
        addons.push(cb.value);
      }
    });

    const categorySelect = document.getElementById('booking-category');
    const categoryName = categorySelect.options[categorySelect.selectedIndex].text;

    const payload = {
      name: formData.get('name'),
      email: formData.get('email'),
      phone: formData.get('phone'),
      date: formData.get('date'),
      category: categoryName,
      details: formData.get('details') + (addons.length ? `\n\nAdd-ons: ${addons.join(', ')}` : '')
    };

    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (result.success) {
        showToast('Booking request submitted! We will contact you soon.', 'success');
        bookingForm.reset();
        calculatePackagePrice();
      } else {
        showToast(result.message || 'Submission failed. Please try again.', 'error');
      }
    } catch (err) {
      console.error('Error submitting booking:', err);
      showToast('Connection error. Please try again.', 'error');
    }
  });

  // 2. Contact Message Form
  const contactForm = document.getElementById('contact-form');
  contactForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = new FormData(contactForm);
    const payload = {
      name: formData.get('name'),
      email: formData.get('email'),
      subject: formData.get('subject'),
      message: formData.get('message')
    };

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (result.success) {
        showToast('Message sent! Advay will get back to you shortly.', 'success');
        contactForm.reset();
      } else {
        showToast(result.message || 'Failed to send message.', 'error');
      }
    } catch (err) {
      console.error('Error sending contact message:', err);
      showToast('Connection error. Please try again.', 'error');
    }
  });

});
