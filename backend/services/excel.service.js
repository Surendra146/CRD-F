const xlsx = require('xlsx');
const fs = require('fs');
const ExcelData = require('../models/ExcelData');

class ExcelService {
  async parseExcelFile(filePath) {
    try {
      const workbook = xlsx.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = xlsx.utils.sheet_to_json(worksheet);
      
      const headers = jsonData.length > 0 ? Object.keys(jsonData[0]) : [];
      
      return {
        headers,
        data: jsonData,
        rowCount: jsonData.length
      };
    } catch (error) {
      throw new Error(`Failed to parse Excel file: ${error.message}`);
    }
  }
  
  async processWithMapping(rawData, columnMapping) {
    return rawData.map(row => {
      const processed = {};
      
      for (const [targetField, sourceColumn] of Object.entries(columnMapping)) {
        const value = row[sourceColumn];
        
        if (targetField === 'date' && value) {
          processed.date = this.parseDate(value);
        } else if (targetField === 'amount' && value) {
          processed.amount = parseFloat(value) || 0;
        } else {
          processed[targetField] = value ? String(value) : '';
        }
      }
      
      processed.metadata = row;
      
      return processed;
    });
  }
  
  parseDate(value) {
    if (value instanceof Date) {
      return value;
    }
    
    if (typeof value === 'number') {
      const date = xlsx.SSF.parse_date_code(value);
      return new Date(date.y, date.m - 1, date.d);
    }
    
    const parsed = new Date(value);
    return isNaN(parsed.getTime()) ? new Date() : parsed;
  }
  
  async saveExcelData(dashboardId, tenantId, sourceName, fileName, rawData, uploadedBy) {
    const excelData = new ExcelData({
      dashboardId,
      tenantId,
      sourceName,
      fileName,
      rawData,
      uploadedBy
    });
    
    return await excelData.save();
  }
  
  async updateColumnMapping(excelDataId, columnMapping, processedData) {
    return await ExcelData.findByIdAndUpdate(
      excelDataId,
      {
        columnMapping,
        processedData,
        updatedAt: Date.now()
      },
      { new: true }
    );
  }
  
  deleteFile(filePath) {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (error) {
      console.error('Error deleting file:', error);
    }
  }
}

module.exports = new ExcelService();