
// /js/contact.js — robust modal controller for the contact popup
// Works with: <a class="submit-btn">, <div id="contact-popup">, .close-contact
// Safe to import multiple times; guards against duplicate listeners.

let __contactInitialized = false;

function trapFocus(container, firstFocusEl) {
  const FOCUSABLE = [
    'a[href]','area[href]','input:not([disabled])','select:not([disabled])',
    'textarea:not([disabled])','button:not([disabled])','iframe','object','embed',
    '[contenteditable]','[tabindex]:not([tabindex="-1"])'
  ];
  function getNodes() {
    return Array.from(container.querySelectorAll(FOCUSABLE.join(',')))
      .filter(el => el.offsetParent !== null || el === document.activeElement);
  }
  function keyHandler(e) {
    if (e.key !== 'Tab') return;
    const nodes = getNodes();
    if (!nodes.length) return;
    const first = nodes[0];
    const last  = nodes[nodes.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault(); last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault(); first.focus();
    }
  }
  container.__trapKeyHandler = keyHandler;
  container.addEventListener('keydown', keyHandler);
  (firstFocusEl || getNodes()[0] || container).focus({ preventScroll: true });
}

function untrapFocus(container) {
  if (container && container.__trapKeyHandler) {
    container.removeEventListener('keydown', container.__trapKeyHandler);
    delete container.__trapKeyHandler;
  }
}

function disableBodyScroll() {
  const scrollY = window.scrollY || document.documentElement.scrollTop;
  document.documentElement.style.top = `-${scrollY}px`;
  document.documentElement.dataset.scrollLock = String(scrollY);
  document.documentElement.style.position = 'fixed';
  document.documentElement.style.width = '100%';
}

function enableBodyScroll() {
  const y = parseInt(document.documentElement.dataset.scrollLock || '0', 10);
  document.documentElement.style.position = '';
  document.documentElement.style.top = '';
  document.documentElement.style.width = '';
  window.scrollTo(0, y);
  delete document.documentElement.dataset.scrollLock;
}

export function initContact() {
  if (__contactInitialized) return;
  __contactInitialized = true;

  const submitBtns = Array.from(document.querySelectorAll('.submit-btn'));
  const popup = document.getElementById('contact-popup');
  if (!popup) {
    console.warn('initContact: #contact-popup not found');
    return;
  }
  const closeBtn = popup.querySelector('.close-contact');
  const inner = popup.querySelector('.contact-inner') || popup;

  // A11y roles
  popup.setAttribute('role', 'dialog');
  popup.setAttribute('aria-modal', 'true');
  popup.setAttribute('aria-hidden', 'true');

  let lastActive = null;

  function openPopup(e) {
    if (e) e.preventDefault();
    lastActive = document.activeElement;
    popup.style.display = 'flex';
    popup.style.opacity = '1';
    popup.setAttribute('aria-hidden', 'false');
    disableBodyScroll();
    trapFocus(popup, inner.querySelector('input, textarea, button, [href]'));
  }

  function closePopup() {
    untrapFocus(popup);
    popup.style.display = 'none';
    popup.style.opacity = '0';
    popup.setAttribute('aria-hidden', 'true');
    enableBodyScroll();
    if (lastActive && typeof lastActive.focus === 'function') {
      lastActive.focus({ preventScroll: true });
    }
  }

  // Open from any .submit-btn
  submitBtns.forEach(btn => {
    // If it's a link (mailto), we still want the modal instead of navigating
    btn.addEventListener('click', openPopup, { passive: false });
  });

  // Close with backdrop click
  popup.addEventListener('click', (e) => {
    if (e.target === popup) closePopup();
  });

  // Close button
  if (closeBtn) closeBtn.addEventListener('click', closePopup);

  // Escape to close
  document.addEventListener('keydown', (e) => {
    if (popup.style.display !== 'none' && e.key === 'Escape') {
      e.stopPropagation();
      closePopup();
    }
  });

  // Optional: handle successful Netlify form submit with graceful close
  const form = popup.querySelector('form');
  if (form) {
    form.addEventListener('submit', () => {
      // Let Netlify handle it; close the modal shortly after
      setTimeout(closePopup, 300);
    });
  }

  console.log('Contact popup initialized.');
}
