const mongoose = require('mongoose');

const excelDataSchema = new mongoose.Schema({
  dashboardId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Dashboard',
    required: true
  },
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true
  },
  sourceName: {
    type: String,
    required: true
  },
  fileName: {
    type: String,
    required: true
  },
  columnMapping: {
    type: Map,
    of: String
  },
  rawData: {
    type: [mongoose.Schema.Types.Mixed],
    default: []
  },
  processedData: {
    type: [{
      date: Date,
      store: String,
      category: String,
      amount: Number,
      metadata: mongoose.Schema.Types.Mixed
    }],
    default: []
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

excelDataSchema.index({ dashboardId: 1 });
excelDataSchema.index({ tenantId: 1 });
excelDataSchema.index({ sourceName: 1 });

module.exports = mongoose.model('ExcelData', excelDataSchema);