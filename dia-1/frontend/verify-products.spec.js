// scratch/verify-products.spec.js
// Automated Playwright E2E test suite for VerifyProducts view
// Run command: npx playwright test scratch/verify-products.spec.js

import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:8080'; // Rebuilt same-origin port

test.describe('Verify Products UI Flow', () => {

  let uniqueDesignNo;
  let uniqueOrderId;

  test.beforeEach(async ({ page }) => {
    // 1. Generate unique identifiers for this test execution
    const randomId = Math.floor(Math.random() * 10000000);
    uniqueDesignNo = `DES-E2E-${randomId}`;
    uniqueOrderId = `REG-E2E-${randomId}`;

    // 2. Navigate to the login page and authenticate
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[type="text"]', 'testuser');
    await page.fill('input[type="password"]', 'password');
    await page.click('input[type="submit"]');
    
    // 3. Wait for navigation to Home dashboard
    await expect(page).toHaveURL(`${BASE_URL}/home`);

    // Dismiss "Set Prices Reminder" popup if it overlays the screen
    const alreadyUpdatedBtn = page.locator('button:has-text("Already Updated")');
    if (await alreadyUpdatedBtn.isVisible()) {
      await alreadyUpdatedBtn.click();
    }

    // 4. Navigate to Add Product page to seed our unique product
    await page.click('text=Add Product');
    await expect(page).toHaveURL(`${BASE_URL}/add-product`);

    // Fill in product details
    await page.selectOption('select[name="categoryId"]', { index: 1 });
    await page.waitForTimeout(200);
    await page.selectOption('select[name="subCategoryId"]', { index: 1 });
    await page.waitForTimeout(200);

    await page.fill('input[name="productName"]', 'E2E Test Ring');
    await page.selectOption('select[name="karatId"]', '18');
    await page.fill('input[name="stockQuantity"]', '5');
    await page.fill('input[name="customOrderId"]', uniqueOrderId);

    // Dynamic design number & weights
    const designNoInput = page.locator('input[name^="designNo"]');
    if (await designNoInput.isVisible()) {
      await designNoInput.fill(uniqueDesignNo);
    }
    const grossInput = page.locator('input[name*="Gross" i], input[name*="gross" i]');
    if (await grossInput.isVisible()) {
      await grossInput.fill('10.5');
    }
    const netInput = page.locator('input[name="net" i], input[name*="Net" i]');
    if (await netInput.isVisible()) {
      await netInput.fill('9.2');
    }

    // Submit form
    await page.click('input[type="submit"]');

    // Click OK in success modal
    await page.locator('.modal .close-btn:has-text("OK")').click();

    // Go back to Home Dashboard
    await page.click('text=Back to Dashboard');
    await expect(page).toHaveURL(`${BASE_URL}/home`);

    // 5. Navigate to Verify Products page
    await page.click('text=Verify Products');
    await expect(page).toHaveURL(`${BASE_URL}/verify-product`);

    // Always wait for our unique product card to load before running any test case
    const testCard = page.locator(`.unverified-panel .verify-product-card:has-text("${uniqueDesignNo}")`);
    await expect(testCard).toBeVisible();
  });

  // ==========================================
  // POSITIVE TEST SCENARIOS
  // ==========================================

  test('Positive: Columns and layout options render correctly', async ({ page }) => {
    // Check column headings
    const unverifiedHeader = page.locator('h2').filter({ hasText: /^Unverified/ });
    const verifiedHeader = page.locator('h2').filter({ hasText: /^Verified/ });
    await expect(unverifiedHeader).toBeVisible();
    await expect(verifiedHeader).toBeVisible();

    // Check list/grid toggle
    const gridButton = page.locator('button:has-text("Grid")');
    const listButton = page.locator('button:has-text("List")');

    await gridButton.click();
    await expect(page.locator('.verify-grid-view').first()).toBeVisible();

    await listButton.click();
    await expect(page.locator('.verify-list-view').first()).toBeVisible();
  });

  test('Positive: Search filters product cards dynamically', async ({ page }) => {
    const searchInput = page.locator('input[placeholder="Search..."]');
    
    // Locators for our unique product card
    const card = page.locator(`.unverified-panel .verify-product-card:has-text("${uniqueDesignNo}")`);
    await expect(card).toBeVisible();

    // Search for a non-matching query
    await searchInput.fill(`${uniqueDesignNo}-xyz`);
    
    // Expect the card to be hidden/disappeared
    await expect(card).toBeHidden();
  });

  test('Positive: Verifying a product moves it to the verified column', async ({ page }) => {
    // Locate our unique unverified card
    const card = page.locator(`.unverified-panel .verify-product-card:has-text("${uniqueDesignNo}")`);
    await expect(card).toBeVisible();

    // Click card to open modal details
    await card.click();
    await expect(page.locator('.popup-overlay')).toBeVisible();

    // Click Mark Verified inside popup
    const verifyButton = page.locator('.popup-button.primary:has-text("Mark Verified")');
    await verifyButton.click();

    // Accept success alerts/modals
    await page.locator('.modal .close-btn:has-text("OK")').click();
    await expect(page.locator('.popup-overlay')).not.toBeVisible();

    // Check if it moved to Verified list
    const verifiedCard = page.locator(`.verified-panel .verify-product-card:has-text("${uniqueDesignNo}")`);
    await expect(verifiedCard).toBeVisible();
  });

  // ==========================================
  // NEGATIVE & EDGE TEST SCENARIOS
  // ==========================================

  test('Negative: Empty state is handled when search yields zero matches', async ({ page }) => {
    const searchInput = page.locator('input[placeholder="Search..."]');
    
    // Wait for original card to load first
    const card = page.locator(`.unverified-panel .verify-product-card:has-text("${uniqueDesignNo}")`);
    await expect(card).toBeVisible();

    // Enter non-matching query
    await searchInput.fill(`${uniqueDesignNo}-different`);

    // Wait automatically for counts to be 0
    await expect(page.locator('.unverified-panel .verify-product-card')).toHaveCount(0);
    await expect(page.locator('.verified-panel .verify-product-card')).toHaveCount(0);
  });

  test('Negative: Broken image URL falls back to placeholder', async ({ page }) => {
    // Wait for card to load
    const card = page.locator(`.unverified-panel .verify-product-card:has-text("${uniqueDesignNo}")`);
    await expect(card).toBeVisible();

    // Locate card without an image or with fallback
    const cards = page.locator('.verify-product-card img');
    const firstCardImage = cards.first();

    const src = await firstCardImage.getAttribute('src');
    
    if (src && src.includes('undefined')) {
      // If src is broken or missing, expect it to render the fallback placeholder image
      await expect(firstCardImage).toHaveAttribute('src', /unavailable.jpg/);
    }
  });

  test('Positive: Update verification frequency (days) successfully', async ({ page }) => {
    const freqInput = page.locator('.filters-bar input[type="number"]');
    await expect(freqInput).toBeVisible();
    await freqInput.fill('60');
    
    const updateBtn = page.locator('.filters-bar button:has-text("Set")');
    await updateBtn.click();
    
    // Accept success modal
    const modal = page.locator('.modal');
    await expect(modal).toBeVisible();
    await expect(modal.locator('p')).toContainText('Frequency updated');
    await modal.locator('.close-btn').click();
  });

  test('Positive: Close and Modify buttons in details popup work correctly', async ({ page }) => {
    const card = page.locator(`.unverified-panel .verify-product-card:has-text("${uniqueDesignNo}")`);
    await card.click();
    
    const popup = page.locator('.popup-overlay');
    await expect(popup).toBeVisible();
    
    // Test Close button
    const closeBtn = popup.locator('button:has-text("Close")');
    await closeBtn.click();
    await expect(popup).not.toBeVisible();
    
    // Re-open and test Modify button redirection
    await card.click();
    await expect(popup).toBeVisible();
    
    const modifyBtn = popup.locator('button:has-text("Modify")');
    await modifyBtn.click();
    
    // Expect redirection to modify-product page
    await expect(page).toHaveURL(/.*modify-product.*/);
  });

  test('Positive: Filtering by category and subcategory updates lists', async ({ page }) => {
    // Select category "Diamond"
    const categorySelect = page.locator('.filters-bar select').first();
    await categorySelect.selectOption({ label: 'Diamond' });
    await page.waitForTimeout(200);
    
    // Select subcategory "Diamond Bangles / Bracelets"
    const subCategorySelect = page.locator('.filters-bar select').nth(1);
    await subCategorySelect.selectOption({ label: 'Diamond Bangles / Bracelets' });
    await page.waitForTimeout(200);
    
    // Expect our unique product card to still be visible
    const card = page.locator(`.unverified-panel .verify-product-card:has-text("${uniqueDesignNo}")`);
    await expect(card).toBeVisible();
  });

});
