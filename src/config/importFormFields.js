export const mandatoryFieldsByImportType = {
  customer_details: [
    { value: 'demographics.location.locationName', label: 'Location Name' },
    { value: 'customerFirstName', label: 'Customer First Name' },
    { value: 'customerLastName', label: 'Customer Last Name' },
    { value: 'phone', label: 'Phone Number' },
    { value: 'customerCreatedDate', label: 'Customer Created Date' },
    { value: 'demographics.gender', label: 'Gender' },
    { value: 'demographics.location.country', label: 'Country' },
    { value: 'demographics.location.state', label: 'State' },
    { value: 'demographics.location.city', label: 'City' },
    { value: 'address', label: 'Address' },
  ],
  customer_sales: [
    { value: 'demographics.location.locationName', label: 'Location Name' },
    { value: 'customerFirstName', label: 'Customer First Name' },
    { value: 'customerLastName', label: 'Customer Last Name' },
    { value: 'phone', label: 'Phone Number' },
    { value: 'bill_number', label: 'Bill Number' },
    { value: 'bill_date', label: 'Bill Date' },
    { value: 'counter_number', label: 'Counter Number' },
    { value: 'unit_price', label: 'Unit Price' },
    { value: 'quantity', label: 'Quantity' },
  ],
};

export const hiddenTargetFieldsByImportType = {
  customer_details: new Set([
    'externalId',
    'demographics.location.locationCode',
    'demographics.location.posNo',
    'whatsappNumber',
    '_billType',
    'bill_number',
    'bill_date',
    'counter_number',
    'unit_price',
    'quantity',
    'total_price',
  ]),
  customer_sales: new Set([
    'externalId',
    'demographics.location.locationCode',
    'whatsappNumber',
    'demographics.customerType',
    'demographics.gender',
    'demographics.location.country',
    'demographics.location.state',
    'demographics.location.city',
    'address',
    'customerCreatedDate',
  ]),
};

export const additionalTargetFieldsByImportType = {
  customer_details: [
    {
      value: 'demographics.customerType',
      label: 'Customer Type',
      defaultValue: 'Regular',
    },
  ],
  customer_sales: [
    {
      value: 'total_price',
      label: 'Total Price',
      derivedFrom: ['unit_price', 'quantity'],
    },
  ],
};
