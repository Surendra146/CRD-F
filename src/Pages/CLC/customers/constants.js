export const statusOptions = [
  { value: '', label: 'All Statuses' },
  { value: 'active', label: 'Active' },
  { value: 'at_risk', label: 'At Risk' },
  { value: 'churned', label: 'Churned' },
  { value: 'loyal', label: 'Loyal' },
  { value: 'new', label: 'New' },
];

export const segmentOptions = [
  { value: '', label: 'All Segments' },
  { value: 'champions', label: 'Champions' },
  { value: 'loyal_customers', label: 'Loyal Customers' },
  { value: 'potential_loyalist', label: 'Potential Loyalist' },
  { value: 'new_customers', label: 'New Customers' },
  { value: 'at_risk', label: 'At Risk' },
  { value: 'hibernating', label: 'Hibernating' },
  { value: 'lost', label: 'Lost' },
];

export const sortOptions = [
  { value: 'createdAt', label: 'Date Added' },
  { value: 'customerCreatedDate', label: 'Customer Created Date' },
  { value: 'lifecycle.lastPurchaseDate', label: 'Last Purchase' },
  { value: 'lifecycle.totalSpent', label: 'Total Spent' },
  { value: 'lifecycle.totalPurchases', label: 'Total Orders' },
];
