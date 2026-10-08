const puppeteer = require('./frontend/node_modules/puppeteer');
const fs = require('fs');
const path = require('path');

const OUTPUT_DIR = path.join(__dirname, 'docs_prezentare', 'screenshots');
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJldWdlbjdyb0BnbWFpbC5jb20iLCJleHAiOjE3OTIwNTQzODd9.iq79CHAq2s8UuvGVSsja9qyBpRu_WNulcfXn-9RZ-Zo';
const USER = JSON.stringify({
  id: 'ed092155-fa49-4653-be80-acd73f6b4e0c',
  email: 'eugen7ro@gmail.com',
  full_name: 'Sushi Han Admin',
  role: 'admin',
  organization_id: 'sh',
  organization_name: 'Sushi Han'
});

async function run() {
  console.log('Launching browser with system Chrome...');
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,940']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });

  const wait = (ms) => new Promise(r => setTimeout(r, ms));

  // Initialize Auth
  await page.goto('http://localhost:3004', { waitUntil: 'domcontentloaded' });
  await page.evaluate((token, user) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', user);
    localStorage.setItem('selected_organization_id', 'sh');
  }, TOKEN, USER);

  // 1. Content Library Root
  console.log('1. Content Library Root...');
  await page.goto('http://localhost:3004/content?org=sushihan', { waitUntil: 'networkidle2' });
  await wait(2000);
  await page.screenshot({ path: path.join(OUTPUT_DIR, '01_content_library.png') });

  // 2. Upload Modal
  console.log('2. Upload Content Modal...');
  try {
    const uploadBtn = await page.$('button.btn-primary');
    if (uploadBtn) {
      await uploadBtn.click();
      await wait(1200);
      await page.screenshot({ path: path.join(OUTPUT_DIR, '02_upload_modal.png') });
      // close
      const cancelBtn = await page.evaluateHandle(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        return btns.find(b => b.textContent.includes('Anulează') || b.textContent.includes('Cancel'));
      });
      if (cancelBtn && cancelBtn.asElement()) await cancelBtn.asElement().click();
      await wait(800);
    }
  } catch (e) {
    console.error('Err upload modal:', e);
  }

  // 3. Folder Modal
  console.log('3. Folder Modal...');
  try {
    const folderBtn = await page.$('button[title="Folder nou"]');
    if (folderBtn) {
      await folderBtn.click();
      await wait(1200);
      await page.screenshot({ path: path.join(OUTPUT_DIR, '03_folder_modal.png') });
      // close
      const cancelBtn = await page.evaluateHandle(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        return btns.find(b => b.textContent.includes('Anulează') || b.textContent.includes('Cancel'));
      });
      if (cancelBtn && cancelBtn.asElement()) await cancelBtn.asElement().click();
      await wait(800);
    }
  } catch (e) {
    console.error('Err folder modal:', e);
  }

  // 4. Playlists Page
  console.log('4. Playlists Page...');
  await page.goto('http://localhost:3004/playlists?org=sushihan', { waitUntil: 'networkidle2' });
  await wait(2000);
  await page.screenshot({ path: path.join(OUTPUT_DIR, '04_playlists_page.png') });

  // 5. Playlist Editor Modal
  console.log('5. Playlist Editor Modal...');
  try {
    const playlistBtn = await page.$('button[data-testid="add-playlist-button"]');
    if (playlistBtn) {
      await playlistBtn.click();
      await wait(1500);
      await page.screenshot({ path: path.join(OUTPUT_DIR, '05_playlist_modal.png') });
      // close
      const cancelBtn = await page.evaluateHandle(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        return btns.find(b => b.textContent.includes('Anulează') || b.textContent.includes('Cancel'));
      });
      if (cancelBtn && cancelBtn.asElement()) await cancelBtn.asElement().click();
      await wait(800);
    }
  } catch (e) {
    console.error('Err playlist modal:', e);
  }

  // 6. Screens Page
  console.log('6. Screens Page...');
  await page.goto('http://localhost:3004/screens?org=sushihan', { waitUntil: 'networkidle2' });
  await wait(2000);
  await page.screenshot({ path: path.join(OUTPUT_DIR, '06_screens_page.png') });

  // 7. Add Screen Modal
  console.log('7. Add Screen Modal...');
  try {
    const addScreenBtn = await page.evaluateHandle(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      return btns.find(b => b.textContent.includes('Adaugă ecran') || b.textContent.includes('Adaugă Ecran'));
    });
    if (addScreenBtn && addScreenBtn.asElement()) {
      await addScreenBtn.asElement().click();
      await wait(1200);
      await page.screenshot({ path: path.join(OUTPUT_DIR, '07_screen_modal.png') });
      // close
      const cancelBtn = await page.evaluateHandle(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        return btns.find(b => b.textContent.includes('Anulează') || b.textContent.includes('Cancel'));
      });
      if (cancelBtn && cancelBtn.asElement()) await cancelBtn.asElement().click();
      await wait(800);
    }
  } catch (e) {
    console.error('Err screen modal:', e);
  }

  // 8. Screen Designer (Target: Sushi Han pl1)
  console.log('8. Screen Designer...');
  await page.goto('http://localhost:3004/screens/3db60e19-0af7-44c5-8293-e8c575e5eb0c/design?org=sushihan', { waitUntil: 'networkidle2' });
  await wait(2500);
  await page.screenshot({ path: path.join(OUTPUT_DIR, '08_screen_designer.png') });

  // 9. TV Live Display View
  console.log('9. TV Live Display...');
  await page.goto('http://localhost:3004/display/3db60e19-0af7-44c5-8293-e8c575e5eb0c', { waitUntil: 'networkidle2' });
  await wait(3000);
  await page.screenshot({ path: path.join(OUTPUT_DIR, '09_tv_display.png') });

  // 2b. External Content Tab
  console.log('2b. External Content Tab...');
  try {
    const uploadBtn = await page.$('button.btn-primary');
    if (uploadBtn) {
      await uploadBtn.click();
      await wait(1000);
      const extTab = await page.evaluateHandle(() => {
        const tabs = Array.from(document.querySelectorAll('[role="tab"]'));
        return tabs.find(t => t.textContent.includes('Link Extern'));
      });
      if (extTab && extTab.asElement()) {
        await extTab.asElement().click();
        await wait(800);
        await page.screenshot({ path: path.join(OUTPUT_DIR, '02b_external_content.png') });
      }
      const cancelBtn = await page.evaluateHandle(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        return btns.find(b => b.textContent.includes('Anulează') || b.textContent.includes('Cancel'));
      });
      if (cancelBtn && cancelBtn.asElement()) await cancelBtn.asElement().click();
      await wait(800);
    }
  } catch (e) {
    console.error('Err external tab:', e);
  }

  // 10. Happy Hour Page
  console.log('10. Happy Hour Page...');
  try {
    await page.goto('http://localhost:3004/happy-hour?org=sushihan', { waitUntil: 'networkidle2' });
    await wait(2000);
    await page.screenshot({ path: path.join(OUTPUT_DIR, '10_happy_hour.png') });

    // Open Happy Hour modal if button exists
    const addHhBtn = await page.evaluateHandle(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      return btns.find(b => b.textContent.includes('Adaugă') || b.textContent.includes('Program nou') || b.textContent.includes('Happy Hour'));
    });
    if (addHhBtn && addHhBtn.asElement()) {
      await addHhBtn.asElement().click();
      await wait(1200);
      await page.screenshot({ path: path.join(OUTPUT_DIR, '10b_happy_hour_modal.png') });
      const closeBtn = await page.evaluateHandle(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        return btns.find(b => b.textContent.includes('Anulează') || b.textContent.includes('Cancel'));
      });
      if (closeBtn && closeBtn.asElement()) await closeBtn.asElement().click();
      await wait(800);
    }
  } catch (e) {
    console.error('Err happy hour:', e);
  }

  // 11. Screen Sync Page
  console.log('11. Screen Sync Page...');
  try {
    await page.goto('http://localhost:3004/screen-sync?org=sushihan', { waitUntil: 'networkidle2' });
    await wait(2000);
    await page.screenshot({ path: path.join(OUTPUT_DIR, '11_screen_sync.png') });
  } catch (e) {
    console.error('Err screen sync:', e);
  }

  console.log('All screenshots captured successfully!');
  await browser.close();
}

run().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
