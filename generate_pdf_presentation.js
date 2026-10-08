const puppeteer = require('./frontend/node_modules/puppeteer');
const fs = require('fs');
const path = require('path');

const SCREENSHOTS_DIR = path.join(__dirname, 'docs_prezentare', 'screenshots');
const OUTPUT_PDF = path.join(__dirname, 'docs_prezentare', 'Ghid_Utilizare_SushiHan.pdf');
const OUTPUT_HTML = path.join(__dirname, 'docs_prezentare', 'presentation.html');

function getImageBase64(filename) {
  const filePath = path.join(SCREENSHOTS_DIR, filename);
  if (!fs.existsSync(filePath)) {
    console.warn(`Warning: ${filePath} does not exist`);
    return '';
  }
  const ext = path.extname(filename).slice(1) || 'png';
  const data = fs.readFileSync(filePath).toString('base64');
  return `data:image/${ext};base64,${data}`;
}

async function buildPresentation() {
  console.log('Loading screenshots for Apple / Mac Keynote style...');
  const imgContent = getImageBase64('01_content_library.png');
  const imgUpload = getImageBase64('02_upload_modal.png');
  const imgExternal = getImageBase64('02b_external_content.png');
  const imgFolder = getImageBase64('03_folder_modal.png');
  const imgPlaylists = getImageBase64('04_playlists_page.png');
  const imgPlaylistModal = getImageBase64('05_playlist_modal.png');
  const imgScreens = getImageBase64('06_screens_page.png');
  const imgScreenModal = getImageBase64('07_screen_modal.png');
  const imgDesigner = getImageBase64('08_screen_designer.png');
  const imgTv = getImageBase64('09_tv_display.png');
  const imgHappyHour = getImageBase64('10b_happy_hour_modal.png') || getImageBase64('10_happy_hour.png');
  const imgScreenSync = getImageBase64('11b_screen_sync_modal.png') || getImageBase64('11_screen_sync.png');

  console.log('Generating PDF template with clean Arial font...');

  const html = `<!DOCTYPE html>
<html lang="ro">
<head>
  <meta charset="UTF-8">
  <title>Ghid Digital Signage — Sushi Han</title>
  <style>
    @page {
      size: A4 landscape;
      margin: 0;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      font-family: "Times New Roman", Times, Georgia, serif !important;
      letter-spacing: 0 !important;
      word-spacing: normal !important;
    }

    body {
      font-family: "Times New Roman", Times, Georgia, serif !important;
      background: #fbfbfd;
      color: #1d1d1f;
      -webkit-font-smoothing: antialiased;
      letter-spacing: 0 !important;
      word-spacing: normal !important;
      text-rendering: geometricPrecision;
      print-color-adjust: exact;
      -webkit-print-color-adjust: exact;
    }

    h1, h2, h3, .cover-h1, .slide-heading {
      font-family: "Times New Roman", Times, Georgia, serif !important;
      letter-spacing: 0 !important;
      font-weight: 700;
    }

    /* SLIDE CONTAINER — A4 Landscape (297mm x 210mm) */
    .slide {
      width: 297mm;
      height: 210mm;
      page-break-after: always;
      position: relative;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      background: #fbfbfd;
      padding: 14mm 18mm 12mm 18mm;
      justify-content: space-between;
    }

    /* SLIDE 1: APPLE KEYNOTE COVER */
    .cover-slide {
      background: #000000;
      color: #ffffff;
      padding: 20mm 24mm 16mm 24mm;
    }

    .cover-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .apple-badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: rgba(255, 255, 255, 0.12);
      border: 1px solid rgba(255, 255, 255, 0.16);
      padding: 6px 14px;
      border-radius: 9999px;
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      color: #f5f5f7;
    }

    .apple-dot-red {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #ff3b30;
      box-shadow: 0 0 10px #ff3b30;
    }

    .tenant-tag {
      font-size: 11.5px;
      color: #86868b;
      font-weight: 500;
      letter-spacing: 0.02em;
    }

    .cover-main {
      max-width: 960px;
      margin: auto 0;
    }

    .cover-hero-tag {
      color: #ff3b30;
      font-size: 13px;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      margin-bottom: 10px;
      display: block;
    }

    .cover-h1 {
      font-size: 42px;
      font-weight: 800;
      letter-spacing: -0.03em;
      line-height: 1.1;
      margin-bottom: 14px;
      background: linear-gradient(180deg, #ffffff 40%, #a1a1a6 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .cover-lead {
      font-size: 16px;
      font-weight: 400;
      color: #86868b;
      line-height: 1.5;
      max-width: 820px;
      margin-bottom: 22px;
    }

    .cover-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
    }

    .cover-card {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 14px;
      padding: 14px 16px;
      backdrop-filter: blur(10px);
    }

    .cover-card-num {
      font-size: 10px;
      font-weight: 700;
      color: #ff3b30;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      margin-bottom: 5px;
    }

    .cover-card-title {
      font-size: 14px;
      font-weight: 700;
      color: #f5f5f7;
      margin-bottom: 3px;
    }

    .cover-card-desc {
      font-size: 11.5px;
      color: #86868b;
      line-height: 1.4;
    }

    .cover-bottom {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-top: 12px;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
      font-size: 11.5px;
      color: #6e6e73;
    }

    /* SLIDE HEADER & FOOTER */
    .slide-header {
      margin-bottom: 6px;
    }

    .slide-category {
      font-size: 11px;
      font-weight: 700;
      color: #ff3b30;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      margin-bottom: 3px;
    }

    .slide-heading {
      font-size: 23px;
      font-weight: 800;
      color: #1d1d1f;
      letter-spacing: -0.02em;
      line-height: 1.2;
    }

    .slide-subheading {
      font-size: 12.5px;
      color: #6e6e73;
      margin-top: 2px;
      line-height: 1.4;
    }

    .apple-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-top: 8px;
      border-top: 1px solid #e5e5ea;
      font-size: 10.5px;
      color: #86868b;
      font-weight: 500;
    }

    .footer-tenant {
      color: #1d1d1f;
      font-weight: 600;
    }

    /* SLIDE BODY: TWO COLUMNS (ACTION PANEL + MAC WINDOW) */
    .slide-body-split {
      display: grid;
      grid-template-columns: 360px 1fr;
      gap: 16px;
      align-items: center;
      margin: auto 0;
      height: 146mm;
    }

    /* LEFT: ACTION PANEL */
    .action-panel {
      display: flex;
      flex-direction: column;
      gap: 10px;
      justify-content: center;
      height: 100%;
    }

    .action-steps {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .action-step {
      background: #ffffff;
      border: 1px solid #e5e5ea;
      border-radius: 12px;
      padding: 10px 12px;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.02);
      display: flex;
      gap: 10px;
      align-items: flex-start;
    }

    .action-step-badge {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      background: #1d1d1f;
      color: #ffffff;
      font-size: 11px;
      font-weight: 800;
      display: flex;
      align-items: center;
      justify-content: center;
      shrink: 0;
      margin-top: 1px;
    }

    .action-step-content {
      font-size: 11.5px;
      color: #424245;
      line-height: 1.45;
    }

    .action-step-title {
      font-size: 12.5px;
      font-weight: 700;
      color: #1d1d1f;
      margin-bottom: 2px;
    }

    .apple-tip-box {
      background: #f5f5f7;
      border: 1px solid #e5e5ea;
      border-radius: 12px;
      padding: 10px 12px;
      font-size: 11px;
      color: #515154;
      line-height: 1.4;
      display: flex;
      gap: 8px;
      align-items: center;
    }

    .apple-tip-icon {
      font-size: 16px;
      shrink: 0;
    }

    /* RIGHT: MAC SAFARI WINDOW */
    .mac-window {
      background: #ffffff;
      border-radius: 14px;
      box-shadow: 0 16px 36px -8px rgba(0, 0, 0, 0.12), 0 0 0 1px rgba(0, 0, 0, 0.06);
      overflow: hidden;
      display: flex;
      flex-direction: column;
      height: 142mm;
    }

    .mac-titlebar {
      height: 28px;
      background: #f6f6f6;
      border-bottom: 1px solid #e1e1e1;
      display: flex;
      align-items: center;
      padding: 0 12px;
      position: relative;
    }

    .mac-traffic-lights {
      display: flex;
      gap: 6px;
    }

    .mac-dot {
      width: 9px;
      height: 9px;
      border-radius: 50%;
    }

    .mac-dot-close { background: #ff5f56; border: 1px solid #e0443e; }
    .mac-dot-min { background: #ffbd2e; border: 1px solid #dea123; }
    .mac-dot-max { background: #27c93f; border: 1px solid #1aab29; }

    .mac-address-bar {
      position: absolute;
      left: 50%;
      transform: translateX(-50%);
      background: #ffffff;
      border: 1px solid #e1e1e1;
      border-radius: 6px;
      padding: 2px 14px;
      font-size: 10px;
      color: #6e6e73;
      font-weight: 500;
      display: flex;
      align-items: center;
      gap: 5px;
      box-shadow: 0 1px 2px rgba(0,0,0,0.03);
    }

    .mac-lock-icon {
      color: #34c759;
      font-size: 9px;
    }

    .mac-viewport {
      flex: 1;
      background: #fbfbfd;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .mac-screenshot {
      width: 100%;
      height: 100%;
      object-fit: contain;
      display: block;
      background: #ffffff;
    }
  </style>
</head>
<body>

  <!-- ========================================== -->
  <!-- SLIDE 1: COVER                             -->
  <!-- ========================================== -->
  <div class="slide cover-slide">
    <div class="cover-top">
      <div class="apple-badge">
        <div class="apple-dot-red"></div>
        Ghid Oficial de Operare &bull; Digital Signage
      </div>
      <div class="tenant-tag">Dedicated Tenant: <strong>sushihan</strong></div>
    </div>

    <div class="cover-main">
      <span class="cover-hero-tag">Smart TV &bull; Cloud Management</span>
      <h1 class="cover-h1">Ghid Complet de Utilizare<br>Meniuri Digitale Sushi Han</h1>
      <p class="cover-lead">
        Platforma dedicată pentru gestionarea afișajelor din restaurante: încărcare fotografii și clipuri, conținut online, configurare playlist-uri, programare Happy Hour și sincronizare multi-ecran în timp real.
      </p>

      <div class="cover-grid">
        <div class="cover-card">
          <div class="cover-card-num">Modulul 1</div>
          <div class="cover-card-title">Biblioteca Media</div>
          <div class="cover-card-desc">Drag & drop, linkuri online (YouTube), foldere și organizare preparate.</div>
        </div>
        <div class="cover-card">
          <div class="cover-card-num">Modulul 2</div>
          <div class="cover-card-title">Playlist-uri & Rulare</div>
          <div class="cover-card-desc">Creare playlist, timpi de expunere și succesiune produse.</div>
        </div>
        <div class="cover-card">
          <div class="cover-card-num">Modulul 3</div>
          <div class="cover-card-title">Happy Hour & Orare</div>
          <div class="cover-card-desc">Comutare automată pe oferte speciale și countdown timer live.</div>
        </div>
        <div class="cover-card">
          <div class="cover-card-num">Modulul 4</div>
          <div class="cover-card-title">TV & Sincronizare</div>
          <div class="cover-card-desc">Conectare Smart TV, Mirror Sync și Matrix Video Wall multi-ecran.</div>
        </div>
      </div>
    </div>

    <div class="cover-bottom">
      <div>Screen Media Digital Signage System &bull; Versiunea 2.4</div>
      <div>Tenant activ: <strong>sh (Sushi Han)</strong> &bull; https://sushihan.smr.onl</div>
    </div>
  </div>

  <!-- ========================================== -->
  <!-- SLIDE 2: FLUXUL GENERAL                    -->
  <!-- ========================================== -->
  <div class="slide">
    <div class="slide-header">
      <div class="slide-category">Arhitectura Sistemului</div>
      <h2 class="slide-heading">Cum ajunge conținutul din panou direct pe televizor</h2>
      <p class="slide-subheading">Flux simplu și intuitiv în 4 etape logice pentru echipa restaurantelor Sushi Han</p>
    </div>

    <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin: auto 0; height: 130mm;">
      <div style="background: #ffffff; border: 1px solid #e5e5ea; border-radius: 16px; padding: 18px 16px; box-shadow: 0 4px 16px rgba(0,0,0,0.03); display: flex; flex-direction: column; justify-content: space-between;">
        <div>
          <div style="width: 28px; height: 28px; border-radius: 50%; background: #ff3b30; color: #fff; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 800; margin-bottom: 12px;">1</div>
          <div style="font-size: 26px; margin-bottom: 8px;">📂</div>
          <h3 style="font-size: 15px; font-weight: 700; color: #1d1d1f; margin-bottom: 6px;">Media & Online</h3>
          <p style="font-size: 11.5px; color: #6e6e73; line-height: 1.45;">Încarci poze și videoclipuri cu preparate prin drag & drop sau adaugi link-uri YouTube / Web.</p>
        </div>
        <div style="font-size: 10.5px; font-weight: 700; color: #ff3b30; text-transform: uppercase;">Pasul 1: Conținut</div>
      </div>

      <div style="background: #ffffff; border: 1px solid #e5e5ea; border-radius: 16px; padding: 18px 16px; box-shadow: 0 4px 16px rgba(0,0,0,0.03); display: flex; flex-direction: column; justify-content: space-between;">
        <div>
          <div style="width: 28px; height: 28px; border-radius: 50%; background: #ff9500; color: #fff; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 800; margin-bottom: 12px;">2</div>
          <div style="font-size: 26px; margin-bottom: 8px;">📑</div>
          <h3 style="font-size: 15px; font-weight: 700; color: #1d1d1f; margin-bottom: 6px;">Playlist & Regie</h3>
          <p style="font-size: 11.5px; color: #6e6e73; line-height: 1.45;">Creezi liste de redare, stabilești ordinea slide-urilor și secundele de afișare pentru fiecare sushi roll.</p>
        </div>
        <div style="font-size: 10.5px; font-weight: 700; color: #ff9500; text-transform: uppercase;">Pasul 2: Playlist</div>
      </div>

      <div style="background: #ffffff; border: 1px solid #e5e5ea; border-radius: 16px; padding: 18px 16px; box-shadow: 0 4px 16px rgba(0,0,0,0.03); display: flex; flex-direction: column; justify-content: space-between;">
        <div>
          <div style="width: 28px; height: 28px; border-radius: 50%; background: #af52de; color: #fff; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 800; margin-bottom: 12px;">3</div>
          <div style="font-size: 26px; margin-bottom: 8px;">⏰</div>
          <h3 style="font-size: 15px; font-weight: 700; color: #1d1d1f; margin-bottom: 6px;">Happy Hour</h3>
          <p style="font-size: 11.5px; color: #6e6e73; line-height: 1.45;">Programezi oferte speciale automate pe zile și intervale orare (ex: 16:00-19:00) cu countdown timer.</p>
        </div>
        <div style="font-size: 10.5px; font-weight: 700; color: #af52de; text-transform: uppercase;">Pasul 3: Automatizare</div>
      </div>

      <div style="background: #ffffff; border: 1px solid #e5e5ea; border-radius: 16px; padding: 18px 16px; box-shadow: 0 4px 16px rgba(0,0,0,0.03); display: flex; flex-direction: column; justify-content: space-between;">
        <div>
          <div style="width: 28px; height: 28px; border-radius: 50%; background: #0071e3; color: #fff; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 800; margin-bottom: 12px;">4</div>
          <div style="font-size: 26px; margin-bottom: 8px;">📺</div>
          <h3 style="font-size: 15px; font-weight: 700; color: #1d1d1f; margin-bottom: 6px;">TV & Sync</h3>
          <p style="font-size: 11.5px; color: #6e6e73; line-height: 1.45;">Asociezi televizorul din sală, activezi efecte de sezon sau sincronizezi mai multe ecrane în Video Wall.</p>
        </div>
        <div style="font-size: 10.5px; font-weight: 700; color: #0071e3; text-transform: uppercase;">Pasul 4: Difuzare</div>
      </div>
    </div>

    <div class="apple-footer">
      <span class="footer-tenant">Sushi Han &bull; Arhitectura Sistemului</span>
      <span>2 / 15</span>
    </div>
  </div>

  <!-- ========================================== -->
  <!-- SLIDE 3: PASUL 1.1 — BIBLIOTECA MEDIA ROOT -->
  <!-- ========================================== -->
  <div class="slide">
    <div class="slide-header">
      <div class="slide-category">Modulul 1 &bull; Pasul 1.1</div>
      <h2 class="slide-heading">Biblioteca Media: Toate Fișierele (Root)</h2>
      <p class="slide-subheading">Vizualizarea generală a tuturor fotografiilor și videoclipurilor încărcate pentru Sushi Han</p>
    </div>

    <div class="slide-body-split">
      <div class="action-panel">
        <div class="action-steps">
          <div class="action-step">
            <div class="action-step-badge">1</div>
            <div class="action-step-content">
              <div class="action-step-title">Accesare Modul</div>
              Din meniul principal din stânga, apasă pe <strong>„Conținut”</strong> (simbolul cu peisaj și cameră foto).
            </div>
          </div>

          <div class="action-step">
            <div class="action-step-badge">2</div>
            <div class="action-step-content">
              <div class="action-step-title">Folderul Principal (Root)</div>
              Click pe <strong>„📁 Toate fișierele (Root)”</strong> din panoul lateral pentru a vedea întreg catalogul nesortat.
            </div>
          </div>

          <div class="action-step">
            <div class="action-step-badge">3</div>
            <div class="action-step-content">
              <div class="action-step-title">Filtrare Rapidă</div>
              Poți comuta între <em>„Doar Imagini”</em> sau <em>„Doar Video”</em> și căuta preparate după denumire.
            </div>
          </div>
        </div>

        <div class="apple-tip-box">
          <div class="apple-tip-icon">💡</div>
          <div><strong>Sfat de organizare:</strong> Fișierele din Root pot fi mutate oricând în foldere tematice prin drag & drop direct peste panoul stâng.</div>
        </div>
      </div>

      <div class="mac-window">
        <div class="mac-titlebar">
          <div class="mac-traffic-lights">
            <div class="mac-dot mac-dot-close"></div>
            <div class="mac-dot mac-dot-min"></div>
            <div class="mac-dot mac-dot-max"></div>
          </div>
          <div class="mac-address-bar">
            <span class="mac-lock-icon">🔒</span> sushihan.smr.onl/content
          </div>
        </div>
        <div class="mac-viewport">
          <img src="${imgContent}" class="mac-screenshot" alt="Biblioteca Media" />
        </div>
      </div>
    </div>

    <div class="apple-footer">
      <span class="footer-tenant">Sushi Han &bull; Biblioteca Media</span>
      <span>3 / 15</span>
    </div>
  </div>

  <!-- ========================================== -->
  <!-- SLIDE 4: PASUL 1.2 — DRAG & DROP & PROGRES -->
  <!-- ========================================== -->
  <div class="slide">
    <div class="slide-header">
      <div class="slide-category">Modulul 1 &bull; Pasul 1.2</div>
      <h2 class="slide-heading">Încărcare Fișiere: Drag & Drop și Progres Live</h2>
      <p class="slide-subheading">Cum tragi fișiere din calculator și monitorizezi viteza și timpul estimat de upload</p>
    </div>

    <div class="slide-body-split">
      <div class="action-panel">
        <div class="action-steps">
          <div class="action-step">
            <div class="action-step-badge">1</div>
            <div class="action-step-content">
              <div class="action-step-title">Drag & Drop Direct</div>
              Trage fotografiile sau clipurile direct din Finder / Desktop în fereastra browserului sau pe zona punctată.
            </div>
          </div>

          <div class="action-step">
            <div class="action-step-badge">2</div>
            <div class="action-step-content">
              <div class="action-step-title">Gestiune Fișiere Pregătite</div>
              Fiecare fișier este listat cu iconiță, dimensiune și buton <strong>„×”</strong> pentru a elimina ușor selecțiile greșite.
            </div>
          </div>

          <div class="action-step">
            <div class="action-step-badge">3</div>
            <div class="action-step-content">
              <div class="action-step-title">Bară de Progres & ETA Live</div>
              În timpul încărcării vezi: <em>„Fișierul 2 din 5”</em>, <strong>„Mai sunt 3 fișiere”</strong>, viteza (MB/s) și timpul rămas estimat!
            </div>
          </div>
        </div>

        <div class="apple-tip-box">
          <div class="apple-tip-icon">⚡</div>
          <div><strong>Optimizare automată:</strong> Videoclipurilor li se extrage durata exactă și li se generează automat o previzualizare HD.</div>
        </div>
      </div>

      <div class="mac-window">
        <div class="mac-titlebar">
          <div class="mac-traffic-lights">
            <div class="mac-dot mac-dot-close"></div>
            <div class="mac-dot mac-dot-min"></div>
            <div class="mac-dot mac-dot-max"></div>
          </div>
          <div class="mac-address-bar">
            <span class="mac-lock-icon">🔒</span> sushihan.smr.onl/content (Adăugare fișiere)
          </div>
        </div>
        <div class="mac-viewport">
          <img src="${imgUpload}" class="mac-screenshot" alt="Modal Upload Fișiere" />
        </div>
      </div>
    </div>

    <div class="apple-footer">
      <span class="footer-tenant">Sushi Han &bull; Upload Fișiere & Drag & Drop</span>
      <span>4 / 15</span>
    </div>
  </div>

  <!-- ========================================== -->
  <!-- SLIDE 5: PASUL 1.3 — CONȚINUT ONLINE / WEB -->
  <!-- ========================================== -->
  <div class="slide">
    <div class="slide-header">
      <div class="slide-category">Modulul 1 &bull; Pasul 1.3</div>
      <h2 class="slide-heading">Adăugarea Conținutului Online (Link Extern)</h2>
      <p class="slide-subheading">Cum integrezi clipuri YouTube, streaming video direct, imagini găzduite online sau pagini web</p>
    </div>

    <div class="slide-body-split">
      <div class="action-panel">
        <div class="action-steps">
          <div class="action-step">
            <div class="action-step-badge">1</div>
            <div class="action-step-content">
              <div class="action-step-title">Comutare pe „Link Extern”</div>
              În fereastra de adăugare conținut, alege al doilea tab: <strong>„Link Extern”</strong>.
            </div>
          </div>

          <div class="action-step">
            <div class="action-step-badge">2</div>
            <div class="action-step-content">
              <div class="action-step-title">Selectare Tip Conținut</div>
              &bull; <strong>YouTube:</strong> Link video sau transmisie live.<br>
              &bull; <strong>Video Direct (URL):</strong> Link MP4 / WebM online.<br>
              &bull; <strong>Imagine (URL):</strong> Poză de pe server extern / CDN.<br>
              &bull; <strong>Pagină Web:</strong> Link către meniul interactiv sau site.
            </div>
          </div>

          <div class="action-step">
            <div class="action-step-badge">3</div>
            <div class="action-step-content">
              <div class="action-step-title">Durată și Salvare</div>
              Lipești URL-ul în câmpul dedicat, setezi durata de difuzare pe ecran și apeși <strong>„Adaugă”</strong>.
            </div>
          </div>
        </div>

        <div class="apple-tip-box">
          <div class="apple-tip-icon">🌐</div>
          <div><strong>Avantaj major:</strong> Pentru fișiere video foarte mari (>200MB), încărcarea pe YouTube sau cloud extern asigură rulare fără consum de stocare!</div>
        </div>
      </div>

      <div class="mac-window">
        <div class="mac-titlebar">
          <div class="mac-traffic-lights">
            <div class="mac-dot mac-dot-close"></div>
            <div class="mac-dot mac-dot-min"></div>
            <div class="mac-dot mac-dot-max"></div>
          </div>
          <div class="mac-address-bar">
            <span class="mac-lock-icon">🔒</span> sushihan.smr.onl/content (Link Extern)
          </div>
        </div>
        <div class="mac-viewport">
          <img src="${imgExternal}" class="mac-screenshot" alt="Modal Link Extern" />
        </div>
      </div>
    </div>

    <div class="apple-footer">
      <span class="footer-tenant">Sushi Han &bull; Conținut Online & YouTube</span>
      <span>5 / 15</span>
    </div>
  </div>

  <!-- ========================================== -->
  <!-- SLIDE 6: PASUL 1.4 — FOLDERE TEMATICE       -->
  <!-- ========================================== -->
  <div class="slide">
    <div class="slide-header">
      <div class="slide-category">Modulul 1 &bull; Pasul 1.4</div>
      <h2 class="slide-heading">Organizarea pe Foldere Tematice</h2>
      <p class="slide-subheading">Crearea de foldere pentru Meniuri, Seturi Promoționale, Băuturi sau Campanii Sezoniere</p>
    </div>

    <div class="slide-body-split">
      <div class="action-panel">
        <div class="action-steps">
          <div class="action-step">
            <div class="action-step-badge">1</div>
            <div class="action-step-content">
              <div class="action-step-title">Creare Folder Nou</div>
              Apasă pe butonul cu iconiță <strong>„+”</strong> de lângă titlul <em>Foldere</em> din panoul lateral stâng.
            </div>
          </div>

          <div class="action-step">
            <div class="action-step-badge">2</div>
            <div class="action-step-content">
              <div class="action-step-title">Personalizare Vizuală</div>
              Introdu numele folderului (ex: <em>„Platouri Sushi Festive”</em>), alege culoarea de identificare și iconița dorită.
            </div>
          </div>

          <div class="action-step">
            <div class="action-step-badge">3</div>
            <div class="action-step-content">
              <div class="action-step-title">Încărcare Directă în Folder</div>
              Când ai un folder selectat, orice fișier adăugat este salvat automat direct în acel folder tematic.
            </div>
          </div>
        </div>

        <div class="apple-tip-box">
          <div class="apple-tip-icon">🗂️</div>
          <div><strong>Navigare rapidă:</strong> Făcând click pe orice folder vezi exclusiv produsele asociate acelei categorii culinare.</div>
        </div>
      </div>

      <div class="mac-window">
        <div class="mac-titlebar">
          <div class="mac-traffic-lights">
            <div class="mac-dot mac-dot-close"></div>
            <div class="mac-dot mac-dot-min"></div>
            <div class="mac-dot mac-dot-max"></div>
          </div>
          <div class="mac-address-bar">
            <span class="mac-lock-icon">🔒</span> sushihan.smr.onl/content (Folder Nou)
          </div>
        </div>
        <div class="mac-viewport">
          <img src="${imgFolder}" class="mac-screenshot" alt="Modal Creare Folder" />
        </div>
      </div>
    </div>

    <div class="apple-footer">
      <span class="footer-tenant">Sushi Han &bull; Organizare Foldere</span>
      <span>6 / 15</span>
    </div>
  </div>

  <!-- ========================================== -->
  <!-- SLIDE 7: PASUL 2.1 — PLAYLIST-URI OVERVIEW -->
  <!-- ========================================== -->
  <div class="slide">
    <div class="slide-header">
      <div class="slide-category">Modulul 2 &bull; Pasul 2.1</div>
      <h2 class="slide-heading">Secțiunea Playlist-uri: Lista de Difuzare</h2>
      <p class="slide-subheading">Centralizatorul secvențelor de conținut care rulează în buclă continuă pe televizoare</p>
    </div>

    <div class="slide-body-split">
      <div class="action-panel">
        <div class="action-steps">
          <div class="action-step">
            <div class="action-step-badge">1</div>
            <div class="action-step-content">
              <div class="action-step-title">Navigare în Modul</div>
              Din meniul din stânga, dă click pe secțiunea <strong>„Playlist-uri”</strong> (simbolul cu listă de redare).
            </div>
          </div>

          <div class="action-step">
            <div class="action-step-badge">2</div>
            <div class="action-step-content">
              <div class="action-step-title">Monitorizare Playlist-uri</div>
              Vezi toate playlist-urile existente pentru restaurantele Sushi Han (ex: <em>Ploiesti 2, Meniu Rulouri, etc.</em>).
            </div>
          </div>

          <div class="action-step">
            <div class="action-step-badge">3</div>
            <div class="action-step-content">
              <div class="action-step-title">Statistici în Timp Real</div>
              Fiecare card afișează numărul de elemente incluse, durata totală a buclei de redare și data ultimei actualizări.
            </div>
          </div>
        </div>

        <div class="apple-tip-box">
          <div class="apple-tip-icon">🔄</div>
          <div><strong>Actualizare fără întrerupere:</strong> Modificările aduse unui playlist se sincronizează instant pe TV fără ecran negru!</div>
        </div>
      </div>

      <div class="mac-window">
        <div class="mac-titlebar">
          <div class="mac-traffic-lights">
            <div class="mac-dot mac-dot-close"></div>
            <div class="mac-dot mac-dot-min"></div>
            <div class="mac-dot mac-dot-max"></div>
          </div>
          <div class="mac-address-bar">
            <span class="mac-lock-icon">🔒</span> sushihan.smr.onl/playlists
          </div>
        </div>
        <div class="mac-viewport">
          <img src="${imgPlaylists}" class="mac-screenshot" alt="Lista Playlist-uri" />
        </div>
      </div>
    </div>

    <div class="apple-footer">
      <span class="footer-tenant">Sushi Han &bull; Playlist-uri</span>
      <span>7 / 15</span>
    </div>
  </div>

  <!-- ========================================== -->
  <!-- SLIDE 8: PASUL 2.2 — CUM SE CREEAZĂ PLAYLIST-->
  <!-- ========================================== -->
  <div class="slide">
    <div class="slide-header">
      <div class="slide-category">Modulul 2 &bull; Pasul 2.2</div>
      <h2 class="slide-heading">Cum se Creează un Playlist (Pas cu Pas)</h2>
      <p class="slide-subheading">Selectarea produselor din bibliotecă, ordonarea prin drag & drop și timpii de afișare</p>
    </div>

    <div class="slide-body-split">
      <div class="action-panel">
        <div class="action-steps">
          <div class="action-step">
            <div class="action-step-badge">1</div>
            <div class="action-step-content">
              <div class="action-step-title">Inițiere & Denumire</div>
              Apasă butonul <strong>„Creează Playlist”</strong>. Tastează un nume clar (ex: <em>„Meniu Săptămânal Sushi Han”</em>).
            </div>
          </div>

          <div class="action-step">
            <div class="action-step-badge">2</div>
            <div class="action-step-content">
              <div class="action-step-title">Adăugare Preparate din Galerie</div>
              Bifezi pozele sau clipurile pe care vrei să le incluzi în fluxul TV. Poți alege din Root sau foldere specifice.
            </div>
          </div>

          <div class="action-step">
            <div class="action-step-badge">3</div>
            <div class="action-step-content">
              <div class="action-step-title">Ordonare & Timp per Slide</div>
              Aranjezi ordinea preparatelor prin drag & drop. Setezi durata de afișare (ex: <strong>10 secunde</strong> per produs) și apeși <em>Salvează</em>.
            </div>
          </div>
        </div>

        <div class="apple-tip-box">
          <div class="apple-tip-icon">⏱️</div>
          <div><strong>Recomandare Sushi Han:</strong> Pentru fotografii, 8-12 secunde permit clienților să citească detaliile. Pentru video, durata este sincronizată automat.</div>
        </div>
      </div>

      <div class="mac-window">
        <div class="mac-titlebar">
          <div class="mac-traffic-lights">
            <div class="mac-dot mac-dot-close"></div>
            <div class="mac-dot mac-dot-min"></div>
            <div class="mac-dot mac-dot-max"></div>
          </div>
          <div class="mac-address-bar">
            <span class="mac-lock-icon">🔒</span> sushihan.smr.onl/playlists (Editor Playlist)
          </div>
        </div>
        <div class="mac-viewport">
          <img src="${imgPlaylistModal}" class="mac-screenshot" alt="Editor Playlist" />
        </div>
      </div>
    </div>

    <div class="apple-footer">
      <span class="footer-tenant">Sushi Han &bull; Creare Playlist</span>
      <span>8 / 15</span>
    </div>
  </div>

  <!-- ========================================== -->
  <!-- SLIDE 9: PASUL 2.3 — PROGRAMARE HAPPY HOUR -->
  <!-- ========================================== -->
  <div class="slide">
    <div class="slide-header">
      <div class="slide-category">Modulul 2 &bull; Pasul 2.3</div>
      <h2 class="slide-heading">Programare Automată: Modulul Happy Hour</h2>
      <p class="slide-subheading">Comutarea automată a televizoarelor pe oferte speciale în funcție de oră și zile ale săptămânii</p>
    </div>

    <div class="slide-body-split">
      <div class="action-panel">
        <div class="action-steps">
          <div class="action-step">
            <div class="action-step-badge">1</div>
            <div class="action-step-content">
              <div class="action-step-title">Accesare & Creare Program</div>
              Mergi la <strong>„Happy Hour”</strong> și apasă <strong>„Adaugă Program Nou”</strong>. Setează numele (ex: <em>„Sushi Happy Hour 1+1”</em>).
            </div>
          </div>

          <div class="action-step">
            <div class="action-step-badge">2</div>
            <div class="action-step-content">
              <div class="action-step-title">Interval Orar & Zile Active</div>
              Stabilești ora de început (ex: <strong>16:00</strong>) și sfârșit (ex: <strong>19:00</strong>), plus zilele săptămânii în care oferta este activă (Luni–Vineri).
            </div>
          </div>

          <div class="action-step">
            <div class="action-step-badge">3</div>
            <div class="action-step-content">
              <div class="action-step-title">Conținut Dedicat & Ecrane</div>
              Selectezi playlist-ul promoțional sau imaginea dedicată și alegi ce televizoare din restaurant vor rula automat campania.
            </div>
          </div>
        </div>

        <div class="apple-tip-box">
          <div class="apple-tip-icon">⏳</div>
          <div><strong>Countdown Timer pe TV:</strong> În Screen Designer poți activa afișarea unui ceas cu numărătoare inversă: <em>„Oferta expiră în 01:45:00”</em>!</div>
        </div>
      </div>

      <div class="mac-window">
        <div class="mac-titlebar">
          <div class="mac-traffic-lights">
            <div class="mac-dot mac-dot-close"></div>
            <div class="mac-dot mac-dot-min"></div>
            <div class="mac-dot mac-dot-max"></div>
          </div>
          <div class="mac-address-bar">
            <span class="mac-lock-icon">🔒</span> sushihan.smr.onl/happy-hour (Programare Orară)
          </div>
        </div>
        <div class="mac-viewport">
          <img src="${imgHappyHour}" class="mac-screenshot" alt="Modul Happy Hour" />
        </div>
      </div>
    </div>

    <div class="apple-footer">
      <span class="footer-tenant">Sushi Han &bull; Automatizare Happy Hour</span>
      <span>9 / 15</span>
    </div>
  </div>

  <!-- ========================================== -->
  <!-- SLIDE 10: PASUL 3.1 — PANOU ECRANE          -->
  <!-- ========================================== -->
  <div class="slide">
    <div class="slide-header">
      <div class="slide-category">Modulul 3 &bull; Pasul 3.1</div>
      <h2 class="slide-heading">Panoul Ecrane: Monitorizarea Televizoarelor</h2>
      <p class="slide-subheading">Centralizatorul tuturor ecranelor fizice instalate în restaurantele Sushi Han</p>
    </div>

    <div class="slide-body-split">
      <div class="action-panel">
        <div class="action-steps">
          <div class="action-step">
            <div class="action-step-badge">1</div>
            <div class="action-step-content">
              <div class="action-step-title">Navigare în Modul</div>
              Apasă pe <strong>„Ecrane”</strong> din bara laterală stângă (iconița cu monitor TV).
            </div>
          </div>

          <div class="action-step">
            <div class="action-step-badge">2</div>
            <div class="action-step-content">
              <div class="action-step-title">Status Conexiune Live</div>
              Punctul 🟢 <strong>Verde</strong> indică TV Online funcțional. Punctul 🔴 <strong>Roșu</strong> semnalează televizor oprit sau deconectat de la Wi-Fi.
            </div>
          </div>

          <div class="action-step">
            <div class="action-step-badge">3</div>
            <div class="action-step-content">
              <div class="action-step-title">Butoane de Control Rapid</div>
              Fiecare televizor are buton pentru <strong>Deschidere Live</strong>, <strong>Screen Designer</strong> și <strong>Copiere Link Kiosk</strong>.
            </div>
          </div>
        </div>

        <div class="apple-tip-box">
          <div class="apple-tip-icon">📡</div>
          <div><strong>Heartbeat automat:</strong> Televizorul raportează starea la fiecare 30 de secunde, oferindu-ți certitudinea că ecranul funcționează perfect în sală.</div>
        </div>
      </div>

      <div class="mac-window">
        <div class="mac-titlebar">
          <div class="mac-traffic-lights">
            <div class="mac-dot mac-dot-close"></div>
            <div class="mac-dot mac-dot-min"></div>
            <div class="mac-dot mac-dot-max"></div>
          </div>
          <div class="mac-address-bar">
            <span class="mac-lock-icon">🔒</span> sushihan.smr.onl/screens
          </div>
        </div>
        <div class="mac-viewport">
          <img src="${imgScreens}" class="mac-screenshot" alt="Panou Ecrane" />
        </div>
      </div>
    </div>

    <div class="apple-footer">
      <span class="footer-tenant">Sushi Han &bull; Monitorizare Televizoare</span>
      <span>10 / 15</span>
    </div>
  </div>

  <!-- ========================================== -->
  <!-- SLIDE 11: PASUL 3.2 — CUM SE CREEAZĂ TV NOU-->
  <!-- ========================================== -->
  <div class="slide">
    <div class="slide-header">
      <div class="slide-category">Modulul 3 &bull; Pasul 3.2</div>
      <h2 class="slide-heading">Cum se Creează și Conectează un TV Nou</h2>
      <p class="slide-subheading">Înregistrarea televizorului în cloud și deschiderea link-ului în browserul Smart TV</p>
    </div>

    <div class="slide-body-split">
      <div class="action-panel">
        <div class="action-steps">
          <div class="action-step">
            <div class="action-step-badge">1</div>
            <div class="action-step-content">
              <div class="action-step-title">Înregistrare în Panou</div>
              Click pe <strong>„Adaugă ecran”</strong>. Completezi: Nume (ex: <em>„TV Vitrină Ploiești”</em>), Locația și Orientarea (<em>Landscape / Portrait</em>).
            </div>
          </div>

          <div class="action-step">
            <div class="action-step-badge">2</div>
            <div class="action-step-content">
              <div class="action-step-title">Conectare pe Smart TV Fizic</div>
              Deschizi browserul televizorului (LG webOS, Samsung Tizen, Android TV) și accesezi URL-ul: <strong>sushihan.smr.onl/display/{id}</strong>.
            </div>
          </div>

          <div class="action-step">
            <div class="action-step-badge">3</div>
            <div class="action-step-content">
              <div class="action-step-title">Mod Fullscreen & Bookmark</div>
              Apeși butonul <em>Fullscreen / Tot ecranul</em>. Salvezi adresa în Bookmark-uri pentru repornire automată după oprirea curentului.
            </div>
          </div>
        </div>

        <div class="apple-tip-box">
          <div class="apple-tip-icon">🛡️</div>
          <div><strong>Protecție Anti-Standby:</strong> Sistemul menține automat ecranul aprins (Wake Lock), prevenind stingerea sau intrarea în screensaver a TV-ului.</div>
        </div>
      </div>

      <div class="mac-window">
        <div class="mac-titlebar">
          <div class="mac-traffic-lights">
            <div class="mac-dot mac-dot-close"></div>
            <div class="mac-dot mac-dot-min"></div>
            <div class="mac-dot mac-dot-max"></div>
          </div>
          <div class="mac-address-bar">
            <span class="mac-lock-icon">🔒</span> sushihan.smr.onl/screens (Adăugare Ecran)
          </div>
        </div>
        <div class="mac-viewport">
          <img src="${imgScreenModal}" class="mac-screenshot" alt="Modal Adăugare Ecran" />
        </div>
      </div>
    </div>

    <div class="apple-footer">
      <span class="footer-tenant">Sushi Han &bull; Înregistrare TV Nou</span>
      <span>11 / 15</span>
    </div>
  </div>

  <!-- ========================================== -->
  <!-- SLIDE 12: PASUL 3.3 — SCREEN DESIGNER       -->
  <!-- ========================================== -->
  <div class="slide">
    <div class="slide-header">
      <div class="slide-category">Modulul 3 &bull; Pasul 3.3</div>
      <h2 class="slide-heading">Screen Designer: Asignare Playlist & Efecte</h2>
      <p class="slide-subheading">Personalizarea televizorului: playlist-ul rulat, Logo Sushi Han și noile Efecte Interactive</p>
    </div>

    <div class="slide-body-split">
      <div class="action-panel">
        <div class="action-steps">
          <div class="action-step">
            <div class="action-step-badge">1</div>
            <div class="action-step-content">
              <div class="action-step-title">Atribuire Playlist (dreapta)</div>
              În caseta <em>Configurare Zone &rarr; Main</em>, alege tipul <strong>Playlist</strong> și selectează <em>Ploiesti 2</em>.
            </div>
          </div>

          <div class="action-step">
            <div class="action-step-badge">2</div>
            <div class="action-step-content">
              <div class="action-step-title">Logo Overlay Sushi Han</div>
              Activează butonul <strong>Logo</strong> pentru a plasa sigla oficială Sushi Han în colțul dorit al ecranului.
            </div>
          </div>

          <div class="action-step">
            <div class="action-step-badge">3</div>
            <div class="action-step-content">
              <div class="action-step-title">Efecte Sezoniere Noi</div>
              🍂 <strong>Toamnă:</strong> Frunze 3D plutitoare în nuanțe calde.<br>
              🎃 <strong>Halloween:</strong> Lilieci zburători, dovleci luminați și fantome.<br>
              Reglează intensitatea: <em>Puțin / Mediu / Mult</em>.
            </div>
          </div>
        </div>

        <div class="apple-tip-box">
          <div class="apple-tip-icon">💾</div>
          <div><strong>Sincronizare live:</strong> Apasă butonul albastru <strong>„Salvează”</strong> din antet. Modificările se transmit instant pe TV!</div>
        </div>
      </div>

      <div class="mac-window">
        <div class="mac-titlebar">
          <div class="mac-traffic-lights">
            <div class="mac-dot mac-dot-close"></div>
            <div class="mac-dot mac-dot-min"></div>
            <div class="mac-dot mac-dot-max"></div>
          </div>
          <div class="mac-address-bar">
            <span class="mac-lock-icon">🔒</span> sushihan.smr.onl/screens/pl1/design
          </div>
        </div>
        <div class="mac-viewport">
          <img src="${imgDesigner}" class="mac-screenshot" alt="Screen Designer" />
        </div>
      </div>
    </div>

    <div class="apple-footer">
      <span class="footer-tenant">Sushi Han &bull; Screen Designer & Efecte</span>
      <span>12 / 15</span>
    </div>
  </div>

  <!-- ========================================== -->
  <!-- SLIDE 13: PASUL 3.4 — SINCRONIZARE TV-URI   -->
  <!-- ========================================== -->
  <div class="slide">
    <div class="slide-header">
      <div class="slide-category">Modulul 3 &bull; Pasul 3.4</div>
      <h2 class="slide-heading">Sincronizarea TV-urilor: Mirror Sync & Video Wall</h2>
      <p class="slide-subheading">Cum legi televizoarele din restaurant pentru a reda simultan sau a forma un perete video uriaș</p>
    </div>

    <div class="slide-body-split">
      <div class="action-panel">
        <div class="action-steps">
          <div class="action-step">
            <div class="action-step-badge">1</div>
            <div class="action-step-content">
              <div class="action-step-title">Modulul „Sincronizare Ecrane”</div>
              Din meniu accesează <strong>„Sincronizare Ecrane”</strong> și apasă <strong>„Grup Nou de Sincronizare”</strong>.
            </div>
          </div>

          <div class="action-step">
            <div class="action-step-badge">2</div>
            <div class="action-step-content">
              <div class="action-step-title">Alegere Mod Sincronizare</div>
              &bull; <strong>Mirror Sync (Oglindă):</strong> Toate televizoarele din grup redau exact același spot în aceeași secundă.<br>
              &bull; <strong>Matrix Video Wall:</strong> Un singur video mare este împărțit pe 2x1, 3x1 sau 2x2 ecrane alăturate.
            </div>
          </div>

          <div class="action-step">
            <div class="action-step-badge">3</div>
            <div class="action-step-content">
              <div class="action-step-title">Ordonare Ecrane Fizice</div>
              Stabilești poziția fiecărui televizor (TV stânga &rarr; TV dreapta) și atribui conținutul dorit. Salvezi grupul.
            </div>
          </div>
        </div>

        <div class="apple-tip-box">
          <div class="apple-tip-icon">🎛️</div>
          <div><strong>Sincronizare milisecundă:</strong> Sistemul sincronizează ceasul televizoarelor prin rețea, eliminând orice ecou audio sau decalaj vizual.</div>
        </div>
      </div>

      <div class="mac-window">
        <div class="mac-titlebar">
          <div class="mac-traffic-lights">
            <div class="mac-dot mac-dot-close"></div>
            <div class="mac-dot mac-dot-min"></div>
            <div class="mac-dot mac-dot-max"></div>
          </div>
          <div class="mac-address-bar">
            <span class="mac-lock-icon">🔒</span> sushihan.smr.onl/screen-sync
          </div>
        </div>
        <div class="mac-viewport">
          <img src="${imgScreenSync}" class="mac-screenshot" alt="Sincronizare Ecrane" />
        </div>
      </div>
    </div>

    <div class="apple-footer">
      <span class="footer-tenant">Sushi Han &bull; Sincronizare Televizoare & Video Wall</span>
      <span>13 / 15</span>
    </div>
  </div>

  <!-- ========================================== -->
  <!-- SLIDE 14: AFIȘAJ LIVE SMART TV              -->
  <!-- ========================================== -->
  <div class="slide">
    <div class="slide-header">
      <div class="slide-category">Rezultat Final</div>
      <h2 class="slide-heading">Afișajul Live în Restaurantul Sushi Han</h2>
      <p class="slide-subheading">Experiența vizuală impecabilă recepționată de clienți pe ecranul televizorului</p>
    </div>

    <div class="slide-body-split">
      <div class="action-panel">
        <div class="action-steps">
          <div class="action-step">
            <div class="action-step-badge">✓</div>
            <div class="action-step-content">
              <div class="action-step-title">Aspect Imersiv Kiosk</div>
              Toate elementele de browser dispar complet, lăsând spațiu exclusiv meniului și ofertelor apetisante Sushi Han.
            </div>
          </div>

          <div class="action-step">
            <div class="action-step-badge">✓</div>
            <div class="action-step-content">
              <div class="action-step-title">Tranziții Fine & Efecte</div>
              Trecerea de la un preparat la altul se face fluid, cu logo-ul Sushi Han suprapus elegant și efectele de sezon active.
            </div>
          </div>

          <div class="action-step">
            <div class="action-step-badge">✓</div>
            <div class="action-step-content">
              <div class="action-step-title">Comutare Instantanee</div>
              Fie că declanșezi un meniu Happy Hour sau schimbi playlist-ul, ecranul își face update în mai puțin de o secundă.
            </div>
          </div>
        </div>

        <div class="apple-tip-box">
          <div class="apple-tip-icon">📺</div>
          <div><strong>Compatibilitate Universală:</strong> Funcționează pe orice Smart TV modern (LG, Samsung, Philips, Sony, Hisense, Android TV).</div>
        </div>
      </div>

      <div class="mac-window">
        <div class="mac-titlebar">
          <div class="mac-traffic-lights">
            <div class="mac-dot mac-dot-close"></div>
            <div class="mac-dot mac-dot-min"></div>
            <div class="mac-dot mac-dot-max"></div>
          </div>
          <div class="mac-address-bar">
            <span class="mac-lock-icon">🔒</span> sushihan.smr.onl/display/pl1 (Kiosk Mode)
          </div>
        </div>
        <div class="mac-viewport">
          <img src="${imgTv}" class="mac-screenshot" alt="Afișaj Live TV" />
        </div>
      </div>
    </div>

    <div class="apple-footer">
      <span class="footer-tenant">Sushi Han &bull; Afișaj Live Smart TV</span>
      <span>14 / 15</span>
    </div>
  </div>

  <!-- ========================================== -->
  <!-- SLIDE 15: BUNE PRACTICI                    -->
  <!-- ========================================== -->
  <div class="slide">
    <div class="slide-header">
      <div class="slide-category">Rezumativ &bull; Ghid Rapid</div>
      <h2 class="slide-heading">Bune Practici pentru Afișajul Sushi Han</h2>
      <p class="slide-subheading">Reguli simple pentru a asigura un aspect vizual premium și funcționare fără întreruperi</p>
    </div>

    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin: auto 0;">
      <div style="background: #ffffff; border: 1px solid #e5e5ea; border-radius: 16px; padding: 18px; box-shadow: 0 4px 14px rgba(0,0,0,0.03);">
        <div style="font-size: 26px; margin-bottom: 8px;">📸</div>
        <h3 style="font-size: 15px; font-weight: 700; color: #1d1d1f; margin-bottom: 6px;">Calitate Grafică</h3>
        <p style="font-size: 11.5px; color: #6e6e73; line-height: 1.45; margin-bottom: 10px;">
          Folosește întotdeauna fotografii clare la 1920&times;1080 pixeli. Mărimea recomandată este sub 3 MB per fișier pentru tranziții ultra-rapide.
        </p>
        <span style="font-size: 10px; font-weight: 700; color: #ff3b30; text-transform: uppercase;">Standard: Full HD 16:9</span>
      </div>

      <div style="background: #ffffff; border: 1px solid #e5e5ea; border-radius: 16px; padding: 18px; box-shadow: 0 4px 14px rgba(0,0,0,0.03);">
        <div style="font-size: 26px; margin-bottom: 8px;">⏱️</div>
        <h3 style="font-size: 15px; font-weight: 700; color: #1d1d1f; margin-bottom: 6px;">Ritmul Playlist-ului</h3>
        <p style="font-size: 11.5px; color: #6e6e73; line-height: 1.45; margin-bottom: 10px;">
          Setează între 8 și 12 secunde per produs. Este intervalul optim care permite clienților să observe detaliile fără a crea senzația de ecran static.
        </p>
        <span style="font-size: 10px; font-weight: 700; color: #34c759; text-transform: uppercase;">Optim: 10 secunde</span>
      </div>

      <div style="background: #ffffff; border: 1px solid #e5e5ea; border-radius: 16px; padding: 18px; box-shadow: 0 4px 14px rgba(0,0,0,0.03);">
        <div style="font-size: 26px; margin-bottom: 8px;">📺</div>
        <h3 style="font-size: 15px; font-weight: 700; color: #1d1d1f; margin-bottom: 6px;">Conectivitate TV</h3>
        <p style="font-size: 11.5px; color: #6e6e73; line-height: 1.45; margin-bottom: 10px;">
          Salvează link-ul ecranului în Bookmark-urile televizorului. Dacă se oprește curentul, televizorul va relua automat transmisiunea la repornire.
        </p>
        <span style="font-size: 10px; font-weight: 700; color: #0071e3; text-transform: uppercase;">Reconectare automată</span>
      </div>
    </div>

    <div style="background: #ffffff; border: 1px solid #e5e5ea; border-radius: 14px; padding: 12px 18px; display: flex; align-items: center; justify-content: space-between; margin-top: 8px;">
      <div>
        <div style="font-size: 12.5px; font-weight: 700; color: #1d1d1f;">Ai nevoie de asistență tehnică pentru ecranele Sushi Han?</div>
        <div style="font-size: 11px; color: #86868b;">Platforma Smart Displays este monitorizată permanent pentru disponibilitate 24/7.</div>
      </div>
      <div style="font-size: 12px; font-weight: 700; color: #ff3b30;">sushihan.smr.onl</div>
    </div>

    <div class="apple-footer">
      <span class="footer-tenant">Sushi Han Digital Signage &bull; Bune Practici</span>
      <span>15 / 15 &bull; Ghid Complet</span>
    </div>
  </div>

</body>
</html>
`;

  fs.writeFileSync(OUTPUT_HTML, html, 'utf8');
  console.log(`HTML generated at: ${OUTPUT_HTML}`);

  console.log('Launching Puppeteer to render Apple / Mac style PDF...');
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'networkidle0' });

  // Wait for fonts & images to settle
  await page.evaluateHandle('document.fonts.ready');
  await new Promise(r => setTimeout(r, 1500));

  console.log(`Printing to PDF at: ${OUTPUT_PDF}...`);
  await page.pdf({
    path: OUTPUT_PDF,
    format: 'A4',
    landscape: true,
    printBackground: true,
    margin: { top: 0, right: 0, bottom: 0, left: 0 }
  });

  console.log('Apple Keynote style PDF generated successfully!');
  await browser.close();
}

buildPresentation().catch(err => {
  console.error('Fatal error during PDF build:', err);
  process.exit(1);
});
