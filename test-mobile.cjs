const { loadEnv, login, takeScreenshot, setupBrowserLogging, waitForAuth } = require('./test-helpers.cjs');
const puppeteer = require('puppeteer');

(async () => {
  console.log('\n🚀 Mobile UI Verification');
  console.log('========================\n');

  const env = loadEnv();
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  // Set mobile viewport (iPhone SE dimensions)
  await page.setViewport({
    width: 375,
    height: 667,
    isMobile: true,
    hasTouch: true,
    deviceScaleFactor: 2
  });

  setupBrowserLogging(page);

  const outputDir = '/tmp/tripper-mobile-verify';
  const fs = require('fs');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  try {
    // 1. Landing page
    console.log('📸 Step 1/5: Loading landing page (mobile)...');
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle0', timeout: 10000 });
    await takeScreenshot(page, '01-mobile-landing', outputDir);

    // 2. Login
    console.log('📸 Step 2/5: Logging in...');
    await login(page, env.TEST_USER_EMAIL, env.TEST_USER_PASSWORD);
    await takeScreenshot(page, '02-mobile-home', outputDir);

    // 3. Open first trip
    console.log('📸 Step 3/5: Opening trip (mobile view)...');
    const tripCard = await page.waitForSelector('[data-testid="trip-card"], .border.cursor-pointer', { timeout: 5000 });
    if (tripCard) {
      await tripCard.click();
      await new Promise(resolve => setTimeout(resolve, 1000));
      await takeScreenshot(page, '03-mobile-trip-list', outputDir);
    }

    // 4. Switch to calendar view
    console.log('📸 Step 4/5: Switching to calendar view...');
    const calendarButton = await page.waitForSelector('button[title="Calendar view"]', { timeout: 5000 });
    if (calendarButton) {
      await calendarButton.click();
      await new Promise(resolve => setTimeout(resolve, 1000));
      await takeScreenshot(page, '04-mobile-calendar', outputDir);
    }

    // 5. Scroll calendar to show bottom
    console.log('📸 Step 5/5: Scrolling calendar...');
    await page.evaluate(() => {
      const scrollContainer = document.querySelector('.overflow-y-auto');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    });
    await new Promise(resolve => setTimeout(resolve, 500));
    await takeScreenshot(page, '05-mobile-calendar-scrolled', outputDir);

    console.log('\n✅ Mobile verification complete!');
    console.log(`📁 Screenshots saved to: ${outputDir}\n`);

  } catch (error) {
    console.error('❌ Error during mobile verification:', error.message);
    await takeScreenshot(page, 'error-state', outputDir);
  } finally {
    await browser.close();
  }
})();
