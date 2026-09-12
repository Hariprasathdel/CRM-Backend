const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

// ==================== STRING HELPERS ====================

/**
 * Capitalize first letter of each word
 * @param {string} str - Input string
 * @returns {string} - Capitalized string
 */
const capitalizeWords = (str) => {
    if (!str) return '';
    return str
        .toLowerCase()
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
};

/**
 * Truncate string to specified length
 * @param {string} str - Input string
 * @param {number} length - Maximum length
 * @param {string} suffix - Suffix to add
 * @returns {string} - Truncated string
 */
const truncateString = (str, length = 50, suffix = '...') => {
    if (!str) return '';
    if (str.length <= length) return str;
    return str.substring(0, length) + suffix;
};

/**
 * Generate random string
 * @param {number} length - Length of string
 * @returns {string} - Random string
 */
const generateRandomString = (length = 8) => {
    return crypto
        .randomBytes(Math.ceil(length / 2))
        .toString('hex')
        .slice(0, length);
};

/**
 * Generate unique ID
 * @returns {string} - Unique ID
 */
const generateUniqueId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
};

/**
 * Slugify string
 * @param {string} str - Input string
 * @returns {string} - Slugified string
 */
const slugify = (str) => {
    if (!str) return '';
    return str
        .toLowerCase()
        .replace(/[^\w\s]/g, '')
        .replace(/\s+/g, '-');
};

// ==================== VALIDATION HELPERS ====================

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} - True if valid
 */
const isValidEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
};

/**
 * Validate phone number
 * @param {string} phone - Phone number to validate
 * @returns {boolean} - True if valid
 */
const isValidPhone = (phone) => {
    const re = /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/;
    return re.test(phone);
};

/**
 * Validate URL
 * @param {string} url - URL to validate
 * @returns {boolean} - True if valid
 */
const isValidUrl = (url) => {
    try {
        new URL(url);
        return true;
    } catch {
        return false;
    }
};

/**
 * Validate date
 * @param {string} date - Date string to validate
 * @returns {boolean} - True if valid
 */
const isValidDate = (date) => {
    return !isNaN(new Date(date).getTime());
};

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @returns {object} - { valid: boolean, message: string }
 */
const validatePasswordStrength = (password) => {
    const result = {
        valid: true,
        message: 'Password is strong',
        checks: {
            length: false,
            uppercase: false,
            lowercase: false,
            number: false,
            special: false
        }
    };

    if (password.length < 8) {
        result.valid = false;
        result.message = 'Password must be at least 8 characters long';
    } else {
        result.checks.length = true;
    }

    if (!/[A-Z]/.test(password)) {
        result.valid = false;
        result.message = 'Password must contain at least one uppercase letter';
    } else {
        result.checks.uppercase = true;
    }

    if (!/[a-z]/.test(password)) {
        result.valid = false;
        result.message = 'Password must contain at least one lowercase letter';
    } else {
        result.checks.lowercase = true;
    }

    if (!/[0-9]/.test(password)) {
        result.valid = false;
        result.message = 'Password must contain at least one number';
    } else {
        result.checks.number = true;
    }

    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
        result.valid = false;
        result.message = 'Password must contain at least one special character';
    } else {
        result.checks.special = true;
    }

    return result;
};

// ==================== DATE HELPERS ====================

/**
 * Format date
 * @param {Date|string} date - Date to format
 * @param {string} format - Format string
 * @returns {string} - Formatted date
 */
const formatDate = (date, format = 'YYYY-MM-DD') => {
    if (!date) return '';
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';

    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');

    return format
        .replace('YYYY', year)
        .replace('MM', month)
        .replace('DD', day)
        .replace('HH', hours)
        .replace('mm', minutes)
        .replace('ss', seconds);
};

/**
 * Get date range
 * @param {string} period - Period (today, week, month, year)
 * @returns {object} - { start: Date, end: Date }
 */
const getDateRange = (period) => {
    const now = new Date();
    const start = new Date(now);
    const end = new Date(now);

    switch (period) {
        case 'today':
            start.setHours(0, 0, 0, 0);
            end.setHours(23, 59, 59, 999);
            break;
        case 'week':
            start.setDate(now.getDate() - now.getDay());
            start.setHours(0, 0, 0, 0);
            end.setDate(start.getDate() + 6);
            end.setHours(23, 59, 59, 999);
            break;
        case 'month':
            start.setDate(1);
            start.setHours(0, 0, 0, 0);
            end.setMonth(now.getMonth() + 1);
            end.setDate(0);
            end.setHours(23, 59, 59, 999);
            break;
        case 'year':
            start.setMonth(0, 1);
            start.setHours(0, 0, 0, 0);
            end.setMonth(11, 31);
            end.setHours(23, 59, 59, 999);
            break;
        default:
            start.setHours(0, 0, 0, 0);
            end.setHours(23, 59, 59, 999);
    }

    return { start, end };
};

/**
 * Calculate age from date of birth
 * @param {Date} dob - Date of birth
 * @returns {number} - Age in years
 */
const calculateAge = (dob) => {
    if (!dob) return 0;
    const today = new Date();
    const birthDate = new Date(dob);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
};

/**
 * Get days between two dates
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {number} - Number of days
 */
const getDaysBetween = (startDate, endDate) => {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

// ==================== NUMBER HELPERS ====================

/**
 * Format currency
 * @param {number} amount - Amount to format
 * @param {string} currency - Currency symbol
 * @param {string} locale - Locale
 * @returns {string} - Formatted currency
 */
const formatCurrency = (amount, currency = '$', locale = 'en-US') => {
    if (amount === undefined || amount === null) return `${currency}0.00`;
    return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: currency === '$' ? 'USD' : 'EUR'
    }).format(amount);
};

/**
 * Format number with commas
 * @param {number} num - Number to format
 * @returns {string} - Formatted number
 */
const formatNumber = (num) => {
    if (num === undefined || num === null) return '0';
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

/**
 * Calculate percentage
 * @param {number} value - Value
 * @param {number} total - Total
 * @param {number} decimals - Decimal places
 * @returns {number} - Percentage
 */
const calculatePercentage = (value, total, decimals = 2) => {
    if (total === 0) return 0;
    return Number(((value / total) * 100).toFixed(decimals));
};

/**
 * Random number between min and max
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number} - Random number
 */
const randomNumber = (min, max) => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
};

// ==================== FILE HELPERS ====================

/**
 * Get file extension
 * @param {string} filename - Filename
 * @returns {string} - File extension
 */
const getFileExtension = (filename) => {
    if (!filename) return '';
    return filename.split('.').pop().toLowerCase();
};

/**
 * Get file size in human readable format
 * @param {number} bytes - File size in bytes
 * @returns {string} - Human readable file size
 */
const getFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
};

/**
 * Check if file is image
 * @param {string} filename - Filename
 * @returns {boolean} - True if image
 */
const isImageFile = (filename) => {
    const extensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'];
    return extensions.includes(getFileExtension(filename));
};

/**
 * Check if file is document
 * @param {string} filename - Filename
 * @returns {boolean} - True if document
 */
const isDocumentFile = (filename) => {
    const extensions = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt'];
    return extensions.includes(getFileExtension(filename));
};

/**
 * Generate unique filename
 * @param {string} originalName - Original filename
 * @returns {string} - Unique filename
 */
const generateUniqueFilename = (originalName) => {
    const ext = getFileExtension(originalName);
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `${timestamp}-${random}.${ext}`;
};

/**
 * Delete file
 * @param {string} filePath - File path
 * @returns {Promise<boolean>} - True if deleted
 */
const deleteFile = (filePath) => {
    return new Promise((resolve, reject) => {
        if (!filePath) {
            resolve(true);
            return;
        }
        fs.unlink(filePath, (err) => {
            if (err) {
                reject(err);
            } else {
                resolve(true);
            }
        });
    });
};

/**
 * Ensure directory exists
 * @param {string} dirPath - Directory path
 * @returns {Promise<boolean>} - True if exists
 */
const ensureDirectoryExists = (dirPath) => {
    return new Promise((resolve, reject) => {
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
        }
        resolve(true);
    });
};

// ==================== JWT HELPERS ====================

/**
 * Generate JWT token
 * @param {Object} payload - Payload to encode
 * @param {string} expiresIn - Expiration time
 * @returns {string} - JWT token
 */
const generateToken = (payload, expiresIn = '30d') => {
    return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });
};

/**
 * Verify JWT token
 * @param {string} token - JWT token
 * @returns {Object} - Decoded payload
 */
const verifyToken = (token) => {
    try {
        return jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
        return null;
    }
};

/**
 * Decode JWT token without verification
 * @param {string} token - JWT token
 * @returns {Object} - Decoded payload
 */
const decodeToken = (token) => {
    try {
        return jwt.decode(token);
    } catch (error) {
        return null;
    }
};

// ==================== OBJECT HELPERS ====================

/**
 * Deep clone object
 * @param {Object} obj - Object to clone
 * @returns {Object} - Cloned object
 */
const deepClone = (obj) => {
    return JSON.parse(JSON.stringify(obj));
};

/**
 * Pick specific fields from object
 * @param {Object} obj - Source object
 * @param {Array} fields - Fields to pick
 * @returns {Object} - New object with picked fields
 */
const pickFields = (obj, fields) => {
    const result = {};
    fields.forEach(field => {
        if (obj && obj[field] !== undefined) {
            result[field] = obj[field];
        }
    });
    return result;
};

/**
 * Omit specific fields from object
 * @param {Object} obj - Source object
 * @param {Array} fields - Fields to omit
 * @returns {Object} - New object without omitted fields
 */
const omitFields = (obj, fields) => {
    const result = { ...obj };
    fields.forEach(field => {
        delete result[field];
    });
    return result;
};

/**
 * Check if object is empty
 * @param {Object} obj - Object to check
 * @returns {boolean} - True if empty
 */
const isEmptyObject = (obj) => {
    return obj && Object.keys(obj).length === 0 && obj.constructor === Object;
};

// ==================== ARRAY HELPERS ====================

/**
 * Chunk array into smaller arrays
 * @param {Array} arr - Array to chunk
 * @param {number} size - Chunk size
 * @returns {Array} - Array of chunks
 */
const chunkArray = (arr, size) => {
    const chunks = [];
    for (let i = 0; i < arr.length; i += size) {
        chunks.push(arr.slice(i, i + size));
    }
    return chunks;
};

/**
 * Remove duplicates from array
 * @param {Array} arr - Array with duplicates
 * @returns {Array} - Array without duplicates
 */
const removeDuplicates = (arr) => {
    return [...new Set(arr)];
};

/**
 * Group array by key
 * @param {Array} arr - Array to group
 * @param {string} key - Key to group by
 * @returns {Object} - Grouped object
 */
const groupBy = (arr, key) => {
    return arr.reduce((result, item) => {
        const group = item[key];
        if (!result[group]) {
            result[group] = [];
        }
        result[group].push(item);
        return result;
    }, {});
};

// ==================== ENCRYPTION HELPERS ====================

/**
 * Hash password
 * @param {string} password - Password to hash
 * @returns {Promise<string>} - Hashed password
 */
const hashPassword = async (password) => {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
};

/**
 * Compare password with hash
 * @param {string} password - Password to compare
 * @param {string} hash - Hashed password
 * @returns {Promise<boolean>} - True if match
 */
const comparePassword = async (password, hash) => {
    return bcrypt.compare(password, hash);
};

/**
 * Encrypt text
 * @param {string} text - Text to encrypt
 * @param {string} secret - Secret key
 * @returns {string} - Encrypted text
 */
const encryptText = (text, secret) => {
    const cipher = crypto.createCipher('aes-256-cbc', secret);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
};

/**
 * Decrypt text
 * @param {string} encrypted - Encrypted text
 * @param {string} secret - Secret key
 * @returns {string} - Decrypted text
 */
const decryptText = (encrypted, secret) => {
    const decipher = crypto.createDecipher('aes-256-cbc', secret);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
};

/**
 * Generate random token
 * @param {number} length - Token length
 * @returns {string} - Random token
 */
const generateRandomToken = (length = 32) => {
    return crypto.randomBytes(length).toString('hex');
};

// ==================== RESPONSE HELPERS ====================

/**
 * Format API response
 * @param {boolean} success - Success status
 * @param {string} message - Response message
 * @param {*} data - Response data
 * @param {number} statusCode - HTTP status code
 * @returns {Object} - Formatted response
 */
const formatResponse = (success, message, data = null, statusCode = 200) => {
    return {
        success,
        message,
        data,
        statusCode,
        timestamp: new Date().toISOString()
    };
};

/**
 * Format error response
 * @param {string} message - Error message
 * @param {number} statusCode - HTTP status code
 * @param {*} errors - Validation errors
 * @returns {Object} - Formatted error response
 */
const formatError = (message, statusCode = 400, errors = null) => {
    return {
        success: false,
        message,
        errors,
        statusCode,
        timestamp: new Date().toISOString()
    };
};

/**
 * Format pagination response
 * @param {Array} data - Data array
 * @param {number} total - Total count
 * @param {number} page - Current page
 * @param {number} limit - Items per page
 * @returns {Object} - Formatted pagination response
 */
const formatPagination = (data, total, page, limit) => {
    const totalPages = Math.ceil(total / limit);
    return {
        data,
        pagination: {
            total,
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages,
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1,
            nextPage: page < totalPages ? parseInt(page) + 1 : null,
            prevPage: page > 1 ? parseInt(page) - 1 : null
        }
    };
};

// ==================== LOGGING HELPERS ====================

/**
 * Log message with timestamp
 * @param {string} level - Log level (info, warn, error)
 * @param {string} message - Log message
 * @param {*} data - Additional data
 */
const log = (level, message, data = null) => {
    const timestamp = new Date().toISOString();
    const logEntry = {
        timestamp,
        level,
        message,
        data
    };
    console.log(JSON.stringify(logEntry));
};

/**
 * Log info message
 * @param {string} message - Log message
 * @param {*} data - Additional data
 */
const logInfo = (message, data = null) => {
    log('info', message, data);
};

/**
 * Log warning message
 * @param {string} message - Log message
 * @param {*} data - Additional data
 */
const logWarn = (message, data = null) => {
    log('warn', message, data);
};

/**
 * Log error message
 * @param {string} message - Log message
 * @param {*} data - Additional data
 */
const logError = (message, data = null) => {
    log('error', message, data);
};

// ==================== EXPORT ALL HELPERS ====================

module.exports = {
    // String helpers
    capitalizeWords,
    truncateString,
    generateRandomString,
    generateUniqueId,
    slugify,
    
    // Validation helpers
    isValidEmail,
    isValidPhone,
    isValidUrl,
    isValidDate,
    validatePasswordStrength,
    
    // Date helpers
    formatDate,
    getDateRange,
    calculateAge,
    getDaysBetween,
    
    // Number helpers
    formatCurrency,
    formatNumber,
    calculatePercentage,
    randomNumber,
    
    // File helpers
    getFileExtension,
    getFileSize,
    isImageFile,
    isDocumentFile,
    generateUniqueFilename,
    deleteFile,
    ensureDirectoryExists,
    
    // JWT helpers
    generateToken,
    verifyToken,
    decodeToken,
    
    // Object helpers
    deepClone,
    pickFields,
    omitFields,
    isEmptyObject,
    
    // Array helpers
    chunkArray,
    removeDuplicates,
    groupBy,
    
    // Encryption helpers
    hashPassword,
    comparePassword,
    encryptText,
    decryptText,
    generateRandomToken,
    
    // Response helpers
    formatResponse,
    formatError,
    formatPagination,
    
    // Logging helpers
    log,
    logInfo,
    logWarn,
    logError
};