# 🛑 Standarde UI / UX Design (Extrase)

## 1. Regula Rotunjirii Uniforme — macOS Tahoe Design (MANDATORIU)
**NIMIC PĂTRĂȚOS!**
Toate elementele interactive (butoane, inputuri, avatare utilizator/client, bule) trebuie să aibă formă complet rotundă de tip pastilă (PILL - `rounded-full`).

| Element | Clasă obligatorie |
|---|---|
| Butoane acțiune principale | `btn-primary` → `rounded-full` |
| Butoane ghost/secundare | `btn-ghost` → `rounded-full` |
| Butoane icon (mici, pătrate) | `btn-icon` → `rounded-full` |
| Butoane danger (ștergere) | `btn-danger` → `rounded-full` |
| Câmpuri input / dropdowns | `glass-input`, `glass-select` → `rounded-full` |
| Badge-uri Status / Counters | `rounded-full` (exclusiv `px-2.5 py-0.5 rounded-full`) |
| Bule counter Search Bar | `h-6 px-3 rounded-full text-xs` |
| Card-uri / Panouri / Modale | `glass-panel`, `modal-panel` → `rounded-2xl` sau `rounded-[1.5rem]` |
| Avatare Clienți / Utilizatori | `rounded-full` (cerc perfect) |

**Excepția Unică (Avatare de Entitate Majoră - ex. Evenimente):**
Pătrățos DOAR logoul unei entități majore (tip Squircle - `rounded-xl` sau `rounded-2xl` + `border-2 border-[var(--surface)]` / `shadow-sm`), NICIODATĂ cerc perfect!

## 2. Arhitectura Vizuală a Tabelelor de Date
- Tabelele au clase de lățime maximă și spațiere internă: `class="data-table w-full"`.
- **Header Tabel**: Întotdeauna majuscule (`uppercase`), culoare text subtilă (gri deschis), spațiat (`tracking-wider`).
- **Rândurile (tr)**: Efect vizual de hover subtil pentru a indica elementele interactive: `hover:bg-[var(--surface-hover)]`.

## 3. Aerisirea Barelor de Filtrare și Căutare
**Fără compresie vizuală!**
- Barele de filtrare secundare, bara de căutare (Search) și butoanele de acțiune NU trebuie să fie pe același rând cu Titlul Paginii. Ele au propriul rând (ex: `flex-col sm:flex-row`).
- **Fără Fundal Ocupativ:** Box-urile de filtrare / căutare NU se includ în containerul panoului principal de date. Ele trebuie să "plutească" vizual (`transparent`) deasupra datelor pentru a oferi o estetică modernă (tip macOS), fără un fundal solid care să sufoce interfața.

## 4. Bara de Căutare Globală (Design)
- **Input-ul**: Rotunjit complet (`rounded-full`), cu padding la stânga pentru iconiță.
- **Iconița**: Plasată absolut în stânga (`absolute left-3`), cu culoare subtilă.
- **Bula Counter în Search**: Bula care afișează numărul de rezultate din interiorul câmpului de căutare trebuie să fie **INVIZIBILĂ** când câmpul este gol. Aceasta apare natural, doar când utilizatorul începe să tasteze.

## 5. Acțiuni, Butoane și Modale
- **Iconițe Rotunjite**: Toate butoanele de acțiune pe rânduri folosesc forme rotunjite (nu pătrate ascuțite).
- **Lightboxes (Fără Tab-uri noi)**: Atașamentele/pozele/actele se afișează DOAR în ferestre tip Lightbox sau Modale pe aceeași pagină. Fără trimiteri în pagini externe (`target="_blank"`).
- **Fără Dialoguri Native**: Funcțiile native `window.confirm`, `window.prompt`, `window.alert` blochează interfața și distrug imersiunea. Ele trebuie înlocuite cu Modale de design custom (tip `<ConfirmModal>`, `<ErrorModal>`) care respectă rotunjirea temei.

## 6. Fluxul Natural de Paginare
- Containerul tabelului trebuie să aibă un design curat `glass-panel`.
- Paginarea se integrează la baza tabelului, în partea de jos, făcând corp comun cu acesta.
- **Stânga**: Selector de număr de rânduri (ex: "Afișează 10 v").
- **Dreapta**: Controale simple de navigare (ex: "Pagina 1 din 2 [ < ] [ > ]") rotunjite.
