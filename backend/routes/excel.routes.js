const express = require('express');
const router = express.Router();
const excelController = require('../controllers/excel.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const tenantIsolation = require('../middlewares/tenant.middleware');
const upload = require('../middlewares/upload.middleware');

router.use(authenticate);
router.use(tenantIsolation);

router.post('/upload', authorize('admin', 'manager'), upload.single('file'), excelController.uploadExcel);
router.post('/map-columns', authorize('admin', 'manager'), excelController.mapColumns);
router.get('/:dashboardId', excelController.getExcelData);

module.exports = router;