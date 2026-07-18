/**
 * Response Helper Utilities
 */

/**
 * Send success response
 * @param {Object} res - Express response object
 * @param {number} statusCode - HTTP status code
 * @param {string} message - Response message
 * @param {any} data - Response data
 */
const sendSuccess = (res, statusCode = 200, message = 'Success', data = null) => {
  res.status(statusCode).json({
    success: true,
    statusCode,
    message,
    ...(data && { data })
  });
};

/**
 * Send error response
 * @param {Object} res - Express response object
 * @param {number} statusCode - HTTP status code
 * @param {string} message - Error message
 * @param {any} errors - Error details
 */
const sendError = (res, statusCode = 500, message = 'Error', errors = null) => {
  res.status(statusCode).json({
    success: false,
    statusCode,
    message,
    ...(errors && { errors })
  });
};

/**
 * Send paginated response
 * @param {Object} res - Express response object
 * @param {number} statusCode - HTTP status code
 * @param {string} message - Response message
 * @param {Array} data - Response data
 * @param {number} total - Total items
 * @param {number} page - Current page
 * @param {number} limit - Items per page
 */
const sendPaginated = (res, statusCode = 200, message = 'Success', data = [], total = 0, page = 1, limit = 10) => {
  res.status(statusCode).json({
    success: true,
    statusCode,
    message,
    data,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit)
    }
  });
};

module.exports = {
  sendSuccess,
  sendError,
  sendPaginated
};
