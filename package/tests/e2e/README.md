# Playwright E2E

## What this suite covers

- Smoke auth verification (stored login state)
- Full happy path business flow:
  - Product config
  - Variant creation
  - Stock-in
  - Order completion
  - Finance and dashboard validation
- Discount extension flow:
  - Coupon + manual discount

Main spec: `tests/e2e/happy-path.spec.ts`

## Environment

The suite expects these values:

- `PLAYWRIGHT_BASE_URL` (default: `http://localhost:3000`)
- `E2E_API_BASE_URL` (default: `http://localhost:5000/api`)
- `E2E_ADMIN_USERNAME` / `E2E_ADMIN_PASSWORD`
  - Falls back to `ADMIN_USERNAME` / `ADMIN_PASSWORD`

Recommended frontend test env file:

- `package/.env.test.local`

## Run (single command)

From project root:

```bash
./scripts/run-playwright-happy-path.sh
```

This script:

1. Starts backend
2. Runs `wipe` + `seed`
3. Starts frontend
4. Runs Playwright suite

## Run manually

```bash
cd package
npm run test:e2e -- tests/e2e/happy-path.spec.ts
npm run test:e2e:headed -- tests/e2e/happy-path.spec.ts
npm run test:e2e:ui
npm run test:e2e:report
```
