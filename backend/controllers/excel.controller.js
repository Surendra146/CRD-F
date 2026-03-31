const path = require('path');
const Dashboard = require('../models/Dashboard');
const ExcelData = require('../models/ExcelData');
const excelService = require('../services/excel.service');

class ExcelController {
  async uploadExcel(req, res, next) {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }
      
      const { dashboardId, sourceName } = req.body;
      
      if (!dashboardId || !sourceName) {
        return res.status(400).json({ error: 'Dashboard ID and source name are required' });
      }
      
      const dashboard = await Dashboard.findOne({
        _id: dashboardId,
        tenantId: req.tenantId
      });
      
      if (!dashboard) {
        excelService.deleteFile(req.file.path);
        return res.status(404).json({ error: 'Dashboard not found' });
      }
      
      const sourceConfig = dashboard.excelSourcesConfig.find(s => s.name === sourceName);
      
      if (!sourceConfig) {
        excelService.deleteFile(req.file.path);
        return res.status(400).json({ error: 'Invalid source name' });
      }
      
      const { headers, data, rowCount } = await excelService.parseExcelFile(req.file.path);
      
      const excelData = await excelService.saveExcelData(
        dashboardId,
        req.tenantId,
        sourceName,
        req.file.originalname,
        data,
        req.user._id
      );
      
      sourceConfig.uploadedFileName = req.file.originalname;
      sourceConfig.uploadedAt = new Date();
      sourceConfig.status = 'uploaded';
      await dashboard.save();
      
      excelService.deleteFile(req.file.path);
      
      res.status(201).json({
        excelDataId: excelData._id,
        headers,
        rowCount,
        message: 'File uploaded successfully'
      });
    } catch (error) {
      if (req.file) {
        excelService.deleteFile(req.file.path);
      }
      next(error);
    }
  }
  
  async mapColumns(req, res, next) {
    try {
      const { excelDataId, columnMapping } = req.body;
      
      if (!excelDataId || !columnMapping) {
        return res.status(400).json({ error: 'Excel data ID and column mapping are required' });
      }
      
      const excelData = await ExcelData.findOne({
        _id: excelDataId,
        tenantId: req.tenantId
      });
      
      if (!excelData) {
        return res.status(404).json({ error: 'Excel data not found' });
      }
      
      const processedData = await excelService.processWithMapping(
        excelData.rawData,
        columnMapping
      );
      
      const updatedExcelData = await excelService.updateColumnMapping(
        excelDataId,
        columnMapping,
        processedData
      );
      
      const dashboard = await Dashboard.findById(excelData.dashboardId);
      const sourceConfig = dashboard.excelSourcesConfig.find(
        s => s.name === excelData.sourceName
      );
      
      if (sourceConfig) {
        sourceConfig.status = 'mapped';
        await dashboard.save();
      }
      
      res.json({
        message: 'Column mapping saved successfully',
        processedRecords: processedData.length
      });
    } catch (error) {
      next(error);
    }
  }
  
  async getExcelData(req, res, next) {
    try {
      const { dashboardId } = req.params;
      
      const excelDataRecords = await ExcelData.find({
        dashboardId,
        tenantId: req.tenantId
      });
      
      res.json(excelDataRecords);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ExcelController();