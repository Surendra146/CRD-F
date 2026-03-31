const { validationResult } = require('express-validator');
const Dashboard = require('../models/Dashboard');
const ExcelData = require('../models/ExcelData');

class DashboardController {
  async createDashboard(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      
      const { name, description, excelSourcesCount, sourceNames } = req.body;
      
      if (sourceNames.length !== parseInt(excelSourcesCount)) {
        return res.status(400).json({ 
          error: 'Source names count must match excelSourcesCount' 
        });
      }
      
      const excelSourcesConfig = sourceNames.map(sourceName => ({
        name: sourceName,
        requiredColumns: [],
        status: 'pending'
      }));
      
      const dashboard = new Dashboard({
        name,
        description,
        tenantId: req.tenantId,
        createdBy: req.user._id,
        excelSourcesConfig
      });
      
      await dashboard.save();
      
      res.status(201).json(dashboard);
    } catch (error) {
      next(error);
    }
  }
  
  async getDashboards(req, res, next) {
    try {
      const dashboards = await Dashboard.find({ 
        tenantId: req.tenantId,
        isActive: true 
      })
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });
      
      res.json(dashboards);
    } catch (error) {
      next(error);
    }
  }
  
  async getDashboardById(req, res, next) {
    try {
      const { id } = req.params;
      
      const dashboard = await Dashboard.findOne({
        _id: id,
        tenantId: req.tenantId
      }).populate('createdBy', 'name email');
      
      if (!dashboard) {
        return res.status(404).json({ error: 'Dashboard not found' });
      }
      
      res.json(dashboard);
    } catch (error) {
      next(error);
    }
  }
  
  async updateDashboard(req, res, next) {
    try {
      const { id } = req.params;
      const { name, description, layout } = req.body;
      
      const dashboard = await Dashboard.findOne({
        _id: id,
        tenantId: req.tenantId
      });
      
      if (!dashboard) {
        return res.status(404).json({ error: 'Dashboard not found' });
      }
      
      if (req.user.role === 'viewer') {
        return res.status(403).json({ error: 'Viewers cannot update dashboards' });
      }
      
      if (name) dashboard.name = name;
      if (description !== undefined) dashboard.description = description;
      if (layout) dashboard.layout = layout;
      dashboard.updatedAt = Date.now();
      
      await dashboard.save();
      
      res.json(dashboard);
    } catch (error) {
      next(error);
    }
  }
  
  async deleteDashboard(req, res, next) {
    try {
      const { id } = req.params;
      
      const dashboard = await Dashboard.findOne({
        _id: id,
        tenantId: req.tenantId
      });
      
      if (!dashboard) {
        return res.status(404).json({ error: 'Dashboard not found' });
      }
      
      if (req.user.role !== 'admin' && req.user.role !== 'manager') {
        return res.status(403).json({ error: 'Insufficient permissions to delete dashboard' });
      }
      
      dashboard.isActive = false;
      dashboard.updatedAt = Date.now();
      await dashboard.save();
      
      res.json({ message: 'Dashboard deleted successfully' });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new DashboardController();