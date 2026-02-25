const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

(async () => {
    try {
        console.log('Starting puppeteer...');
        const browser = await puppeteer.launch({
            headless: 'new',
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const page = await browser.newPage();

        const htmlPath = path.resolve(__dirname, 'presentation.html');
        console.log('Loading HTML file:', htmlPath);

        await page.goto(`file://${htmlPath}`, {
            waitUntil: 'networkidle0', // wait for Tailwind via CDN to load fully
            timeout: 60000
        });

        const pdfPath = path.resolve(__dirname, 'Prezentare_Digital_Signage.pdf');

        await page.pdf({
            path: pdfPath,
            format: 'A4',
            printBackground: true, // required to show CSS backgrounds/colors
            margin: { top: '0', right: '0', bottom: '0', left: '0' }
        });

        console.log(`PDF successfully generated at: ${pdfPath}`);
        await browser.close();
        process.exit(0);
    } catch (error) {
        console.error('Failed to generate PDF:', error);
        process.exit(1);
    }
})();
