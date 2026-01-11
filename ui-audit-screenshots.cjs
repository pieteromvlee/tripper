const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Read credentials from .env
const envPath = path.join(__dirname, '../home/pieter/dev/tripper/.env');
let env = {};
try {
  env = fs.readFileSync(envPath, 'utf8')
    .split('\n')
    .filter(l => l && !l.startsWith('#'))
    .reduce((acc, l) => {
      const [k, ...v] = l.split('=');
      acc[k] = v.join('=');
      return acc;
    }, {});
} catch (e) {
  console.log('No .env file found, will try without credentials');
}

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });

  const outputDir = '/tmp/tripper-ui-audit';
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
  }

  console.log('Navigating to app...');
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle0', timeout: 30000 });

  // Take screenshot of landing/login page
  await page.screenshot({ path: `${outputDir}/01-landing.png` });
  console.log('Screenshot: landing page');

  // Try to login if credentials are available
  if (env.TEST_USER_EMAIL && env.TEST_USER_PASSWORD) {
    try {
      // Look for sign in button
      const signInButton = await page.$('button:has-text("Sign in")');
      if (signInButton) {
        await signInButton.click();
        await page.waitForTimeout(1000);

        // Fill in email and password
        await page.type('input[type="email"]', env.TEST_USER_EMAIL);
        await page.type('input[type="password"]', env.TEST_USER_PASSWORD);

        // Click submit
        await page.click('button[type="submit"]');
        await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 10000 });

        console.log('Logged in successfully');
      }
    } catch (e) {
      console.log('Login attempt failed or not needed:', e.message);
    }
  }

  // Wait a bit for content to load
  await page.waitForTimeout(2000);

  // Screenshot: Main trips page
  await page.screenshot({ path: `${outputDir}/02-trips-list.png` });
  console.log('Screenshot: trips list');

  // Try to click into a trip if available
  try {
    const tripCard = await page.$('[class*="cursor-pointer"][class*="border"]');
    if (tripCard) {
      await tripCard.click();
      await page.waitForTimeout(2000);

      // Screenshot: Trip page with locations
      await page.screenshot({ path: `${outputDir}/03-trip-page.png` });
      console.log('Screenshot: trip page');

      // Try to open category filter/management
      try {
        // Look for "Categories" or category button
        const categoryButton = await page.$x("//button[contains(., 'CATEGORIES') or contains(., 'Categories')]");
        if (categoryButton.length > 0) {
          await categoryButton[0].click();
          await page.waitForTimeout(500);
          await page.screenshot({ path: `${outputDir}/04-category-filter.png` });
          console.log('Screenshot: category filter dropdown');

          // Try to find "Manage categories" option
          const manageButton = await page.$x("//button[contains(., 'Manage') or contains(., 'manage')]");
          if (manageButton.length > 0) {
            await manageButton[0].click();
            await page.waitForTimeout(1000);
            await page.screenshot({ path: `${outputDir}/05-category-management-modal.png` });
            console.log('Screenshot: category management modal');

            // Try to click "Add" button
            const addButton = await page.$x("//button[contains(., 'ADD') or contains(., 'Add new')]");
            if (addButton.length > 0) {
              await addButton[0].click();
              await page.waitForTimeout(500);
              await page.screenshot({ path: `${outputDir}/06-add-category-modal.png` });
              console.log('Screenshot: add category modal');

              // Close this modal
              const closeButton = await page.$('button[aria-label="Close"], button svg[class*="lucide-x"]');
              if (closeButton) await closeButton.click();
              await page.waitForTimeout(300);
            }

            // Close category management
            const closeButton = await page.$('button[aria-label="Close"], button svg[class*="lucide-x"]');
            if (closeButton) await closeButton.click();
            await page.waitForTimeout(300);
          }
        }
      } catch (e) {
        console.log('Could not navigate category modals:', e.message);
      }

      // Try to click "Add location" button
      try {
        const addLocationButton = await page.$x("//button[contains(., 'Add location') or contains(., 'ADD LOCATION')]");
        if (addLocationButton.length > 0) {
          await addLocationButton[0].click();
          await page.waitForTimeout(1000);
          await page.screenshot({ path: `${outputDir}/07-add-location-form.png` });
          console.log('Screenshot: add location form');

          // Close
          const closeButton = await page.$('button[aria-label="Close"], button svg[class*="lucide-x"]');
          if (closeButton) await closeButton.click();
          await page.waitForTimeout(300);
        }
      } catch (e) {
        console.log('Could not open add location:', e.message);
      }

      // Try to click on a location card to see details
      try {
        const locationCard = await page.$('[class*="cursor-pointer"][class*="border"]:not([class*="trip"])');
        if (locationCard) {
          await locationCard.click();
          await page.waitForTimeout(1000);
          await page.screenshot({ path: `${outputDir}/08-location-detail.png` });
          console.log('Screenshot: location detail');

          // Close
          const closeButton = await page.$('button[aria-label="Close"], button svg[class*="lucide-x"]');
          if (closeButton) await closeButton.click();
          await page.waitForTimeout(300);
        }
      } catch (e) {
        console.log('Could not open location detail:', e.message);
      }
    }
  } catch (e) {
    console.log('Could not navigate trip page:', e.message);
  }

  console.log('\nAll screenshots saved to:', outputDir);
  await browser.close();
})();
