# Automated Test Cases

The suite uses Node's built-in `node:test` runner. API business logic is covered without external test frameworks, and an optional HTTP integration suite is included.

## Phase 2 regression tests

| ID | Area | Test case | Expected result |
|---|---|---|---|
| TC-01 | API | GET checks catalog | Only `id`, `name`, `price` are returned |
| TC-02 | API | Quote duplicate `IDENTITY` IDs | Subtotal is 299, not 598 |
| TC-03 | API | Quote with an invalid ID | HTTP 400; whole request rejected |
| TC-04 | API | Quote with empty `checkIds` | HTTP 400 |
| TC-05 | API | Quote without `checkIds` | HTTP 400 |
| TC-06 | API | Quote after a previous non-zero discount with discount omitted | Omitted discount is 0 |
| TC-07 | API | Quote `IDENTITY + EDUCATION` at 10% | Discount 79.80, GST 129.28, total 847.48 |
| TC-08 | UI logic | Uncheck a selected check | Live subtotal recalculates downward |
| TC-09 | UI logic | Select a check | Quote payload uses catalog ID, e.g. `IDENTITY` |
| TC-10 | UI logic | Display money values | Values use INR and exactly two decimal digits |
| TC-11 | UI logic | Change valid discount to invalid discount | Validation message appears again |
| TC-12 | UI logic | Failed quote response | Success message is not displayed |
| TC-13 | API | Same checks with different discounts | New discount is calculated; no stale cached quote |
| TC-14 | API | Quote with a discount | Catalog prices remain unchanged after quote |
| TC-15 | API | Boolean/object/null/out-of-range discount | HTTP 400 |
| TC-16 | API | Successful quote status | HTTP 200 |

## Additional code defects found during review

1. **Stale quote cache** — cache was keyed only by selected check IDs and ignored the discount. The fix removes unsafe request-result caching.
2. **Catalog state mutation** — quote calculation permanently changed `check.price`. The fix makes calculation read-only.
3. **UI ID/payload mismatch** — the checkbox DOM id (`check-IDENTITY`) was sent instead of the catalog value (`IDENTITY`). The fix uses the checkbox value.
4. **UI total mismatch** — the Quote Total field displayed the live subtotal instead of the server's total. The fix displays the API total.
5. **False success on API errors** — non-2xx responses and network errors were shown as successful quote generation. The fix checks `res.ok` and reports an error.

## Commands

```bash
npm install
npm test
npm run test:api
npm run test:ui
npm run test:integration
```
