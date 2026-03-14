// Roof MRI - Site Scripts
document.addEventListener('DOMContentLoaded', () => {

  // --- Sticky header shadow on scroll ---
  const header = document.querySelector('.site-header');
  if (header) {
    window.addEventListener('scroll', () => {
      header.classList.toggle('scrolled', window.scrollY > 10);
    });
  }

  // --- Mobile nav toggle ---
  const hamburger = document.querySelector('.hamburger');
  const mobileNav = document.querySelector('.mobile-nav');
  if (hamburger && mobileNav) {
    hamburger.addEventListener('click', () => {
      mobileNav.classList.toggle('open');
      hamburger.classList.toggle('active');
    });
    mobileNav.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => mobileNav.classList.remove('open'));
    });
  }

  // --- Simple form handling (Netlify forms) ---
  const form = document.querySelector('[data-netlify="true"]');
  if (form) {
    form.addEventListener('submit', (e) => {
      const btn = form.querySelector('button[type="submit"]');
      if (btn) {
        btn.textContent = 'Sending...';
        btn.disabled = true;
      }
    });
  }

  // --- Animate elements on scroll ---
  const observerOptions = {
    threshold: 0.15,
    rootMargin: '0px 0px -40px 0px'
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  document.querySelectorAll('.feature-card, .testimonial-card, .step, .resource-card, .cert-card, .stat-item, .payoff-card, .package-card').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
    observer.observe(el);
  });

  const style = document.createElement('style');
  style.textContent = '.in-view { opacity: 1 !important; transform: translateY(0) !important; }';
  document.head.appendChild(style);

  // --- Active nav link ---
  const currentPath = window.location.pathname.replace(/\/$/, '') || '/index';
  document.querySelectorAll('.nav-links a, .mobile-nav a').forEach(link => {
    const href = link.getAttribute('href').replace(/\/$/, '').replace('.html', '');
    const path = currentPath.replace('.html', '');
    if (href === path || (href === '/' && (path === '' || path === '/index'))) {
      link.classList.add('active');
    }
  });

  // --- Modal System ---
  function openModal(id) {
    const modal = document.getElementById(id);
    if (modal) {
      modal.classList.add('active');
      document.body.style.overflow = 'hidden';
    }
  }
  function closeModal(id) {
    const modal = document.getElementById(id);
    if (modal) {
      modal.classList.remove('active');
      document.body.style.overflow = '';
    }
  }
  // Close on overlay click
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        overlay.classList.remove('active');
        document.body.style.overflow = '';
      }
    });
  });
  // Close on X button
  document.querySelectorAll('.modal-close').forEach(btn => {
    btn.addEventListener('click', () => {
      const overlay = btn.closest('.modal-overlay');
      if (overlay) {
        overlay.classList.remove('active');
        document.body.style.overflow = '';
      }
    });
  });
  // Close on Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal-overlay.active').forEach(m => {
        m.classList.remove('active');
      });
      document.body.style.overflow = '';
    }
  });

  // Option grid selection
  document.querySelectorAll('.modal-option').forEach(opt => {
    opt.addEventListener('click', () => {
      const grid = opt.closest('.modal-option-grid');
      const hidden = grid.nextElementSibling;
      grid.querySelectorAll('.modal-option').forEach(o => o.classList.remove('selected'));
      opt.classList.add('selected');
      if (hidden && hidden.tagName === 'INPUT' && hidden.type === 'hidden') {
        hidden.value = opt.dataset.value;
      }
    });
  });

  // Expose openModal globally for onclick attributes
  window.openModal = openModal;
  window.closeModal = closeModal;

  // --- Event Toast Notification ---
  const toast = document.getElementById('event-toast');
  if (toast) {
    // Check if user already dismissed this session
    if (!sessionStorage.getItem('toast-dismissed')) {
      setTimeout(() => {
        toast.classList.add('visible');
        // Play a subtle ping using Web Audio API
        try {
          const ctx = new (window.AudioContext || window.webkitAudioContext)();
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.type = 'sine';
          osc.frequency.setValueAtTime(880, ctx.currentTime);
          osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.08);
          gain.gain.setValueAtTime(0.15, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
          osc.start(ctx.currentTime);
          osc.stop(ctx.currentTime + 0.4);
        } catch (e) { /* audio not supported, no big deal */ }
      }, 5000);

      // Close toast
      const toastClose = toast.querySelector('.event-toast-close');
      if (toastClose) {
        toastClose.addEventListener('click', (e) => {
          e.stopPropagation();
          toast.classList.add('hiding');
          toast.classList.remove('visible');
          sessionStorage.setItem('toast-dismissed', '1');
        });
      }

      // --- Expandable toast logic ---
      const expandBtn = document.getElementById('toast-expand-btn');
      const pathSelect = document.getElementById('toast-path-select');
      const depositView = document.getElementById('toast-deposit-view');
      const infoView = document.getElementById('toast-info-view');
      const successDeposit = document.getElementById('toast-success-deposit');
      const successInfo = document.getElementById('toast-success-info');
      let stripeLoaded = false;

      // Helper: show one view, hide others
      function showToastView(view) {
        [pathSelect, depositView, infoView, successDeposit, successInfo].forEach(v => {
          if (v) v.style.display = 'none';
        });
        if (view) view.style.display = 'block';
      }

      // Expand toast on "Save Your Spot" click
      if (expandBtn) {
        expandBtn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          toast.classList.add('expanded');
          showToastView(pathSelect);
        });
      }

      // Path A: Deposit - load Stripe Buy Button
      const pickDeposit = document.getElementById('toast-pick-deposit');
      if (pickDeposit) {
        pickDeposit.addEventListener('click', (e) => {
          e.stopPropagation();
          showToastView(depositView);
          // Load Stripe script once, then inject the buy button
          const container = document.getElementById('toast-stripe-container');
          if (!stripeLoaded && container) {
            stripeLoaded = true;
            const buyBtn = document.createElement('stripe-buy-button');
            buyBtn.setAttribute('buy-button-id', 'buy_btn_1T2Fp3GLhVcE3NBCfcb0pYuO');
            buyBtn.setAttribute('publishable-key', 'pk_live_51QUB2XGLhVcE3NBCi9yr1IXd2QTsmr3mXYDHXlvU6NUTrQGmPv394lzT31R4O1rin83btrwJ2ItdDMBX26I7HoBl00puY5FTxJ');
            container.appendChild(buyBtn);
            const script = document.createElement('script');
            script.src = 'https://js.stripe.com/v3/buy-button.js';
            script.async = true;
            document.head.appendChild(script);
          }
        });
      }

      // Path B: Request Info
      const pickInfo = document.getElementById('toast-pick-info');
      if (pickInfo) {
        pickInfo.addEventListener('click', (e) => {
          e.stopPropagation();
          showToastView(infoView);
        });
      }

      // Back buttons
      const backDeposit = document.getElementById('toast-back-deposit');
      const backInfo = document.getElementById('toast-back-info');
      if (backDeposit) {
        backDeposit.addEventListener('click', (e) => {
          e.stopPropagation();
          showToastView(pathSelect);
        });
      }
      if (backInfo) {
        backInfo.addEventListener('click', (e) => {
          e.stopPropagation();
          showToastView(pathSelect);
        });
      }

      // Info form submission
      const infoForm = document.getElementById('toast-info-form');
      if (infoForm) {
        infoForm.addEventListener('submit', (e) => {
          e.preventDefault();
          e.stopPropagation();
          const formData = new FormData(infoForm);
          const payload = Object.fromEntries(formData.entries());
          payload.source = 'Nashville Training Toast';
          payload.timestamp = new Date().toISOString();

          // Submit to Netlify form
          const netlifyBody = new URLSearchParams();
          netlifyBody.append('form-name', 'training-info');
          for (const [k, v] of Object.entries(payload)) {
            netlifyBody.append(k, v);
          }
          fetch('/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: netlifyBody.toString()
          }).catch(() => {});

          // Show success
          showToastView(successInfo);
        });
      }

      // Prevent expanded toast from dismissing on click
      toast.addEventListener('click', (e) => {
        if (toast.classList.contains('expanded')) {
          e.stopPropagation();
          return;
        }
      });
    }
  }
});
