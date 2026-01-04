# 🚀 WEBHOOK DEPLOYMENT INSTRUCTIONS

## Step 1: Add Environment Variables to Render

Go to your Render dashboard → Your service → Environment tab

Add these FIVE environment variables:

### 1. STRIPE_SECRET_KEY
```
sk_test_... (your existing test key)
```

### 2. FIREBASE_PROJECT_ID
```
topseat-d1d5d
```

### 3. FIREBASE_CLIENT_EMAIL
```
firebase-adminsdk-fbsvc@topseat-d1d5d.iam.gserviceaccount.com
```

### 4. FIREBASE_PRIVATE_KEY
⚠️ **IMPORTANT:** Copy this EXACTLY as shown (with the `\n` escapes):
```
-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQChYz+geojpW6LJ\nwgp8Y6vVOHH1U4TdCnf4TtdBRHVfYV1VasI6jxnD+gd9Aez3qb16KiFzR1vTaABk\nJAEzYV/nwM8pEft+hNfU02bZN8aZlu99eIOxuffsNxKrx8s8+i6aA+fuPEgLAYOh\nTWGljM2efBCsw4IziP04rFRECvT4g7LjXZOvOeXnM+ec6ptg0BKKIpR2AQwUtEyX\nrJH8VC5dQtCY9Kz9sBv4TWHERXbPavMsrKOTVKzGJ4d+dEMTK6YrUutxHLRBOwJk\noFFwRlCR9SsM0tkUtpg5xw4daFW83Ky67+2PuJY+OtPVIzLkk2fCgy/xB18ITDnX\nfXEhgt43AgMBAAECggEACtZwYmV4JjuaHfRi4eGLm4Dz3iaiqHlYfxtER0TCoQoX\ny3Gk42vSrh9vO0zSzfrfF4IWxvgGyZaVWCQ21G14lEaVYsurWN6w48Diijm9o3jI\nUmOybE/xvzIflduP4WNnl74laBEyQVLztPROV2CyOi9Yq1Fhv/Y2EwU3j24w7zNF\njH74zLMMHlUebifh03UlWSop9jb1Emjc4mzWa62qy+5XN6IUa6ti3iVUTcdrkcCw\n30xaS9j6Zp77fZo5f+b8z76oaxTlTup+YBFrQ6ITYiqcUhskT0o/w0MV0PV7Pl6J\naVkrGX04m9Ag/Pah+NdsbrPiIM7hT84He7JrW7GlIQKBgQDWWp9KbrkMlnKI1c5z\nUKBqj01L3gIyX6mtwN3brfbvkRMJOqwIDyw/3jt6eTk5lWOniTkJwrqIitUbVdJc\n2nnXKA9j9Ok/9KPlKAiMVLeM8fL3LCNoWj63yLYMtT/0k06exx4L8f+GXoy8JIEX\nPV+7uwOU3lYOwAtPZf/r64u45wKBgQDAvjpmlosnw0aILYbWuUiuEceqLbnnaeQ2\nSxpIOJqkymAbttt1bCulGgAT5vSpHo7KvMzMALELplRzr8ZOkYw/laWXjgpdVWKh\nEn2iB2lcXJdvV6veLTPQ/0wojUCB+mSX0ZU+W1V4v+9tbNSpCI2Vr2mvn94JzNuv\niNJTs+Z2MQKBgAYn0A85IsNDxsI7MZSKKjElMFkPZQzBRoQg174pPsAecGeBcdNB\nbEnhPeAEfyoyKgxzmlm3Z9fn9Lq2OjZEZ99P3TFHpTMa+WHpRmWRQTwg7pM+hz3F\n6aspbmDrC40gdc+FdE1vg6D+MhhtC+/46Tjg4/dwcxQ1W53KFhFWUErdAoGBAJB/\nzS7OHGNiHgXIA/gFDr0ZrVQjVeVtWN9vbLPKY/25j1YXv+4He60akgZZtwD3XNwX\nsX4b4p+2Qkg89nI+4iNlYLD/lzuj4P6a6z9HSTEqZYne84Xs45UDYShhxYPsoe/D\n+5y1Qp31X13tIn3bYLJgwN4e/4rfX6/45p5EGDpxAoGAKCU3IuFMP7xjZoHGHj5b\nXOOWoPDTx21X4JHlCCx42zPoME29LhuEZkdeqhppO5EOxgxJ4msM27LaWDliLhbG\n6m40wrgaOL8PIwh4gewWwcElYmWl7eYNAbdGif46tYhlzUbQVAqHgn+/PASxHAJA\n/dnqtb8FTbze2V6YkVxBOOY=\n-----END PRIVATE KEY-----\n
```

### 5. STRIPE_WEBHOOK_SECRET
Leave this EMPTY for now. We'll add it in Step 3.

Click "Save Changes"

---

## Step 2: Deploy Updated Backend

1. Commit and push to GitHub:
```bash
git add index.js package.json
git commit -m "Add Firebase Admin SDK and webhook integration"
git push
```

2. Wait for Render to deploy (~2 minutes)

3. Check the logs for "Server running on port..."

---

## Step 3: Configure Stripe Webhook

1. Go to https://dashboard.stripe.com/test/webhooks

2. Click **"Add endpoint"**

3. **Endpoint URL:** 
```
https://fallingman.onrender.com/webhook
```

4. **Events to send:** Select these events:
   - `checkout.session.completed`
   - `customer.subscription.deleted`
   - `customer.subscription.updated`

5. Click **"Add endpoint"**

6. After creating, click on your webhook endpoint

7. Click **"Reveal"** next to "Signing secret"

8. Copy the secret (starts with `whsec_...`)

9. Go back to Render → Environment → Edit `STRIPE_WEBHOOK_SECRET`

10. Paste the webhook secret and save

11. Render will automatically redeploy

---

## Step 4: Test the Integration

1. Go to https://topseat.us/attempts.html

2. Click "Buy Now" on any product

3. Use Stripe test card:
   - Card: `4242 4242 4242 4242`
   - Expiry: `12/34`
   - CVC: `123`
   - ZIP: `12345`

4. Complete payment

5. Check Render logs - you should see:
```
✅ Webhook event received: checkout.session.completed
💳 Payment successful!
👤 Found user: [user_id]
✅ Added 10 bonus attempts to [email]
```

6. Refresh your game - you should see updated attempts!

---

## ✅ Done!

Future purchases will now automatically update Firestore:
- **10 attempts** → Adds 10 to `bonusAttempts`
- **30 attempts** → Adds 30 to `bonusAttempts`
- **Pro subscription** → Sets `subscriptionStatus` to "active"
- **Cancelled subscription** → Sets `subscriptionStatus` to "cancelled"

---

## 🔒 Security Notes

- Never commit the Firebase service account JSON to GitHub
- Keep it only in Render environment variables
- Rotate keys if they're ever exposed
- Use Stripe test mode until ready for production
