# BackFlashBrothers — Setup Guide

Step-by-step instructions for setting up business email, Firebase, and connecting everything to the website.

---

## Part 1: Business Email (Zoho Mail — Free)

### 1.1 Create a Zoho Mail Account
- Go to https://www.zoho.com/mail/
- Click "Sign Up Free" (make sure you pick the **Free plan** — 5 users, 5GB each)
- Sign up with a personal email for now (you'll add your custom domain next)

### 1.2 Add Your Domain
- In the Zoho setup wizard, enter **backflashbrothers.com**
- Zoho will ask you to verify you own the domain

### 1.3 Verify Domain Ownership
- Zoho will give you a **TXT record** (looks like: `zoho-verification=zb12345678.zmverify.zoho.com`)
- Log in to your domain registrar (wherever you bought backflashbrothers.com)
- Go to **DNS Settings** (sometimes called "DNS Management" or "DNS Records")
- Add a new **TXT record**:
  - **Host/Name:** `@`
  - **Value:** paste the verification code Zoho gave you
  - **TTL:** leave default or set to 3600
- Save it and go back to Zoho and click "Verify"
- Note: DNS changes can take a few minutes to an hour to go through. If verification fails, wait 15 minutes and try again.

### 1.4 Create Your Email Addresses
- Create **benedict@backflashbrothers.com**
- Create **laurence@backflashbrothers.com**
- Optionally create **hello@backflashbrothers.com** as a shared/alias address for customer inquiries

### 1.5 Set Up MX Records
Zoho will give you MX records to add. Go back to your domain registrar's DNS settings and add these:

| Type | Host/Name | Value | Priority |
|------|-----------|-------|----------|
| MX | @ | mx.zoho.com | 10 |
| MX | @ | mx2.zoho.com | 20 |
| MX | @ | mx3.zoho.com | 50 |

**Important:** If there are any existing MX records (like from your domain registrar's default email), delete them first.

### 1.6 (Optional) Set Up SPF Record
This helps your emails not land in spam. Add another DNS record:

| Type | Host/Name | Value |
|------|-----------|-------|
| TXT | @ | `v=spf1 include:zoho.com ~all` |

### 1.7 Test It
- Go to https://mail.zoho.com and log in with your new email
- Send a test email to your personal email
- Reply from your personal email back to your business email
- Make sure both directions work

You now have working business email.

---

## Part 2: Firebase Project Setup

### 2.1 Create a Firebase Project
- Go to https://console.firebase.google.com
- Sign in with your business email (benedict@backflashbrothers.com)
- Click "Create a project"
- Name it **backflashbrothers**
- You can disable Google Analytics (you don't need it right now)
- Click "Create Project"

### 2.2 Enable Email/Password Authentication
- In the Firebase console, click **Authentication** in the left sidebar
- Click **Get Started**
- Click **Email/Password**
- Toggle the first switch to **Enabled**
- Click **Save**
- (Optional) Go back and also enable **Google** sign-in if you want that option

### 2.3 Enable Cloud Firestore
- In the left sidebar, click **Firestore Database**
- Click **Create Database**
- Choose **Start in production mode**
- Pick a location closest to you (us-central1 is fine for San Antonio)
- Click **Enable**

### 2.4 Register a Web App
- Click the gear icon (top left) > **Project settings**
- Scroll down to "Your apps" and click the **</>** (web) icon
- Nickname: **backflashbrothers-web**
- You do NOT need Firebase Hosting (skip that checkbox)
- Click **Register app**
- You'll see a config block that looks like this:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "backflashbrothers.firebaseapp.com",
  projectId: "backflashbrothers",
  storageBucket: "backflashbrothers.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
```

- **Copy this entire block.** You'll need it in the next step.

### 2.5 Paste Your Config into the Website
- Open the file `site/firebase-config.js`
- Replace the placeholder config with your real config:

**Before:**
```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

**After:** paste your real values from the Firebase console.

### 2.6 Create Your Admin Accounts
- Open your website and click **Sign In** in the nav
- Click the **Sign Up** tab
- Create an account for Benedict (use benedict@backflashbrothers.com)
- Do the same for Laurence (use laurence@backflashbrothers.com)
- Now go back to the Firebase console > **Authentication** > **Users**
- You'll see both accounts listed. **Copy the User UID** for each one (it's a long string like `aBcDeFgHiJkLmNoPqRsTuVwXyZ`)

### 2.7 Set Up Admin Access in Firestore
- In Firebase console, go to **Firestore Database**
- Click **Start collection**
- Collection ID: `config`
- Document ID: `admins`
- Add a field:
  - Field name: `uids`
  - Type: **array**
  - Add two values (both as strings): paste Benedict's UID and Laurence's UID
- Click **Save**

Now you and Laurence are recognized as admins on the website.

### 2.8 Set Up Firestore Security Rules
- In Firebase console, go to **Firestore Database** > **Rules** tab
- Delete the default rules and paste these:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Admin UIDs list — only admins can read, nobody can write (edit in console only)
    match /config/admins {
      allow read: if request.auth != null &&
        request.auth.uid in resource.data.uids;
      allow write: if false;
    }

    // Orders — customers can create, read their own. Admins can read/update all.
    match /orders/{orderId} {
      allow create: if request.auth != null;
      allow read: if request.auth != null &&
        (request.auth.uid == resource.data.userId ||
         get(/databases/$(database)/documents/config/admins).data.uids.hasAny([request.auth.uid]));
      allow update: if request.auth != null &&
        get(/databases/$(database)/documents/config/admins).data.uids.hasAny([request.auth.uid]);
      allow delete: if false;
    }

    // Inventory — only admins can read and write
    match /inventory/{itemId} {
      allow read, write: if request.auth != null &&
        get(/databases/$(database)/documents/config/admins).data.uids.hasAny([request.auth.uid]);
    }
  }
}
```

- Click **Publish**

---

## Part 3: Connect Formspree (Email Backup for Orders)

### 3.1 Create a Formspree Account
- Go to https://formspree.io
- Sign up with your business email
- Free plan allows 50 submissions per month

### 3.2 Create a Form
- Click **New Form**
- Name it "Buy Orders" (or whatever you want)
- Formspree will give you an endpoint like: `https://formspree.io/f/xAbCdEfG`
- Copy the form ID (the part after `f/`, like `xAbCdEfG`)

### 3.3 Add It to the Website
- Open `site/shop.html`
- Find this line near the top of the buy modal:
  ```
  action="https://formspree.io/f/YOUR_FORM_ID"
  ```
- Replace `YOUR_FORM_ID` with your actual form ID

### 3.4 (Optional) Create a Second Form for Contact Page
- Create another form in Formspree called "Contact Messages"
- Open `site/contact.html`
- Find: `action="https://formspree.io/f/PLACEHOLDER"`
- Replace `PLACEHOLDER` with the new form ID

---

## Checklist

Use this to track your progress:

- [ ] Zoho Mail account created
- [ ] Domain verified in Zoho
- [ ] Email addresses created (benedict@, laurence@, hello@)
- [ ] MX records added to DNS
- [ ] SPF record added to DNS
- [ ] Test emails working
- [ ] Firebase project created
- [ ] Email/Password auth enabled
- [ ] Cloud Firestore enabled
- [ ] Web app registered and config copied
- [ ] Config pasted into `site/firebase-config.js`
- [ ] Admin accounts created (signed up on website)
- [ ] Admin UIDs added to Firestore `config/admins` doc
- [ ] Firestore security rules published
- [ ] Formspree account created
- [ ] Buy form endpoint added to `site/shop.html`
- [ ] Contact form endpoint added to `site/contact.html`
