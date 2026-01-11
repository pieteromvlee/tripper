const fs = require('fs');
const path = require('path');

/**
 * Load environment variables from .env file
 * @returns {Object} Environment variables as key-value pairs
 */
function loadEnv() {
  const envPath = path.join(__dirname, '.env');
  let env = {};

  try {
    env = fs.readFileSync(envPath, 'utf8')
      .split('\n')
      .filter(l => l && !l.startsWith('#'))
      .reduce((acc, l) => {
        const [k, ...v] = l.split('=');
        if (k) acc[k.trim()] = v.join('=').trim();
        return acc;
      }, {});
  } catch (e) {
    console.warn('Warning: No .env file found, test credentials not available');
  }

  return env;
}

/**
 * Setup browser logging to capture console messages and errors
 * @param {Page} page - Puppeteer page instance
 */
function setupBrowserLogging(page) {
  page.on('console', msg => {
    const type = msg.type();
    const text = msg.text();
    if (type === 'error') {
      console.log('❌ BROWSER ERROR:', text);
    } else if (type === 'warning') {
      console.log('⚠️  BROWSER WARNING:', text);
    } else if (type === 'log') {
      console.log('📝 BROWSER LOG:', text);
    }
  });

  page.on('pageerror', error => {
    console.log('💥 PAGE ERROR:', error.message);
  });

  page.on('requestfailed', request => {
    console.log('🌐 REQUEST FAILED:', request.url(), request.failure().errorText);
  });
}

/**
 * Take a screenshot with error handling
 * @param {Page} page - Puppeteer page instance
 * @param {string} name - Screenshot name (without extension)
 * @param {string} dir - Directory to save screenshot
 * @returns {Promise<boolean>} Success status
 */
async function takeScreenshot(page, name, dir = '/tmp') {
  try {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const filepath = path.join(dir, `${name}.png`);
    await page.screenshot({ path: filepath, fullPage: false });
    console.log(`✓ Screenshot saved: ${filepath}`);
    return true;
  } catch (error) {
    console.error(`✗ Screenshot failed (${name}):`, error.message);
    return false;
  }
}

/**
 * Wait for authentication state to settle
 * Waits for either the authenticated home page or login page to load
 * @param {Page} page - Puppeteer page instance
 * @param {number} timeout - Timeout in milliseconds
 * @returns {Promise<'authenticated'|'unauthenticated'>} Authentication state
 */
async function waitForAuth(page, timeout = 5000) {
  try {
    // Wait for either authenticated state or login form
    await Promise.race([
      page.waitForSelector('h1', { timeout }).catch(() => null),
      page.waitForSelector('a[href="/login"]', { timeout }).catch(() => null),
      page.waitForSelector('#email', { timeout }).catch(() => null),
    ]);

    // Check which state we're in by looking for authenticated indicators
    const isAuthenticated = await page.$('h1').then(async el => {
      if (!el) return false;
      const text = await el.evaluate(node => node.textContent);
      return text && text.toUpperCase().includes('MY TRIPS');
    }).catch(() => false);

    return isAuthenticated ? 'authenticated' : 'unauthenticated';
  } catch (error) {
    console.error('Error waiting for auth state:', error.message);
    return 'unauthenticated';
  }
}

/**
 * Login to the application
 * @param {Page} page - Puppeteer page instance
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise<boolean>} Success status
 */
async function login(page, email, password) {
  try {
    console.log('Attempting login...');

    // Check if we're already on the login page, if not navigate to it
    const currentUrl = page.url();
    if (!currentUrl.includes('/login')) {
      // Look for "Sign In to Get Started" link on landing page
      const signInLink = await page.$('a[href="/login"]');
      if (signInLink) {
        console.log('Clicking "Sign In to Get Started" link...');
        await signInLink.click();
        await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 10000 });
      } else {
        // Navigate directly to login page
        await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle0' });
      }
    }

    // Wait for login form
    await page.waitForSelector('#email', { timeout: 5000 });
    await page.waitForSelector('#password', { timeout: 5000 });

    console.log('Filling login form...');

    // Clear existing values and type credentials
    await page.click('#email', { clickCount: 3 }); // Select all
    await page.type('#email', email);

    await page.click('#password', { clickCount: 3 }); // Select all
    await page.type('#password', password);

    // Submit form
    console.log('Submitting login form...');
    await page.click('button[type="submit"]');

    // Wait for navigation or error message
    await Promise.race([
      page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 10000 }),
      page.waitForSelector('.bg-red-500\\/10', { timeout: 10000 }), // Error message
    ]);

    // Check if login was successful
    const errorElement = await page.$('.bg-red-500\\/10');
    if (errorElement) {
      const errorText = await errorElement.evaluate(el => el.textContent);
      console.error('❌ Login failed:', errorText);
      return false;
    }

    // Wait for authenticated state
    const authState = await waitForAuth(page, 5000);
    if (authState === 'authenticated') {
      console.log('✓ Login successful');
      return true;
    } else {
      console.error('❌ Login failed: Not authenticated after form submission');
      return false;
    }
  } catch (error) {
    console.error('❌ Login error:', error.message);
    return false;
  }
}

/**
 * Click an element and wait for a specified time
 * @param {Page} page - Puppeteer page instance
 * @param {string} selector - CSS selector
 * @param {number} waitTime - Time to wait after click (ms)
 * @returns {Promise<boolean>} Success status
 */
async function clickAndWait(page, selector, waitTime = 1000) {
  try {
    await page.waitForSelector(selector, { timeout: 5000 });
    await page.click(selector);
    await page.waitForTimeout(waitTime);
    return true;
  } catch (error) {
    console.error(`Click failed for selector "${selector}":`, error.message);
    return false;
  }
}

/**
 * Wait for network to be idle
 * @param {Page} page - Puppeteer page instance
 * @param {number} timeout - Timeout in milliseconds
 */
async function waitForNetworkIdle(page, timeout = 2000) {
  await page.waitForNetworkIdle({ timeout, idleTime: 500 });
}

module.exports = {
  loadEnv,
  setupBrowserLogging,
  takeScreenshot,
  waitForAuth,
  login,
  clickAndWait,
  waitForNetworkIdle,
};
