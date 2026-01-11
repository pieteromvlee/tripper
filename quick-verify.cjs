const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const { loadEnv, setupBrowserLogging, takeScreenshot, login } = require('./test-helpers.cjs');

/**
 * Quick verification script for Tripper UI
 * Takes screenshots of key pages to verify visual changes
 *
 * Usage:
 *   node quick-verify.cjs                    # Headless mode
 *   PUPPETEER_HEADLESS=false node quick-verify.cjs  # Headed mode (see browser)
 */

(async () => {
  const env = loadEnv();
  const headless = process.env.PUPPETEER_HEADLESS !== 'false';
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
  const outputDir = `/tmp/tripper-verify`;

  // Create output directory
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  console.log('\n🚀 Quick UI Verification');
  console.log('========================\n');
  console.log(`Mode: ${headless ? 'Headless' : 'Headed (visible browser)'}`);
  console.log(`Output: ${outputDir}\n`);

  // Launch browser
  const browser = await puppeteer.launch({
    headless: headless,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    // Show browser in headed mode
    ...(headless ? {} : { slowMo: 50 })
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });

  // Setup logging
  setupBrowserLogging(page);

  try {
    // 1. Landing page
    console.log('📸 Step 1/4: Loading landing page...');
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle0', timeout: 30000 });
    await takeScreenshot(page, '01-landing', outputDir);

    // 2. Login if credentials available
    if (env.TEST_USER_EMAIL && env.TEST_USER_PASSWORD) {
      console.log('📸 Step 2/4: Logging in...');
      const loginSuccess = await login(page, env.TEST_USER_EMAIL, env.TEST_USER_PASSWORD);

      if (!loginSuccess) {
        console.log('⚠️  Login failed - screenshots will show unauthenticated state');
      }

      await page.waitForNetworkIdle({ timeout: 5000, idleTime: 500 }).catch(() => null);
      await takeScreenshot(page, '02-authenticated-home', outputDir);
    } else {
      console.log('⚠️  Step 2/4: No credentials - skipping login');
      await takeScreenshot(page, '02-no-credentials', outputDir);
    }

    // 3. Try to open first trip
    console.log('📸 Step 3/4: Opening first trip...');
    try {
      // Look for trip cards (they have cursor-pointer and border classes)
      const tripCard = await page.$('[class*="cursor-pointer"][class*="border"]');
      if (tripCard) {
        await tripCard.click();
        await page.waitForNetworkIdle({ timeout: 5000, idleTime: 500 }).catch(() => null);
        await takeScreenshot(page, '03-trip-detail', outputDir);
        console.log('✓ Opened trip successfully');
      } else {
        console.log('ℹ️  No trips found (create a trip in the app to test this)');
        await takeScreenshot(page, '03-no-trips', outputDir);
      }
    } catch (error) {
      console.log('⚠️  Could not open trip:', error.message);
      await takeScreenshot(page, '03-trip-error', outputDir);
    }

    // 4. Final state
    console.log('📸 Step 4/4: Final state...');
    await takeScreenshot(page, '04-final-state', outputDir);

    console.log('\n✅ Verification complete!');
    console.log(`📁 Screenshots saved to: ${outputDir}`);
    console.log('\nTo view screenshots, use:');
    console.log(`   ls -lh ${outputDir}`);
    console.log(`   # or with Claude Code, use the Read tool\n`);

  } catch (error) {
    console.error('\n❌ Error during verification:', error);
    await takeScreenshot(page, 'error-state', outputDir);
    throw error;
  } finally {
    await browser.close();
  }

})().catch(error => {
  console.error('\n❌ Fatal error:', error.message);
  console.error('\nTroubleshooting:');
  console.error('  - Is the dev server running? (npm run dev)');
  console.error('  - Is Convex backend running? (npx convex dev)');
  console.error('  - Check test credentials in .env file');
  process.exit(1);
});
