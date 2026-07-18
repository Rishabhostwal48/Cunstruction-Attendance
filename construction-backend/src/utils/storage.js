const fs = require('fs');
const path = require('path');

/**
 * Storage Abstraction Layer
 * Can be extended to support AWS S3 in the future
 */

const UPLOAD_DIR = process.env.UPLOAD_DIR || './src/uploads';
const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE) || 5242880; // 5MB default
const ALLOWED_TYPES = process.env.ALLOWED_FILE_TYPES?.split(',') || ['jpg', 'jpeg', 'png', 'gif'];

/**
 * Ensure upload directory exists
 */
const ensureUploadDir = () => {
  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  }
};

/**
 * Validate file
 * @param {Object} file - Multer file object
 * @returns {Object} Validation result
 */
const validateFile = (file) => {
  if (!file) {
    return { valid: false, error: 'No file provided' };
  }

  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: `File size exceeds maximum allowed size of ${MAX_FILE_SIZE / 1024 / 1024}MB` };
  }

  const fileExt = path.extname(file.originalname).substring(1).toLowerCase();
  if (!ALLOWED_TYPES.includes(fileExt)) {
    return { valid: false, error: `File type not allowed. Allowed types: ${ALLOWED_TYPES.join(', ')}` };
  }

  return { valid: true };
};

/**
 * Generate unique filename
 * @param {string} originalname - Original filename
 * @returns {string} Unique filename
 */
const generateFilename = (originalname) => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const ext = path.extname(originalname);
  return `${timestamp}-${random}${ext}`;
};

/**
 * Save file to local storage
 * @param {Object} file - Multer file object
 * @param {string} subfolder - Subfolder in uploads directory
 * @returns {string} File path relative to uploads directory
 */
const saveFile = (file, subfolder = '') => {
  ensureUploadDir();
  
  const validation = validateFile(file);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const filename = generateFilename(file.originalname);
  let filepath = path.join(UPLOAD_DIR, filename);
  let relativePath = filename;

  if (subfolder) {
    const subdir = path.join(UPLOAD_DIR, subfolder);
    if (!fs.existsSync(subdir)) {
      fs.mkdirSync(subdir, { recursive: true });
    }
    filepath = path.join(subdir, filename);
    relativePath = `${subfolder}/${filename}`;
  }

  fs.writeFileSync(filepath, file.buffer);
  return relativePath;
};

/**
 * Delete file from local storage
 * @param {string} filepath - File path relative to uploads directory
 */
const deleteFile = (filepath) => {
  const fullPath = path.join(UPLOAD_DIR, filepath);
  if (fs.existsSync(fullPath)) {
    fs.unlinkSync(fullPath);
  }
};

/**
 * Get file URL
 * @param {string} filepath - File path relative to uploads directory
 * @returns {string} Relative URL for the file
 */
const getFileUrl = (filepath) => {
  return `/uploads/${filepath}`;
};

/**
 * AWS S3 placeholder functions for future migration
 */
const saveFileS3 = async (file, subfolder = '') => {
  throw new Error('S3 storage not yet implemented');
};

const deleteFileS3 = async (filepath) => {
  throw new Error('S3 storage not yet implemented');
};

module.exports = {
  ensureUploadDir,
  validateFile,
  generateFilename,
  saveFile,
  deleteFile,
  getFileUrl,
  saveFileS3,
  deleteFileS3,
  UPLOAD_DIR,
  MAX_FILE_SIZE,
  ALLOWED_TYPES
};
