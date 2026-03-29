export const TEST_PREFIX = `PW-${Date.now()}`;

export const testData = {
  categoryName: `${TEST_PREFIX} Bedsheets`,
  typeName: `${TEST_PREFIX} Stripe`,
  sizes: ['Single', 'King'],
  colorAName: `${TEST_PREFIX} White`,
  colorAHex: '#FFFFFF',
  colorBName: `${TEST_PREFIX} Blue`,
  colorBHex: '#0000FF',
  variantA: {
    size: 'Single',
    costPrice: 1000,
    sellPrice: 1500,
    lowStockThreshold: 5,
    stockInQty: 10,
  },
  variantB: {
    size: 'King',
    costPrice: 1200,
    sellPrice: 1800,
    lowStockThreshold: 5,
    stockInQty: 8,
  },
  order: {
    customerName: 'John Test',
    customerPhone: '771234567',
    customerAddress: 'No. 45, Flower Road, Colombo 07',
    itemAQTY: 2,
    itemBQTY: 1,
    itemBDiscountPercent: 10,
  },
  coupon: {
    code: `${TEST_PREFIX}SAVE5`,
    type: 'fixed' as const,
    value: 500,
  },
  manualDiscountFixed: 100,
};

export const calculations = {
  firstOrder() {
    const aGross = testData.order.itemAQTY * testData.variantA.sellPrice;
    const bGross = testData.order.itemBQTY * testData.variantB.sellPrice;
    const bDiscount = (bGross * testData.order.itemBDiscountPercent) / 100;
    const subtotal = aGross + bGross;
    const total = subtotal - bDiscount;
    const cost =
      testData.order.itemAQTY * testData.variantA.costPrice +
      testData.order.itemBQTY * testData.variantB.costPrice;
    const profit = total - cost;
    return { aGross, bGross, bDiscount, subtotal, total, cost, profit };
  },
  secondOrder() {
    const subtotal = testData.variantA.sellPrice;
    const total = subtotal - testData.coupon.value - testData.manualDiscountFixed;
    const cost = testData.variantA.costPrice;
    const profit = total - cost;
    return { subtotal, total, cost, profit };
  },
};

export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
