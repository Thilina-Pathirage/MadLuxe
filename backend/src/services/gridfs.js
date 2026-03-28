const { Readable } = require('stream');
const mongoose = require('mongoose');

const BUCKET_NAME = process.env.GRIDFS_BUCKET || 'variantImages';

const getBucket = () => {
  const db = mongoose.connection.db;
  if (!db) {
    throw new Error('MongoDB connection is not ready');
  }

  return new mongoose.mongo.GridFSBucket(db, { bucketName: BUCKET_NAME });
};

const uploadBuffer = ({ buffer, filename, contentType, metadata = {} }) =>
  new Promise((resolve, reject) => {
    const bucket = getBucket();
    const uploadStream = bucket.openUploadStream(filename, {
      contentType,
      metadata,
    });

    Readable.from(buffer)
      .pipe(uploadStream)
      .on('error', reject)
      .on('finish', () => {
        resolve({
          fileId: uploadStream.id.toString(),
          filename: uploadStream.filename,
          contentType,
          size: buffer.length,
        });
      });
  });

const deleteFile = async (fileId) => {
  const bucket = getBucket();

  try {
    await bucket.delete(new mongoose.Types.ObjectId(fileId));
  } catch (err) {
    if (err?.message?.includes('FileNotFound')) return;
    throw err;
  }
};

const openDownloadStream = (fileId) => {
  const bucket = getBucket();
  return bucket.openDownloadStream(new mongoose.Types.ObjectId(fileId));
};

const findFile = async (fileId) => {
  const bucket = getBucket();
  const files = await bucket.find({ _id: new mongoose.Types.ObjectId(fileId) }).toArray();
  return files[0] || null;
};

const getStorageStats = async () => {
  const db = mongoose.connection.db;
  if (!db) {
    throw new Error('MongoDB connection is not ready');
  }

  const collection = db.collection(`${BUCKET_NAME}.files`);
  const [result] = await collection
    .aggregate([
      {
        $group: {
          _id: null,
          fileCount: { $sum: 1 },
          totalBytes: { $sum: '$length' },
        },
      },
    ])
    .toArray();

  const fileCount = result?.fileCount ?? 0;
  const totalBytes = result?.totalBytes ?? 0;

  return {
    bucketName: BUCKET_NAME,
    fileCount,
    totalBytes,
    totalMB: Math.round((totalBytes / (1024 * 1024)) * 100) / 100,
  };
};

module.exports = {
  BUCKET_NAME,
  uploadBuffer,
  deleteFile,
  openDownloadStream,
  findFile,
  getStorageStats,
};
