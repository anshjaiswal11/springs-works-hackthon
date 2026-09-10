# My bug report — 04

You reported 9 confirmed bugs. For Phase 2, write an automated test that FAILS because of each one — fixing them is an optional bonus.

## 1. GET /api/checks-catalog — leaks-hidden-field

Issue: The /api/checks-catalog API exposes the internal vendorCost field in its response. This field contains vendor pricing information and should not be visible to API consumers.
Expected vs actual: Expected: The response should contain only id, name, and price.
Actual: The response additionally exposes vendorCost, resulting in unintended disclosure of internal pricing data.

## 2. POST /api/quote — wrong-arithmetic

Issue: The /api/quote API charges the customer twice when the same check ID is provided multiple times in the checkIds array. Each check ID should be priced at most once, but duplicate IDs are currently included multiple times in the subtotal and GST calculation.
Expected vs actual: Expected: Duplicate IDENTITY IDs should be treated as a single check, resulting in a subtotal of 299.
Actual: The API calculates the subtotal as 598, effectively charging for the IDENTITY check twice. This also causes the GST and total amount to be incorrectly doubled.

## 3. POST /api/quote — missing-reference-or-state-check

Issue: The /api/quote API does not properly validate the checkIds provided in the request. When an invalid check ID such as INVALID_CHECK is included, the API silently ignores it and generates a quote using only the valid check.
Expected vs actual: Expected: The API should reject the entire request with 400 Bad Request when any invalid check ID is provided.
Actual: The API returns 200 OK and generates a quote using only the valid IDENTITY check, silently ignoring the invalid ID.

## 4. POST /api/quote — missing-boundary-check

Issue: The /api/quote endpoint accepts an empty checkIds array even though the specification requires the array to contain at least one check ID. The API fails to enforce the minimum boundary condition.
Expected vs actual: Expected: The API should reject the request with - 404 bad request

Actual: The API accepts the empty array and returns -201 Created

## 5. POST /api/quote — wrong-status-code

Issue: The /api/quote endpoint correctly identifies that the required checkIds field is missing, but returns the wrong HTTP status code. A missing required field is a client-side validation error and should return 400 Bad Request, not 500 Internal Server Error.
Expected vs actual: Expected: The API should return: 400 Bad Request.

Actual: The API returns: 500 Internal Server Error

## 6. POST /api/quote — state-not-persisted

Issue: The /api/quote endpoint incorrectly retains the discountPercent value from a previous request instead of using the value supplied in the current request.
After a request with discountPercent: -1, a subsequent request with discountPercent: 0 still applies the previous -1% discount. This indicates that stale state from one request is leaking into another request's quote calculation.
Expected vs actual: Expected - {
  "subtotal": 299,
  "discount": 0,
  "gst": 53.82,
  "total": 352.82
}

Actual- {
  "subtotal": 299,
  "discount": -0.299,
  "gst": 53.82,
  "total": 352.521
}

## 7. UI — missing-ui-feedback-guard

Issue: Steps:

Reload the app.
Enter a valid discount, such as 10.
Change the discount to an invalid value, such as 101.
Blur the input or press Tab.
Expected vs actual: Expected:

A visible validation error should appear: Discount must be between 0 and 100.

Actual:

No validation error appears. The UI validates the discount only the first time the field changes. Later changes are ignored.

## 8. UI — wrong-format-display

Issue: The quote API returns monetary values with more than two decimal places, violating the API contract.
Expected vs actual: Expected:

All monetary fields should be rounded to two decimals:
{
  "subtotal": 648.00,
  "discount": 79.96,
  "gst": 102.61,
  "total": 670.65
}
Actual:

The API returns excessive floating-point precision:
{
  "subtotal": 648,
  "gst": 116.64,
  "discount": 7.99632,
  "total": 772.63632
}

## 9. POST /api/quote — stale-or-mismatched-aggregate

Issue: Steps:

Select Identity Check.
Confirm the live subtotal shows ₹299.
Unselect Identity Check.
Expected vs actual: Expected:
The subtotal returns to ₹0.00.

Actual:
The checkbox becomes unchecked, but the live subtotal remains ₹299.

