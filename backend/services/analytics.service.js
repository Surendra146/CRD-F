const ExcelData = require('../models/ExcelData');

class AnalyticsService {
  async getFilteredData(dashboardId, tenantId, filters = {}) {
    const query = {
      dashboardId,
      tenantId
    };
    
    const excelDataRecords = await ExcelData.find(query);
    
    let allData = [];
    excelDataRecords.forEach(record => {
      allData = allData.concat(record.processedData);
    });
    
    let filteredData = allData;
    
    if (filters.dateFrom) {
      filteredData = filteredData.filter(item => 
        new Date(item.date) >= new Date(filters.dateFrom)
      );
    }
    
    if (filters.dateTo) {
      filteredData = filteredData.filter(item => 
        new Date(item.date) <= new Date(filters.dateTo)
      );
    }
    
    if (filters.store) {
      filteredData = filteredData.filter(item => 
        item.store === filters.store
      );
    }
    
    if (filters.category) {
      filteredData = filteredData.filter(item => 
        item.category === filters.category
      );
    }
    
    return filteredData;
  }
  
  async getAggregatedData(dashboardId, tenantId, groupBy = 'date', filters = {}) {
    const data = await this.getFilteredData(dashboardId, tenantId, filters);
    
    const grouped = {};
    
    data.forEach(item => {
      let key;
      
      if (groupBy === 'date') {
        key = new Date(item.date).toISOString().split('T')[0];
      } else if (groupBy === 'store') {
        key = item.store || 'Unknown';
      } else if (groupBy === 'category') {
        key = item.category || 'Unknown';
      } else {
        key = 'All';
      }
      
      if (!grouped[key]) {
        grouped[key] = {
          label: key,
          total: 0,
          count: 0,
          items: []
        };
      }
      
      grouped[key].total += item.amount || 0;
      grouped[key].count += 1;
      grouped[key].items.push(item);
    });
    
    return Object.values(grouped).map(group => ({
      label: group.label,
      total: Math.round(group.total * 100) / 100,
      count: group.count,
      average: Math.round((group.total / group.count) * 100) / 100
    }));
  }
  
  async getUniqueValues(dashboardId, tenantId, field) {
    const excelDataRecords = await ExcelData.find({ dashboardId, tenantId });
    
    const uniqueValues = new Set();
    
    excelDataRecords.forEach(record => {
      record.processedData.forEach(item => {
        if (item[field]) {
          uniqueValues.add(item[field]);
        }
      });
    });
    
    return Array.from(uniqueValues).sort();
  }
}

module.exports = new AnalyticsService();