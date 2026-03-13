// Mobile menu toggle
const menuToggle = document.querySelector('.menu-toggle');
const navLinks = document.querySelector('.nav-links');

if (menuToggle) {
  menuToggle.addEventListener('click', () => {
    navLinks.classList.toggle('open');
  });
}

// ===== Auth Modal (injected via JS so we don't duplicate HTML) =====

const authModalHTML = `
<div class="modal-overlay" id="auth-modal">
  <div class="modal">
    <button class="modal-close" aria-label="Close">&times;</button>
    <div class="auth-tabs">
      <button class="auth-tab active" data-tab="signin">Sign In</button>
      <button class="auth-tab" data-tab="signup">Sign Up</button>
    </div>
    <form id="signin-form" class="auth-form">
      <label>Email <span class="required">*</span></label>
      <input type="email" name="email" required>
      <label>Password <span class="required">*</span></label>
      <input type="password" name="password" required>
      <p id="signin-status"></p>
      <button type="submit" class="btn btn-primary" style="width:100%;">Sign In</button>
    </form>
    <form id="signup-form" class="auth-form" style="display:none;">
      <label>Name <span class="required">*</span></label>
      <input type="text" name="name" required>
      <label>Email <span class="required">*</span></label>
      <input type="email" name="email" required>
      <label>Password <span class="required">*</span></label>
      <input type="password" name="password" required minlength="6">
      <p id="signup-status"></p>
      <button type="submit" class="btn btn-primary" style="width:100%;">Sign Up</button>
    </form>
  </div>
</div>`;

document.body.insertAdjacentHTML('beforeend', authModalHTML);

const authModal = document.getElementById('auth-modal');
const signinForm = document.getElementById('signin-form');
const signupForm = document.getElementById('signup-form');

// Auth tab switching
document.querySelectorAll('.auth-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    if (tab.dataset.tab === 'signin') {
      signinForm.style.display = '';
      signupForm.style.display = 'none';
    } else {
      signinForm.style.display = 'none';
      signupForm.style.display = '';
    }
  });
});

// Close auth modal
authModal.querySelector('.modal-close').addEventListener('click', () => {
  authModal.classList.remove('open');
});
authModal.addEventListener('click', (e) => {
  if (e.target === authModal) authModal.classList.remove('open');
});

function openAuthModal() {
  authModal.classList.add('open');
  document.getElementById('signin-status').textContent = '';
  document.getElementById('signup-status').textContent = '';
  signinForm.reset();
  signupForm.reset();
}

// Sign In
signinForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const email = signinForm.elements['email'].value.trim();
  const password = signinForm.elements['password'].value;
  const status = document.getElementById('signin-status');
  const btn = signinForm.querySelector('button[type="submit"]');
  btn.disabled = true;
  btn.textContent = 'Signing in...';
  status.textContent = '';

  auth.signInWithEmailAndPassword(email, password)
    .then(() => {
      authModal.classList.remove('open');
      signinForm.reset();
    })
    .catch((err) => {
      status.textContent = err.message;
      status.style.color = '#C94444';
    })
    .finally(() => {
      btn.disabled = false;
      btn.textContent = 'Sign In';
    });
});

// Sign Up
signupForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const name = signupForm.elements['name'].value.trim();
  const email = signupForm.elements['email'].value.trim();
  const password = signupForm.elements['password'].value;
  const status = document.getElementById('signup-status');
  const btn = signupForm.querySelector('button[type="submit"]');
  btn.disabled = true;
  btn.textContent = 'Creating account...';
  status.textContent = '';

  auth.createUserWithEmailAndPassword(email, password)
    .then((cred) => {
      return cred.user.updateProfile({ displayName: name });
    })
    .then(() => {
      authModal.classList.remove('open');
      signupForm.reset();
    })
    .catch((err) => {
      status.textContent = err.message;
      status.style.color = '#C94444';
    })
    .finally(() => {
      btn.disabled = false;
      btn.textContent = 'Sign Up';
    });
});

// ===== Auth State + Nav =====

let currentUser = null;
let isAdmin = false;
// Track if a buy was attempted while logged out
let pendingBuy = null;

const authNavItem = document.getElementById('auth-nav-item');

auth.onAuthStateChanged(async (user) => {
  currentUser = user;
  isAdmin = false;

  if (user) {
    isAdmin = await checkAdmin(user.uid);
    const displayName = user.displayName || user.email.split('@')[0];

    authNavItem.innerHTML = `
      <a href="#" class="auth-user-toggle">${displayName}</a>
      <div class="auth-dropdown">
        <a href="account.html">My Orders</a>
        ${isAdmin ? '<a href="admin.html">Admin</a>' : ''}
        <a href="#" id="logout-link">Log Out</a>
      </div>`;

    authNavItem.querySelector('.auth-user-toggle').addEventListener('click', (e) => {
      e.preventDefault();
      authNavItem.classList.toggle('dropdown-open');
    });

    document.getElementById('logout-link').addEventListener('click', (e) => {
      e.preventDefault();
      auth.signOut();
    });

    // If there was a pending buy, open the buy modal now
    if (pendingBuy && buyModal) {
      openBuyModal(pendingBuy.camera, pendingBuy.price);
      pendingBuy = null;
    }
  } else {
    authNavItem.innerHTML = '<a href="#" id="signin-link">Sign In</a>';
    document.getElementById('signin-link').addEventListener('click', (e) => {
      e.preventDefault();
      openAuthModal();
    });
  }
});

// Close dropdown when clicking elsewhere
document.addEventListener('click', (e) => {
  if (authNavItem && !authNavItem.contains(e.target)) {
    authNavItem.classList.remove('dropdown-open');
  }
});

// ===== Buy Modal =====

const buyModal = document.getElementById('buy-modal');
const buyForm = document.getElementById('buy-form');
const buyThankYou = document.getElementById('buy-thank-you');

function openBuyModal(camera, price) {
  document.getElementById('modal-title').textContent = 'Buy ' + camera;
  document.getElementById('modal-subtitle').textContent = camera + ' — ' + price;
  document.getElementById('buy-camera').value = camera;
  document.getElementById('buy-price').value = price;
  buyForm.style.display = '';
  buyThankYou.style.display = 'none';
  buyForm.reset();
  // Pre-fill from auth
  if (currentUser) {
    const nameField = buyForm.querySelector('input[name="name"]');
    const emailField = buyForm.querySelector('input[name="email"]');
    if (nameField && currentUser.displayName) nameField.value = currentUser.displayName;
    if (emailField && currentUser.email) emailField.value = currentUser.email;
  }
  document.getElementById('buy-form-status').textContent = '';
  buyModal.classList.add('open');
}

document.querySelectorAll('.buy-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const camera = btn.getAttribute('data-camera');
    const price = btn.getAttribute('data-price');

    if (!currentUser) {
      // Save what they wanted to buy, open auth modal
      pendingBuy = { camera, price };
      openAuthModal();
      return;
    }

    openBuyModal(camera, price);
  });
});

if (buyModal) {
  buyModal.querySelector('.modal-close').addEventListener('click', () => {
    buyModal.classList.remove('open');
  });

  buyModal.addEventListener('click', (e) => {
    if (e.target === buyModal) buyModal.classList.remove('open');
  });
}

if (buyForm) {
  buyForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const status = document.getElementById('buy-form-status');
    const submitBtn = buyForm.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitting...';
    status.textContent = '';

    const camera = document.getElementById('buy-camera').value;
    const price = document.getElementById('buy-price').value;
    const name = buyForm.querySelector('input[name="name"]').value.trim();
    const email = buyForm.querySelector('input[name="email"]').value.trim();
    const address = buyForm.querySelector('textarea[name="address"]').value.trim();

    // Save order to Firestore
    const orderData = {
      userId: currentUser ? currentUser.uid : null,
      userName: name,
      userEmail: email,
      camera: camera,
      price: price,
      shippingAddress: address,
      status: 'received',
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    };

    db.collection('orders').add(orderData)
      .then(() => {
        // Also submit to Formspree as email backup
        const formAction = buyForm.getAttribute('action');
        if (formAction && !formAction.includes('YOUR_FORM_ID')) {
          fetch(formAction, {
            method: 'POST',
            body: new FormData(buyForm),
            headers: { 'Accept': 'application/json' }
          }).catch(() => {}); // Formspree is just a backup, don't block on it
        }
        buyForm.style.display = 'none';
        buyThankYou.style.display = 'block';
      })
      .catch((err) => {
        status.textContent = 'Something went wrong. Please try again.';
        status.style.color = '#C94444';
      })
      .finally(() => {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Submit Order';
      });
  });
}

// ===== Contact Form =====

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
