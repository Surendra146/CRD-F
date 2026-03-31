const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboard.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const tenantIsolation = require('../middlewares/tenant.middleware');
const { dashboardValidator } = require('../utils/validators');

router.use(authenticate);
router.use(tenantIsolation);

router.post('/', authorize('admin', 'manager'), dashboardValidator, dashboardController.createDashboard);
router.get('/', dashboardController.getDashboards);
router.get('/:id', dashboardController.getDashboardById);
router.put('/:id', authorize('admin', 'manager'), dashboardController.updateDashboard);
router.delete('/:id', authorize('admin', 'manager'), dashboardController.deleteDashboard);

module.exports = router;