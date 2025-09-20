// Simple script to check if data is being passed correctly
const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  // Listen to console logs
  page.on('console', msg => {
    console.log('CONSOLE:', msg.text());
  });

  await page.goto('http://localhost:5174/');

  // Wait a bit for everything to load
  await page.waitForTimeout(5000);

  // Get the content of the data grid area
  const gridContent = await page.evaluate(() => {
    const grid = document.querySelector('.data-grid-container');
    return grid ? grid.innerText : 'Grid not found';
  });

  console.log('Grid content:', gridContent);

  await browser.close();
})();