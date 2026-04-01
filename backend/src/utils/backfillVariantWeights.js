const Variant = require('../models/Variant');

const DEFAULT_WEIGHT_GRAMS = 1000;

const backfillVariantWeights = async () => {
  const result = await Variant.updateMany(
    {
      $or: [
        { weightGrams: { $exists: false } },
        { weightGrams: null },
        { weightGrams: { $lte: 0 } },
      ],
    },
    { $set: { weightGrams: DEFAULT_WEIGHT_GRAMS } }
  );

  const updatedCount = Number(result?.modifiedCount || result?.nModified || 0);
  if (updatedCount > 0) {
    console.log(`Backfilled weightGrams=${DEFAULT_WEIGHT_GRAMS} for ${updatedCount} variant(s)`);
  }
};

module.exports = {
  DEFAULT_WEIGHT_GRAMS,
  backfillVariantWeights,
};
