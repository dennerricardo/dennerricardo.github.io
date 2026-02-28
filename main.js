/**
 * * main.js
 *
 * WHY a separate JS file:
 * - Cached by the browser after the first load. Every subsequent page
 *   (practice.html, contact.html) gets it instantly from cache.
 * - Easier to debug: browser DevTools shows "main.js line 25"
 *   instead of "index.html line 312".
 * - A single place to add new behaviour for the whole site.
 *
 * WHY defer (set on the <script> tag in HTML):
 * - The browser downloads main.js in parallel with parsing HTML,
 *   but only executes it AFTER the full DOM is ready.
 * - This means we never need DOMContentLoaded wrappers — the DOM
 *   is always available when this script runs.
 */

/* =============================================
   SCROLL-TRIGGERED ANIMATIONS
   WHY IntersectionObserver:
   - No scroll event listeners → no performance hit.
   - Fires only when an element enters the viewport.
   - Native browser API, no jQuery or library needed.
   - Works perfectly with Playwright/Selenium tests
     because elements are fully visible before being
     interacted with.
============================================= */
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('animate-in');
      // WHY unobserve: once the animation has played
      // we don't need to watch that element anymore.
      // This keeps the observer lean and efficient.
      observer.unobserve(entry.target);
    }
  });
}, {
  // threshold: 0.12 means 12% of the element must be
  // visible before we trigger. Prevents animations
  // firing too early on tall sections.
  threshold: 0.12
});

// Observe all cards and timeline items on the page.
// querySelectorAll returns a NodeList, and forEach works
// on it directly — no need to spread into an array.
document.querySelectorAll('.skill-card, .timeline-item').forEach(el => {
  observer.observe(el);
});


/* =============================================
   ACTIVE NAV LINK HIGHLIGHT
   WHY: As the user scrolls, the nav link
   corresponding to the visible section gets
   highlighted. This is called "scroll spy" and
   it significantly improves UX on long pages.
   We use IntersectionObserver again — same
   pattern, different purpose.
============================================= */
const sections   = document.querySelectorAll('section[id]');
const navLinks   = document.querySelectorAll('.nav-links a');

const navObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      // Remove active state from all links
      navLinks.forEach(link => link.style.color = '');
      // Add active state to the matching link
      const activeLink = document.querySelector(
        `.nav-links a[href="#${entry.target.id}"]`
      );
      if (activeLink) activeLink.style.color = 'var(--accent)';
    }
  });
}, {
  // rootMargin shifts the trigger point to the middle of
  // the screen, so the nav updates when a section is
  // roughly centered — feels more natural.
  rootMargin: '-40% 0px -50% 0px'
});

sections.forEach(section => navObserver.observe(section));


/* =============================================
   CONTACT FORM — CLIENT-SIDE FEEDBACK
   WHY: Formspree handles the actual sending,
   but we add a JS layer so the user gets
   instant visual feedback (button state change)
   instead of a full page reload.
============================================= */
const contactForm   = document.getElementById('contact-form');
const submitButton  = document.getElementById('contact-submit');

if (contactForm && submitButton) {
  contactForm.addEventListener('submit', async (e) => {
    e.preventDefault(); // Stop default browser form submit

    // Disable button and show loading state
    submitButton.disabled    = true;
    submitButton.textContent = 'Sending...';

    try {
      const response = await fetch(contactForm.action, {
        method:  'POST',
        body:    new FormData(contactForm),
        headers: { 'Accept': 'application/json' }
      });

      if (response.ok) {
        // Success state
        submitButton.textContent       = '✓ Message sent!';
        submitButton.style.background  = '#00cc6a';
        contactForm.reset();

        // Reset button after 4 seconds
        setTimeout(() => {
          submitButton.textContent      = 'Send Message →';
          submitButton.style.background = '';
          submitButton.disabled         = false;
        }, 4000);

      } else {
        throw new Error('Server error');
      }

    } catch {
      submitButton.textContent      = 'Something went wrong — try again';
      submitButton.style.background = '#c0392b';
      submitButton.disabled         = false;

      setTimeout(() => {
        submitButton.textContent      = 'Send Message →';
        submitButton.style.background = '';
      }, 4000);
    }
  });
}