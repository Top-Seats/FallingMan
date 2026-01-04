# Sky Fall Payments Backend

Minimal Node.js/Express backend for handling Stripe payments for the Sky Fall game.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Run locally:
```bash
npm start
```

3. Test health check:
```bash
curl http://localhost:3000/health
```

Should return: `{"status":"ok"}`

## Deployment on Render

1. Connect your GitHub repo to Render
2. Create a new Web Service
3. Build Command: `npm install`
4. Start Command: `npm start`
5. Environment: Node
6. Add Environment Variable:
   - `STRIPE_SECRET_KEY` = Your Stripe secret key (from Stripe Dashboard)

The service will automatically start on the port provided by Render via `process.env.PORT`.

## Endpoints

- `GET /health` - Health check endpoint
- `POST /create-checkout-session` - Create a Stripe checkout session
  - Request body: `{ "priceId": "price_xxx" }`
  - Response: `{ "id": "cs_xxx", "url": "https://checkout.stripe.com/..." }`

## Environment Variables

- `STRIPE_SECRET_KEY` - Stripe secret key (required)
- `PORT` - Server port (optional, defaults to 3000)
