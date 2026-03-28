# Modernize Next.js Free (MADLAXUE Admin Suite)

A bundled admin dashboard built on **Next.js 16**, **React 19**, and **Material UI v7**, paired with an Express/Mongo backend that exposes inventory, orders, finance, and media-management APIs. The repo is meant to serve as a tailorable admin experience for MADLAXUE-style businesses: the frontend delivers dashboards, auth screens, and sample layouts while the backend delivers CRUD services for categories, variants, stock movements, orders, coupons, finance data, and images.

## Architecture at a glance

- **Frontend (`package/`)** – a Next.js app with the Modernize theme, TypeScript, MUI components, and the Playwright-based `tests/e2e` suite. It hits the backend via `/api/*` routes and ships with sample dashboards, form pages, authentication, and responsive layout scaffolding.
- **Backend (`backend/`)** – an Express server wired to MongoDB via Mongoose. It applies helmet, CORS (controlled by `ALLOWED_ORIGINS`), rate limiting, JWT protection, and exposes endpoints for inventory, variants, colors, categories, dashboard stats, stock movements, orders, coupons, finance analytics, and image uploads.
- **Scripts (`scripts/`)** – helper scripts such as `scripts/run-playwright-happy-path.sh` orchestrate Playwright runs with the happy-path spec.

## Key capabilities

- Modern Next.js 16 + React 19 + MUI 7 stack with clean layout pages
- Express REST API with authentication guard, validation, and upload support for variant images
- Warehouse-focused resources: categories, product types, colors, variants, stock movements, orders, coupons, finance summaries
- Playwright happy-path test (`package/tests/e2e/happy-path.spec.ts`) exercising the main flows
- Environment-aware configs with `.env.example` for ports, Mongo URI, uploads, rate limits, and CORS origins

## Getting started

1. **Frontend** (`package/`)
   - Install: `cd package && npm install`
   - Run dev server: `npm run dev`
   - Build: `npm run build`
   - Lint: `npm run lint`
   - E2E tests: `npm run test:e2e` (add `:headed`, `:ui`, or `:report` as needed)

2. **Backend** (`backend/`)
   - Copy `.env.example` to `.env` and fill values for `PORT`, `MONGODB_URI`, `ALLOWED_ORIGINS`, `UPLOAD_PATH`, `MAX_FILE_SIZE`, `MAX_IMAGES_PER_VARIANT`, `GRIDFS_BUCKET`, and `HOST_URL`.
   - Install dependencies: `cd backend && npm install`
   - Seed or wipe data: `npm run seed` / `npm run wipe`
   - Start server: `npm run dev` (uses `nodemon`) or `npm start`

3. **Playwright helper** – `npm run test:e2e` from `package/` can be wrapped with `scripts/run-playwright-happy-path.sh` if you need an opinionated happy-path run.

## API highlights

- `POST /api/auth/login` / `POST /api/auth/register` for JWT-based access
- Protected resources such as `/api/categories`, `/api/variants`, `/api/stock-movements`, `/api/orders`, `/api/coupons`, `/api/finance`, and `/api/images`
- Image uploads support `multipart/form-data` to `/api/images/upload/:variantId` with primary flag toggling
- Finance endpoints return summaries, breakdowns, and top-selling data by period
- Dashboard route delivers a compact stats payload for overview screens

## Development tips

- Frontend expects the backend host in `NEXT_PUBLIC_API_URL` or proxied via rewrites to `/api/*` (adjust `next.config.mjs` if needed).
- The backend uses `.env` and logs its environment at startup.
- Run the Playwright happy-path spec in headed mode when debugging UI failures: `npm run test:e2e:headed` from `package/`.

## Testing & releases

- `package/` houses Playwright specs under `tests/e2e`; keep the `happy-path.spec.ts` aligned with the UI selectors and flows.
- Deploy the frontend with `npm run build` and `npm run start`; the backend can be containerized or run alongside with `npm start`.

## License

MIT © AdminMart / Modernize Free Next.js Template
