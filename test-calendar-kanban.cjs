const puppeteer = require('puppeteer');
const { loadEnv, login, takeScreenshot, waitForAuth, setupBrowserLogging } = require('./test-helpers.cjs');

async function testCalendarKanbanViews() {
  console.log('\n🧪 Testing Calendar and Kanban Views');
  console.log('=====================================\n');

  const env = loadEnv();
  const browser = await puppeteer.launch({
    headless: process.env.PUPPETEER_HEADLESS !== 'false',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });
    setupBrowserLogging(page);

    // Step 1: Navigate and login
    console.log('📸 Step 1: Logging in...');
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });
    await login(page, env.TEST_USER_EMAIL, env.TEST_USER_PASSWORD);
    await takeScreenshot(page, '01-logged-in', '/tmp/tripper-calendar-test');

    // Step 2: Open first trip
    console.log('📸 Step 2: Opening trip...');
    await page.waitForSelector('[href^="/trip/"]', { timeout: 10000 });
    await page.click('[href^="/trip/"]');
    await page.waitForNetworkIdle({ timeout: 10000 });
    await takeScreenshot(page, '02-trip-map-view', '/tmp/tripper-calendar-test');

    // Step 3: Switch to Calendar view
    console.log('📸 Step 3: Switching to Calendar view...');
    await new Promise(resolve => setTimeout(resolve, 1000));
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const calendarBtn = buttons.find(btn => btn.textContent.includes('Calendar'));
      if (calendarBtn) calendarBtn.click();
    });
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for view to render
    await takeScreenshot(page, '03-calendar-view', '/tmp/tripper-calendar-test');

    // Step 4: Click on a location in calendar view
    console.log('📸 Step 4: Clicking location in calendar...');
    // Look for location chips (they have category icons)
    const locationChip = await page.$('.cursor-pointer[class*="px-2 py-1"]');
    if (locationChip) {
      await locationChip.click();
      await new Promise(resolve => setTimeout(resolve, 500));
      await takeScreenshot(page, '04-calendar-location-detail', '/tmp/tripper-calendar-test');

      // Check if modal opened
      const modal = await page.$('.fixed.inset-0.z-50');
      if (modal) {
        console.log('✓ LocationDetail modal opened from calendar view');

        // Close modal
        await page.evaluate(() => {
          const buttons = Array.from(document.querySelectorAll('button'));
          const backBtn = buttons.find(btn => btn.textContent.includes('Back'));
          if (backBtn) backBtn.click();
        });
        await new Promise(resolve => setTimeout(resolve, 300));
      } else {
        console.log('✗ Modal did not open');
      }
    } else {
      console.log('⚠ No location chips found in calendar view');
    }

    // Step 5: Switch to Kanban view
    console.log('📸 Step 5: Switching to Kanban view...');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const kanbanBtn = buttons.find(btn => btn.textContent.includes('Kanban'));
      if (kanbanBtn) kanbanBtn.click();
    });
    await new Promise(resolve => setTimeout(resolve, 1000));
    await takeScreenshot(page, '05-kanban-view', '/tmp/tripper-calendar-test');

    // Step 6: Click on a location in kanban view
    console.log('📸 Step 6: Clicking location in kanban...');
    const kanbanLocationChip = await page.$('.cursor-pointer[class*="px-2 py-1"]');
    if (kanbanLocationChip) {
      await kanbanLocationChip.click();
      await new Promise(resolve => setTimeout(resolve, 500));
      await takeScreenshot(page, '06-kanban-location-detail', '/tmp/tripper-calendar-test');

      // Check if modal opened
      const modal = await page.$('.fixed.inset-0.z-50');
      if (modal) {
        console.log('✓ LocationDetail modal opened from kanban view');
      } else {
        console.log('✗ Modal did not open');
      }
    } else {
      console.log('⚠ No location chips found in kanban view');
    }

    console.log('\n✅ Test complete!');
    console.log('📁 Screenshots saved to: /tmp/tripper-calendar-test\n');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error(error.stack);
  } finally {
    await browser.close();
  }
}

testCalendarKanbanViews();
