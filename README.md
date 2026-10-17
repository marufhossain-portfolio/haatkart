# HaatKart

> Professional multi-category e-commerce storefront — static HTML/CSS/JS, runs on GitHub Pages.
> Built by **[Md. Maruf Hossain](https://marufhossain-portfolio.github.io/)** — Industrial Engineering / Operational Excellence.

## About

HaatKart is a complete, dependency-free e-commerce front-end with **4 product categories**, a **working shopping cart** (localStorage), and an **admin panel that writes back to GitHub** so only the owner can change products.

Inspired by the layout and flow of a typical Bangladeshi multi-brand e-store (mega-menu, hero, value props, category grids, hot deals, brand section, rich footer) — but it is an **original build**: own design system, own demo brand, no copied assets or content.

## Live

Once GitHub Pages is enabled: `https://<your-username>.github.io/<repo>/`

## Pages

| Page | File | What it does |
|---|---|---|
| Home | `index.html` | Hero, value props, best sellers, tabbed hot deals, brand cards |
| Shop | `shop.html` | Category / sub-category / brand / price filters, search, sort, load-more |
| Product | `product.html?id=<id>` | Gallery, price + discount, specs table, qty picker, related products |
| Cart | `cart.html` | Line items, qty edit, remove, coupon codes, delivery + VAT summary |
| Checkout | `checkout.html` | Delivery form, payment method, order confirmation with e-mail / WhatsApp hand-off |
| Admin | `admin.html` | **Owner-only** product CRUD, image upload, store settings — saved to GitHub |

## Admin panel (owner only)

Customers **cannot** edit anything — they have no write path at all. Only someone with a GitHub token for this repo can change products.

**Setup**

1. GitHub → *Settings → Developer settings → Personal access tokens → Fine-grained tokens → Generate new token*
2. Repository access: **Only select repositories** → pick this repo
3. Permissions → **Contents: Read and write** (only this is needed)
4. Expiry: 30 days is a good habit
5. Open `admin.html`, enter your GitHub username, repo name and the token, then **Login**

**What the admin can do**

- Add / edit / delete products — name, category, sub-category, brand, price, old price, stock, badge, rating, reviews, description, specifications
- Upload a product image (auto-resized to 900px, stored in `assets/img/`)
- Store settings — order e-mail, WhatsApp number, free-delivery threshold, delivery fee, VAT %

Every save is a **commit to this repository**, and the live site picks it up within ~1 minute.

**Security notes — please read**

- The token lives in `sessionStorage` only. It is **never** written into the repository or the site source, and it is cleared when the browser tab closes.
- The site is **static**: there is no server, no database and no real payment gateway. The checkout form records the order on the customer's own device and hands it off by **e-mail** (`mailto:`) or **WhatsApp** link. To collect orders automatically you would need a backend or a form service — that is the honest limitation of a free GitHub Pages site.
- Anyone who obtains your token can edit the repo. Use a **fine-grained token scoped to this one repo**, short expiry, and revoke it if it leaks.

## Data

- `js/products.json` — **the source of truth**. Admin panel reads and writes this file.
- `js/data-fallback.js` — auto-generated copy so the site still renders when opened directly via `file://` (fetch is blocked there) or offline. The admin panel does not edit this file.

## Tech

- No frameworks, no build step, no dependencies — plain HTML + CSS + vanilla JS
- Cart, applied coupon and last orders in `localStorage`
- CSS custom properties design system, responsive from 320px up
- Product images: uploaded via the GitHub Contents API, served from `raw.githubusercontent.com`

## Local preview

`file://` works for browsing (fallback data is used), but to test the **admin panel** and real `products.json` loading, serve the folder locally:

```bash
npx serve .
# or
python -m http.server 8000
```

## License

Demo / portfolio project. Product names, prices and images are placeholders — replace them with your real catalogue via the admin panel.
