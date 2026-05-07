const fs = require('fs');

const file1 = './frontend/public/demo_generator.html';
let html1 = fs.readFileSync(file1, 'utf8');

// Insert Lang Button
html1 = html1.replace(
  '<div class="flex items-center gap-4">',
  '<div class="flex items-center gap-4">\n        <button onclick="toggleLang()" class="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-600 px-4 py-2 rounded-full text-xs font-bold text-white transition-all shadow-lg" id="langToggleBtn">🇬🇧 English</button>'
);

// We will inject the i18n dictionary at the top of the script
const scriptToInject = `
    const i18n = {
      ro: {
        title: "Design Ecran (Demo)",
        sub: "Configurează template-ul și zonele pentru afișajul tău temporar",
        imgSec: "<i data-lucide='image' class='w-4 h-4 text-indigo-400'></i> Imaginea Ta (Template Ecran Full)",
        up1: "Click sau Drag & Drop",
        up2: "Urcă un meniu sau o reclamă (JPG/PNG)",
        ex1: "<i data-lucide='image' class='w-3 h-3'></i> Burger",
        ex2: "<i data-lucide='image' class='w-3 h-3'></i> Haine",
        rotTop: "<i data-lucide='rotate-cw' class='w-3 h-3 text-slate-500 mx-1'></i>",
        txtSec: "<i data-lucide='type' class='w-4 h-4 text-blue-400'></i> Text Personalizat",
        ph: "ex: SUPER OFERTĂ -50%",
        col: "Culoare Text (Hex):",
        bg: "Fundal Negru:",
        fxSec: "<i data-lucide='sparkles' class='w-4 h-4 text-amber-500'></i> Efecte Vizuale",
        fx1: "Parallax", fx2: "Steam (Abur)", fx3: "Valentine Hearts", fx4: "Sakura", fx5: "Zăpadă",
        intSec: "Intensitate Zăpadă / Sakura / Inimi",
        int1: "Scăzută", int2: "Medie", int3: "Maximă",
        tSec: "<i data-lucide='clock' class='w-4 h-4 text-purple-400'></i> Timer Happy Hour",
        tDur: "Durată (M:S)", tPos: "Poziție",
        dscTitle: "Notă Funcționalitate Demo",
        dscText: "Acest afișaj interactiv este generat exclusiv în scop demonstrativ. Linkul de previzualizare va fi activ o perioadă limitată de <strong>5 minute</strong> de la creare și va conține marca de apă (logo-ul) <strong>GetApp</strong>.<br>Pentru acces pe durată nelimitată, rulare continuă (24/7) pe monitoare / Smart TV-uri fizice, și conținut <strong>100% personalizat</strong> la nivel de locație, este necesară activarea abonamentului standard GetApp Smart Displays.",
        btn: "<i data-lucide='monitor-play' class='w-6 h-6'></i> PREVIZUALIZARE PE TV (5 MINUTE)",
        succ: "Ecranul a fost pregătit și rulează invizibil!",
        btnO: "<i data-lucide='external-link' class='w-5 h-5'></i> Deschide Live pe Tot Ecranul",
        err1: "Te rugăm să încarci o imagine prima dată!",
        err2: "Eroare Memorie Browser: Poza este prea mare! Te rugăm să folosești o poză sub 3MB.",
        langBtn: "🇬🇧 English",
        posGrid: ["Sus-Stânga", "Sus-Centru", "Sus-Dreapta", "Centru-Stg", "Centru", "Centru-Drp", "Jos-Stânga", "Jos-Centru", "Jos-Dreapta"]
      },
      en: {
        title: "Screen Design (Demo)",
        sub: "Configure the template and zones for your temporary display",
        imgSec: "<i data-lucide='image' class='w-4 h-4 text-indigo-400'></i> Your Image (Full Screen Template)",
        up1: "Click or Drag & Drop",
        up2: "Upload a menu or ad (JPG/PNG)",
        ex1: "<i data-lucide='image' class='w-3 h-3'></i> Burger",
        ex2: "<i data-lucide='image' class='w-3 h-3'></i> Suits",
        rotTop: "<i data-lucide='rotate-cw' class='w-3 h-3 text-slate-500 mx-1'></i>",
        txtSec: "<i data-lucide='type' class='w-4 h-4 text-blue-400'></i> Custom Text",
        ph: "ex: HOT DEAL -50%",
        col: "Text Color (Hex):",
        bg: "Dark Background:",
        fxSec: "<i data-lucide='sparkles' class='w-4 h-4 text-amber-500'></i> Visual Effects",
        fx1: "Parallax", fx2: "Steam", fx3: "Valentine Hearts", fx4: "Sakura", fx5: "Snow",
        intSec: "Intensity Snow / Sakura / Hearts",
        int1: "Low", int2: "Medium", int3: "Maximum",
        tSec: "<i data-lucide='clock' class='w-4 h-4 text-purple-400'></i> Happy Hour Timer",
        tDur: "Duration (M:S)", tPos: "Position",
        dscTitle: "Demo Functionality Notice",
        dscText: "This interactive display is generated exclusively for demonstration purposes. The preview link will be active for a limited time of <strong>5 minutes</strong> from creation and will contain the <strong>GetApp</strong> watermark.<br>For unlimited access, continuous playback (24/7) on physical monitors / Smart TVs, and <strong>100% customized</strong> content per location, activating the standard GetApp Smart Displays subscription is required.",
        btn: "<i data-lucide='monitor-play' class='w-6 h-6'></i> PREVIEW ON TV (5 MINUTES)",
        succ: "The screen has been prepared and is running invisibly!",
        btnO: "<i data-lucide='external-link' class='w-5 h-5'></i> Open Live Fullscreen",
        err1: "Please upload an image first!",
        err2: "Browser Memory Error: File is too large! Please use a picture under 3MB.",
        langBtn: "🇷🇴 Română",
        posGrid: ["Top-Left", "Top-Center", "Top-Right", "Center-L", "Center", "Center-R", "Bottom-L", "Bottom-Center", "Bottom-R"]
      }
    };

    let curLang = 'ro';
    
    function toggleLang() {
      curLang = curLang === 'ro' ? 'en' : 'ro';
      document.getElementById('langToggleBtn').innerText = i18n[curLang].langBtn;
      
      // Update DOM Text Elements
      document.querySelector('h1').innerText = i18n[curLang].title;
      document.querySelector('header p').innerText = i18n[curLang].sub;
      document.querySelectorAll('h2')[0].innerHTML = i18n[curLang].imgSec;
      document.querySelectorAll('#uploadUI p')[0].innerText = i18n[curLang].up1;
      document.querySelectorAll('#uploadUI p')[1].innerText = i18n[curLang].up2;
      document.querySelectorAll('button[onclick="setSampleImage(\\'burger\\')"]')[0].innerHTML = i18n[curLang].ex1;
      document.querySelectorAll('button[onclick="setSampleImage(\\'fashion\\')"]')[0].innerHTML = i18n[curLang].ex2;
      
      document.querySelectorAll('h2')[1].innerHTML = i18n[curLang].txtSec;
      document.getElementById('textContent').placeholder = i18n[curLang].ph;
      
      const txtLabels = document.getElementById('textSettings').querySelectorAll('span.text-slate-400');
      txtLabels[0].innerText = i18n[curLang].tPos;
      txtLabels[1].innerText = i18n[curLang].col;
      txtLabels[2].innerText = i18n[curLang].bg;

      document.querySelectorAll('h2')[2].innerHTML = i18n[curLang].fxSec;
      const fxLabels = document.querySelectorAll('.effect-btn span');
      fxLabels[0].innerText = i18n[curLang].fx1;
      fxLabels[1].innerText = i18n[curLang].fx2;
      fxLabels[2].innerText = i18n[curLang].fx3;
      fxLabels[3].innerText = i18n[curLang].fx4;
      fxLabels[4].innerText = i18n[curLang].fx5;

      const intTitle = document.querySelector('input[name="effInt"]').closest('.mt-4').querySelector('span');
      intTitle.innerText = i18n[curLang].intSec;
      
      const intLabels = document.querySelectorAll('input[name="effInt"] + div');
      intLabels[0].innerText = i18n[curLang].int1;
      intLabels[1].innerText = i18n[curLang].int2;
      intLabels[2].innerText = i18n[curLang].int3;

      document.querySelectorAll('h2')[3].innerHTML = i18n[curLang].tSec;
      const tLabels = document.getElementById('timerSettings').querySelectorAll('span.text-slate-400');
      tLabels[0].innerText = i18n[curLang].tDur;
      tLabels[1].innerText = i18n[curLang].tPos;

      document.querySelector('h4.text-amber-500').innerText = i18n[curLang].dscTitle;
      document.querySelector('h4.text-amber-500').nextElementSibling.innerHTML = i18n[curLang].dscText;

      document.getElementById('generateBtn').innerHTML = i18n[curLang].btn;
      document.querySelector('#resultBox p').innerText = i18n[curLang].succ;
      document.getElementById('openBtn').innerHTML = i18n[curLang].btnO;

      // Update active grid names if they were already rendered
      renderPosGrids();
      lucide.createIcons();
    }

    // Wrap renderPosGrids to use translations
    function renderPosGrids() {
      const posMapMap = [
        { id: 'top-left', l: i18n[curLang].posGrid[0] }, { id: 'top-center', l: i18n[curLang].posGrid[1] }, { id: 'top-right', l: i18n[curLang].posGrid[2] },
        { id: 'center-left', l: i18n[curLang].posGrid[3] }, { id: 'center', l: i18n[curLang].posGrid[4] }, { id: 'center-right', l: i18n[curLang].posGrid[5] },
        { id: 'bottom-left', l: i18n[curLang].posGrid[6] }, { id: 'bottom-center', l: i18n[curLang].posGrid[7] }, { id: 'bottom-right', l: i18n[curLang].posGrid[8] }
      ];
      
      const textPosContainer = document.getElementById('textPosContainer');
      const timerPosContainer = document.getElementById('timerPosContainer');
      
      textPosContainer.innerHTML = '';
      timerPosContainer.innerHTML = '';

      posMapMap.forEach(pos => {
        const createBtn = (container, isTimer) => {
          const btn = document.createElement('button');
          const isSelected = isTimer ? selectedTimerPos === pos.id : selectedTextPos === pos.id;
          btn.className = \`text-[10px] font-bold py-1.5 px-1 rounded-md transition-all border \${isSelected ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg' : 'bg-slate-800 border-slate-600 text-slate-400 hover:bg-slate-700'}\`;
          btn.innerText = pos.l;
          btn.onclick = () => {
            if(isTimer) { selectedTimerPos = pos.id; } else { selectedTextPos = pos.id; }
            renderPosGrids(); // Re-render for selection update
          };
          container.appendChild(btn);
        };
        createBtn(textPosContainer, false);
        createBtn(timerPosContainer, true);
      });
    }

`;

html1 = html1.replace('<script>', '<script>\n' + scriptToInject);

// Strip out the old static posMap loop completely
html1 = html1.replace(/\/\/ UI: Populate Position Grids[\s\S]*?timerPosContainer\.appendChild\(btn\);\n    }\);/g, '// Grids are mounted by renderPosGrids inside i18n\n    renderPosGrids();');

// Inject the language payload into the Final Output array
html1 = html1.replace('imgId: imgId,', 'imgId: imgId,\n        lang: curLang,');

fs.writeFileSync(file1, html1);

// Part 2: demo_tv.html
const file2 = './frontend/public/demo_tv.html';
let html2 = fs.readFileSync(file2, 'utf8');

// Inject translations for expired container and happy hour text
html2 = html2.replace("const dataParam = urlParams.get('d');", `const dataParam = urlParams.get('d');
      const tvI18n = {
        ro: {
          err1: "Eroare: Link Invalid", err1p: "Lipsete parametrul \\"d\\".",
          err2: "Poza nu a fost găsită", err2p: "Dacă vrei să urci propria imagine din calculator, Demo-ul rulează corect doar pe acest aparat!<br>Dacă trimiți link-ul unui coleg pe alt browser, acesta nu îi vede imaginea locală.",
          err3: "Eroare Decriptare", err3p: "Link-ul este corupt.",
          exp1: "Timpul Demo a Expirat", exp1p: "Sistemul real rulează nelimitat 24/7 pe Smart TV-urile locației tale, fără pauze.<br><br>Te-ai convins cât de bine arată reclamele noastre? Activează-ți contul!",
          expBtn: "Contactează-ne acum",
          demoExp: "Demo Expiră în",
          hh: "Happy Hour se termină în"
        },
        en: {
          err1: "Error: Invalid Link", err1p: "Parameter \\"d\\" is missing.",
          err2: "Image Not Found", err2p: "If you uploaded your own image from your computer, the Demo only runs correctly on this specific device!<br>If you send the link to a colleague on another browser, they won't see your local image.",
          err3: "Decryption Error", err3p: "The link is corrupted.",
          exp1: "Demo Time Expired", exp1p: "The real system runs unlimited 24/7 on your location's Smart TVs, with no breaks.<br><br>Convinced by how great our displays look? Activate your account!",
          expBtn: "Contact us now",
          demoExp: "Demo Expires in",
          hh: "Happy Hour ends in"
        }
      };`);

// Apply dictionary mapping dynamically based on payload
html2 = html2.replace('const payload = JSON.parse(decodeURIComponent(atob(dataParam)));', `const payload = JSON.parse(decodeURIComponent(atob(dataParam)));
        const lang = payload.lang || 'ro';
        const t = tvI18n[lang];
        
        document.querySelector('#expiredContainer h1').innerText = t.exp1;
        document.querySelector('#expiredContainer p').innerHTML = t.exp1p;
        document.querySelector('#expiredContainer a').innerText = t.expBtn;
        document.querySelector('.text-rose-400.tracking-widest').innerText = t.demoExp;
        document.querySelector('.uppercase.tracking-wider.mb-1.text-center').innerText = t.hh;
`);

html2 = html2.replace("expiredContainer.innerHTML = '<h1 class=\"text-white text-3xl font-bold\">Eroare: Link Invalid</h1><p class=\"text-slate-400\">Lipsete parametrul \"d\".</p>';", 
  "expiredContainer.innerHTML = `<h1 class=\"text-white text-3xl font-bold\">Eroare: Link Invalid</h1><p class=\"text-slate-400\">Lipsete parametrul 'd'.</p>`;");

html2 = html2.replace("expiredContainer.innerHTML = '<h1 class=\"text-white text-3xl font-bold\">Poza nu a fost găsită</h1><p class=\"text-slate-400 mt-2\">Dacă vrei să urci propria imagine din calculator, Demo-ul rulează corect doar pe acest aparat!<br>Dacă trimiți link-ul unui coleg pe alt telefon, acesta nu îi vede imaginea locală.</p>';",
  "expiredContainer.innerHTML = `<h1 class=\"text-white text-3xl font-bold\">${t.err2}</h1><p class=\"text-slate-400 mt-2\">${t.err2p}</p>`;");

html2 = html2.replace("expiredContainer.innerHTML = '<h1 class=\"text-white text-3xl font-bold\">Eroare Decriptare</h1><p class=\"text-slate-400\">Link-ul este corupt.</p>';",
  "expiredContainer.innerHTML = `<h1 class=\"text-white text-3xl font-bold\">Eroare</h1><p class=\"text-slate-400\">Corupt.</p>`;");

fs.writeFileSync(file2, html2);
console.log("Translation success");

