# BGV Package Pricing — Phase 2 Fix Track

This repository contains the fixed BGV Package Pricing application and its automated regression tests.

## What was fixed

All 9 confirmed bugs from the supplied bug report were fixed:

1. Hidden `vendorCost` is no longer exposed by `GET /api/checks-catalog`.
2. Duplicate check IDs are counted once.
3. Unknown check IDs cause the complete quote request to return `400 Bad Request`.
4. Empty `checkIds` is rejected with `400 Bad Request`.
5. Missing/non-array `checkIds` is rejected with `400 Bad Request` instead of `500`.
6. Each quote request is isolated; an omitted discount always means `0%`.
7. Discount validation runs on every input change and before requesting a quote.
8. Discount, GST and total use the specified formula and monetary values are rounded to two decimals.
9. The live subtotal is recalculated from the current checkbox state, so it decreases when checks are unchecked.

The original bug report documents these nine issues. See `my-bug-report.md` and `TEST_CASES.md` for the regression mapping.

## Additional defects found and fixed

During source review, five more defects were found:

- Quote cache ignored `discountPercent`, returning stale quotes for the same checks.
- Quote calculation mutated catalog prices, corrupting future quotes/catalog responses.
- The UI sent checkbox DOM IDs such as `check-IDENTITY` instead of the catalog ID `IDENTITY`.
- The UI displayed the live subtotal in the Quote Total field instead of the API's total.
- The UI displayed a success message for failed API requests and network errors.

## API behavior

### GET `/api/checks-catalog`

Returns public catalog fields only:

```json
[
  { "id": "IDENTITY", "name": "Identity Check", "price": 299 }
]
```

### POST `/api/quote`

Request:

```json
{
  "checkIds": ["IDENTITY", "EDUCATION"],
  "discountPercent": 10
}
```

Rules:

- `checkIds` is required and must be a non-empty array of strings.
- Every ID must exactly match a catalog ID.
- Duplicate IDs are counted once.
- `discountPercent` is optional and defaults to `0`.
- `discountPercent` must be a finite number from `0` through `100`.
- Discount = `subtotal * discountPercent / 100`.
- GST = `(subtotal - discount) * 0.18`.
- Total = `subtotal - discount + gst`.
- Monetary values are rounded to two decimal places.
- Successful quotes return HTTP `200`.

## Running locally

Requirements: Node.js 20+.

```bash
npm install
npm start
```

Then open `http://localhost:3004`.

## Running automated tests

The main suite has no additional test-framework dependency:

```bash
npm test
```

Individual suites:

```bash
npm run test:api
npm run test:ui
```

An HTTP integration suite is also included:

```bash
npm run test:integration
```

## Project structure

```text
.
├── data.js
├── handlers.js
├── isolation.js
├── pricing.js
├── server.js
├── public/
│   ├── app.js
│   ├── app-logic.js
│   ├── index.html
│   ├── report-widget.js
│   └── style.css
├── test/
│   ├── api-unit.test.js
│   ├── api.integration.test.js
│   └── ui-logic.test.js
├── TEST_CASES.md
├── my-bug-report.md
└── README.md
```

## Notes

`/api/reset`, `/spec`, `/openapi.json`, authentication, isolation, and the reporting widget remain available for the challenge workflow. The `/spec` page reads this README so the fixed behavior is documented in-app.
