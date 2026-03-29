const WebsiteSettings = require('../models/WebsiteSettings');

const WEBSITE_SETTINGS_KEY = 'website';

const getOrCreateWebsiteSettings = async () => {
  let settings = await WebsiteSettings.findOne({ key: WEBSITE_SETTINGS_KEY }).select('-__v');
  if (settings) return settings;

  settings = await WebsiteSettings.create({ key: WEBSITE_SETTINGS_KEY });
  return WebsiteSettings.findById(settings._id).select('-__v');
};

module.exports = {
  WEBSITE_SETTINGS_KEY,
  getOrCreateWebsiteSettings,
};
