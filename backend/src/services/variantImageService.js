const { uploadBuffer, deleteFile } = require('./gridfs');

const MAX_IMAGES_PER_VARIANT = parseInt(process.env.MAX_IMAGES_PER_VARIANT, 10) || 10;

const buildImageUrl = (fileId) => `/api/images/file/${fileId}`;

const uploadFilesForVariant = async (_req, variant, files = []) => {
  const uploadedFileIds = [];

  try {
    const existingCount = variant.images?.length ?? 0;
    const incomingCount = files.length;
    if (existingCount + incomingCount > MAX_IMAGES_PER_VARIANT) {
      const err = new Error(`Maximum ${MAX_IMAGES_PER_VARIANT} images allowed per variant`);
      err.statusCode = 400;
      throw err;
    }

    for (const file of files) {
      const stored = await uploadBuffer({
        buffer: file.buffer,
        filename: file.originalname,
        contentType: file.mimetype,
        metadata: {
          variantId: variant._id.toString(),
          sku: variant.sku,
        },
      });

      uploadedFileIds.push(stored.fileId);

      variant.images.push({
        fileId: stored.fileId,
        filename: stored.filename,
        contentType: stored.contentType,
        size: stored.size,
        url: buildImageUrl(stored.fileId),
        isPrimary: variant.images.length === 0,
        sortOrder: variant.images.length,
      });
    }

    return variant.images;
  } catch (err) {
    await Promise.all(uploadedFileIds.map((fileId) => deleteFile(fileId)));
    throw err;
  }
};

module.exports = {
  buildImageUrl,
  uploadFilesForVariant,
};
