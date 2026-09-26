const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log(`BROWSER CONSOLE: ${msg.type()}: ${msg.text()}`));
  page.on('pageerror', error => console.log(`BROWSER ERROR: ${error}`));
  page.on('requestfailed', request => console.log(`BROWSER REQUEST FAILED: ${request.url()} - ${request.failure()?.errorText}`));

  await page.goto('http://localhost:3000/');
  
  // Wait for the page to load
  await page.waitForTimeout(2000);
  
  // Look for the read aloud button (which has the svg volume icon or play icon)
  // Let's just evaluate and click it
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const readAloudBtn = buttons.find(b => b.getAttribute('aria-label') === 'Read the introduction aloud');
    if (readAloudBtn) {
      console.log('Found read aloud button, clicking...');
      readAloudBtn.click();
    } else {
      console.log('Read aloud button not found');
    }
  });

  // Wait a few seconds to let audio play and capture logs
  await page.waitForTimeout(5000);

  await browser.close();
})();
