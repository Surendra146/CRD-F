export const mandatoryFieldsByImportType = {
  customer_details: [
    { value: 'name', label: 'Customer Name' },
    { value: 'demographics.customerType', label: 'Customer Type' },
    { value: 'demographics.location.locationName', label: 'Location Name' },
    { value: 'phone', label: 'Phone Number' },
    { value: 'address', label: 'Address' },
    { value: 'demographics.location.country', label: 'Country' },
    { value: 'demographics.location.state', label: 'State' },
    { value: 'customerCreatedDate', label: 'Customer Created Date' },
  ],
  customer_sales: [
    { value: 'demographics.location.locationName', label: 'Location Name' },
    { value: 'name', label: 'Customer Name' },
    { value: 'phone', label: 'Phone Number' },
    { value: '_orderId', label: 'Order ID' },
    { value: '_purchasePosNo', label: 'POS No' },
    { value: '_purchasePrice', label: 'Unit Price' },
    { value: '_purchaseDate', label: 'Purchase Date' },
  ],
};

export const hiddenTargetFieldsByImportType = {
  customer_details: new Set([
    'externalId',
    'demographics.location.locationCode',
    'demographics.location.posNo',
    'whatsappNumber',
    '_billType',
  ]),
  customer_sales: new Set([
    'externalId',
    'demographics.location.locationCode',
    'whatsappNumber',
    'demographics.customerType',
  ]),
};

export const additionalTargetFieldsByImportType = {
  customer_details: [
    { value: 'demographics.customerType', label: 'Customer Type' },
    { value: 'lifecycle.segment', label: 'Customer Segment' },
  ],
  customer_sales: [
    { value: '_billType', label: 'Bill Type' },
    { value: 'lifecycle.segment', label: 'Customer Segment' },
  ],
};
