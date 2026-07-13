import test from "node:test";
import assert from "node:assert/strict";
import {
  calculateGrid,
  cloneForm,
  EMPTY_FORM,
  SAMPLE_FORM,
} from "../src/gridMath.js";

test("matches the supplied Securities ETF pressure-test screenshot", () => {
  const result = calculateGrid(SAMPLE_FORM);

  assert.equal(result.gridNum, 19);
  assert.equal(result.maxAmount, 25127.2);
  assert.equal(result.groups.small.length, 13);
  assert.equal(result.groups.mid.length, 4);
  assert.equal(result.groups.big.length, 2);
  assert.deepEqual(result.groups.small[0], {
    type: "small",
    gridLabel: "小网",
    priceDigits: 3,
    gridLevel: 1,
    levelPct: 1,
    buyPrice: 1.12,
    buyQuantity: 900,
    buyAmount: 1008,
    sellPrice: 1.176,
    sellQuantity: 900,
    sellAmount: 1058.4,
    profitAmount: 50.4,
    profitRate: 0.05,
  });
  assert.deepEqual(result.groups.small.at(-1), {
    type: "small",
    gridLabel: "小网",
    priceDigits: 3,
    gridLevel: 13,
    levelPct: 0.4,
    buyPrice: 0.448,
    buyQuantity: 2200,
    buyAmount: 985.6,
    sellPrice: 0.504,
    sellQuantity: 2200,
    sellAmount: 1108.8,
    profitAmount: 123.2,
    profitRate: 0.125,
  });
});

test("supports unrounded quantities, linear increment, and retained profit", () => {
  const form = cloneForm(EMPTY_FORM);
  form.name = "公式校验";
  form.code = "000000";
  form.initPrice = "1";
  form.maxDrawdownPct = "20";
  form.quantityRound = "none";
  form.small.incrementPct = "10";
  form.small.profitMultiple = "1";

  const result = calculateGrid(form);
  assert.equal(result.gridNum, 5);
  assert.deepEqual(
    result.groups.small.slice(0, 3).map((row) => ({
      buyAmount: row.buyAmount,
      buyQuantity: row.buyQuantity,
      sellQuantity: row.sellQuantity,
    })),
    [
      { buyAmount: 1000, buyQuantity: 1000, sellQuantity: 952.38 },
      { buyAmount: 1100, buyQuantity: 1157.89, sellQuantity: 1100 },
      { buyAmount: 1200, buyQuantity: 1333.33, sellQuantity: 1263.16 },
    ],
  );
});

test("matches the source default small-grid capital total", () => {
  const form = cloneForm(EMPTY_FORM);
  form.name = "默认样例";
  form.code = "000000";
  form.initPrice = "1";

  const result = calculateGrid(form);
  assert.equal(result.gridNum, 13);
  assert.equal(result.maxAmount, 13025);
});
