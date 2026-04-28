# Smart Stock Intake Feature Plan

## Context
When restocking from trips, the owner imports new inventory via Excel. Her preferred format is highly simplified: each color/style is its own row, and the quantity for all sizes combined is written simply as (e.g., `4pcs`).

## Objective
To preserve her fast data entry process while ensuring that the underlying inventory system correctly tracks individual sizes.

## 1. Trip & Batch Tagging
To easily identify stock from specific restock trips without mixing up existing items:
*   **Import UI Update:** Add a "Trip / Batch Name" (e.g., "Dubai Spring 26") text field to the Excel Import popup.
*   **Backend Tagging:** The Electron import handler will tag all products and variants imported in that session with this Trip Name.
*   **Inventory Filter:** Add a dropdown filter in the Inventory screen to quick-filter products by "Trip / Batch".

## 2. Smart Variant Splitting
Instead of creating a single product with a stock of 4, the parser will smartly split quantities like `4pcs` into individual variants (1 stock each) based on explicitly provided—or safely fallback—sizes.

### How it will work:
She adds a new column to her Excel file named `Size Range` (or `Sizes`).

*   **Scenario A (Explicit Comma List):** 
    *   Quantity = `3pcs`
    *   Size Range = `S, M, L`
    *   *Result:* Creates 3 variants: Size S, Size M, Size L.
*   **Scenario B (Explicit Dash Range):**
    *   Quantity = `4pcs`
    *   Size Range = `38-44`
    *   *Result:* Creates 4 variants incrementing by 2: Size 38, 40, 42, 44.
*   **Scenario C (Missing/Blank Size column):**
    *   Quantity = `4pcs`
    *   Size Range = `(blank)`
    *   *Result (Safe Fallback):* Creates 4 variants named: `Undefined 1`, `Undefined 2`, `Undefined 3`, `Undefined 4`.

## 3. Maintenance Filter
Because we want to avoid incorrect guessing of sizes when she forgets to input the `Size Range` column, the system defaults to "Undefined". 

To help her manage these fallbacks later:
*   Add a quick-toggle filter in the Inventory screen labeled **"Needs Size Update"**.
*   This will display all products containing an "Undefined" variant.
*   She can easily find these items and update their sizes to the correct physical items when she is unpacking the stock.

## 4. Automated SKU Generation (Zero Memorization)
To prevent the owner from having to memorize complex category prefixes (like "DJV-CAL" for dresses or "DJV-JAY" for men's items), the system will handle SKU generation automatically based on the Category she types.

*   **How it works in Excel:** She can completely **leave the SKU column blank**. All she needs to do is fill in the "Category" column (e.g., "Dresses").
*   **How the System Handles it:**
    *   The import script will check the given Category.
    *   It will map the Category to its designated prefix using a predefined list (e.g., `Dresses` -> `DJV-CAL`, `Men` -> `DJV-JAY`).
    *   It will find the next available sequential number for that prefix (e.g., `045`).
    *   It will append the specific size variant generated in Step 2 (e.g., `-38`).
    *   **Final Auto-Generated SKU:** `DJV-CAL-045-38`.

### Prefix Configuration Requirement
To make this work flawlessly, the system needs to be pre-programmed with all the shop's categories and their desired prefixes. 

If she introduces a completely new category in the Excel sheet that the system doesn't know about yet, it will safely fall back to using the shop's default prefix **`DJV-`** (Dee's Joy Ventures) followed by the first 3 letters of the new category.
*   *Example:* A new category called "Shoes" will automatically get the prefix `DJV-SHO`.
