export const EMPTY_FORM = {
  name: "",
  code: "",
  initPrice: "",
  quantityRound: "100",
  maxDrawdownPct: "60",
  small: {
    enabled: true,
    stepPct: "5",
    amountPerGrid: "1000",
    incrementPct: "0",
    profitMultiple: "0",
  },
  mid: {
    enabled: false,
    stepPct: "15",
    amountPerGrid: "",
    incrementPct: "0",
    profitMultiple: "0",
  },
  big: {
    enabled: false,
    stepPct: "30",
    amountPerGrid: "",
    incrementPct: "0",
    profitMultiple: "0",
  },
};

export const SAMPLE_FORM = {
  ...EMPTY_FORM,
  name: "证券",
  code: "512880",
  initPrice: "1.12",
  small: { ...EMPTY_FORM.small },
  mid: {
    ...EMPTY_FORM.mid,
    enabled: true,
    amountPerGrid: "2000",
  },
  big: {
    ...EMPTY_FORM.big,
    enabled: true,
    amountPerGrid: "2000",
  },
};

const GRID_META = {
  small: { label: "小网", priceDigits: 3 },
  mid: { label: "中网", priceDigits: 4 },
  big: { label: "大网", priceDigits: 4 },
};

function round(value, digits = 2) {
  const factor = 10 ** digits;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

function roundQuantity(value, useHundreds) {
  if (!useHundreds) return round(value, 2);
  return Math.max(100, Math.round(value / 100) * 100);
}

function asNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function validateGridForm(form) {
  if (!form.name.trim()) return "请填写品种名称！";
  if (!form.code.trim()) return "请填写品种交易代码！";
  if (!(asNumber(form.initPrice) > 0)) return "请填写品种的首网价格！";

  const step = asNumber(form.small.stepPct);
  if (!step) return "请填写小网档差。档差单位是(%)";
  if (step < 1) return "档差单位是(%)，请填写大于1的数字！";
  if (step > 100) return "档差单位是(%)，档差请填写小于100！";

  const drawdown = asNumber(form.maxDrawdownPct);
  if (!(drawdown > 0 && drawdown < 100)) return "最大跌幅请输入 1 到 99 之间的数字。";

  for (const key of ["small", "mid", "big"]) {
    const grid = form[key];
    if (!grid.enabled) continue;
    if (!(asNumber(grid.stepPct) > 0 && asNumber(grid.stepPct) <= 100)) {
      return `${GRID_META[key].label}档差请输入 1 到 100 之间的数字。`;
    }
    const amount = asNumber(grid.amountPerGrid, asNumber(form.small.amountPerGrid));
    if (!(amount > 0)) return `请填写${GRID_META[key].label}每网金额。`;
  }

  return "";
}

function buildRows({
  type,
  initPrice,
  maxDrawdown,
  stepPct,
  amountPerGrid,
  incrementPct,
  profitMultiple,
  useHundreds,
}) {
  const rows = [];
  const step = stepPct / 100;
  const increment = incrementPct / 100;
  const isSmall = type === "small";
  let levelPct = isSmall ? 1 : round(1 - step, 2);
  let gridLevel = 1;

  while (
    levelPct > 0 &&
    1 - levelPct <= maxDrawdown + 1e-9 &&
    gridLevel <= 500
  ) {
    const buyPrice = round(initPrice * levelPct, 4);
    const sellPrice = round(initPrice * (levelPct + step), 4);
    const plannedAmount = round(
      amountPerGrid * (1 + (gridLevel - 1) * increment),
      2,
    );
    const buyQuantity = roundQuantity(plannedAmount / buyPrice, useHundreds);
    const buyAmount = useHundreds
      ? round(buyQuantity * buyPrice, 4)
      : plannedAmount;
    const profitAmount = round(sellPrice * buyQuantity - buyAmount, 4);
    const unroundedSellQuantity =
      buyQuantity - (profitMultiple * profitAmount) / sellPrice;
    const sellQuantity = roundQuantity(unroundedSellQuantity, useHundreds);
    const sellAmount = round(sellQuantity * sellPrice, 4);

    rows.push({
      type,
      gridLabel: GRID_META[type].label,
      priceDigits: GRID_META[type].priceDigits,
      gridLevel,
      levelPct,
      buyPrice,
      buyQuantity,
      buyAmount,
      sellPrice,
      sellQuantity,
      sellAmount,
      profitAmount,
      profitRate: round((sellPrice - buyPrice) / buyPrice, 4),
    });

    levelPct = round(levelPct - step, 2);
    gridLevel += 1;
  }

  return rows;
}

export function calculateGrid(form) {
  const initPrice = round(asNumber(form.initPrice), 3);
  const maxDrawdown = asNumber(form.maxDrawdownPct) / 100;
  const useHundreds = form.quantityRound === "100";
  const fallbackAmount = asNumber(form.small.amountPerGrid);
  const groups = {};

  for (const type of ["small", "mid", "big"]) {
    const config = form[type];
    groups[type] = config.enabled
      ? buildRows({
          type,
          initPrice,
          maxDrawdown,
          stepPct: asNumber(config.stepPct),
          amountPerGrid: asNumber(config.amountPerGrid, fallbackAmount) || fallbackAmount,
          incrementPct: asNumber(config.incrementPct),
          profitMultiple: asNumber(config.profitMultiple),
          useHundreds,
        })
      : [];
  }

  const rows = [...groups.small, ...groups.mid, ...groups.big];
  const maxAmount = round(
    rows.reduce((sum, row) => sum + row.buyAmount, 0),
    2,
  );
  const totalProfit = round(
    rows.reduce((sum, row) => sum + row.profitAmount, 0),
    2,
  );

  return {
    name: form.name.trim(),
    code: form.code.trim(),
    initPrice,
    maxDrawdownPct: asNumber(form.maxDrawdownPct),
    gridNum: rows.length,
    maxAmount,
    totalProfit,
    returnOnCapital: maxAmount ? round((totalProfit / maxAmount) * 100, 2) : 0,
    groups,
  };
}

export function cloneForm(form) {
  return {
    ...form,
    small: { ...form.small },
    mid: { ...form.mid },
    big: { ...form.big },
  };
}
