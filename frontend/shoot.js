const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

(async () => {
    try {
        const browser = await puppeteer.launch({
            headless: 'new',
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const page = await browser.newPage();
        await page.setViewport({ width: 1280, height: 800 });

        // Go to local backoffice (assuming it runs on port 3000)
        console.log('Navigating to http://localhost:3000...');
        await page.goto('http://localhost:3000', { waitUntil: 'networkidle2', timeout: 10000 }).catch(e => console.log('Could not load localhost. Using blank.'));

        // Take screenshot of backoffice
        const boPath = path.resolve(__dirname, 'bo_screen.png');
        await page.screenshot({ path: boPath });
        console.log('Saved backoffice screenshot.');

        await browser.close();
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
})();
