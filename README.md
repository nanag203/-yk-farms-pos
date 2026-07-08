# YK Farms POS

A simple point-of-sale app for Yeboah Kudom Farms — record sales, track stock, and manage customer debts, from your phone or laptop.

## What's inside

- **Home** — today's sales total, total debt owed, low stock warnings
- **New Sale** — pick products and quantities, choose or add a customer, record full or partial payment
- **Stock** — see current stock per product, add new products, log restocks
- **Debts** — see who owes what, record payments against a balance

## One-time setup (do this once)

### 1. Database (already done)
You already ran `schema.sql` in Supabase's SQL Editor. Now also run `functions.sql` the same way — paste it into a new SQL Editor query and click Run. This creates the function that records a sale, updates stock, and updates debt all at once.

### 2. Environment variables
Copy `.env.local.example` to a new file named `.env.local` and it will already have your real Supabase URL and key filled in — no changes needed unless you regenerate your keys later.

### 3. Add your first products
Once the app is live, go to the **Stock** tab and add your egg products (e.g. "Large Eggs", price per crate, starting stock count) before recording your first sale.

## Deploying (put this on your phone as a real link)

1. **Push this folder to GitHub**: create a new repository on github.com, then upload all these files to it (or use GitHub Desktop if you prefer clicking over typing commands).
2. **Go to vercel.com** and sign in with your GitHub account.
3. Click **Add New → Project**, select your `yk-farms-pos` repository.
4. Before deploying, add the environment variables under **Environment Variables**:
   - `NEXT_PUBLIC_SUPABASE_URL` → your Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_KEY` → your Supabase publishable key
5. Click **Deploy**. In about a minute you'll get a link like `yk-farms-pos.vercel.app` — open that on your phone and you're live.

## Notes

- Every time you push changes to GitHub, Vercel automatically redeploys — no manual steps needed.
- Data security is currently open (anyone with your app link can read/write). This is fine while it's just you and your mum using it, but ask if you want to add a login later.
