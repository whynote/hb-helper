import { useEffect, useMemo, useState } from "react";
import {
  calculateGrid,
  cloneForm,
  SAMPLE_FORM,
  validateGridForm,
} from "./gridMath.js";

const STORAGE_KEY = "etf-grid-lab-strategies-v1";
const MAX_STRATEGIES = 20;

const HELP = {
  name: {
    title: "å“ç§åç§°",
    body: "æœ¬ç½‘æ ¼æ‰€æŠ•èµ„çš„å“ç§åç§°ï¼Œå¦‚ï¼šè¯åˆ¸ETF",
  },
  code: {
    title: "å“ç§ä»£ç ",
    body: "æœ¬ç½‘æ ¼æ‰€æŠ•èµ„çš„å“ç§åœºå†…å¤–äº¤æ˜“ä»£ç ï¼Œå¦‚è¯åˆ¸ETFå¯¹åº”åœºå†…äº¤æ˜“ä»£ç ï¼š512880ã€‚åŒä¸€ä¸ªå“ç§å¯èƒ½æœ‰å¾ˆå¤šä¸åŒçš„äº¤æ˜“ä»£ç ï¼Œè¯·è‡ªè¡Œé€‰å–æ‚¨çš„æŠ•èµ„æ ‡çš„ã€‚\nå»ºè®®å¡«å†™æ­£ç¡®çš„äº¤æ˜“ä»£ç ï¼Œåç»­å¯ç”¨äºè‡ªåŠ¨ç›‘æ§ä»·æ ¼ï¼Œå¹¶æä¾›åˆ°ä»·æé†’ç­‰ç›¸å…³æœåŠ¡ã€‚",
  },
  initPrice: {
    title: "å»ºä»“ä»·æ ¼",
    body: "â€œå…³äºå¼€å§‹çš„æ—¶æœºï¼šæœ€å¥½çš„å¼€å§‹æ—¶æœºï¼Œæ˜¯ä»·æ ¼ç•¥ä½äºä»·å€¼çš„æ—¶å€™ã€‚ä»·æ ¼å¤ªé«˜ï¼Œä¹°å…¥çš„éƒ¨åˆ†å¾ˆéš¾èµšé’±ã€‚ä»·æ ¼å¤ªä½ï¼Œèµšä¸äº†å‡ æ¬¡å°±é£äº†ã€‚ è‡³äºä»€ä¹ˆæ—¶å€™æ˜¯ä»·æ ¼ç•¥ä½äºä»·å€¼ï¼Œå¾ˆéš¾ç»™ä½ ä¸€ä¸ªç»Ÿä¸€çš„æ ‡å‡†ã€‚ä½ å¯ä»¥è§‚å¯ŸETFè®¡åˆ’ï¼Œå¦‚æœæˆ‘ä»¬å¼€å§‹ä¹°å…¥ï¼Œå°±è‡³å°‘è¯´æ˜è¿™ä¸ªä¸œè¥¿ä¸å¤ªè´µäº†ã€‚â€",
  },
  quantityRound: {
    title: "æ•°é‡å‡‘æ•´æ–¹å¼",
    body: "æ ¹æ®åœºå†…äº¤æ˜“è§„åˆ™ï¼Œæˆäº¤æ•°é‡é¡»æ˜¯100çš„æ•´æ•°å€ã€‚ç³»ç»Ÿå°†è‡ªåŠ¨æ ¹æ®ä½ è®¾ç½®çš„æ¯ç½‘é‡‘é¢å’Œå„æ¡£ä½ä»·æ ¼ï¼Œè‡ªåŠ¨å°†æ¯ä¸€æ¡£ä½çš„ä¹°å–æ•°é‡æ¢ç®—æˆæ•´ç™¾çš„æ•°é‡ï¼Œæœ€ä½æ•°é‡100ã€‚",
  },
  maxDrawdownPct: {
    title: "æ¨¡æ‹Ÿæœ€å¤§ä¸‹è·Œå¹…åº¦",
    body: "ç”¨äºè®¡ç®—æ‰€éœ€èµ„é‡‘çš„å‹åŠ›æµ‹è¯•ã€‚â€œè®¾è®¡äº¤æ˜“è¡¨æ ¼çš„æ—¶å€™ï¼Œæ ¹æ®å…·ä½“æƒ…å†µï¼Œæ¨¡æ‹Ÿæœ€å¤§ä¸‹è·Œå¹…åº¦ã€‚æ¯”å¦‚è¯´ï¼Œä½ ç°åœ¨è¦å¼€å§‹ä¸€ä¸ªä¸­è¯500çš„ç½‘æ ¼ï¼Œé‚£ä½ å°±åº”è¯¥çŸ¥é“ï¼Œä¸‹è·Œ60%ï¼Œå‡ ä¹ä¸€å®šæ˜¯æœ€åæƒ…å†µäº†ã€‚ç”šè‡³ä¸‹è·Œ50%ä¹Ÿéå¸¸å›°éš¾ã€‚é‚£ä¹ˆä½ å¦‚æœç›¸å¯¹æ¥è¯´æ¿€è¿›ä¸€ç‚¹ï¼Œå°±å¯ä»¥ä»¥40%è®¾è®¡å‹åŠ›æµ‹è¯•ã€‚ä¿å®ˆä¸€ç‚¹ï¼Œå°±æŒ‰ç…§50%æˆ–è€…60%è®¾è®¡ã€‚â€",
  },
  stepPct: {
    title: "ç½‘æ ¼å¤§å°",
    body: "â€œæ™®é€šçš„å“ç§ä¸€èˆ¬ç»™5%ã€‚æ³¢åŠ¨å¤§çš„å“ç§ï¼Œæ¯”å¦‚åˆ¸å•†æŒ‡æ•°ï¼Œç»™10%ã€‚ä¾›å‚è€ƒã€‚â€",
  },
  amountPerGrid: {
    title: "æ¯ç½‘é‡‘é¢",
    body: "æ ¹æ®æ‚¨çš„å®é™…æƒ…å†µï¼Œç»™æ¯ä¸€ç½‘çš„æŠ•å…¥é‡‘é¢",
  },
  incrementPct: {
    title: "é€æ ¼åŠ ç ",
    body: "æ¯ä¸‹ä¸€ç½‘ï¼ŒæŠ•å…¥åˆ°è¿™ä¸€ç½‘çš„é‡‘é¢å¢åŠ çš„ç™¾åˆ†æ¯”ã€‚å¦‚ç¬¬ä¸€ç½‘çš„é‡‘é¢æ˜¯100ï¼ŒåŠ ç æ¯”ä¾‹æ˜¯5%ï¼Œé‚£ä¹ˆä¸‹ä¸€ç½‘çš„ä¹°å…¥é‡‘é¢æ˜¯105",
  },
  profitMultiple: {
    title: "ç•™åˆ©æ¶¦å€æ•°",
    body: "æ¯ä¸€ç½‘å–å‡ºçš„æ—¶å€™ï¼Œæ˜¯å¦æŠŠåˆ©æ¶¦å…¨éƒ¨å–å‡ºã€‚è®¾ç½®ä¸º0åˆ™ä¸ç•™åˆ©æ¶¦ï¼Œè®¾ç½®ä¸º1ï¼Œåˆ™è¡¨ç¤ºæŠŠåˆ©æ¶¦ç•™ä¸‹ï¼Œæ”¶å›æœ¬é‡‘ã€‚",
  },
  fundLookup: {
    title: "æŒ‡æ•°åŸºé‡‘é€ŸæŸ¥",
    body: "æ•´ç†æ±‡æ€»çš„Eå¤§äº¤æ˜“å¸¸ç”¨çš„æŒ‡æ•°åŸºé‡‘é€ŸæŸ¥ã€‚å†…æµ‹ä¸­ï¼Œæ•¬è¯·å…³æ³¨ã€‚",
  },
};

function readStrategies() {
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

function number(value, digits = 2) {
  return Number(value).toLocaleString("zh-CN", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

function plainNumber(value, digits = 2) {
  return Number(value).toLocaleString("zh-CN", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
    useGrouping: false,
  });
}

function routeFromHash() {
  return window.location.hash === "#create" ? "create" : "dashboard";
}

function HelpButton({ helpKey, onOpen }) {
  if (!helpKey) return <span className="field-spacer" aria-hidden="true" />;
  return (
    <button
      className="help-button"
      type="button"
      aria-label={`æŸ¥çœ‹${HELP[helpKey].title}è¯´æ˜`}
      onClick={() => onOpen(HELP[helpKey])}
    >
      <i className="bi bi-info-circle" aria-hidden="true" />
    </button>
  );
}

function FieldRow({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  helpKey,
  onHelp,
  inputMode,
}) {
  return (
    <div className="field-row">
      <label>{label}</label>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        inputMode={inputMode}
        onChange={(event) => onChange(event.target.value)}
      />
      <HelpButton helpKey={helpKey} onOpen={onHelp} />
    </div>
  );
}

function Switch({ checked, onChange, disabled, label }) {
  return (
    <label className={`switch ${disabled ? "is-disabled" : ""}`}>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        aria-label={label}
        onChange={(event) => onChange?.(event.target.checked)}
      />
      <span aria-hidden="true" />
    </label>
  );
}

function GridSection({ type, title, grid, setGrid, onHelp }) {
  const isSmall = type === "small";
  return (
    <section className="form-section">
      <div className="grid-section-title">
        <Switch
          checked={grid.enabled}
          disabled={isSmall}
          label={`${title}å¼€å…³`}
          onChange={(enabled) => setGrid("enabled", enabled)}
        />
        <strong>{title}</strong>
      </div>

      {grid.enabled && (
        <div className="field-list">
          <FieldRow
            label="ç½‘æ ¼æ¡£å·®(%)"
            value={grid.stepPct}
            type="number"
            inputMode="decimal"
            placeholder="ç½‘æ ¼çš„æ¡£å·®æˆ–æ­¥é•¿"
            helpKey={isSmall ? "stepPct" : undefined}
            onHelp={onHelp}
            onChange={(value) => setGrid("stepPct", value)}
          />
          <FieldRow
            label="æ¯ç½‘é‡‘é¢(å…ƒ)"
            value={grid.amountPerGrid}
            type="number"
            inputMode="decimal"
            placeholder="æ¯ç½‘è®¡åˆ’æŠ•å…¥çš„é‡‘é¢"
            helpKey={isSmall ? "amountPerGrid" : undefined}
            onHelp={onHelp}
            onChange={(value) => setGrid("amountPerGrid", value)}
          />
          <FieldRow
            label="é€æ ¼åŠ ç (%)"
            value={grid.incrementPct}
            type="number"
            inputMode="decimal"
            placeholder="æ¯ç½‘æŠ•å…¥é‡‘é¢æŒ‰æ¡£å·®é€’å¢çš„æ¯”ä¾‹"
            helpKey={isSmall ? "incrementPct" : undefined}
            onHelp={onHelp}
            onChange={(value) => setGrid("incrementPct", value)}
          />
          <FieldRow
            label="ç•™åˆ©æ¶¦å€æ•°"
            value={grid.profitMultiple}
            type="number"
            inputMode="decimal"
            placeholder="å–å‡ºæ—¶ä¿ç•™çš„åˆ©æ¶¦å€æ•°"
            helpKey={isSmall ? "profitMultiple" : undefined}
            onHelp={onHelp}
            onChange={(value) => setGrid("profitMultiple", value)}
          />
        </div>
      )}
    </section>
  );
}

function CreateStrategy({
  draft,
  setDraft,
  onPreview,
  onHelp,
}) {
  const setRoot = (key, value) => setDraft((current) => ({ ...current, [key]: value }));
  const setGrid = (type, key, value) =>
    setDraft((current) => ({
      ...current,
      [type]: { ...current[type], [key]: value },
    }));

  return (
    <main className="create-page">
      <form
        className="strategy-form"
        onSubmit={(event) => {
          event.preventDefault();
          onPreview();
        }}
      >
        <section className="form-section basic-section">
          <div className="basic-title">
            <h1>åŸºæœ¬ä¿¡æ¯</h1>
            <button
              type="button"
              className="lookup-button"
              onClick={() => onHelp(HELP.fundLookup)}
            >
              <i className="bi bi-search" aria-hidden="true" />
              æŒ‡æ•°åŸºé‡‘é€ŸæŸ¥
            </button>
          </div>
          <div className="field-list">
            <FieldRow
              label="å“ç§åç§°"
              value={draft.name}
              placeholder="ç½‘æ ¼å“ç§çš„åç§°"
              helpKey="name"
              onHelp={onHelp}
              onChange={(value) => setRoot("name", value)}
            />
            <FieldRow
              label="äº¤æ˜“ä»£ç "
              value={draft.code}
              placeholder="å“ç§çš„äº¤æ˜“ä»£ç "
              helpKey="code"
              onHelp={onHelp}
              onChange={(value) => setRoot("code", value.replace(/[^\w]/g, ""))}
            />
            <FieldRow
              label="å»ºä»“ä»·æ ¼"
              value={draft.initPrice}
              type="number"
              inputMode="decimal"
              placeholder="ç½‘æ ¼çš„é¦–ç½‘ä»·æ ¼"
              helpKey="initPrice"
              onHelp={onHelp}
              onChange={(value) => setRoot("initPrice", value)}
            />
            <div className="field-row quantity-row">
              <label>æ•°é‡å‡‘æ•´</label>
              <div className="radio-stack">
                <label>
                  <input
                    type="radio"
                    name="quantityRound"
                    checked={draft.quantityRound === "100"}
                    onChange={() => setRoot("quantityRound", "100")}
                  />
                  <span className="radio-icon" aria-hidden="true"><i className="bi bi-check" /></span>
                  <span>æŒ‰100å‡‘æ•´</span>
                </label>
                <label>
                  <input
                    type="radio"
                    name="quantityRound"
                    checked={draft.quantityRound === "none"}
                    onChange={() => setRoot("quantityRound", "none")}
                  />
                  <span className="radio-icon" aria-hidden="true"><i className="bi bi-check" /></span>
                  <span>ä¸ç”¨å‡‘æ•´</span>
                </label>
              </div>
              <HelpButton helpKey="quantityRound" onOpen={onHelp} />
            </div>
            <FieldRow
              label="æœ€å¤§è·Œå¹…(%)"
              value={draft.maxDrawdownPct}
              type="number"
              inputMode="decimal"
              placeholder="è¶…å‡ºæœ€å¤§è·Œå¹…åˆ™ä¸å†æŠ•å…¥"
              helpKey="maxDrawdownPct"
              onHelp={onHelp}
              onChange={(value) => setRoot("maxDrawdownPct", value)}
            />
          </div>
        </section>

        <GridSection
          type="small"
          title="å°ç½‘"
          grid={draft.small}
          setGrid={(key, value) => setGrid("small", key, value)}
          onHelp={onHelp}
        />
        <GridSection
          type="mid"
          title="ä¸­ç½‘"
          grid={draft.mid}
          setGrid={(key, value) => setGrid("mid", key, value)}
          onHelp={onHelp}
        />
        <GridSection
          type="big"
          title="å¤§ç½‘"
          grid={draft.big}
          setGrid={(key, value) => setGrid("big", key, value)}
          onHelp={onHelp}
        />

        <div className="form-actions">
          <button className="primary-button pressure-button" type="submit">
            å‹åŠ›æµ‹è¯•
          </button>
        </div>
      </form>
    </main>
  );
}

function ResultTable({ title, rows }) {
  if (!rows.length) return null;
  return (
    <section className="result-table-section">
      <div className="table-scroll">
        <table className="result-table">
          <thead>
            <tr>
              <th>{title}</th>
              <th>ä¹°å…¥ä»·</th>
              <th>ä¹°å…¥æ•°é‡</th>
              <th>ä¹°å…¥é‡‘é¢</th>
              <th>å–å‡ºä»·</th>
              <th>å–å‡ºæ•°é‡</th>
              <th>å–å‡ºé‡‘é¢</th>
              <th>åˆ©æ¶¦</th>
              <th>ç›ˆåˆ©æ¯”</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={`${row.type}-${row.gridLevel}`}>
                <td>{plainNumber(row.levelPct, 2)}</td>
                <td>{plainNumber(row.buyPrice, row.priceDigits)}</td>
                <td>{plainNumber(row.buyQuantity)}</td>
                <td>{plainNumber(row.buyAmount)}</td>
                <td>{plainNumber(row.sellPrice, row.priceDigits)}</td>
                <td>{plainNumber(row.sellQuantity)}</td>
                <td>{plainNumber(row.sellAmount)}</td>
                <td>{plainNumber(row.profitAmount)}</td>
                <td>{plainNumber(row.profitRate * 100)} %</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function ResultPanel({ result, onReset, onSave, savedView = false, onEdit }) {
  return (
    <div className="result-backdrop" role="presentation">
      <section className="result-sheet" role="dialog" aria-modal="true" aria-label="å‹åŠ›æµ‹è¯•ç»“æœ">
        <div className="result-content">
          <header className="result-header">
            <h2>ã€{result.name}ã€‘-ã€{result.code}ã€‘ç½‘æ ¼æ•°æ®</h2>
            <div className="result-summary">
              <div>
                <span>æ€»ç½‘æ ¼æ•°</span>
                <strong>{result.gridNum}</strong>
              </div>
              <div>
                <span>æœ€å¤§è·Œå¹…</span>
                <strong>{number(result.maxDrawdownPct, 0)}%</strong>
              </div>
              <div>
                <span>æœ€å¤§æŠ•å…¥(å…ƒ)</span>
                <strong>{plainNumber(result.maxAmount)}</strong>
              </div>
            </div>
          </header>
          <ResultTable title="å°ç½‘" rows={result.groups.small} />
          <ResultTable title="ä¸­ç½‘" rows={result.groups.mid} />
          <ResultTable title="å¤§ç½‘" rows={result.groups.big} />
        </div>
        <footer className="sheet-actions">
          <button className="secondary-button" type="button" onClick={onReset}>
            {savedView ? "å…³é—­" : "é‡æ–°è®¾ç½®"}
          </button>
          {savedView ? (
            <button className="primary-button" type="button" onClick={onEdit}>
              ç¼–è¾‘ç­–ç•¥
            </button>
          ) : (
            <button className="primary-button" type="button" onClick={onSave}>
              ä¿å­˜ç­–ç•¥
            </button>
          )}
        </footer>
      </section>
    </div>
  );
}

function StrategyCard({ strategy, onView, onEdit, onToggle, onDelete }) {
  const running = strategy.status === "running";
  return (
    <article className="strategy-card">
      <header>
        <div>
          <h2>{strategy.result.name}</h2>
          <span>{strategy.result.code}</span>
        </div>
 #´êÚ$z{-®éÜj×#°¢6öç7BfÆÆ&6´Ö÷VçBÒ4çVÖ&W"†f÷&Òç6ÖÆÂæÖ÷VçEW$w&–B“°¢6öç7Bw&÷W2Ò·Ó° ¢f÷"†6öç7BG—Röb²'6ÖÆÂ"Â&Ö–B"Â&&–r%Ò’°¢6öç7B6öæf–rÒf÷&Õ·G—UÓ°¢w&÷W5·G—UÒÒ6öæf–ræVæ&ÆV@¢ò'V–ÆE&÷w2‡°¢G—RÀ¢–æ—E&–6RÀ¢Ö„G&vF÷vâÀ¢7FW7C¢4çVÖ&W"†6öæf–rç7FW7B’À¢Ö÷VçEW$w&–C¢4çVÖ&W"†6öæf–ræÖ÷VçEW$w&–BÂfÆÆ&6´Ö÷VçB’ÇÂfÆÆ&6´Ö÷VçBÀ¢–æ7&VÖVçE7C¢4çVÖ&W"†6öæf–ræ–æ7&VÖVçE7B’À¢&öf—D×VÇF—ÆS¢4çVÖ&W"†6öæf–rç&öf—D×VÇF—ÆR’À¢W6T‡VæG&VG2À¢Ò¢¢µÓ°¢Ğ ¢6öç7B&÷w2Ò²ââæw&÷W2ç6ÖÆÂÂââæw&÷W2æÖ–BÂââæw&÷W2æ&–uÓ°¢6öç7BÖ„Ö÷VçBÒ&÷VæB€¢&÷w2ç&VGV6R‚‡7VÒÂ&÷r’Óâ7VÒ²&÷ræ'W”Ö÷VçBÂ’À¢"À¢“°¢6öç7BF÷FÅ&öf—BÒ&÷VæB€¢&÷w2ç&VGV6R‚‡7VÒÂ&÷r’Óâ7VÒ²&÷rç&öf—DÖ÷VçBÂ’À¢"À¢“° ¢&WGW&â°¢æÖS¢f÷&ÒææÖRçG&–Ò‚’À¢6öFS¢f÷&Òæ6öFRçG&–Ò‚’À¢–æ—E&–6RÀ¢Ö„G&vF÷vå7C¢4çVÖ&W"†f÷&ÒæÖ„G&vF÷vå7B’À¢w&–DçVÓ¢&÷w2æÆVæwF‚À¢Ö„Ö÷VçBÀ¢F÷FÅ&öf—BÀ¢&WGW&äöä6—FÃ¢Ö„Ö÷VçBò&÷VæB‚‡F÷FÅ&öf—BòÖ„Ö÷VçB’¢Â"’¢À¢w&÷W2À¢Ó°§Ğ ¦W‡÷'BgVæ7F–öâ6ÆöæTf÷&Ò†f÷&Ò’°¢&WGW&â°¢ââæf÷&ÒÀ¢6ÖÆÃ¢²ââæf÷&Òç6ÖÆÂÒÀ¢Ö–C¢²ââæf÷&ÒæÖ–BÒÀ¢&–s¢²ââæf÷&Òæ&–rÒÀ¢Ó°§Ğ