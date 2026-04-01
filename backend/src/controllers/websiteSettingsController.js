const { success, error } = require('../utils/apiResponse');
const { uploadBuffer, deleteFile } = require('../services/gridfs');
const { buildImageUrl } = require('../services/variantImageService');
const { getOrCreateWebsiteSettings } = require('../services/websiteSettingsService');

const normalizeImage = (image) => {
  if (!image) return null;
  if (!image.fileId || !image.filename || !image.contentType || !image.size || !image.url) return null;

  return {
    fileId: String(image.fileId),
    filename: String(image.filename),
    contentType: String(image.contentType),
    size: Number(image.size),
    url: String(image.url),
  };
};

const getWebsiteSettings = async (req, res, next) => {
  try {
    const settings = await getOrCreateWebsiteSettings();
    const data = settings.toObject();
    data.heroAutoSlide = data.heroAutoSlide !== false;
    return success(res, { data });
  } catch (err) {
    next(err);
  }
};

const updateWebsiteSettings = async (req, res, next) => {
  try {
    const settings = await getOrCreateWebsiteSettings();
    const shouldAutoSlide = typeof req.body.heroAutoSlide === 'boolean'
      ? req.body.heroAutoSlide
      : settings.heroAutoSlide !== false;

    const nextSlides = (req.body.heroSlides || []).map((slide, index) => ({
      title: String(slide.title || '').trim(),
      subtitle: String(slide.subtitle || '').trim(),
      image: normalizeImage(slide.image),
      sortOrder: Number.isFinite(Number(slide.sortOrder)) ? Number(slide.sortOrder) : index,
    }));

    const prevImageIds = new Set(
      (settings.heroSlides || [])
        .map((slide) => slide?.image?.fileId)
        .filter(Boolean)
    );
    const nextImageIds = new Set(
      nextSlides
        .map((slide) => slide?.image?.fileId)
        .filter(Boolean)
    );

    settings.heroAutoSlide = shouldAutoSlide;
    settings.heroSlides = nextSlides;
    await settings.save();

    const removedImageIds = [...prevImageIds].filter((id) => !nextImageIds.has(id));
    if (removedImageIds.length > 0) {
      await Promise.all(removedImageIds.map((fileId) => deleteFile(fileId)));
    }

    return success(res, { data: settings }, 'Website settings updated');
  } catch (err) {
    next(err);
  }
};

const uploadHeroImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return error(res, 'No file uploaded', 400);
    }

    const stored = await uploadBuffer({
      buffer: req.file.buffer,
      filename: req.file.originalname,
      contentType: req.file.mimetype,
      metadata: {
        entity: 'website-hero',
        uploadedBy: req.user?.id,
      },
    });

    const image = {
      fileId: stored.fileId,
      filename: stored.filename,
      contentType: stored.contentType,
      size: stored.size,
      url: buildImageUrl(stored.fileId),
    };

    return success(res, { data: image }, 'Hero image uploaded', 201);
  } catch (err) {
    next(err);
  }
};

const uploadGalleryImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return error(res, 'No file uploaded', 400);
    }

    const settings = await getOrCreateWebsiteSettings();

    const stored = await uploadBuffer({
      buffer: req.file.buffer,
      filename: req.file.originalname,
      contentType: req.file.mimetype,
      metadata: {
        entity: 'website-gallery',
        uploadedBy: req.user?.id,
      },
    });

    const image = {
      fileId: stored.fileId,
      filename: stored.filename,
      contentType: stored.contentType,
      size: stored.size,
      url: buildImageUrl(stored.fileId),
    };

    settings.galleryImages.push(image);
    await settings.save();

    const added = settings.galleryImages[settings.galleryImages.length - 1];
    return success(res, { data: added.toObject() }, 'Gallery image uploaded', 201);
  } catch (err) {
    next(err);
  }
};

const deleteGalleryImage = async (req, res, next) => {
  try {
    const { imageId } = req.params;
    const settings = await getOrCreateWebsiteSettings();

    const imgDoc = settings.galleryImages.id(imageId);
    if (!imgDoc) {
      return error(res, 'Gallery image not found', 404);
    }

    const fileId = imgDoc.fileId;
    imgDoc.deleteOne();
    await settings.save();

    await deleteFile(fileId);

    return success(res, {}, 'Gallery image deleted');
  } catch (err) {
    next(err);
  }
};

const getPublicGallery = async (req, res, next) => {
  try {
    const settings = await getOrCreateWebsiteSettings();
    const galleryImages = (settings.galleryImages || []).map((img) => ({
      id: String(img._id),
      url: img.url,
      filename: img.filename,
    }));
    return success(res, { data: { galleryImages } });
  } catch (err) {
    next(err);
  }
};

const getPublicBanners = async (req, res, next) => {
  try {
    const settings = await getOrCreateWebsiteSettings();
    const heroSlides = (settings.heroSlides || [])
      .slice()
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((slide) => ({
        id: String(slide._id),
        title: slide.title,
        subtitle: slide.subtitle,
        imageUrl: slide.image?.url ?? null,
      }));

    return success(res, {
      data: {
        heroAutoSlide: settings.heroAutoSlide !== false,
        heroSlides,
      },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getWebsiteSettings,
  updateWebsiteSettings,
  uploadHeroImage,
  uploadGalleryImage,
  deleteGalleryImage,
  getPublicGallery,
  getPublicBanners,
};
