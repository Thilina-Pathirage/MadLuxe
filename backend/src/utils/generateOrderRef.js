const generateOrderRef = async () => {
  // Deferred require to avoid circular dependency
  const Order = require('../models/Order');

  const count = await Order.countDocuments();
  let num = count + 1;
  let ref = `ORD-${String(num).padStart(3, '0')}`;

  while (await Order.exists({ orderRef: ref })) {
    num++;
    ref = `ORD-${String(num).padStart(3, '0')}`;
  }

  return ref;
};

module.exports = generateOrderRef;
