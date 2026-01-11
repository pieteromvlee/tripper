const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const { loadEnv, setupBrowserLogging, takeScreenshot, login } = require('./test-helpers.cjs');

// Read credentials from .env
const env = loadEnv();

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });

  // Setup browser logging to capture errors
  setupBrowserLogging(page);

  const outputDir = '/tmp/tripper-ui-audit';
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  console.log('\n🚀 Starting UI audit...\n');
  console.log('Navigating to app...');
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle0', timeout: 30000 });

  // Take screenshot of landing/login page
  await takeScreenshot(page, '01-landing', outputDir);

  // Try to login if credentials are available
  if (env.TEST_USER_EMAIL && env.TEST_USER_PASSWORD) {
    const loginSuccess = await login(page, env.TEST_USER_EMAIL, env.TEST_USER_PASSWORD);
    if (!loginSuccess) {
      console.log('⚠️  Login failed, continuing with limited access...');
    }
    // Wait for page to settle after login
    await page.waitForNetworkIdle({ timeout: 5000, idleTime: 500 }).catch(() => null);
  } else {
    console.log('⚠️  No test credentials found, skipping login');
  }

  // Screenshot: Main trips page (or login page if not authenticated)
  await takeScreenshot(page, '02-trips-list', outputDir);

  // Try to click into a trip if available
  try {
    const tripCard = await page.$('[class*="cursor-pointer"][class*="border"]');
    if (tripCard) {
      await tripCard.click();
      await page.waitForNetworkIdle({ timeout: 5000, idleTime: 500 }).catch(() => null);

      // Screenshot: Trip page with locations
      await takeScreenshot(page, '03-trip-page', outputDir);

      // Try to open category filter/management
      try {
        // Look for "Categories" or category button
        const categoryButton = await page.$x("//button[contains(., 'CATEGORIES') or contains(., 'Categories')]");
        if (categoryButton.length > 0) {
          await categoryButton[0].click();
          await page.waitForNetworkIdle({ timeout: 2000, idleTime: 300 }).catch(() => null);
          await takeScreenshot(page, '04-category-filter', outputDir);

          // Try to find "Manage categories" option
          const manageButton = await page.$x("//button[contains(., 'Manage') or contains(., 'manage')]");
          if (manageButton.length > 0) {
            await manageButton[0].click();
            await page.waitForNetworkIdle({ timeout: 2000, idleTime: 300 }).catch(() => null);
            await takeScreenshot(page, '05-category-management-modal', outputDir);

            // Try to click "Add" button
            const addButton = await page.$x("//button[contains(., 'ADD') or contains(., 'Add new')]");
            if (addButton.length > 0) {
              await addButton[0].click();
              await page.waitForNetworkIdle({ timeout: 2000, idleTime: 300 }).catch(() => null);
              await takeScreenshot(page, '06-add-category-modal', outputDir);

              // Close this modal
              const closeButton = await page.$('button[aria-label="Close"], button svg[class*="lucide-x"]');
              if (closeButton) {
                await closeButton.click();
                await page.waitForNetworkIdle({ timeout: 2000, idleTime: 300 }).catch(() => null);
              }
            }

            // Close category management
            const closeButton = await page.$('button[aria-label="Close"], button svg[class*="lucide-x"]');
            if (closeButton) {
              await closeButton.click();
              await page.waitForNetworkIdle({ timeout: 2000, idleTime: 300 }).catch(() => null);
            }
          }
        }
      } catch (e) {
        console.log('⚠️  Could not navigate category modals:', e.message);
      }

      // Try to click "Add location" button
      try {
        const addLocationButton = await page.$x("//button[contains(., 'Add location') or contains(., 'ADD LOCATION')]");
        if (addLocationButton.length > 0) {
          await addLocationButton[0].click();
          await page.waitForNetworkIdle({ timeout: 2000, idleTime: 300 }).catch(() => null);
          await takeScreenshot(page, '07-add-location-form', outputDir);

          // Close
          const closeButton = await page.$('button[aria-label="Close"], button svg[class*="lucide-x"]');
          if (closeButton) {
            await closeButton.click();
            await page.waitForNetworkIdle({ timeout: 2000, idleTime: 300 }).catch(() => null);
          }
        }
      } catch (e) {
        console.log('⚠️  Could not open add location:', e.message);
      }

      // Try to click on a location card to see details
      try {
        const locationCard = await page.$('[class*="cursor-pointer"][class*="border"]:not([class*="trip"])');
        if (locationCard) {
          await locationCard.click();
          await page.waitForNetworkIdle({ timeout: 2000, idleTime: 300 }).catch(() => null);
          await takeScreenshot(page, '08-location-detail', outputDir);

          // Close
          const closeButton = await page.$('button[aria-label="Close"], button svg[class*="lucide-x"]');
          if (closeButton) {
            await closeButton.click();
            await page.waitForNetworkIdle({ timeout: 2000, idleTime: 300 }).catch(() => null);
          }
        }
      } catch (e) {
        console.log('⚠️  Could not open location detail:', e.message);
      }
    }
  } catch (e) {
    console.log('⚠️  Could not navigate trip page:', e.message);
  }

  console.log('\n✅ UI audit complete! Screenshots saved to:', outputDir);
  await browser.close();
})().catch(error => {
  console.error('\n❌ Fatal error during UI audit:', error);
  process.exit(1);
});
