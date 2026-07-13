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
    title: "品种名称",
    body: "本网格所投资的品种名称，如：证券ETF",
  },
  code: {
    title: "品种代码",
    body: "本网格所投资的品种场内外交易代码，如证券ETF对应场内交易代码：512880。同一个品种可能有很多不同的交易代码，请自行选取您的投资标的。\n建议填写正确的交易代码，后续可用于自动监控价格，并提供到价提醒等相关服务。",
  },
  initPrice: {
    title: "建仓价格",
    body: "“关于开始的时机：最好的开始时机，是价格略低于价值的时候。价格太高，买入的部分很难赚钱。价格太低，赚不了几次就飞了。 至于什么时候是价格略低于价值，很难给你一个统一的标准。你可以观察ETF计划，如果我们开始买入，就至少说明这个东西不太贵了。”",
  },
  quantityRound: {
    title: "数量凑整方式",
    body: "根据场内交易规则，成交数量须是100的整数倍。系统将自动根据你设置的每网金额和各档位价格，自动将每一档位的买卖数量换算成整百的数量，最低数量100。",
  },
  maxDrawdownPct: {
    title: "模拟最大下跌幅度",
    body: "用于计算所需资金的压力测试。“设计交易表格的时候，根据具体情况，模拟最大下跌幅度。比如说，你现在要开始一个中证500的网格，那你就应该知道，下跌60%，几乎一定是最坏情况了。甚至下跌50%也非常困难。那么你如果相对来说激进一点，就可以以40%设计压力测试。保守一点，就按照50%或者60%设计。”",
  },
  stepPct: {
    title: "网格大小",
    body: "“普通的品种一般给5%。波动大的品种，比如券商指数，给10%。供参考。”",
  },
  amountPerGrid: {
    title: "每网金额",
    body: "根据您的实际情况，给每一网的投入金额",
  },
  incrementPct: {
    title: "逐格加码",
    body: "每下一网，投入到这一网的金额增加的百分比。如第一网的金额是100，加码比例是5%，那么下一网的买入金额是105",
  },
  profitMultiple: {
    title: "留利润倍数",
    body: "每一网卖出的时候，是否把利润全部卖出。设置为0则不留利润，设置为1，则表示把利润留下，收回本金。",
  },
  fundLookup: {
    title: "指数基金速查",
    body: "整理汇总的E大交易常用的指数基金速查。内测中，敬请关注。",
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
  return window.location.hash.startsWith("#create") ? "create" : "dashboard";
}

function HelpButton({ helpKey, onOpen }) {
  if (!helpKey) return <span className="field-spacer" aria-hidden="true" />;
  return (
    <button
      className="help-button"
      type="button"
      aria-label={`查看${HELP[helpKey].title}说明`}
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
          label={`${title}开关`}
          onChange={(enabled) => setGrid("enabled", enabled)}
        />
        <strong>{title}</strong>
      </div>

      {grid.enabled && (
        <div className="field-list">
          <FieldRow
            label="网格档差(%)"
            value={grid.stepPct}
            type="number"
            inputMode="decimal"
            placeholder="网格的档差或步长"
            helpKey={isSmall ? "stepPct" : undefined}
            onHelp={onHelp}
            onChange={(value) => setGrid("stepPct", value)}
          />
          <FieldRow
            label="每网金额(元)"
            value={grid.amountPerGrid}
            type="number"
            inputMode="decimal"
            placeholder="每网计划投入的金额"
            helpKey={isSmall ? "amountPerGrid" : undefined}
            onHelp={onHelp}
            onChange={(value) => setGrid("amountPerGrid", value)}
          />
          <FieldRow
            label="逐格加码(%)"
            value={grid.incrementPct}
            type="number"
            inputMode="decimal"
            placeholder="每网投入金额按档差递增的比例"
            helpKey={isSmall ? "incrementPct" : undefined}
            onHelp={onHelp}
            onChange={(value) => setGrid("incrementPct", value)}
          />
          <FieldRow
            label="留利润倍数"
            value={grid.profitMultiple}
            type="number"
            inputMode="decimal"
            placeholder="卖出时保留的利润倍数"
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
            <h1>基本信息</h1>
            <button
              type="button"
              className="lookup-button"
              onClick={() => onHelp(HELP.fundLookup)}
            >
              <i className="bi bi-search" aria-hidden="true" />
              指数基金速查
            </button>
          </div>
          <div className="field-list">
            <FieldRow
              label="品种名称"
              value={draft.name}
              placeholder="网格品种的名称"
              helpKey="name"
              onHelp={onHelp}
              onChange={(value) => setRoot("name", value)}
            />
            <FieldRow
              label="交易代码"
              value={draft.code}
              placeholder="品种的交易代码"
              helpKey="code"
              onHelp={onHelp}
              onChange={(value) => setRoot("code", value.replace(/[^\w]/g, ""))}
            />
            <FieldRow
              label="建仓价格"
              value={draft.initPrice}
              type="number"
              inputMode="decimal"
              placeholder="网格的首网价格"
              helpKey="initPrice"
              onHelp={onHelp}
              onChange={(value) => setRoot("initPrice", value)}
            />
            <div className="field-row quantity-row">
              <label>数量凑整</label>
              <div className="radio-stack">
                <label>
                  <input
                    type="radio"
                    name="quantityRound"
                    checked={draft.quantityRound === "100"}
                    onChange={() => setRoot("quantityRound", "100")}
                  />
                  <span className="radio-icon" aria-hidden="true"><i className="bi bi-check" /></span>
                  <span>按100凑整</span>
                </label>
                <label>
                  <input
                    type="radio"
                    name="quantityRound"
                    checked={draft.quantityRound === "none"}
                    onChange={() => setRoot("quantityRound", "none")}
                  />
                  <span className="radio-icon" aria-hidden="true"><i className="bi bi-check" /></span>
                  <span>不用凑整</span>
                </label>
              </div>
              <HelpButton helpKey="quantityRound" onOpen={onHelp} />
            </div>
            <FieldRow
              label="最大跌幅(%)"
              value={draft.maxDrawdownPct}
              type="number"
              inputMode="decimal"
              placeholder="超出最大跌幅则不再投入"
              helpKey="maxDrawdownPct"
              onHelp={onHelp}
              onChange={(value) => setRoot("maxDrawdownPct", value)}
            />
          </div>
        </section>

        <GridSection
          type="small"
          title="小网"
          grid={draft.small}
          setGrid={(key, value) => setGrid("small", key, value)}
          onHelp={onHelp}
        />
        <GridSection
          type="mid"
          title="中网"
          grid={draft.mid}
          setGrid={(key, value) => setGrid("mid", key, value)}
          onHelp={onHelp}
        />
        <GridSection
          type="big"
          title="大网"
          grid={draft.big}
          setGrid={(key, value) => setGrid("big", key, value)}
          onHelp={onHelp}
        />

        <div className="form-actions">
          <button className="primary-button pressure-button" type="submit">
            压力测试
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
              <th>买入价</th>
              <th>买入数量</th>
              <th>买入金额</th>
              <th>卖出价</th>
              <th>卖出数量</th>
              <th>卖出金额</th>
              <th>利润</th>
              <th>盈利比</th>
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
      <section className="result-sheet" role="dialog" aria-modal="true" aria-label="压力测试结果">
        <div className="result-content">
          <header className="result-header">
            <h2>【{result.name}】-【{result.code}】网格数据</h2>
            <div className="result-summary">
              <div>
                <span>总网格数</span>
                <strong>{result.gridNum}</strong>
              </div>
              <div>
                <span>最大跌幅</span>
                <strong>{number(result.maxDrawdownPct, 0)}%</strong>
              </div>
              <div>
                <span>最大投入(元)</span>
                <strong>{plainNumber(result.maxAmount)}</strong>
              </div>
            </div>
          </header>
          <ResultTable title="小网" rows={result.groups.small} />
          <ResultTable title="中网" rows={result.groups.mid} />
          <ResultTable title="大网" rows={result.groups.big} />
        </div>
        <footer className="sheet-actions">
          <button className="secondary-button" type="button" onClick={onReset}>
            {savedView ? "关闭" : "重新设置"}
          </button>
          {savedView ? (
            <button className="primary-button" type="button" onClick={onEdit}>
              编辑策略
            </button>
          ) : (
            <button className="primary-button" type="button" onClick={onSave}>
              保存策略
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
        <span className={`status-badge ${running ? "running" : "pending"}`}>
          {running ? "执行中" : "未执行"}
        </span>
      </header>
      <div className="strategy-metrics">
        <div><span>网格数</span><strong>{strategy.result.gridNum}</strong></div>
        <div><span>最大跌幅</span><strong>{number(strategy.result.maxDrawdownPct, 0)}%</strong></div>
        <div><span>最大投入</span><strong>¥{number(strategy.result.maxAmount)}</strong></div>
        <div><span>单轮利润</span><strong>¥{number(strategy.result.totalProfit)}</strong></div>
      </div>
      <footer>
        <button type="button" onClick={onView}>查看详情</button>
        <button type="button" onClick={onEdit}>编辑</button>
        <button type="button" onClick={onToggle}>{running ? "设为未执行" : "开始执行"}</button>
        <button className="danger-link" type="button" onClick={onDelete}>删除</button>
      </footer>
    </article>
  );
}

function Dashboard({
  strategies,
  onCreate,
  onView,
  onEdit,
  onToggle,
  onDelete,
}) {
  const [filter, setFilter] = useState("all");
  const counts = {
    all: strategies.length,
    running: strategies.filter((item) => item.status === "running").length,
    pending: strategies.filter((item) => item.status !== "running").length,
  };
  const visible = strategies.filter((item) => filter === "all" || item.status === filter);

  return (
    <main className="dashboard-page">
      <nav className="status-tabs" aria-label="策略状态筛选">
        {[
          ["all", "全部"],
          ["running", "执行中"],
          ["pending", "未执行"],
        ].map(([key, label]) => (
          <button
            key={key}
            type="button"
            className={filter === key ? "active" : ""}
            onClick={() => setFilter(key)}
          >
            {label}({counts[key]})
          </button>
        ))}
      </nav>

      <div className="dashboard-content">
        {!visible.length ? (
          <div className="empty-notice">
            {strategies.length
              ? `暂无${filter === "running" ? "执行中" : "未执行"}的网格策略`
              : "您还没有创建自己的网格数据"}
          </div>
        ) : (
          <div className="strategy-list">
            {visible.map((strategy) => (
              <StrategyCard
                key={strategy.id}
                strategy={strategy}
                onView={() => onView(strategy)}
                onEdit={() => onEdit(strategy)}
                onToggle={() => onToggle(strategy.id)}
                onDelete={() => onDelete(strategy.id)}
              />
            ))}
          </div>
        )}
      </div>

      <footer className="dashboard-footer">
        <p>
          您是【本地用户】 最多可以创建 <strong>{MAX_STRATEGIES}</strong> 个网格
          <span>已使用 {strategies.length}/{MAX_STRATEGIES}</span>
        </p>
        <button
          className="primary-button create-button"
          type="button"
          disabled={strategies.length >= MAX_STRATEGIES}
          onClick={onCreate}
        >
          创建网格策略
        </button>
      </footer>
    </main>
  );
}

function HelpDialog({ content, onClose }) {
  if (!content) return null;
  return (
    <div className="help-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className="help-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="help-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header>
          <h2 id="help-title">{content.title}</h2>
          <button type="button" aria-label="关闭说明" onClick={onClose}>
            <i className="bi bi-x-lg" aria-hidden="true" />
          </button>
        </header>
        <p>{content.body}</p>
        <button className="primary-button" type="button" onClick={onClose}>知道了</button>
      </section>
    </div>
  );
}

export function App() {
  const [page, setPage] = useState(routeFromHash);
  const [strategies, setStrategies] = useState(readStrategies);
  const [draft, setDraft] = useState(() => cloneForm(SAMPLE_FORM));
  const [editingId, setEditingId] = useState(null);
  const [preview, setPreview] = useState(null);
  const [viewingStrategy, setViewingStrategy] = useState(null);
  const [help, setHelp] = useState(null);
  const [toast, setToast] = useState("");

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(strategies));
  }, [strategies]);

  useEffect(() => {
    const onHashChange = () => {
      const hash = window.location.hash;
      setPage(routeFromHash());
      if (!hash.endsWith("/preview")) setPreview(null);
      if (!hash.endsWith("/view")) setViewingStrategy(null);
    };
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key !== "Escape") return;

      if (help) {
        setHelp(null);
      } else if (preview) {
        window.history.back();
      } else if (viewingStrategy) {
        window.history.back();
      } else if (page === "create") {
        navigate("dashboard");
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [help, page, preview, viewingStrategy]);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(""), 3000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const sortedStrategies = useMemo(
    () => [...strategies].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    [strategies],
  );

  const navigate = (next) => {
    window.location.hash = next === "create" ? "create" : "strategies";
    setPage(next);
    window.scrollTo({ top: 0, behavior: "instant" });
  };

  const startCreate = () => {
    setDraft(cloneForm(SAMPLE_FORM));
    setEditingId(null);
    setPreview(null);
    navigate("create");
  };

  const editStrategy = (strategy) => {
    setDraft(cloneForm(strategy.config));
    setEditingId(strategy.id);
    setPreview(null);
    setViewingStrategy(null);
    navigate("create");
  };

  const runPreview = () => {
    const error = validateGridForm(draft);
    if (error) {
      setToast(error);
      return;
    }
    setPreview(calculateGrid(draft));
    window.location.hash = "create/preview";
  };

  const closePreview = () => {
    if (window.location.hash.endsWith("/preview")) {
      window.history.back();
    } else {
      setPreview(null);
    }
  };

  const viewStrategy = (strategy) => {
    setViewingStrategy(strategy);
    window.location.hash = "strategies/view";
  };

  const closeViewingStrategy = () => {
    if (window.location.hash.endsWith("/view")) {
      window.history.back();
    } else {
      setViewingStrategy(null);
    }
  };

  const savePreview = () => {
    if (!editingId && strategies.length >= MAX_STRATEGIES) {
      setToast(`最多只能创建 ${MAX_STRATEGIES} 个网格策略。`);
      return;
    }

    const now = new Date().toISOString();
    setStrategies((current) => {
      const existing = current.find((item) => item.id === editingId);
      const item = {
        id: editingId || crypto.randomUUID(),
        status: existing?.status || "pending",
        createdAt: existing?.createdAt || now,
        updatedAt: now,
        config: cloneForm(draft),
        result: preview,
      };
      return existing
        ? current.map((strategy) => (strategy.id === editingId ? item : strategy))
        : [...current, item];
    });
    setPreview(null);
    setEditingId(null);
    setToast("策略已保存到本机");
    navigate("dashboard");
  };

  const deleteStrategy = (id) => {
    const strategy = strategies.find((item) => item.id === id);
    if (!strategy || !window.confirm(`确定删除“${strategy.result.name}”网格策略吗？`)) return;
    setStrategies((current) => current.filter((item) => item.id !== id));
  };

  return (
    <>
      {page === "create" ? (
        <CreateStrategy
          draft={draft}
          setDraft={setDraft}
          onPreview={runPreview}
          onHelp={setHelp}
        />
      ) : (
        <Dashboard
          strategies={sortedStrategies}
          onCreate={startCreate}
          onView={viewStrategy}
          onEdit={editStrategy}
          onToggle={(id) =>
            setStrategies((current) =>
              current.map((item) =>
                item.id === id
                  ? {
                      ...item,
                      status: item.status === "running" ? "pending" : "running",
                      updatedAt: new Date().toISOString(),
                    }
                  : item,
              ),
            )
          }
          onDelete={deleteStrategy}
        />
      )}

      {preview && (
        <ResultPanel
          result={preview}
          onReset={closePreview}
          onSave={savePreview}
        />
      )}
      {viewingStrategy && (
        <ResultPanel
          result={viewingStrategy.result}
          savedView
          onReset={closeViewingStrategy}
          onEdit={() => editStrategy(viewingStrategy)}
        />
      )}
      <HelpDialog content={help} onClose={() => setHelp(null)} />
      {toast && <div className="top-toast" role="alert">{toast}</div>}
    </>
  );
}
