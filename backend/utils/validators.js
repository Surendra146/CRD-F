const { body, param, query } = require('express-validator');

const registerValidator = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('tenantName').optional().trim()
];

const loginValidator = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required')
];

const dashboardValidator = [
  body('name').trim().notEmpty().withMessage('Dashboard name is required'),
  body('description').optional().trim(),
  body('excelSourcesCount').isInt({ min: 1, max: 20 }).withMessage('Excel sources count must be between 1 and 20'),
  body('sourceNames').isArray({ min: 1 }).withMessage('Source names must be an array')
];

const columnMappingValidator = [
  body('dashboardId').isMongoId().withMessage('Valid dashboard ID required'),
  body('sourceName').trim().notEmpty().withMessage('Source name required'),
  body('columnMapping').isObject().withMessage('Column mapping must be an object')
];

module.exports = {
  registerValidator,
  loginValidator,
  dashboardValidator,
  columnMappingValidator
};