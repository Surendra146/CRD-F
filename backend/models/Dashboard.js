const mongoose = require('mongoose');

const dashboardSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  excelSourcesConfig: {
    type: [{
      name: String,
      requiredColumns: [String],
      uploadedFileName: String,
      uploadedAt: Date,
      status: {
        type: String,
        enum: ['pending', 'uploaded', 'mapped'],
        default: 'pending'
      }
    }],
    default: []
  },
  layout: {
    filters: {
      type: [{
        id: String,
        type: String,
        label: String,
        position: { x: Number, y: Number },
        config: mongoose.Schema.Types.Mixed
      }],
      default: []
    },
    charts: {
      type: [{
        id: String,
        type: String,
        title: String,
        dataSource: String,
        position: { x: Number, y: Number, w: Number, h: Number },
        config: mongoose.Schema.Types.Mixed
      }],
      default: []
    }
  },
  isActive: {
    type: Boolean,
    default: true
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

dashboardSchema.index({ tenantId: 1 });
dashboardSchema.index({ createdBy: 1 });

module.exports = mongoose.model('Dashboard', dashboardSchema);