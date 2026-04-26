export const targetFieldOptionsFallback = [{ value: '', label: 'Skip this column' }];

export const transformationOptions = [
  { value: 'none', label: 'No Transform' },
  { value: 'date', label: 'Parse as Date' },
  { value: 'number', label: 'Parse as Number' },
  { value: 'phone', label: 'Format Phone' },
  { value: 'email', label: 'Format Email' },
];

export const importSteps = [
  { num: 1, label: 'Upload File' },
  { num: 2, label: 'Map Columns' },
  { num: 3, label: 'Processing' },
  { num: 4, label: 'Complete' },
];

export const maxImportFileSizeMb = 20;
export const maxImportFileSizeBytes = maxImportFileSizeMb * 1024 * 1024;

export const terminalStatuses = new Set(['completed', 'partial', 'failed']);

export const importTypeOptions = [
  { value: 'customer_details', label: 'Customer Detail Import' },
  { value: 'customer_sales', label: 'Customer Sales Import' },
];
