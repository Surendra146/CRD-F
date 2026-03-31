const analyticsService = require('../services/analytics.service');
const Dashboard = require('../models/Dashboard');

class AnalyticsController {
  async getAnalytics(req, res, next) {
    try {
      const { dashboardId } = req.params;
      const { dateFrom, dateTo, store, category, groupBy } = req.query;
      
      const dashboard = await Dashboard.findOne({
        _id: dashboardId,
        tenantId: req.tenantId
      });
      
      if (!dashboard) {
        return res.status(404).json({ error: 'Dashboard not found' });
      }
      
      const filters = {
        dateFrom,
        dateTo,
        store,
        category
      };
      
      const aggregatedData = await analyticsService.getAggregatedData(
        dashboardId,
        req.tenantId,
        groupBy || 'date',
        filters
      );
      
      res.json(aggregatedData);
    } catch (error) {
      next(error);
    }
  }
  
  async getFilterOptions(req, res, next) {
    try {
      const { dashboardId } = req.params;
      
      const dashboard = await Dashboard.findOne({
        _id: dashboardId,
        tenantId: req.tenantId
      });
      
      if (!dashboard) {
        return res.status(404).json({ error: 'Dashboard not found' });
      }
      
      const stores = await analyticsService.getUniqueValues(
        dashboardId,
        req.tenantId,
        'store'
      );
      
      const categories = await analyticsService.getUniqueValues(
        dashboardId,
        req.tenantId,
        'category'
      );
      
      res.json({
        stores,
        categories
      });
    } catch (error) {
      next(error);
    }
  }
  
  async getRawData(req, res, next) {
    try {
      const { dashboardId } = req.params;
      const { dateFrom, dateTo, store, category, limit = 100, skip = 0 } = req.query;
      
      const filters = {
        dateFrom,
        dateTo,
        store,
        category
      };
      
      const data = await analyticsService.getFilteredData(
        dashboardId,
        req.tenantId,
        filters
      );
      
      const paginatedData = data.slice(parseInt(skip), parseInt(skip) + parseInt(limit));
      
      res.json({
        data: paginatedData,
        total: data.length,
        limit: parseInt(limit),
        skip: parseInt(skip)
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AnalyticsController();