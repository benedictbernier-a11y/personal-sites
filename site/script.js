// Mobile menu toggle
const menuToggle = document.querySelector('.menu-toggle');
const navLinks = document.querySelector('.nav-links');

if (menuToggle) {
  menuToggle.addEventListener('click', () => {
    navLinks.classList.toggle('open');
  });
}

// Contact form handler
const form = document.getElementById('contact-form');
const formStatus = document.getElementById('form-status');
const thankYou = document.getElementById('thank-you');

if (form) {
  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const name = form.elements['name'].value.trim();
    const email = form.elements['email'].value.trim();

    if (!name || !email) {
      formStatus.textContent = 'Please fill in your name and email.';
      formStatus.style.color = '#A0522D';
      return;
    }

    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending...';
    formStatus.textContent = '';

    fetch(form.action, {
      method: 'POST',
      body: new FormData(form),
      headers: { 'Accept': 'application/json' }
    })
      .then((response) => {
        if (response.ok) {
          form.reset();
          form.style.display = 'none';
          thankYou.style.display = 'block';
        } else {
          formStatus.textContent = 'Something went wrong. Please try again.';
          formStatus.style.color = '#A0522D';
        }
      })
      .catch(() => {
        formStatus.textContent = 'Something went wrong. Please try again.';
        formStatus.style.color = '#A0522D';
      })
      .finally(() => {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Send Message';
      });
  });
}
