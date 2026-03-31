const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analytics.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const tenantIsolation = require('../middlewares/tenant.middleware');

router.use(authenticate);
router.use(tenantIsolation);

router.get('/:dashboardId', analyticsController.getAnalytics);
router.get('/:dashboardId/filters', analyticsController.getFilterOptions);
router.get('/:dashboardId/raw', analyticsController.getRawData);

module.exports = router;