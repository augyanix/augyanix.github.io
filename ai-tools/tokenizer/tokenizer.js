// Token Lab: a small BPE (Byte Pair Encoding) tokenizer that trains in your browser.
// No downloads, no network calls. Everything here is plain JavaScript.
//
// How it is built (same idea as real tokenizers, smaller on purpose):
//   1. Pre-split text into words, keeping the space in front of each word (like GPT tokenizers).
//   2. Start with single characters as the vocabulary.
//   3. Repeatedly count every neighbouring pair and merge the most frequent one into a new token.
//   4. To tokenize new text, apply the learned merges in the same order (rank order).
// Real models start from the 256 bytes instead of characters; we start from characters so
// Telugu letters stay readable on screen. The page explains this difference.

"use strict";

// ---------- Training corpus (mostly English + Teluglish, very little Telugu script, on purpose) ----------
const CORPUS = [
  "AI is learning every day. The model reads the text, the model writes the answer, and the model learns from the data.",
  "I am learning AI every day. Learning is the best thing. I am reading, I am writing, I am thinking.",
  "The tokenizer cuts the text into tokens. Every token gets a number. The number goes into the model.",
  "Nenu prathi roju AI nerchukuntunnanu. Nuvvu kuda nerchuko. Memu andharam nerchukuntunnamu.",
  "Nenu chesthunna, nuvvu chesthunnava, memu chesthunnamu, vallu chesthunnaru, aame chesthundhi.",
  "AI ante Artificial Intelligence. Model ante oka pedda math function. Token ante text lo chinna mukka.",
  "Prathi token ki oka number untundhi. Aa number ne model chaduvuthundhi, words kaadhu.",
  "ChatGPT, Claude, Gemini anni tokens tho ne pani chesthaayi. Context window kuda tokens lo ne kolustharu.",
  "Interview ki prepare avvali ante prathi roju konchem nerchukovaali. Resume lo AI skills raayaali.",
  "Gold rate, petrol rate, cricket score, movie review, exam result: anni AI tho adagochu.",
  "The price of a model is counted in tokens. More tokens means more cost and more time.",
  "Students and employees use AI for notes, emails, code, resumes and interview practice.",
  "నేను AI నేర్చుకుంటున్నాను.",
  "the the the and and and ing ing ing tion tion er er ed ed ly ly",
  "chesthunna chesthunnava chesthunnamu chesthunnaru chesthundhi chesaanu chesindhi chesaaru",
  "nerchukuntunnanu nerchukuntunnamu nerchuko nerchukovaali nerchukunnaanu",
  "undhi untundhi unnaayi kaadhu kaavaali avvali avthundhi vasthundhi",
];
const CORPUS_TEXT = CORPUS.join("\n");
const MAX_MERGES = 400;

// ---------- Core BPE ----------
// Pre-tokenizer: optional leading space + a run of non-space characters, or a run of whitespace.
const PRE = /\s?[^\s]+|\s+/gu;
const preSplit = (text) => text.match(PRE) || [];
// Split into user-visible characters. Array.from splits by code point; Telugu vowel signs are their own
// code points, which is exactly what a character-level start looks like.
const chars = (word) => Array.from(word);

function train(text, maxMerges) {
  // word -> frequency
  const freq = new Map();
  for (const w of preSplit(text)) freq.set(w, (freq.get(w) || 0) + 1);
  const words = [...freq].map(([w, n]) => ({ syms: chars(w), n }));
  const base = [...new Set(words.flatMap((w) => w.syms))].sort();
  const merges = []; // [a, b]
  const history = []; // pair counts before each merge, for the trainer view
  for (let i = 0; i < maxMerges; i++) {
    const counts = countPairs(words);
    if (!counts.size) break;
    const best = topPairs(counts, 1)[0];
    if (!best || best[1] < 2) break; // a pair seen once is not worth a token
    const [a, b] = best[0].split("\u0000");
    merges.push([a, b]);
    history.push(best[1]);
    for (const w of words) w.syms = mergeOnce(w.syms, a, b);
  }
  // vocabulary: base characters get ids 0..n-1, every merge gets the next id
  const vocab = new Map(base.map((c, i) => [c, i]));
  merges.forEach(([a, b], i) => { if (!vocab.has(a + b)) vocab.set(a + b, base.length + i); });
  return { base, merges, history, vocab };
}

function countPairs(words) {
  const counts = new Map();
  for (const { syms, n } of words) {
    for (let i = 0; i < syms.length - 1; i++) {
      const k = syms[i] + "\u0000" + syms[i + 1];
      counts.set(k, (counts.get(k) || 0) + n);
    }
  }
  return counts;
}
// Highest count first; ties broken alphabetically so the result is the same on every device.
function topPairs(counts, k) {
  return [...counts].sort((x, y) => y[1] - x[1] || (x[0] < y[0] ? -1 : 1)).slice(0, k);
}
function mergeOnce(syms, a, b) {
  const out = [];
  for (let i = 0; i < syms.length; i++) {
    if (i < syms.length - 1 && syms[i] === a && syms[i + 1] === b) { out.push(a + b); i++; }
    else out.push(syms[i]);
  }
  return out;
}

// Encode with the first `useMerges` merges, in rank order (lowest rank merges first).
function encode(model, text, useMerges) {
  const rank = new Map();
  model.merges.slice(0, useMerges).forEach(([a, b], i) => rank.set(a + "\u0000" + b, i));
  const out = [];
  for (const word of preSplit(text)) {
    let syms = chars(word);
    while (syms.length > 1) {
      let best = -1, bestRank = Infinity;
      for (let i = 0; i < syms.length - 1; i++) {
        const r = rank.get(syms[i] + "\u0000" + syms[i + 1]);
        if (r !== undefined && r < bestRank) { bestRank = r; best = i; }
      }
      if (best < 0) break;
      const [a, b] = model.merges[bestRank];
      syms = mergeOnce(syms, a, b);
    }
    out.push(...syms);
  }
  return out.map((t) => ({ t, id: model.vocab.has(t) ? model.vocab.get(t) : null }));
}

const utf8Bytes = (s) => new TextEncoder().encode(s).length;

// ---------- Rendering helpers (DOM only, no innerHTML with user text) ----------
const $ = (id) => document.getElementById(id);
function el(tag, cls, text) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text !== undefined) e.textContent = text;
  return e;
}
// Show spaces and newlines visibly inside a chip.
function chipText(t) {
  const frag = document.createDocumentFragment();
  for (const ch of chars(t)) {
    if (ch === " ") frag.append(el("span", "sp", "·"));
    else if (ch === "\n") frag.append(el("span", "sp", "↵"));
    else if (ch === "\t") frag.append(el("span", "sp", "→"));
    else frag.append(document.createTextNode(ch));
  }
  return frag;
}
function renderTokens(container, toks, opts = {}) {
  container.replaceChildren();
  toks.forEach((tk, i) => {
    const c = el("span", "tok c" + (i % 5));
    if (tk.id === null) c.classList.add("unk");
    if (opts.fresh && opts.fresh.has(tk.t)) c.classList.add("fresh");
    const s = el("span", "s"); s.append(chipText(tk.t));
    c.append(s, el("span", "id", tk.id === null ? "new" : String(tk.id)));
    c.title = tk.id === null ? "Training lo ee character ledhu" : "Token ID " + tk.id;
    container.append(c);
  });
}
const fmt = (n) => n.toLocaleString("en-IN");

// ---------- 1. Live tokenizer ----------
const MODEL = train(CORPUS_TEXT, MAX_MERGES);
const live = { input: $("liveText"), out: $("liveTokens"), slider: $("mergeSlider") };

function updateLive() {
  const text = live.input.value;
  const use = Number(live.slider.value);
  const toks = encode(MODEL, text, use);
  renderTokens(live.out, toks);
  const nChars = chars(text).length;
  $("sChars").textContent = fmt(nChars);
  $("sBytes").textContent = fmt(utf8Bytes(text));
  $("sTokens").textContent = fmt(toks.length);
  $("sRatio").textContent = toks.length ? (nChars / toks.length).toFixed(1) : "0";
  $("vocabSize").textContent = fmt(MODEL.base.length + use);
  $("mergeCount").textContent = fmt(use);
  const unk = toks.filter((t) => t.id === null).length;
  $("unkNote").hidden = unk === 0;
  $("unkCount").textContent = fmt(unk);
}
live.slider.max = String(MODEL.merges.length);
live.slider.value = String(MODEL.merges.length);
$("maxMerges").textContent = fmt(MODEL.merges.length);
live.input.addEventListener("input", updateLive);
live.slider.addEventListener("input", updateLive);
$("showIds").addEventListener("change", (e) => live.out.classList.toggle("show-ids", e.target.checked));
document.querySelectorAll("[data-sample]").forEach((b) =>
  b.addEventListener("click", () => { live.input.value = b.dataset.sample; updateLive(); live.input.focus(); }));

// ---------- 2. Watch BPE learn, one merge at a time ----------
const T = { input: $("trainText"), out: $("trainTokens"), pairs: $("pairTable"), log: $("mergeLog"), step: $("stepBtn"), play: $("playBtn"), reset: $("resetBtn") };
let ts = null; // trainer state
let timer = null;

function trainerReset() {
  stopPlay();
  const freq = new Map();
  for (const w of preSplit(T.input.value)) freq.set(w, (freq.get(w) || 0) + 1);
  const words = [...freq].map(([w, n]) => ({ syms: chars(w), n }));
  const base = [...new Set(words.flatMap((w) => w.syms))].sort();
  ts = { words, merges: [], vocab: new Map(base.map((c, i) => [c, i])), fresh: new Set(), original: T.input.value };
  T.log.replaceChildren();
  $("explain").textContent = "Ippudu prathi character oka token. \"Okka merge\" nokkandi: ekkuva saarlu pakka pakkana vachhe jantani AI kaluputhundhi.";
  trainerRender();
}

function trainerTokens() {
  // Re-encode the original text with the merges learned so far (rank order, like the real encoder).
  const model = { merges: ts.merges, vocab: ts.vocab };
  return encode(model, ts.original, ts.merges.length);
}

function trainerRender() {
  const toks = trainerTokens();
  renderTokens(T.out, toks, { fresh: ts.fresh });
  T.out.classList.add("show-ids");
  const counts = countPairs(ts.words);
  const top = topPairs(counts, 6);
  T.pairs.replaceChildren();
  top.forEach(([k, n], i) => {
    const [a, b] = k.split("\u0000");
    const tr = el("tr", i === 0 && n >= 2 ? "top" : "");
    const td = el("td"); td.append(chipText(a), document.createTextNode(" + "), chipText(b));
    tr.append(td, el("td", "n", String(n)));
    T.pairs.append(tr);
  });
  if (!top.length) T.pairs.append(el("tr")).append(el("td", "", "Inka jantalu levu"));
  $("tTokens").textContent = fmt(toks.length);
  $("tVocab").textContent = fmt(ts.vocab.size);
  $("tMerges").textContent = fmt(ts.merges.length);
  const done = !top.length || top[0][1] < 2;
  T.step.disabled = done; T.play.disabled = done;
  if (done && ts.merges.length) {
    $("explain").textContent = "Training aipoyindhi: inka rendu saarlu repeat ayye janta ledhu. Real tokenizers ilaane, kaani billions of words meedha, oka 100,000+ tokens vocabulary vachhe varaku chesthaayi.";
    stopPlay();
  }
}

function trainerStep() {
  const counts = countPairs(ts.words);
  const best = topPairs(counts, 1)[0];
  if (!best || best[1] < 2) { trainerRender(); return; }
  const [a, b] = best[0].split("\u0000");
  ts.merges.push([a, b]);
  const id = ts.vocab.size;
  if (!ts.vocab.has(a + b)) ts.vocab.set(a + b, id);
  for (const w of ts.words) w.syms = mergeOnce(w.syms, a, b);
  ts.fresh = new Set([a + b]);
  const li = el("li");
  li.append(el("span", "r", "#" + ts.merges.length));
  const s = el("span"); s.append(chipText(a), document.createTextNode(" + "), chipText(b), document.createTextNode(" → "), chipText(a + b));
  li.append(s);
  T.log.append(li);
  T.log.scrollTop = T.log.scrollHeight;
  const show = (x) => x.replace(/ /g, "·");
  $("explain").textContent = `Merge #${ts.merges.length}: "${show(a)}" + "${show(b)}" ${best[1]} saarlu pakka pakkana vachhayi, anduke kalipi kotha token "${show(a + b)}" chesindhi (ID ${ts.vocab.get(a + b)}).`;
  trainerRender();
}
function stopPlay() { if (timer) { clearInterval(timer); timer = null; } T.play.textContent = "▶ Auto play"; }
T.step.addEventListener("click", () => { stopPlay(); trainerStep(); });
T.play.addEventListener("click", () => {
  if (timer) { stopPlay(); return; }
  T.play.textContent = "❚❚ Pause";
  timer = setInterval(trainerStep, 700);
});
T.reset.addEventListener("click", trainerReset);
T.input.addEventListener("change", trainerReset);

// ---------- 3. Same meaning, different token cost ----------
const LANGS = [
  { name: "English", text: "I am learning AI every day." },
  { name: "Teluglish", text: "Nenu prathi roju AI nerchukuntunnanu." },
  { name: "Telugu script", text: "నేను ప్రతి రోజు AI నేర్చుకుంటున్నాను." },
];
function renderLangs() {
  const rows = LANGS.map((l) => ({ ...l, toks: encode(MODEL, l.text, MODEL.merges.length).length, bytes: utf8Bytes(l.text), chars: chars(l.text).length }));
  const max = Math.max(...rows.map((r) => r.toks));
  const wrap = $("langs");
  wrap.replaceChildren();
  for (const r of rows) {
    const row = el("div", "lang" + (r.toks === max ? " worst" : ""));
    const bar = el("div", "bar"); const fill = el("i"); bar.append(fill);
    row.append(el("span", "name", r.name), el("span", "txt", r.text), el("span", "count", String(r.toks)), bar,
      el("span", "meta", `${r.chars} characters · ${r.bytes} bytes (UTF-8) · ${r.toks} tokens`));
    wrap.append(row);
    // CSSOM writes are allowed under style-src 'self' (only style="" attributes are blocked).
    requestAnimationFrame(() => { fill.style.width = Math.max(4, Math.round((r.toks / max) * 100)) + "%"; });
  }
}

// ---------- Start ----------
updateLive();
trainerReset();
renderLangs();
