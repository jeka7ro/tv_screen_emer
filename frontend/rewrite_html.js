const fs = require('fs');

const brainDir = '/Users/eugeniucazmal/.gemini/antigravity/brain/0a4c4941-fa8a-4cf0-9ceb-63f5a116cc1f';
const logoBase64 = fs.readFileSync(brainDir + '/media__1772022033239.png').toString('base64');
const backofficeBase64 = fs.readFileSync(brainDir + '/media__1772022047420.png').toString('base64');

const html = `<!DOCTYPE html>
<html lang="ro">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Prezentare Screen Media</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        @page { size: A4; margin: 0; }
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 0; background-color: #f8fafc; color: #1e293b; }
        .page { width: 210mm; height: 297mm; padding: 20mm; margin: 0 auto; background: white; box-sizing: border-box; position: relative; overflow: hidden; page-break-after: always; }
        .bg-pattern { position: absolute; top: 0; left: 0; width: 100%; height: 100%; background-image: radial-gradient(#cbd5e1 1px, transparent 1px); background-size: 20px 20px; opacity: 0.3; z-index: 0; pointer-events: none; }
        .content { position: relative; z-index: 1; height: 100%; display: flex; flex-direction: column; }
        .accent-bar { width: 60px; height: 6px; background: linear-gradient(90deg, #3b82f6, #ec4899); border-radius: 3px; margin-bottom: 24px; }
        .feature-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; }
        .feature-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; }
        .icon-box { width: 48px; height: 48px; background: #eff6ff; border-radius: 12px; display: flex; align-items: center; justify-content: center; color: #3b82f6; margin-bottom: 16px; }
        .footer { position: absolute; bottom: 20mm; left: 20mm; right: 20mm; display: flex; justify-content: space-between; align-items: center; padding-top: 15px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b; }
        .image-container { border-radius: 12px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1); border: 1px solid #e2e8f0; background: #fff; display: flex; justify-content: center; align-items: center; }
        .image-container img { width: 100%; height: 100%; object-fit: contain; }
    </style>
</head>
<body>

    <!-- PAGE 1: Intro & Role -->
    <div class="page">
        <div class="bg-pattern"></div>
        <div class="content">
            <div class="flex justify-between items-start mb-10">
                <div>
                    <h1 class="text-4xl font-black tracking-tight text-slate-900 mb-2">SCREEN MEDIA</h1>
                    <h2 class="text-xl text-slate-500 font-medium tracking-wide uppercase">Digital Signage System</h2>
                </div>
                <!-- User Uploaded Logo -->
                <div class="h-20 flex items-center justify-end">
                    <img src="data:image/png;base64,${logoBase64}" style="height: 100%; object-fit: contain;" />
                </div>
            </div>

            <div class="accent-bar"></div>

            <p class="text-xl text-slate-700 leading-relaxed mb-8 font-medium">
                Scopul principal: Controlați de la distanță sute de ecrane TV din locațiile dumneavoastră, dintr-un singur panou extrem de simplu și intuitiv. Schimbați meniuri, prețuri și oferte instantaneu pe toate ecranele, oriunde s-ar afla fizic. Fără stick-uri USB, fără deplasări.
            </p>

            <!-- Main Backoffice Image -->
            <div class="image-container mb-8 h-72 relative bg-slate-50 p-2">
                <img src="data:image/png;base64,${backofficeBase64}" alt="Screen Media Backoffice" class="rounded shadow-sm" />
                <div class="absolute bottom-4 left-4 text-xs font-mono text-white bg-slate-900/70 px-2 py-1 rounded backdrop-blur-sm">Interfață Backoffice Intuitivă</div>
            </div>

            <h3 class="text-2xl font-bold text-slate-900 mb-6">Ce știe să facă? Foarte simplu:</h3>
            
            <div class="feature-grid">
                <div class="feature-box">
                    <div class="icon-box">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
                    </div>
                    <h4 class="text-lg font-bold text-slate-800 mb-2">Actualizări în câteva secunde</h4>
                    <p class="text-sm text-slate-600 leading-relaxed">Ai modificat un preț din platformă? Va apărea instant pe televizorul din locație, fără delay sau refresh-uri necesare (Live Sync).</p>
                </div>
                <div class="feature-box">
                    <div class="icon-box">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                     </div>
                    <h4 class="text-lg font-bold text-slate-800 mb-2">Mai Multe Zone pe Același TV</h4>
                    <p class="text-sm text-slate-600 leading-relaxed">Împarte ecranul: rulează un videoclip promoțional HD sus, iar în partea de jos o bandă glisantă (ticker) cu mesaje și oferte introduse din tastatură.</p>
                </div>
            </div>

            <div class="footer">
                <div>SCREEN MEDIA - Prezentare Generală</div>
                <div>Pagina 1 din 2</div>
            </div>
        </div>
    </div>

    <!-- PAGE 2: Digital Menus & Video Walls -->
    <div class="page">
        <div class="bg-pattern"></div>
        <div class="content">
            <h2 class="text-3xl font-black tracking-tight text-slate-900 mb-8">Funcții Hi-Tech pe Înțelesul Tuturor</h2>
            <div class="accent-bar"></div>

            <!-- Digital Menu Feature -->
            <div class="mb-8">
                <div class="flex items-center gap-4 mb-4">
                    <div class="w-10 h-10 bg-rose-100 text-rose-600 rounded-lg flex items-center justify-center">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2-2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path></svg>
                    </div>
                    <h3 class="text-2xl font-bold text-slate-800">Meniuri Digitale Clic-and-Go</h3>
                </div>
                <div class="flex gap-6 items-start">
                    <div class="flex-1">
                        <p class="text-sm text-slate-600 leading-relaxed mb-4 text-justify">
                            Platforma taie costurile de grafică. Construiți meniuri superbe direct în platformă. Scrieți textul, prețul și alegeți un fundal dinamic gata pregătit. Lista produselor va arăta profesionist și e mereu actuzalizată.
                        </p>
                    </div>
                </div>
            </div>

            <!-- Video Wall / Synchronization Feature -->
            <div class="mb-8">
                <div class="flex items-center gap-4 mb-4">
                    <div class="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path></svg>
                    </div>
                    <h3 class="text-2xl font-bold text-slate-800">Afișaje Gigant (Cascadă & Video Wall)</h3>
                </div>
                <div class="flex gap-6 items-start">
                    <div class="flex-1">
                        <p class="text-sm text-slate-600 leading-relaxed mb-4 text-justify">
                            Lipiți oricâte televizoare normale unul lângă altul pentru un efect fenomenal! Nu necesită hardware scump, ecranele „comunică” între ele:
                        </p>
                        <ul class="text-sm text-slate-600 space-y-2">
                            <li class="flex items-center gap-2"><span class="text-indigo-500 font-bold">1. Cascadă:</span> O reclamă curge fluid de pe un televizor pe următorul dintr-un rând lung (efect de fast-food premium).</li>
                            <li class="flex items-center gap-2"><span class="text-indigo-500 font-bold">2. Video Wall:</span> Pui 4 ecrane pătrat (2x2) și sistemul decupează o singură imagine 4K pe toate 4 odată!</li>
                        </ul>
                    </div>
                </div>
            </div>

            <div class="mb-6">
                <div class="flex items-center gap-4 mb-4">
                    <div class="w-10 h-10 bg-amber-100 text-amber-600 rounded-lg flex items-center justify-center">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    </div>
                    <h3 class="text-2xl font-bold text-slate-800">Automatizare și Siguranță 100%</h3>
                </div>
                <ul class="text-sm text-slate-600 space-y-3">
                    <li class="flex items-start gap-2">
                        <span class="text-amber-500 font-bold mt-0.5">✓</span>
                        <div><strong>Programare în Avans:</strong> Programează dintr-un calendar vizual ca „Meniul de Mic-Dejun” să pornească automat zilnic la ora 07:00. Uită de ecrane manuale.</div>
                    </li>
                    <li class="flex items-start gap-2">
                        <span class="text-amber-500 font-bold mt-0.5">✓</span>
                        <div><strong>Televizoarele NU se sting:</strong> Aplicația integrează straturi speciale care împiedică Smart TV-urile să intre în Standby de la sine.</div>
                    </li>
                    <li class="flex items-start gap-2">
                        <span class="text-amber-500 font-bold mt-0.5">✓</span>
                        <div><strong>Funcționează fară Internet:</strong> Chiar dacă localul rămâne fără semnal net, ecranul nu va cădea. Continuă să redea meniul salvat local neîntrerupt.</div>
                    </li>
                </ul>
            </div>

            <div class="footer">
                <div>SCREEN MEDIA - Prezentare Generală</div>
                <div>Pagina 2 din 2</div>
            </div>
        </div>
    </div>
</body>
</html>`;

fs.writeFileSync('presentation.html', html);
console.log('HTML rewritten completely for Screen Media');
