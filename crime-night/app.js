// ESN Crime Night: hash-routed single page. Views are template strings; events are delegated on #view.
import { CASES } from './data/cases.js';
import { SUSPECTS } from './data/suspects.js';
import { t, tr, setLang, getLang, detectLang } from './lib/i18n.js';
import { normaliseName } from './lib/assign.js';
import { lookupCode } from './lib/codes.js';
import * as S from './lib/state.js';

const LANG_KEY = 'crimenight.lang';
const PLACEHOLDER = 'img/suspects/placeholder.svg';
const TABS = [['clues', 'tab_clues'], ['cases', 'tab_cases'], ['suspects', 'tab_suspects'], ['rules', 'tab_rules']];
const TILTS = [-3, 2, -1, 3, -2, 1, -3, 2, -1];

const storage = S.safeStorage();
let state = S.load(storage);
let picking = [];
let lastHash = null;
let toastTimer;

const $ = id => document.getElementById(id);
const main = $('view');
const nav = $('tabs');
const langSel = $('lang');
const toastEl = $('toast');

const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const pad = n => String(n).padStart(2, '0');
const caseById = id => CASES.find(c => c.id === id);
const photo = name => SUSPECTS.find(s => s.name === name)?.photo || PLACEHOLDER;
const persist = () => S.save(storage, state);
const culpritsLabel = c => t(c.culprits === 1 ? 'culprits_1' : 'culprits_2');

/* ---------- language ---------- */

function applyLang(l) {
  setLang(l);
  document.documentElement.lang = getLang();
  langSel.value = getLang();
  $('brand').textContent = t('brand');
  $('lang-label').textContent = t('lang_label');
}

function initLang() {
  let saved = null;
  try { saved = storage.getItem(LANG_KEY); } catch { /* ignore */ }
  applyLang(state?.lang || saved || detectLang(navigator.language));
}

/* ---------- routing ---------- */

function route() {
  if (!state) return { view: 'identify' };
  const [v, a, b] = location.hash.replace(/^#\/?/, '').split('/');
  const id = Number(a);
  if (v === 'case' && caseById(id)) {
    if (b === 'accuse') return { view: 'accuse', id, tab: 'cases' };
    if (b === 'verdict' && state.verdict[id]) return { view: 'verdict', id };
    return { view: 'case', id, tab: 'cases' };
  }
  if (v === 'clues' || v === 'cases' || v === 'suspects') return { view: v, tab: v };
  return { view: 'rules', tab: 'rules' }; // players land on the rules first
}

function go(hash) {
  if (location.hash === hash) render();
  else location.hash = hash;
}

function onHashChange() {
  const r = route();
  if (r.view === 'accuse') {
    const { cleared } = S.crossed(state, caseById(r.id));
    picking = (state.verdict[r.id]?.accused || []).filter(n => !cleared.has(n));
  }
  render();
}

/* ---------- feedback ---------- */

function toast(msg) {
  toastEl.textContent = msg;
  toastEl.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove('show'), 2400);
}

function shake(el) {
  el.classList.remove('shake');
  void el.offsetWidth;
  el.classList.add('shake');
}

/* ---------- partials ---------- */

// A missing or misnamed photo falls back to the silhouette instead of a broken-image icon.
const FALLBACK = `onerror="this.onerror=null;this.src='${PLACEHOLDER}'"`;

// .photo wraps every suspect picture so CSS can lay the worn-archive overlay on top.
function mugImg(name, alt = '') {
  return `<span class="photo"><img src="${photo(name)}" alt="${alt}" loading="lazy" width="120" height="160" ${FALLBACK}></span>`;
}

function missingPoster(m) {
  return `<figure class="missing">
    <span class="photo"><img src="${m.photo}" alt="${esc(m.name)}" loading="lazy" width="120" height="160" ${FALLBACK}></span>
    <figcaption><b>${t('missing_label')}</b>${esc(m.name)}</figcaption>
  </figure>`;
}

function clueSlip(c, clue, withCode) {
  return `<article class="slip" id="slip-${c.id}-${clue.letter}">
    <header><span>${t('case_n', { n: pad(c.id) })} · ${esc(tr(c.short))}</span><span class="badge">${clue.letter}</span></header>
    <p><strong class="cleared">${t('cleared')} ${clue.clears.join(' + ')}.</strong> ${esc(tr(clue.text))}</p>
    ${withCode ? `<div class="code"><span>${t('your_code')}</span><b>${esc(clue.code)}</b><small>${t('code_hint')}</small></div>` : ''}
  </article>`;
}

function codeForm() {
  return `<form class="code-form" data-form="code" autocomplete="off">
    <label for="code-input">${t('code_label')}</label>
    <div class="row">
      <input id="code-input" name="code" autocapitalize="characters" autocorrect="off" spellcheck="false" maxlength="30" placeholder="${t('code_placeholder')}">
      <button type="submit">${t('code_submit')}</button>
    </div>
  </form>`;
}

/* ---------- views ---------- */

const VIEWS = {
  identify() {
    return `<section class="folder identify">
      <div class="clip"></div><div class="stamp">${t('stamp_topsecret')}</div>
      <h1>ESN CRIME NIGHT</h1>
      <p class="tagline">${t('id_tagline')}</p>
      <h2>${t('id_title')}</h2>
      <form id="identify-form" novalidate>
        <label>${t('id_name')}<input name="name" autocomplete="given-name" maxlength="40" required></label>
        <p class="error" id="id-error" hidden>${t('id_err_empty')}</p>
        <button class="btn-primary" type="submit">${t('id_open')}</button>
      </form>
    </section>
    <p class="credit">${t('credit')} · ESN Bologna</p>`;
  },

  clues() {
    const own = S.ownClues(state);
    return `<section class="folder">
      <div class="clip"></div><div class="stamp">${t('stamp_topsecret')}</div><div class="print"></div>
      <h1>${t('clues_title')}</h1>
      <p class="agent">${t('clues_detective', { name: `<u>${esc(state.name)}</u>` })} · ${t('clues_count')}</p>
      <p class="file-ref">REF: <span class="redact">XXXXXXXX</span> · ESN/BO</p>
      ${CASES.map(c => clueSlip(c, c.clues.find(x => x.letter === own[c.id]), true)).join('')}
    </section>`;
  },

  cases() {
    return `<h1 class="page-title">${t('cases_title')}</h1>
      ${codeForm()}
      <ul class="case-list">${CASES.map(c => {
        const accused = !!state.verdict[c.id];
        return `<li><a class="folder case-card" href="#/case/${c.id}">
          <span class="case-no">${t('case_n', { n: pad(c.id) })}</span>
          <h2>${esc(tr(c.title))}</h2>
          <p>${culpritsLabel(c)} · ${t('evidence_count', { n: state.unlocked[c.id].length })}</p>
          <span class="stamp ${accused ? '' : 'faded'}">${t(accused ? 'stamp_accused' : 'stamp_unsolved')}</span>
        </a></li>`;
      }).join('')}</ul>`;
  },

  case({ id }) {
    const c = caseById(id);
    const own = S.ownClues(state)[id];
    const got = state.unlocked[id];
    const { cleared, manual } = S.crossed(state, c);
    const accused = !!state.verdict[id];
    return `<a class="back" href="#/cases">${t('back_cases')}</a>
    <section class="folder">
      <div class="clip"></div><div class="stamp">${t(accused ? 'stamp_accused' : 'stamp_unsolved')}</div>
      <h1>${t('case_n', { n: pad(id) })}</h1>
      <p class="agent"><b>${esc(tr(c.title))}</b> · ${culpritsLabel(c)}</p>
      <h3 class="lbl">${t('the_crime')}</h3>
      ${c.missing ? missingPoster(c.missing) : ''}
      <p class="crime">${esc(tr(c.crime))}</p>
      <h3 class="lbl">${t('evidence')}</h3>
      <div class="ev">${'ABCDE'.split('').map(L => `<button class="ev-box ${got.includes(L) ? 'got' : ''} ${L === own ? 'mine' : ''}" data-action="ev" data-letter="${L}" aria-pressed="${got.includes(L)}">${L}</button>`).join('')}</div>
      ${c.clues.filter(x => got.includes(x.letter)).map(x => clueSlip(c, x, false)).join('')}
      ${codeForm()}
      <h3 class="lbl">${t('suspects_tap')}</h3>
      <div class="mugs">${SUSPECTS.map(s => {
        const by = cleared.get(s.name);
        const x = !!by || manual.has(s.name);
        return `<button class="mug ${x ? 'x' : ''} ${by ? 'by-ev' : ''}" data-action="cross" data-name="${s.name}" aria-pressed="${x}">
          ${mugImg(s.name)}<span>${s.name}</span>${by ? `<i class="mini-stamp">${t('cleared_stamp')}</i>` : ''}
        </button>`;
      }).join('')}</div>
      <a class="btn-primary" href="#/case/${id}/${accused ? 'verdict' : 'accuse'}">${t(accused ? 'verdict_view' : 'accuse_btn')}</a>
      <p class="small center">${t('verdict_show')}</p>
    </section>`;
  },

  accuse({ id }) {
    const c = caseById(id);
    const { cleared } = S.crossed(state, c);
    return `<a class="back" href="#/case/${id}">${t('back_case')}</a>
    <section class="folder">
      <div class="clip"></div>
      <h1>${t('accuse_title')}</h1>
      <p class="agent"><b>${esc(tr(c.title))}</b> · ${t(c.culprits === 1 ? 'accuse_pick_1' : 'accuse_pick_2')}</p>
      <div class="mugs">${SUSPECTS.map(s => {
        const out = cleared.has(s.name);
        const sel = picking.includes(s.name);
        return `<button class="mug ${sel ? 'picked' : ''} ${out ? 'x' : ''}" data-action="pick" data-name="${s.name}" aria-pressed="${sel}" ${out ? 'disabled' : ''}>
          ${mugImg(s.name)}<span>${s.name}</span>
        </button>`;
      }).join('')}</div>
      <button class="btn-primary" data-action="lock" ${picking.length === c.culprits ? '' : 'disabled'}>${t('accuse_confirm')}</button>
      <a class="link center" href="#/case/${id}">${t('accuse_cancel')}</a>
    </section>`;
  },

  verdict({ id }) {
    const c = caseById(id);
    const v = state.verdict[id];
    const time = new Date(v.at).toLocaleTimeString(getLang(), { hour: '2-digit', minute: '2-digit' });
    return `<section class="verdict-card">
      <p class="brand-line">ESN CRIME NIGHT · ${t('case_n', { n: pad(id) })}</p>
      <h1>${t('verdict_title')}</h1>
      <h2>${esc(tr(c.title))}</h2>
      <p class="lbl">${t('verdict_accused')}</p>
      <div class="accused">${v.accused.map(n => `<figure>${mugImg(n)}<figcaption>${esc(n)}</figcaption></figure>`).join('')}</div>
      <dl>
        <dt>${t('verdict_detective')}</dt><dd>${esc(state.name)}</dd>
        <dt>${t('verdict_time')}</dt><dd>${time}</dd>
      </dl>
      <div class="stamp">${t('verdict_evidence', { n: state.unlocked[id].length })}</div>
      <p class="show">${t('verdict_show')}</p>
      <div class="row">
        <a class="btn-ghost" href="#/case/${id}">${t('back_case')}</a>
        <a class="btn-ghost" href="#/case/${id}/accuse">${t('verdict_change')}</a>
      </div>
    </section>`;
  },

  suspects() {
    return `<h1 class="page-title">${t('suspects_title')}</h1>
      <p class="sub">${t('suspects_sub')}</p>
      <div class="polaroids">${SUSPECTS.map((s, i) => `<figure class="polaroid" style="--tilt:${TILTS[i % TILTS.length]}deg">
        ${mugImg(s.name, s.name)}
        <figcaption><b>${s.name}</b><span>${esc(tr(s.caption))}</span></figcaption>
      </figure>`).join('')}</div>`;
  },

  rules() {
    return `<section class="folder">
      <div class="clip"></div>
      <h1>${t('rules_title')}</h1>
      <ol class="rules">${[1, 2, 3, 4, 5].map(i => `<li>${t('rules_' + i)}</li>`).join('')}</ol>
      <p>${t('rules_team')}</p>
      <p class="mission">${t('rules_mission')}</p>
      <p>${t('rules_nophone')}</p>
      <div class="stamp static">${t('rules_fiction')}</div>
      <a class="btn-primary" href="#/clues">${t('rules_cta')}</a>
    </section>
    <p class="credit">${t('credit')} · ESN Bologna</p>`;
  },
};

function render() {
  const r = route();
  document.body.dataset.view = r.view;
  nav.hidden = !r.tab;
  nav.innerHTML = r.tab
    ? TABS.map(([id, key], i) => `<a href="#/${id}" class="tab ${r.tab === id ? 'on' : ''}" ${r.tab === id ? 'aria-current="page"' : ''}><small>0${i + 1}</small>${t(key)}</a>`).join('')
    : '';
  main.innerHTML = VIEWS[r.view](r);
  if (location.hash !== lastHash) {
    lastHash = location.hash;
    window.scrollTo(0, 0);
  }
}

/* ---------- events ---------- */

main.addEventListener('submit', e => {
  e.preventDefault();
  const form = e.target;

  if (form.id === 'identify-form') {
    const data = new FormData(form);
    const name = String(data.get('name') || '');
    if (!normaliseName(name)) {
      $('id-error').hidden = false;
      shake(form.querySelector('input[name="name"]'));
      return;
    }
    state = S.create(name, getLang());
    persist();
    go('#/rules');
    return;
  }

  if (form.dataset.form === 'code') {
    const input = form.querySelector('input');
    const hit = lookupCode(input.value);
    if (!hit) {
      shake(input);
      toast(t('code_bad'));
      return;
    }
    const result = S.unlock(state, hit.caseId, hit.letter);
    persist();
    toast(result === 'known' ? t('code_known') : t('code_ok', { letter: hit.letter, n: pad(hit.caseId) }));
    render();
  }
});

main.addEventListener('click', e => {
  const el = e.target.closest('[data-action]');
  if (!el) return;
  const r = route();
  const name = el.dataset.name;

  switch (el.dataset.action) {
    case 'ev': {
      const L = el.dataset.letter;
      if (state.unlocked[r.id].includes(L)) {
        $(`slip-${r.id}-${L}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else {
        toast(t('evidence_locked', { letter: L }));
      }
      break;
    }

    case 'cross': {
      const { cleared } = S.crossed(state, caseById(r.id));
      if (cleared.has(name)) {
        toast(t('cleared_by', { letter: cleared.get(name) }));
        break;
      }
      S.toggleManual(state, r.id, name);
      persist();
      render();
      break;
    }

    case 'pick': {
      const max = caseById(r.id).culprits;
      if (picking.includes(name)) picking = picking.filter(n => n !== name);
      else picking = [...picking, name].slice(-max); // picking a 3rd drops the oldest
      render();
      break;
    }

    case 'lock':
      if (picking.length !== caseById(r.id).culprits) break;
      S.setVerdict(state, r.id, picking);
      persist();
      go(`#/case/${r.id}/verdict`);
      break;
  }
});

langSel.addEventListener('change', () => {
  applyLang(langSel.value);
  if (state) {
    state.lang = getLang();
    persist();
  } else {
    try { storage.setItem(LANG_KEY, getLang()); } catch { /* ignore */ }
  }
  render();
});

window.addEventListener('hashchange', onHashChange);

/* ---------- loader ---------- */

function runLoader() {
  const el = $('loader');
  let seen = false;
  try { seen = sessionStorage.getItem('crimenight.loader') === '1'; } catch { /* ignore */ }
  if (seen || matchMedia('(prefers-reduced-motion: reduce)').matches) {
    el.remove();
    return;
  }
  try { sessionStorage.setItem('crimenight.loader', '1'); } catch { /* ignore */ }

  const text = t('loader_typing');
  const out = el.querySelector('.typed');
  el.querySelector('.loader-stamp').textContent = t('stamp_topsecret');
  let i = 0;
  let finished = false;
  const finish = () => {
    if (finished) return;
    finished = true;
    clearInterval(timer);
    el.classList.add('out');
    setTimeout(() => el.remove(), 350);
  };
  const timer = setInterval(() => {
    out.textContent = text.slice(0, ++i);
    if (i >= text.length) {
      clearInterval(timer);
      el.classList.add('stamped');
      setTimeout(finish, 650);
    }
  }, 40);
  el.addEventListener('click', finish);
}

/* ---------- boot ---------- */

initLang();
onHashChange();
runLoader();
