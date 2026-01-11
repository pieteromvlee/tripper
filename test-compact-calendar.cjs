const puppeteer = require('puppeteer');
const fs = require('fs');

// Read credentials from .env
const envPath = '/home/pieter/dev/tripper/.env';
const env = fs.existsSync(envPath)
  ? fs.readFileSync(envPath, 'utf8')
      .split('\n')
      .filter(l => l && !l.startsWith('#'))
      .reduce((acc, l) => {
        const [k, ...v] = l.split('=');
        acc[k] = v.join('=');
        return acc;
      }, {})
  : {};

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });

  console.log('Navigating to app...');
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });

  // Take initial screenshot
  await page.screenshot({ path: '/tmp/screenshot-home.png' });
  console.log('Screenshot saved: /tmp/screenshot-home.png');

  // Check if we need to login
  const signInButton = await page.$('button:has-text("Sign in")');
  if (signInButton && env.TEST_USER_EMAIL && env.TEST_USER_PASSWORD) {
    console.log('Logging in...');
    await signInButton.click();
    await page.waitForTimeout(1000);

    // Fill in credentials
    await page.type('input[type="email"]', env.TEST_USER_EMAIL);
    await page.type('input[type="password"]', env.TEST_USER_PASSWORD);

    // Click submit
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'networkidle0' });
  }

  // Wait for trips to load
  await page.waitForTimeout(2000);
  await page.screenshot({ path: '/tmp/screenshot-trips.png' });
  console.log('Screenshot saved: /tmp/screenshot-trips.png');

  // Click on first trip
  const tripCard = await page.$('a[href*="/trip/"]');
  if (tripCard) {
    console.log('Opening first trip...');
    await tripCard.click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: '/tmp/screenshot-trip.png' });
    console.log('Screenshot saved: /tmp/screenshot-trip.png');

    // Check if on desktop or mobile (check viewport width)
    const width = await page.evaluate(() => window.innerWidth);

    if (width >= 768) {
      // Desktop: Click calendar view toggle in detail panel
      console.log('Desktop view detected');
      const calendarToggle = await page.$('button:has-text("Calendar")');
      if (calendarToggle) {
        await calendarToggle.click();
        await page.waitForTimeout(1000);
      }
    } else {
      // Mobile: Use three-way toggle
      console.log('Mobile view detected');
      const calendarToggle = await page.$('button:has-text("Calendar")');
      if (calendarToggle) {
        await calendarToggle.click();
        await page.waitForTimeout(1000);
      }
    }

    await page.screenshot({ path: '/tmp/screenshot-calendar-month.png' });
    console.log('Screenshot saved: /tmp/screenshot-calendar-month.png');

    // Now click the "Compact" button
    console.log('Looking for Compact button...');
    const compactButton = await page.$('button:has-text("Compact")');
    if (compactButton) {
      console.log('Clicking Compact button...');
      await compactButton.click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: '/tmp/screenshot-calendar-compact.png' });
      console.log('Screenshot saved: /tmp/screenshot-calendar-compact.png');
    } else {
      console.log('Compact button not found - checking page content');
      const content = await page.content();
      fs.writeFileSync('/tmp/page-content.html', content);
      console.log('Page content saved to /tmp/page-content.html');
    }
  }

  await browser.close();
  console.log('Done!');
})();
