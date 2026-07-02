import { useState, useEffect, useMemo, useRef } from "react";
import {
  ShoppingBag, Sparkles, Stethoscope, Zap, Car, Smartphone, Home,
  MoreHorizontal, Tag, Plus, ChevronLeft, ChevronRight, Trash2, X
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

const ICONS = { ShoppingBag, Sparkles, Stethoscope, Zap, Car, Smartphone, Home, MoreHorizontal, Tag };

const DEFAULT_CATEGORIES = [
  { name: "日用品", color: "#5C7A5C", icon: "ShoppingBag" },
  { name: "美容",   color: "#B0678C", icon: "Sparkles" },
  { name: "医療費", color: "#5A7D8C", icon: "Stethoscope" },
  { name: "光熱費", color: "#C08A3E", icon: "Zap" },
  { name: "交通費", color: "#7A6A9E", icon: "Car" },
  { name: "通信費", color: "#4F8A8B", icon: "Smartphone" },
  { name: "住居費", color: "#8C5A3C", icon: "Home" },
  { name: "その他", color: "#9B9483", icon: "MoreHorizontal" },
];

const CUSTOM_PALETTE = ["#C4574A", "#3E7CB1", "#8A9A5B", "#A67C3E", "#6B5B95", "#4A7C6F", "#B3823E", "#6E8CA0"];

const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"];

function pad2(n) { return String(n).padStart(2, "0"); }
function dateKey(d) { return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`; }
function parseKey(k) { const [y, m, d] = k.split("-").map(Number); return new Date(y, m - 1, d); }
function displayDate(d) {
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日(${WEEKDAYS[d.getDay()]})`;
}
function monthLabel(d) { return `${d.getFullYear()}年${d.getMonth() + 1}月`; }
function yen(n) { return `¥${Number(n || 0).toLocaleString("ja-JP")}`; }
function addMonths(d, n) { return new Date(d.getFullYear(), d.getMonth() + n, 1); }
function monthKey(d) { return d.getFullYear() * 12 + d.getMonth(); }
function uid() {
  return (typeof crypto !== "undefined" && crypto.randomUUID) ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

async function loadJSON(key, fallback) {
  try {
    const res = await window.storage.get(key, false);
    if (!res) return fallback;
    return JSON.parse(res.value);
  } catch (e) {
    return fallback;
  }
}
async function saveJSON(key, value) {
  try { await window.storage.set(key, JSON.stringify(value), false); } catch (e) { /* noop */ }
}

const FONT_IMPORT = `@import url('https://fonts.googleapis.com/css2?family=Shippori+Mincho:wght@400;600;800&family=Zen+Kaku+Gothic+New:wght@400;500;700&family=JetBrains+Mono:wght@400;500;700&display=swap');`;

const STYLES = `
${FONT_IMPORT}

.kb-root {
  --paper: #EFEAE0;
  --paper-card: #F6F2E8;
  --paper-line: #D6CDB8;
  --ink: #2B3A4A;
  --ink-soft: #62717E;
  --stamp-red: #B23A2E;
  --stamp-red-dark: #8F2E24;
  --gold: #C08A3E;
  --income-green: #4C7A5C;
  --income-green-dark: #365C42;
  --desk: #33402F;
  --font-display: 'Shippori Mincho', serif;
  --font-body: 'Zen Kaku Gothic New', sans-serif;
  --font-mono: 'JetBrains Mono', monospace;

  min-height: 100%;
  background: var(--desk);
  background-image: radial-gradient(ellipse at top, #435038 0%, #2b3527 75%);
  font-family: var(--font-body);
  color: var(--ink);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 10px 8px;
  box-sizing: border-box;
}
.kb-root * { box-sizing: border-box; }

.kb-book {
  position: relative;
  width: 100%;
  max-width: 400px;
  display: flex;
}

.kb-binder {
  width: 22px;
  background: linear-gradient(180deg, #C9BFA4, #BDB295);
  border-radius: 10px 0 0 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-evenly;
  padding: 18px 0;
  box-shadow: inset -3px 0 6px rgba(0,0,0,0.15);
  flex-shrink: 0;
}
.kb-hole {
  width: 9px; height: 9px; border-radius: 50%;
  background: #2b3527;
  box-shadow: inset 0 1px 2px rgba(0,0,0,0.6);
}

.kb-card {
  flex: 1;
  background: var(--paper);
  background-image:
    linear-gradient(var(--paper-line) 1px, transparent 1px);
  background-size: 100% 28px;
  border-radius: 0 12px 12px 0;
  box-shadow: 4px 10px 28px rgba(0,0,0,0.35);
  min-height: 620px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
}

.kb-header {
  padding: 20px 22px 14px;
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  border-bottom: 1px solid var(--paper-line);
  background: var(--paper-card);
}
.kb-title {
  font-family: var(--font-display);
  font-weight: 800;
  font-size: 24px;
  letter-spacing: 0.08em;
  color: var(--ink);
}
.kb-today {
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--ink-soft);
}

.kb-body { flex: 1; padding: 18px 20px 90px; overflow-y: auto; }

/* ---- bottom tabs ---- */
.kb-tabs-horiz {
  display: flex;
  position: absolute;
  left: 0; right: 0; bottom: 0;
  background: var(--paper-card);
  border-top: 1px solid var(--paper-line);
  padding: 8px 10px calc(8px + env(safe-area-inset-bottom, 0px));
  justify-content: space-around;
}
.kb-tab-horiz {
  display: flex; flex-direction: column; align-items: center; gap: 3px;
  font-size: 11px; color: var(--ink-soft); cursor: pointer; padding: 4px 10px; border-radius: 8px;
}
.kb-tab-horiz.active { color: var(--stamp-red); font-weight: 700; }
.kb-body { padding-bottom: 80px; }

/* ---- input screen ---- */
.kb-type-toggle { display: flex; gap: 8px; margin-bottom: 18px; }
.kb-type-btn {
  flex: 1; text-align: center; padding: 10px 0; border-radius: 10px; cursor: pointer;
  font-family: var(--font-display); font-size: 14px; font-weight: 700; letter-spacing: 0.05em;
  border: 1.5px solid var(--paper-line); background: var(--paper-card); color: var(--ink-soft);
}
.kb-type-btn.expense.active { background: var(--stamp-red); border-color: var(--stamp-red-dark); color: #fff; }
.kb-type-btn.income.active { background: var(--income-green); border-color: var(--income-green-dark); color: #fff; }

.kb-stamp.income { background: var(--income-green); border-color: var(--income-green-dark); box-shadow: 0 3px 0 var(--income-green-dark), 0 6px 10px rgba(0,0,0,0.25); }
.kb-stamp.income:active { box-shadow: 0 0 0 var(--income-green-dark), 0 2px 4px rgba(0,0,0,0.2); }

.kb-row { margin-bottom: 22px; }
.kb-label { font-size: 12px; color: var(--ink-soft); margin-bottom: 8px; letter-spacing: 0.05em; }
.kb-date-nav { display: flex; align-items: center; gap: 10px; }
.kb-date-nav button {
  border: none; background: var(--paper-card); width: 34px; height: 34px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center; cursor: pointer; color: var(--ink);
  box-shadow: 0 1px 3px rgba(0,0,0,0.15);
}
.kb-date-text {
  flex: 1; text-align: center; font-family: var(--font-display); font-size: 16px; cursor: pointer;
  padding: 6px 0; border-bottom: 1px dashed var(--paper-line);
}
.kb-date-hidden-input { position: absolute; opacity: 0; width: 0; height: 0; }

.kb-memo-input, .kb-cat-add-input {
  width: 100%; border: none; border-bottom: 1px solid var(--paper-line);
  background: transparent; font-family: var(--font-body); font-size: 15px; padding: 8px 2px;
  outline: none; color: var(--ink);
}
.kb-memo-input:focus, .kb-cat-add-input:focus { border-color: var(--stamp-red); }

.kb-amount-wrap { display: flex; align-items: baseline; gap: 6px; border-bottom: 1px solid var(--paper-line); padding: 6px 2px; }
.kb-yen { font-family: var(--font-mono); font-size: 20px; color: var(--ink-soft); }
.kb-amount-input {
  border: none; background: transparent; outline: none; font-family: var(--font-mono);
  font-size: 26px; font-weight: 700; color: var(--ink); width: 100%;
}

.kb-cat-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
.kb-chip {
  display: flex; flex-direction: column; align-items: center; gap: 5px;
  padding: 10px 4px; border-radius: 10px; border: 1.5px dashed var(--paper-line);
  background: var(--paper-card); cursor: pointer; font-size: 12px; color: var(--ink);
  transition: all 0.12s ease;
}
.kb-chip.selected { border-style: solid; color: #fff; }
.kb-chip svg { width: 18px; height: 18px; }

.kb-confirm-wrap { display: flex; justify-content: center; margin-top: 30px; }
.kb-stamp {
  width: 92px; height: 92px; border-radius: 50%;
  background: var(--stamp-red); color: #fff; border: 3px solid var(--stamp-red-dark);
  font-family: var(--font-display); font-size: 20px; font-weight: 800; letter-spacing: 0.1em;
  cursor: pointer; transform: rotate(-6deg);
  box-shadow: 0 3px 0 var(--stamp-red-dark), 0 6px 10px rgba(0,0,0,0.25);
  transition: transform 0.08s ease, box-shadow 0.08s ease;
}
.kb-stamp:active { transform: rotate(-6deg) translateY(3px); box-shadow: 0 0 0 var(--stamp-red-dark), 0 2px 4px rgba(0,0,0,0.2); }
.kb-stamp:disabled { background: #b6ada0; border-color: #9c9384; cursor: not-allowed; box-shadow: none; }

.kb-toast {
  position: absolute; top: 14px; left: 50%; transform: translateX(-50%);
  background: var(--stamp-red); color: #fff; padding: 8px 18px; border-radius: 20px;
  font-family: var(--font-display); font-size: 13px; letter-spacing: 0.1em; z-index: 20;
  box-shadow: 0 4px 10px rgba(0,0,0,0.3);
}

/* ---- calendar screen ---- */
.kb-cal-nav { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; }
.kb-cal-nav button { border: none; background: none; cursor: pointer; color: var(--ink); padding: 4px; }
.kb-cal-month { font-family: var(--font-display); font-size: 18px; font-weight: 700; }
.kb-cal-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 3px; }
.kb-cal-wd { text-align: center; font-size: 11px; color: var(--ink-soft); padding-bottom: 6px; }
.kb-cal-cell {
  min-height: 52px; border: 1px solid var(--paper-line); border-radius: 6px;
  background: var(--paper-card); padding: 4px; cursor: pointer; position: relative;
}
.kb-cal-cell.empty { background: transparent; border: none; cursor: default; }
.kb-cal-cell.today { outline: 2px solid var(--gold); outline-offset: -2px; }
.kb-cal-cell.selected { background: #fff; box-shadow: 0 0 0 2px var(--stamp-red) inset; }
.kb-cal-daynum { font-size: 11px; color: var(--ink-soft); }
.kb-cal-total { font-family: var(--font-mono); font-size: 10px; font-weight: 700; color: var(--stamp-red-dark); margin-top: 2px; line-height: 1.3; }
.kb-cal-total.income { color: var(--income-green-dark); }
.kb-cal-dots { display: flex; gap: 2px; position: absolute; bottom: 4px; left: 4px; }
.kb-cal-dot { width: 5px; height: 5px; border-radius: 50%; }

.kb-day-panel { margin-top: 16px; border-top: 1px dashed var(--paper-line); padding-top: 12px; }
.kb-day-entry { display: flex; align-items: center; gap: 10px; padding: 8px 0; border-bottom: 1px solid var(--paper-line); font-size: 13px; }
.kb-day-entry .cat-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
.kb-day-entry .memo { flex: 1; color: var(--ink-soft); }
.kb-day-entry .amt { font-family: var(--font-mono); font-weight: 700; }
.kb-day-entry button { border: none; background: none; color: var(--ink-soft); cursor: pointer; }

/* ---- chart screen ---- */
.kb-period-tabs { display: flex; gap: 8px; margin-bottom: 16px; }
.kb-period-tab {
  flex: 1; text-align: center; padding: 8px 0; border-radius: 8px; border: 1px solid var(--paper-line);
  background: var(--paper-card); cursor: pointer; font-size: 13px; color: var(--ink-soft);
}
.kb-period-tab.active { background: var(--ink); color: #fff; border-color: var(--ink); font-weight: 700; }

.kb-range-nav { display: flex; align-items: center; justify-content: center; gap: 14px; margin-bottom: 14px; }
.kb-range-nav button { border: none; background: none; cursor: pointer; color: var(--ink); }
.kb-range-label { font-family: var(--font-mono); font-size: 13px; color: var(--ink-soft); }

.kb-donut-wrap { position: relative; width: 100%; height: 220px; }
.kb-donut-center { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; pointer-events: none; }
.kb-donut-total { font-family: var(--font-mono); font-size: 20px; font-weight: 700; color: var(--ink); }
.kb-donut-label { font-size: 11px; color: var(--ink-soft); margin-top: 2px; }

.kb-legend { margin-top: 18px; }
.kb-legend-row { display: flex; align-items: center; gap: 10px; padding: 7px 0; border-bottom: 1px solid var(--paper-line); font-size: 13px; }
.kb-legend-dot { width: 10px; height: 10px; border-radius: 3px; flex-shrink: 0; }
.kb-legend-name { flex: 1; }
.kb-legend-amt { font-family: var(--font-mono); font-weight: 700; }
.kb-legend-pct { font-family: var(--font-mono); font-size: 11px; color: var(--ink-soft); width: 42px; text-align: right; }

.kb-summary-bar { display: flex; gap: 8px; margin-bottom: 16px; }
.kb-summary-item { flex: 1; background: var(--paper-card); border: 1px solid var(--paper-line); border-radius: 10px; padding: 8px 6px; text-align: center; }
.kb-summary-label { font-size: 11px; color: var(--ink-soft); margin-bottom: 3px; }
.kb-summary-val { font-family: var(--font-mono); font-size: 13px; font-weight: 700; color: var(--ink); }
.kb-summary-val.income { color: var(--income-green-dark); }
.kb-summary-val.expense { color: var(--stamp-red-dark); }

.kb-empty { text-align: center; color: var(--ink-soft); padding: 40px 20px; font-size: 13px; }

.kb-add-cat-chip { border: 1.5px dashed var(--paper-line); background: transparent; }
`;

function IconFor({ name, ...props }) {
  const Comp = ICONS[name] || Tag;
  return <Comp {...props} />;
}

export default function App() {
  const [loading, setLoading] = useState(true);
  const [entries, setEntries] = useState([]);
  const [customCategories, setCustomCategories] = useState([]);
  const [screen, setScreen] = useState("input");
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);

  useEffect(() => {
    (async () => {
      const [e, c] = await Promise.all([
        loadJSON("kakeibo:entries", []),
        loadJSON("kakeibo:customCategories", []),
      ]);
      setEntries(e);
      setCustomCategories(c);
      setLoading(false);
    })();
  }, []);

  const categories = useMemo(() => [...DEFAULT_CATEGORIES, ...customCategories], [customCategories]);

  function showToast(msg) {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 1600);
  }

  async function addEntry(entry) {
    const next = [...entries, entry];
    setEntries(next);
    await saveJSON("kakeibo:entries", next);
  }
  async function deleteEntry(id) {
    const next = entries.filter((e) => e.id !== id);
    setEntries(next);
    await saveJSON("kakeibo:entries", next);
  }
  async function addCategory(name) {
    const color = CUSTOM_PALETTE[customCategories.length % CUSTOM_PALETTE.length];
    const next = [...customCategories, { name, color, icon: "Tag" }];
    setCustomCategories(next);
    await saveJSON("kakeibo:customCategories", next);
    return name;
  }

  if (loading) {
    return (
      <div className="kb-root">
        <style>{STYLES}</style>
        <div style={{ color: "#F6F2E8", fontFamily: "var(--font-body)" }}>読み込み中…</div>
      </div>
    );
  }

  const today = new Date();

  return (
    <div className="kb-root">
      <style>{STYLES}</style>
      <div className="kb-book">
        <div className="kb-binder">
          {Array.from({ length: 8 }).map((_, i) => <div className="kb-hole" key={i} />)}
        </div>
        <div className="kb-card">
          {toast && <div className="kb-toast">{toast}</div>}
          <div className="kb-header">
            <div className="kb-title">家計簿</div>
            <div className="kb-today">{displayDate(today)}</div>
          </div>
          <div className="kb-body">
            {screen === "input" && (
              <InputScreen categories={categories} onAdd={addEntry} onAddCategory={addCategory} onSaved={() => showToast("記帳しました")} />
            )}
            {screen === "calendar" && (
              <CalendarScreen entries={entries} categories={categories} onDelete={deleteEntry} />
            )}
            {screen === "chart" && (
              <ChartScreen entries={entries} categories={categories} />
            )}
          </div>

          <div className="kb-tabs-horiz">
            <TabButtonHoriz active={screen === "input"} label="入力" onClick={() => setScreen("input")} />
            <TabButtonHoriz active={screen === "calendar"} label="カレンダー" onClick={() => setScreen("calendar")} />
            <TabButtonHoriz active={screen === "chart"} label="集計" onClick={() => setScreen("chart")} />
          </div>
        </div>
      </div>
    </div>
  );
}

function TabButtonHoriz({ active, label, onClick }) {
  return (
    <div className={`kb-tab-horiz${active ? " active" : ""}`} onClick={onClick}>
      <div>{label}</div>
    </div>
  );
}

function InputScreen({ categories, onAdd, onAddCategory, onSaved }) {
  const [date, setDate] = useState(new Date());
  const [type, setType] = useState("expense");
  const [memo, setMemo] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState(null);
  const [addingCat, setAddingCat] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const dateInputRef = useRef(null);

  function shiftDate(n) {
    const d = new Date(date);
    d.setDate(d.getDate() + n);
    setDate(d);
  }

  async function handleConfirm() {
    const amt = Number(amount);
    if (!amt || amt <= 0 || !category) return;
    await onAdd({ id: uid(), date: dateKey(date), memo: memo.trim(), amount: amt, category, type });
    setMemo("");
    setAmount("");
    setCategory(null);
    onSaved();
  }

  async function submitNewCategory() {
    const name = newCatName.trim();
    if (!name) { setAddingCat(false); return; }
    await onAddCategory(name);
    setCategory(name);
    setNewCatName("");
    setAddingCat(false);
  }

  const canConfirm = Number(amount) > 0 && !!category;

  return (
    <div>
      <div className="kb-type-toggle">
        <div className={`kb-type-btn expense${type === "expense" ? " active" : ""}`} onClick={() => setType("expense")}>支出</div>
        <div className={`kb-type-btn income${type === "income" ? " active" : ""}`} onClick={() => setType("income")}>収入</div>
      </div>

      <div className="kb-row">
        <div className="kb-label">日付</div>
        <div className="kb-date-nav">
          <button onClick={() => shiftDate(-1)}><ChevronLeft size={16} /></button>
          <div className="kb-date-text" onClick={() => dateInputRef.current && dateInputRef.current.showPicker ? dateInputRef.current.showPicker() : dateInputRef.current.click()}>
            {displayDate(date)}
          </div>
          <button onClick={() => shiftDate(1)}><ChevronRight size={16} /></button>
          <input
            ref={dateInputRef}
            type="date"
            className="kb-date-hidden-input"
            value={dateKey(date)}
            onChange={(e) => e.target.value && setDate(parseKey(e.target.value))}
          />
        </div>
      </div>

      <div className="kb-row">
        <div className="kb-label">メモ(何を買った？)</div>
        <input className="kb-memo-input" value={memo} onChange={(e) => setMemo(e.target.value)} placeholder="例）スーパーで食材" />
      </div>

      <div className="kb-row">
        <div className="kb-label">{type === "expense" ? "支出" : "収入"}</div>
        <div className="kb-amount-wrap">
          <span className="kb-yen">¥</span>
          <input
            className="kb-amount-input"
            type="number"
            inputMode="numeric"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0"
          />
        </div>
      </div>

      <div className="kb-row">
        <div className="kb-label">カテゴリー</div>
        <div className="kb-cat-grid">
          {categories.map((c) => (
            <div
              key={c.name}
              className={`kb-chip${category === c.name ? " selected" : ""}`}
              style={category === c.name ? { background: c.color, borderColor: c.color } : {}}
              onClick={() => setCategory(c.name)}
            >
              <IconFor name={c.icon} />
              <span>{c.name}</span>
            </div>
          ))}
          {!addingCat && (
            <div className="kb-chip kb-add-cat-chip" onClick={() => setAddingCat(true)}>
              <Plus size={18} />
              <span>追加</span>
            </div>
          )}
        </div>
        {addingCat && (
          <div style={{ marginTop: 10, display: "flex", gap: 8, alignItems: "center" }}>
            <input
              className="kb-cat-add-input"
              autoFocus
              placeholder="新しいカテゴリー名"
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submitNewCategory()}
            />
            <button onClick={submitNewCategory} style={{ border: "none", background: "none", cursor: "pointer", color: "var(--ink)" }}><Plus size={18} /></button>
            <button onClick={() => { setAddingCat(false); setNewCatName(""); }} style={{ border: "none", background: "none", cursor: "pointer", color: "var(--ink-soft)" }}><X size={18} /></button>
          </div>
        )}
      </div>

      <div className="kb-confirm-wrap">
        <button className={`kb-stamp${type === "income" ? " income" : ""}`} disabled={!canConfirm} onClick={handleConfirm}>確定</button>
      </div>
    </div>
  );
}

function CalendarScreen({ entries, categories, onDelete }) {
  const [month, setMonth] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); });
  const [selectedKey, setSelectedKey] = useState(null);
  const catColor = (name) => (categories.find((c) => c.name === name) || {}).color || "#9B9483";

  const byDate = useMemo(() => {
    const m = {};
    for (const e of entries) {
      if (!m[e.date]) m[e.date] = [];
      m[e.date].push(e);
    }
    return m;
  }, [entries]);

  const weeks = useMemo(() => {
    const first = new Date(month.getFullYear(), month.getMonth(), 1);
    const startOffset = first.getDay();
    const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
    const cells = [];
    for (let i = 0; i < startOffset; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(month.getFullYear(), month.getMonth(), d));
    while (cells.length % 7 !== 0) cells.push(null);
    const w = [];
    for (let i = 0; i < cells.length; i += 7) w.push(cells.slice(i, i + 7));
    return w;
  }, [month]);

  const todayKey = dateKey(new Date());
  const selectedEntries = selectedKey ? (byDate[selectedKey] || []) : [];

  return (
    <div>
      <div className="kb-cal-nav">
        <button onClick={() => setMonth(addMonths(month, -1))}><ChevronLeft size={18} /></button>
        <div className="kb-cal-month">{monthLabel(month)}</div>
        <button onClick={() => setMonth(addMonths(month, 1))}><ChevronRight size={18} /></button>
      </div>
      <div className="kb-cal-grid">
        {WEEKDAYS.map((w) => <div className="kb-cal-wd" key={w}>{w}</div>)}
        {weeks.flat().map((d, i) => {
          if (!d) return <div className="kb-cal-cell empty" key={i} />;
          const k = dateKey(d);
          const dayEntries = byDate[k] || [];
          const expenseTotal = dayEntries.filter((e) => e.type !== "income").reduce((s, e) => s + e.amount, 0);
          const incomeTotal = dayEntries.filter((e) => e.type === "income").reduce((s, e) => s + e.amount, 0);
          const cats = [...new Set(dayEntries.map((e) => e.category))].slice(0, 3);
          return (
            <div
              key={i}
              className={`kb-cal-cell${k === todayKey ? " today" : ""}${k === selectedKey ? " selected" : ""}`}
              onClick={() => setSelectedKey(k === selectedKey ? null : k)}
            >
              <div className="kb-cal-daynum">{d.getDate()}</div>
              {expenseTotal > 0 && <div className="kb-cal-total">-{yen(expenseTotal)}</div>}
              {incomeTotal > 0 && <div className="kb-cal-total income">+{yen(incomeTotal)}</div>}
              {cats.length > 0 && (
                <div className="kb-cal-dots">
                  {cats.map((c) => <div className="kb-cal-dot" style={{ background: catColor(c) }} key={c} />)}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {selectedKey && (
        <div className="kb-day-panel">
          <div className="kb-label">{displayDate(parseKey(selectedKey))}の記録</div>
          {selectedEntries.length === 0 && <div className="kb-empty" style={{ padding: "20px 0" }}>記録がありません</div>}
          {selectedEntries.map((e) => (
            <div className="kb-day-entry" key={e.id}>
              <div className="cat-dot" style={{ background: catColor(e.category) }} />
              <div className="memo">{e.category}{e.memo ? ` ・ ${e.memo}` : ""}</div>
              <div className="amt" style={{ color: e.type === "income" ? "var(--income-green-dark)" : "var(--stamp-red-dark)" }}>
                {e.type === "income" ? "+" : "-"}{yen(e.amount)}
              </div>
              <button onClick={() => onDelete(e.id)}><Trash2 size={15} /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ChartScreen({ entries, categories }) {
  const [period, setPeriod] = useState("1m");
  const [refMonth, setRefMonth] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); });
  const catColor = (name) => (categories.find((c) => c.name === name) || {}).color || "#9B9483";
  const monthsBack = period === "1m" ? 0 : period === "3m" ? 2 : 11;
  const startMonth = addMonths(refMonth, -monthsBack);

  const filtered = useMemo(() => {
    const startMK = monthKey(startMonth);
    const endMK = monthKey(refMonth);
    return entries.filter((e) => {
      const mk = monthKey(parseKey(e.date));
      return mk >= startMK && mk <= endMK;
    });
  }, [entries, startMonth, refMonth]);

  const expenseEntries = useMemo(() => filtered.filter((e) => e.type !== "income"), [filtered]);
  const incomeTotal = useMemo(() => filtered.filter((e) => e.type === "income").reduce((s, e) => s + e.amount, 0), [filtered]);

  const data = useMemo(() => {
    const sums = {};
    for (const e of expenseEntries) sums[e.category] = (sums[e.category] || 0) + e.amount;
    return Object.entries(sums)
      .map(([name, value]) => ({ name, value, color: catColor(name) }))
      .sort((a, b) => b.value - a.value);
  }, [expenseEntries, categories]);

  const total = data.reduce((s, d) => s + d.value, 0);
  const rangeLabel = period === "1m" ? monthLabel(refMonth) : `${monthLabel(startMonth)}〜${monthLabel(refMonth)}`;

  return (
    <div>
      <div className="kb-period-tabs">
        <div className={`kb-period-tab${period === "1m" ? " active" : ""}`} onClick={() => setPeriod("1m")}>1ヶ月</div>
        <div className={`kb-period-tab${period === "3m" ? " active" : ""}`} onClick={() => setPeriod("3m")}>3ヶ月</div>
        <div className={`kb-period-tab${period === "12m" ? " active" : ""}`} onClick={() => setPeriod("12m")}>1年</div>
      </div>

      <div className="kb-range-nav">
        <button onClick={() => setRefMonth(addMonths(refMonth, -1))}><ChevronLeft size={16} /></button>
        <div className="kb-range-label">{rangeLabel}</div>
        <button onClick={() => setRefMonth(addMonths(refMonth, 1))}><ChevronRight size={16} /></button>
      </div>

      <div className="kb-summary-bar">
        <div className="kb-summary-item"><div className="kb-summary-label">収入</div><div className="kb-summary-val income">+{yen(incomeTotal)}</div></div>
        <div className="kb-summary-item"><div className="kb-summary-label">支出</div><div className="kb-summary-val expense">-{yen(total)}</div></div>
        <div className="kb-summary-item"><div className="kb-summary-label">差引</div><div className="kb-summary-val">{yen(incomeTotal - total)}</div></div>
      </div>

      {total === 0 ? (
        <div className="kb-empty">この期間の支出記録はまだありません</div>
      ) : (
        <>
          <div className="kb-donut-wrap">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data} dataKey="value" nameKey="name" innerRadius="58%" outerRadius="88%" paddingAngle={2} stroke="none">
                  {data.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="kb-donut-center">
              <div className="kb-donut-total">{yen(total)}</div>
              <div className="kb-donut-label">合計</div>
            </div>
          </div>

          <div className="kb-legend">
            {data.map((d) => (
              <div className="kb-legend-row" key={d.name}>
                <div className="kb-legend-dot" style={{ background: d.color }} />
                <div className="kb-legend-name">{d.name}</div>
                <div className="kb-legend-amt">{yen(d.value)}</div>
                <div className="kb-legend-pct">{((d.value / total) * 100).toFixed(0)}%</div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}