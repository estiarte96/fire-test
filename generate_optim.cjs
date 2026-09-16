const fs = require('fs');
const path = require('path');

const baseDir = path.join(__dirname, 'Preguntes optim');
const ankiDir = path.join(baseDir, 'anki_csv');
const htmlDir = path.join(baseDir, 'html_repas');

fs.mkdirSync(baseDir, { recursive: true });
fs.mkdirSync(ankiDir, { recursive: true });
fs.mkdirSync(htmlDir, { recursive: true });

const questions = JSON.parse(fs.readFileSync(path.join(__dirname, 'public', 'preguntes.json'), 'utf8'));
const themes = [...new Set(questions.map(q => q.theme))].filter(Boolean).sort();

function cleanFilename(name) {
  return name
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/·/g, '')
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function escapeCsvField(field) {
  if (field === null || field === undefined) return '';
  const str = String(field);
  return `"${str.replace(/"/g, '""')}"`;
}

// 1. GENERATE ANKI CSVs PER THEME
const allAnkiRows = [['Front', 'Back', 'Tag', 'ID']];

themes.forEach(theme => {
  const themeQuestions = questions.filter(q => q.theme === theme);
  const themeAnkiRows = [['Front', 'Back', 'Tag', 'ID']];
  const tag = cleanFilename(theme);

  themeQuestions.forEach((q, idx) => {
    let frontHtml = `<div style="text-align: left; font-family: -apple-system, sans-serif;">`;
    frontHtml += `<div style="font-size: 11px; color: #888; margin-bottom: 6px;">[${q.theme}] Pregunta ${idx + 1}</div>`;
    frontHtml += `<div style="font-weight: bold; font-size: 16px; margin-bottom: 14px; line-height: 1.4;">${q.statement}</div>`;
    frontHtml += `<div style="font-size: 14px; line-height: 1.6;">`;
    ['A', 'B', 'C', 'D'].forEach(opt => {
      if (q.options && q.options[opt]) {
        frontHtml += `<div style="padding: 5px 0;"><b>${opt})</b> ${q.options[opt]}</div>`;
      }
    });
    frontHtml += `</div></div>`;

    const correctLetter = q.correct || '';
    const correctText = (q.options && q.options[correctLetter]) ? q.options[correctLetter] : '';
    let backHtml = `<div style="text-align: left; font-family: -apple-system, sans-serif;">`;
    backHtml += `<div style="font-weight: bold; font-size: 16px; color: #10b981; margin-bottom: 8px;">✓ Resposta Correcta: ${correctLetter}</div>`;
    backHtml += `<div style="font-size: 14px; margin-bottom: 12px; padding: 10px; background: rgba(16,185,129,0.1); border-radius: 6px; border-left: 4px solid #10b981;">${correctLetter}) ${correctText}</div>`;
    if (q.explanation && q.explanation !== 'Sense explicació.') {
      backHtml += `<hr style="border: 0; border-top: 1px solid #ddd; margin: 12px 0;">`;
      backHtml += `<div style="font-size: 13px; color: #444; line-height: 1.4;"><b style="color: #111;">Explicació:</b> ${q.explanation}</div>`;
    }
    backHtml += `</div>`;

    const row = [frontHtml, backHtml, tag, String(q.id)];
    themeAnkiRows.push(row);
    allAnkiRows.push(row);
  });

  const csvContent = themeAnkiRows.map(r => r.map(escapeCsvField).join(',')).join('\n');
  fs.writeFileSync(path.join(ankiDir, `${cleanFilename(theme)}.csv`), '\ufeff' + csvContent, 'utf8');
});

// Master Anki CSV (9.025 preguntes)
const masterCsvContent = allAnkiRows.map(r => r.map(escapeCsvField).join(',')).join('\n');
fs.writeFileSync(path.join(ankiDir, `00_TOTES_LES_PREGUNTES_ANKI.csv`), '\ufeff' + masterCsvContent, 'utf8');

// ESTIL VISUAL NET I ELEGANT
const htmlStyles = `
  :root {
    --bg: #f8fafc;
    --card: #ffffff;
    --card-border: #e2e8f0;
    --text: #1e293b;
    --text-muted: #64748b;
    --primary: #2c3e50;
    --primary-hover: #1a252f;
    --accent: #e74c3c;
    --success: #10b981;
    --error: #ef4444;
  }
  * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; }
  body { background: var(--bg); color: var(--text); padding: 30px 20px; line-height: 1.5; font-size: 14px; }
  .container { max-width: 960px; margin: 0 auto; }
  .header { text-align: center; margin-bottom: 24px; padding: 26px; background: var(--card); border-radius: 14px; border: 1px solid var(--card-border); box-shadow: 0 2px 8px rgba(0,0,0,0.03); }
  .header h1 { font-size: 22px; margin-bottom: 8px; color: var(--primary); border-bottom: 2px solid var(--accent); padding-bottom: 8px; display: inline-block; }
  .header p { color: var(--text-muted); font-size: 14px; margin-top: 6px; }
  .controls { display: flex; gap: 10px; justify-content: center; margin-top: 18px; flex-wrap: wrap; }
  .btn { padding: 9px 16px; border-radius: 8px; border: none; font-weight: 600; cursor: pointer; transition: 0.2s; font-size: 13px; text-decoration: none; display: inline-flex; align-items: center; gap: 6px; }
  .btn-primary { background: var(--primary); color: white; }
  .btn-primary:hover { background: var(--primary-hover); }
  .btn-secondary { background: #f1f5f9; color: #334155; border: 1px solid #cbd5e1; }
  .btn-secondary:hover { background: #e2e8f0; }
  .btn-accent { background: var(--accent); color: white; }
  .btn-accent:hover { background: #c0392b; }
  
  .q-card { background: var(--card); border-radius: 12px; padding: 20px; margin-bottom: 18px; border: 1px solid var(--card-border); box-shadow: 0 2px 6px rgba(0,0,0,0.02); page-break-inside: avoid; break-inside: avoid; transition: all 0.2s; }
  .q-meta { display: flex; justify-content: space-between; align-items: center; font-size: 12px; color: var(--text-muted); margin-bottom: 10px; }
  .q-statement { font-size: 15px; font-weight: bold; color: #000; margin-bottom: 14px; line-height: 1.4; }
  .options-list { display: flex; flex-direction: column; gap: 8px; margin-bottom: 14px; }
  .option { padding: 10px 14px; border-radius: 8px; background: #f8fafc; border: 1px solid #e2e8f0; font-size: 14px; color: #333; display: flex; gap: 10px; align-items: flex-start; cursor: pointer; user-select: none; transition: all 0.15s; }
  .option:hover { background: #f1f5f9; border-color: #cbd5e1; }
  .option.correct { background: rgba(16, 185, 129, 0.12) !important; border-color: var(--success) !important; color: #047857 !important; font-weight: 600; }
  .option.wrong { background: rgba(239, 68, 68, 0.12) !important; border-color: var(--error) !important; color: #b91c1c !important; }
  
  .solution-box { margin-top: 12px; padding: 14px; border-radius: 8px; background: #f8fafc; border-left: 4px solid var(--primary); font-size: 13px; display: none; }
  .solution-box.visible { display: block; }
  .explanation-text { color: #475569; margin-top: 6px; line-height: 1.4; }
  .toggle-sol-btn { padding: 5px 12px; border-radius: 6px; background: #f1f5f9; color: var(--primary); border: 1px solid #cbd5e1; font-size: 12px; font-weight: 600; cursor: pointer; }
  .toggle-sol-btn:hover { background: #e2e8f0; }

  /* Secció de Solucions al Final */
  .solutions-section {
    margin-top: 40px;
    padding: 30px 24px;
    background: var(--card);
    border-radius: 14px;
    border: 1px solid var(--card-border);
    box-shadow: 0 2px 10px rgba(0,0,0,0.03);
    page-break-before: always;
    break-before: page;
  }
  .solutions-header {
    text-align: center;
    margin-bottom: 24px;
    padding-bottom: 12px;
    border-bottom: 2px solid var(--accent);
  }
  .solutions-header h2 {
    font-size: 22px;
    color: var(--primary);
    margin-bottom: 6px;
  }
  .solutions-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
    gap: 8px;
    margin-bottom: 30px;
  }
  .sol-grid-item {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    padding: 8px 12px;
    border-radius: 6px;
    font-size: 13px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .sol-grid-item b {
    color: #10b981;
    font-size: 14px;
  }
  .detailed-sol-item {
    padding: 14px 0;
    border-bottom: 1px solid #e2e8f0;
    page-break-inside: avoid;
    break-inside: avoid;
  }
  .detailed-sol-item:last-child {
    border-bottom: none;
  }
  .detailed-sol-q {
    font-weight: bold;
    color: #000;
    margin-bottom: 4px;
    font-size: 14px;
  }
  .detailed-sol-ans {
    color: #333;
    font-size: 13px;
    margin-left: 15px;
  }

  @media print {
    body { background: white !important; color: #222 !important; padding: 0 !important; font-size: 13px !important; margin: 15mm 10mm !important; }
    .header .controls, .toggle-sol-btn, .no-print, .solution-box { display: none !important; }
    .header { border: none !important; box-shadow: none !important; padding: 0 0 15px 0 !important; margin-bottom: 20px !important; }
    .header h1 { font-size: 20px !important; color: #2c3e50 !important; border-bottom: 1px solid #e74c3c !important; }
    .q-card { border: none !important; box-shadow: none !important; margin-bottom: 15px !important; padding: 0 !important; page-break-inside: avoid !important; break-inside: avoid !important; }
    .q-statement { color: #000 !important; font-size: 15px !important; font-weight: bold !important; margin-bottom: 4px !important; }
    .option { border: none !important; background: transparent !important; padding: 2px 0 !important; margin-left: 15px !important; color: #333 !important; }
    .solutions-section { page-break-before: always !important; break-before: page !important; border: none !important; box-shadow: none !important; padding: 0 !important; margin-top: 0 !important; }
    .sol-grid-item { border: 1px solid #cbd5e1 !important; background: #f8fafc !important; color: #000 !important; }
  }
`;

function generateReviewHtml(title, subtitle, qList, backLink = '../index.html') {
  let questionsHtml = '';
  let gridSolutionsHtml = '';
  let detailedSolutionsHtml = '';

  qList.forEach((q, idx) => {
    let optionsHtml = '';
    ['A', 'B', 'C', 'D'].forEach(opt => {
      if (q.options && q.options[opt]) {
        optionsHtml += `
          <div class="option" data-opt="${opt}" onclick="selectOption(${q.id}, '${opt}')">
            <b>${opt})</b> <span>${escapeHtml(q.options[opt])}</span>
          </div>
        `;
      }
    });

    const correctLetter = q.correct || 'A';
    const correctText = (q.options && q.options[correctLetter]) ? q.options[correctLetter] : '';

    // Targeta de pregunta
    questionsHtml += `
      <div class="q-card" id="q-${q.id}" data-correct="${correctLetter}">
        <div class="q-meta">
          <span>Pregunta ${idx + 1} de ${qList.length} • ID: ${q.id}</span>
          <button class="toggle-sol-btn" onclick="toggleSolution(${q.id})">💡 Veure Solució</button>
        </div>
        <div class="q-statement">❓ ${idx + 1}. ${escapeHtml(q.statement)}</div>
        <div class="options-list">
          ${optionsHtml}
        </div>
        <div class="solution-box" id="sol-${q.id}">
          <div style="font-weight: 700; color: #10b981;">✓ Resposta Correcta: ${correctLetter}) ${escapeHtml(correctText)}</div>
          ${q.explanation && q.explanation !== 'Sense explicació.' ? `<div class="explanation-text">&bull; <b>Explicació:</b> ${escapeHtml(q.explanation)}</div>` : ''}
        </div>
      </div>
    `;

    // Taula de resum de respostes al final
    gridSolutionsHtml += `
      <div class="sol-grid-item">
        <span>Pregunta ${idx + 1}</span>
        <b>${correctLetter}</b>
      </div>
    `;

    // Llistat detallat de respostes al final
    let detAnsHtml = `&bull; <b>Resposta (${correctLetter}):</b> ${escapeHtml(correctText)}`;
    if (q.explanation && q.explanation !== 'Sense explicació.') {
      detAnsHtml += `<br>&bull; <b>Explicació:</b> ${escapeHtml(q.explanation)}`;
    }

    detailedSolutionsHtml += `
      <div class="detailed-sol-item">
        <div class="detailed-sol-q">❓ ${idx + 1}. ${escapeHtml(q.statement)}</div>
        <div class="detailed-sol-ans">${detAnsHtml}</div>
      </div>
    `;
  });

  return `<!DOCTYPE html>
<html lang="ca">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)} - Repàs</title>
  <style>
    ${htmlStyles}
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <a href="${backLink}" class="no-print" style="color: var(--primary); text-decoration: none; font-size: 13px; font-weight: 600; display: inline-block; margin-bottom: 12px;">← Tornar a l'Índex</a>
      <div>
        <h1>${escapeHtml(title)}</h1>
      </div>
      <p>${escapeHtml(subtitle)}</p>
      
      <div class="controls no-print">
        <a href="#solucions-final" class="btn btn-primary">🏁 Anar a les Solucions al Final</a>
        <button class="btn btn-secondary" onclick="toggleAllSolutions()">💡 Mostrar/Ocultar Solucions a Cada Targeta</button>
        <button class="btn btn-secondary" onclick="resetAll()">🔄 Reiniciar Respostes</button>
        <button class="btn btn-accent" onclick="window.print()">🖨️ Imprimir / Guardar en PDF</button>
      </div>
    </div>

    <!-- Preguntes -->
    ${questionsHtml}

    <!-- SECCIÓ DE SOLUCIONS AL FINAL DE LA PÀGINA -->
    <div class="solutions-section" id="solucions-final">
      <div class="solutions-header">
        <h2>🏁 Plantilla de Respostes Correctes i Solucions</h2>
        <p style="color: var(--text-muted); font-size: 13px;">${escapeHtml(title)} (${qList.length} preguntes)</p>
      </div>

      <h3 style="font-size: 16px; margin-bottom: 12px; color: var(--primary);">📋 Taula ràpida de respostes:</h3>
      <div class="solutions-grid">
        ${gridSolutionsHtml}
      </div>

      <h3 style="font-size: 16px; margin-bottom: 14px; margin-top: 24px; color: var(--primary); border-top: 1px solid var(--card-border); padding-top: 20px;">📖 Solucions detallades i explicacions:</h3>
      <div class="detailed-solutions-list">
        ${detailedSolutionsHtml}
      </div>
    </div>
  </div>

  <script>
    let allVisible = false;

    function selectOption(id, opt) {
      const card = document.getElementById('q-' + id);
      const correct = card.getAttribute('data-correct');
      const box = document.getElementById('sol-' + id);
      
      card.querySelectorAll('.option').forEach(o => {
        o.classList.remove('correct', 'wrong');
      });

      const selected = card.querySelector('.option[data-opt="' + opt + '"]');
      if (opt === correct) {
        if (selected) selected.classList.add('correct');
      } else {
        if (selected) selected.classList.add('wrong');
        const correctOpt = card.querySelector('.option[data-opt="' + correct + '"]');
        if (correctOpt) correctOpt.classList.add('correct');
      }
      box.classList.add('visible');
    }

    function toggleSolution(id) {
      const card = document.getElementById('q-' + id);
      const box = document.getElementById('sol-' + id);
      const isVis = box.classList.toggle('visible');
      const correct = card.getAttribute('data-correct');
      const correctOpt = card.querySelector('.option[data-opt="' + correct + '"]');
      if (correctOpt) {
        if (isVis) correctOpt.classList.add('correct');
        else if (!allVisible) correctOpt.classList.remove('correct');
      }
    }

    function toggleAllSolutions() {
      allVisible = !allVisible;
      document.querySelectorAll('.solution-box').forEach(b => {
        if (allVisible) b.classList.add('visible');
        else b.classList.remove('visible');
      });
      document.querySelectorAll('.q-card').forEach(c => {
        const correct = c.getAttribute('data-correct');
        const opt = c.querySelector('.option[data-opt="' + correct + '"]');
        if (opt) {
          if (allVisible) opt.classList.add('correct');
          else opt.classList.remove('correct');
        }
      });
    }

    function resetAll() {
      allVisible = false;
      document.querySelectorAll('.solution-box').forEach(b => b.classList.remove('visible'));
      document.querySelectorAll('.option').forEach(o => o.classList.remove('correct', 'wrong'));
    }
  </script>
</body>
</html>`;
}

// 2. GENERATE THEME HTML REVIEW PAGES (T01 to T34)
themes.forEach(theme => {
  const themeQuestions = questions.filter(q => q.theme === theme);
  const pageHtml = generateReviewHtml(theme, `${themeQuestions.length} preguntes per estudiar i practicar.`, themeQuestions);
  fs.writeFileSync(path.join(htmlDir, `${cleanFilename(theme)}.html`), pageHtml, 'utf8');
});

// 3. GENERATE MASTER INTERACTIVE INDEX (index.html & Repas_Global.html)
let themeCardsNavHtml = '';
themes.forEach(theme => {
  const count = questions.filter(q => q.theme === theme).length;
  const fileName = `${cleanFilename(theme)}.html`;
  const csvName = `${cleanFilename(theme)}.csv`;
  themeCardsNavHtml += `
    <div class="theme-nav-card" style="background: var(--card); border: 1px solid var(--card-border); border-radius: 12px; padding: 18px; box-shadow: 0 2px 6px rgba(0,0,0,0.02); display: flex; flex-direction: column; justify-content: space-between; gap: 12px;">
      <div>
        <div style="font-size: 11px; color: var(--accent); font-weight: 700; text-transform: uppercase; margin-bottom: 4px;">Tema Oficial</div>
        <h3 style="font-size: 16px; margin-bottom: 6px; line-height: 1.3; color: var(--primary);">${escapeHtml(theme)}</h3>
        <p style="font-size: 13px; color: var(--text-muted);">${count} preguntes</p>
      </div>
      <div style="display: flex; gap: 8px; flex-wrap: wrap;">
        <a href="html_repas/${fileName}" class="btn btn-primary" style="flex: 1; justify-content: center; font-size: 12px; padding: 8px 12px;">Repassar HTML</a>
        <a href="anki_csv/${csvName}" download class="btn btn-secondary" style="font-size: 12px; padding: 8px 12px;" title="Descarregar CSV per a Anki">📦 Anki</a>
      </div>
    </div>
  `;
});

const masterIndexHtml = `<!DOCTYPE html>
<html lang="ca">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Preguntes Òptim - Oposicions Bombers</title>
  <style>
    ${htmlStyles}
    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px; margin-top: 24px; }
  </style>
</head>
<body>
  <div class="container" style="max-width: 1100px;">
    <div class="header">
      <h1>🔥 Preguntes Òptim - Oposicions Bombers</h1>
      <p>Total de <b>${questions.length}</b> preguntes distribuïdes en els <b>${themes.length}</b> temes oficials.</p>
      
      <div class="controls" style="margin-top: 20px;">
        <a href="anki_csv/00_TOTES_LES_PREGUNTES_ANKI.csv" download class="btn btn-accent" style="font-size: 13px; padding: 12px 20px;">
          📥 Descarregar TOTES per a Anki (Master CSV - ${questions.length} preguntes)
        </a>
      </div>
    </div>

    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; flex-wrap: wrap; gap: 12px;">
      <h2 style="font-size: 18px; color: var(--primary);">Temari Oficial (${themes.length} Temes)</h2>
      <input type="text" id="filterInput" placeholder="Cercar tema..." onkeyup="filterThemes()" style="padding: 10px 16px; border-radius: 8px; background: var(--card); border: 1px solid var(--card-border); color: #222; font-size: 14px; width: 260px; outline: none;">
    </div>

    <div class="grid" id="themesGrid">
      ${themeCardsNavHtml}
    </div>
  </div>

  <script>
    function filterThemes() {
      const q = document.getElementById('filterInput').value.toLowerCase();
      document.querySelectorAll('.theme-nav-card').forEach(card => {
        const text = card.innerText.toLowerCase();
        card.style.display = text.includes(q) ? 'flex' : 'none';
      });
    }
  </script>
</body>
</html>`;

fs.writeFileSync(path.join(baseDir, 'index.html'), masterIndexHtml, 'utf8');
fs.writeFileSync(path.join(baseDir, 'Repas_Global.html'), masterIndexHtml, 'utf8');

console.log('Successfully generated all clean Anki CSVs and interactive HTML review pages with end solutions!');
