const puppeteer = require('puppeteer');
const { loadEnv, login, takeScreenshot, setupBrowserLogging } = require('./test-helpers.cjs');

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

(async () => {
  console.log('\n🧪 Mobile Navigation Test\n========================\n');

  const env = loadEnv();
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();

    // Set mobile viewport (iPhone 12 Pro size)
    await page.setViewport({ width: 390, height: 844 });

    setupBrowserLogging(page);

    // Step 1: Navigate and login
    console.log('📱 Step 1/6: Logging in (mobile view)...');
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });
    await login(page, env.TEST_USER_EMAIL, env.TEST_USER_PASSWORD);
    await takeScreenshot(page, '01-mobile-home', '/tmp/tripper-mobile-test');

    // Step 2: Open first trip
    console.log('📱 Step 2/6: Opening trip...');
    await page.waitForSelector('a[href^="/trip/"]', { timeout: 5000 });
    await page.click('a[href^="/trip/"]');
    await wait(2000);
    await takeScreenshot(page, '02-trip-list-view', '/tmp/tripper-mobile-test');

    // Step 3: Switch to map view
    console.log('📱 Step 3/6: Switching to map view...');
    const mapButtonSelector = 'button[title="Map view"]';
    await page.waitForSelector(mapButtonSelector, { timeout: 5000 });
    await page.click(mapButtonSelector);
    await wait(1500);
    await takeScreenshot(page, '03-map-view', '/tmp/tripper-mobile-test');

    // Step 4: Click a location marker to show SelectionPopover
    console.log('📱 Step 4/6: Clicking location marker...');
    // Find and click a map marker (canvas element with markers)
    // Try to click in the center-ish area where markers are likely to be
    await page.mouse.click(195, 400);
    await wait(1000);
    await takeScreenshot(page, '04-selection-popover', '/tmp/tripper-mobile-test');

    // Step 5: Switch back to list view
    console.log('📱 Step 5/6: Switching to list view...');
    const listButtonSelector = 'button[title="List view"]';
    await page.waitForSelector(listButtonSelector, { timeout: 5000 });
    await page.click(listButtonSelector);
    await wait(1000);
    await takeScreenshot(page, '05-list-view-with-selection', '/tmp/tripper-mobile-test');

    // Step 6: Test double-tap on a location card
    console.log('📱 Step 6/6: Testing double-tap (should switch to map)...');
    // Find a location card and double-tap it
    const cardSelector = 'div[class*="cursor-pointer"]';
    await page.waitForSelector(cardSelector, { timeout: 5000 });

    // Simulate double-tap by clicking twice quickly
    await page.click(cardSelector);
    await wait(100); // Wait 100ms (within 300ms threshold)
    await page.click(cardSelector);
    await wait(1500);

    await takeScreenshot(page, '06-after-double-tap', '/tmp/tripper-mobile-test');

    console.log('\n✅ Mobile navigation test complete!');
    console.log('📁 Screenshots saved to: /tmp/tripper-mobile-test\n');
    console.log('To view screenshots, use the Read tool with these paths:');
    console.log('  /tmp/tripper-mobile-test/04-selection-popover.png (verify no Map button)');
    console.log('  /tmp/tripper-mobile-test/06-after-double-tap.png (verify switched to map view)\n');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
  } finally {
    await browser.close();
  }
})();
