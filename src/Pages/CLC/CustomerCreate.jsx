import { useEffect, useState } from 'react';
import { ArrowLeft, PlusCircle } from 'lucide-react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

import Header from '../../components/Layout/Header.jsx';
import Button from '../../components/UI/button.jsx';
import Input from '../../components/UI/input.jsx';
import Select from '../../components/UI/select.jsx';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/UI/card.jsx';
import { customersApi } from '../../services/customers.js';
import { segmentsApi } from '../../services/segments.js';

const initialForm = {
  name: '',
  email: '',
  phone: '',
  address: '',
  customerCreatedDate: '',
  age: '',
  gender: '',
  customerType: '',
  segment: '',
  locationName: '',
  posNo: '',
  city: '',
  state: '',
  country: '',
  postalCode: '',
  orderId: '',
  saleDate: '',
  saleAmount: '',
  unitPrice: '',
};

const formatDateInputValue = (value) => {
  if (!value) return '';
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return '';

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const normalizeCustomer = (payload) => payload?.data?.data || payload?.data || payload || null;
const getLatestPurchaseIndex = (purchases = []) => {
  if (!Array.isArray(purchases) || purchases.length === 0) return -1;

  let latestIndex = 0;
  let latestTime = new Date(purchases[0]?.date || 0).getTime();

  purchases.forEach((purchase, index) => {
    const currentTime = new Date(purchase?.date || 0).getTime();
    if (currentTime > latestTime) {
      latestTime = currentTime;
      latestIndex = index;
    }
  });

  return latestIndex;
};

export default function CustomerCreate() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEditMode = Boolean(id);
  const isSalesModule = searchParams.get('moduleType') === 'customer_sales';
  const backPath = isSalesModule ? '/customers/sales' : '/customers/details';

  const [form, setForm] = useState(initialForm);
  const [purchases, setPurchases] = useState([]);
  const [latestPurchaseIndex, setLatestPurchaseIndex] = useState(-1);

  const { data: segmentsData } = useQuery({
    queryKey: ['segments'],
    queryFn: () => segmentsApi.getAll(),
  });

  const segmentOptions = [
    { label: 'Select', value: '' },
    ...Array.from(
      new Set(
        (Array.isArray(segmentsData?.data) ? segmentsData.data : segmentsData || [])
          .flatMap((segment) => (Array.isArray(segment?.filters?.segments) ? segment.filters.segments : []))
          .filter(Boolean)
      )
    ).map((segmentValue) => ({
      label: String(segmentValue).replace(/_/g, ' '),
      value: segmentValue,
    })),
  ];

  const { data: customerData } = useQuery({ 
    queryKey: ['customer-edit', id],
    queryFn: () => customersApi.getById(id).then(normalizeCustomer),
    enabled: isEditMode,
  });

  useEffect(() => {
    if (!isEditMode || !customerData) return;

    const customerPurchases = Array.isArray(customerData.purchases) ? customerData.purchases : [];
    const purchaseIndex = getLatestPurchaseIndex(customerPurchases);
    const latestPurchase = purchaseIndex >= 0 ? customerPurchases[purchaseIndex] : null;

    // eslint-disable-next-line react-hooks/set-state-in-effect -- Hydrate the editable form when the fetched customer changes.
    setPurchases(customerPurchases);
    setLatestPurchaseIndex(purchaseIndex);

    setForm({
      name: customerData.name || '',
      email: customerData.email || '',
      phone: customerData.phone || '',
      address: customerData.address || '',
      customerCreatedDate: formatDateInputValue(customerData.customerCreatedDate),
      age:
        customerData.demographics?.age !== undefined && customerData.demographics?.age !== null
          ? String(customerData.demographics.age)
          : '',
      gender: customerData.demographics?.gender || '',
      customerType: customerData.demographics?.customerType || '',
      segment: customerData.lifecycle?.segment || '',
      locationName: customerData.demographics?.location?.locationName || '',
      posNo: customerData.demographics?.location?.posNo || '',
      city: customerData.demographics?.location?.city || '',
      state: customerData.demographics?.location?.state || '',
      country: customerData.demographics?.location?.country || '',
      postalCode: customerData.demographics?.location?.postalCode || '',
      orderId: latestPurchase?.orderId || '',
      saleDate: formatDateInputValue(latestPurchase?.date),
      saleAmount:
        latestPurchase?.amount !== undefined
          ? String(latestPurchase?.amount || '')
          : '',
      unitPrice:
        latestPurchase?.items?.[0]?.price !== undefined
          ? String(latestPurchase?.items?.[0]?.price || '')
          : '',
    });
  }, [customerData, isEditMode]);

  const mutation = useMutation({
    mutationFn: (data) => (isEditMode ? customersApi.update(id, data) : customersApi.create(data)),
    onSuccess: () => {
      toast.success(isEditMode ? 'Customer updated successfully' : 'Customer created successfully');
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      if (id) {
        queryClient.invalidateQueries({ queryKey: ['customer', id] });
        queryClient.invalidateQueries({ queryKey: ['customer-edit', id] });
      }
      navigate(backPath);
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || (isEditMode ? 'Failed to update customer' : 'Failed to create customer'));
    },
  });

  const handleChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const validateForm = () => {
    if (isSalesModule) {
      const requiredFields = [
        { key: 'name', label: 'Customer Name' },
        { key: 'locationName', label: 'Location Name' },
        { key: 'phone', label: 'Phone Number' },
        { key: 'saleDate', label: 'Sale Date' },
        { key: 'saleAmount', label: 'Sale Amount' },
      ];

      const missingField = requiredFields.find(
        (field) => !String(form[field.key] || '').trim()
      );

      if (missingField) {
        toast.error(`${missingField.label} is required`);
        return false;
      }

      return true;
    }

    const requiredFields = [
      { key: 'name', label: 'Customer Name' },
      { key: 'locationName', label: 'Location Name' },
      { key: 'phone', label: 'Phone Number' },
      { key: 'address', label: 'Address' },
      { key: 'country', label: 'Country' },
      { key: 'state', label: 'State' },
      { key: 'customerCreatedDate', label: 'Customer Created Date' },
    ];

    const missingField = requiredFields.find(
      (field) => !String(form[field.key] || '').trim()
    );

    if (missingField) {
      toast.error(`${missingField.label} is required`);
      return false;
    }

    return true;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const normalizedPhone = form.phone.trim();
    const normalizedLocationName = form.locationName.trim();

    if (isSalesModule) {
      const normalizedPurchases = [...purchases];
      const hasLatestPurchase = latestPurchaseIndex >= 0 && normalizedPurchases[latestPurchaseIndex];

      if (!hasLatestPurchase) {
        toast.error('No sales purchase record found for this customer');
        return;
      }

      const saleAmountNumber = Number(form.saleAmount);
      const unitPriceNumber = form.unitPrice ? Number(form.unitPrice) : undefined;

      if (Number.isNaN(saleAmountNumber)) {
        toast.error('Sale Amount must be a valid number');
        return;
      }

      if (form.unitPrice && Number.isNaN(unitPriceNumber)) {
        toast.error('Unit Price must be a valid number');
        return;
      }

      const currentPurchase = normalizedPurchases[latestPurchaseIndex];
      const updatedItems = Array.isArray(currentPurchase.items) ? [...currentPurchase.items] : [];
      const firstItem = updatedItems[0] || {};

      updatedItems[0] = {
        ...firstItem,
        price: unitPriceNumber,
      };

      normalizedPurchases[latestPurchaseIndex] = {
        ...currentPurchase,
        orderId: form.orderId || currentPurchase.orderId,
        date: new Date(form.saleDate),
        amount: saleAmountNumber,
        items: updatedItems,
      };

      const payload = {
        name: form.name.trim(),
        phone: normalizedPhone,
        moduleType: 'customer_sales',
        demographics: {
          location: {
            locationCode: normalizedLocationName,
            locationName: normalizedLocationName,
            posNo: form.posNo || undefined,
            city: form.city || undefined,
            state: form.state.trim() || undefined,
            country: form.country.trim() || undefined,
            postalCode: form.postalCode.trim() || undefined,
          },
        },
        purchases: normalizedPurchases,
      };

      mutation.mutate(payload);
      return;
    }

    const payload = {
      externalId: normalizedPhone,
      name: form.name.trim(),
      moduleType: 'customer_details',
      email: form.email || undefined,
      phone: normalizedPhone,
      address: form.address.trim(),
      customerCreatedDate: form.customerCreatedDate
        ? new Date(form.customerCreatedDate)
        : undefined,
      demographics: {
        age: form.age ? Number(form.age) : undefined,
        gender: form.gender || undefined,
        customerType: form.customerType || undefined,
        location: {
          locationCode: normalizedLocationName,
          locationName: normalizedLocationName,
          posNo: form.posNo || undefined,
          city: form.city || undefined,
          state: form.state.trim(),
          country: form.country.trim(),
          postalCode: form.postalCode.trim(),
        },
      },
      lifecycle: {
        ...(form.segment ? { segment: form.segment } : {}),
      },
    };

    mutation.mutate(payload);
  };

  return (
    <div>
      <Header
        title={
          isEditMode
            ? isSalesModule
              ? 'Edit Customer Sales'
              : 'Edit Customer'
            : 'Add Customer'
        }
        subtitle={
          isEditMode
            ? isSalesModule
              ? 'Update customer sales information'
              : 'Update customer information'
            : 'Create a new customer record'
        }
        actions={
          <Link to={backPath}>
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </Link>
        }
      />

      <div className="p-4 sm:p-6 lg:p-8">
        <Card>
          <CardHeader>
            <CardTitle>
              {isEditMode ? (isSalesModule ? 'Sales Edit' : 'Customer Details') : 'New Customer'}
            </CardTitle>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <h3 className="mb-4 text-sm font-semibold text-gray-700">
                  Customer Details
                </h3>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <Input
                    label="Customer Name *"
                    value={form.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                  />

                  <Input
                    label="Phone Number *"
                    value={form.phone}
                    onChange={(e) => handleChange('phone', e.target.value)}
                  />

                  {!isSalesModule ? (
                    <>
                      <Input
                        label="Email"
                        value={form.email}
                        onChange={(e) => handleChange('email', e.target.value)}
                      />

                      <Input
                        label="Customer Created Date *"
                        type="date"
                        value={form.customerCreatedDate}
                        onChange={(e) => handleChange('customerCreatedDate', e.target.value)}
                      />

                      <div className="md:col-span-2">
                        <Input
                          label="Address *"
                          value={form.address}
                          onChange={(e) => handleChange('address', e.target.value)}
                        />
                      </div>
                    </>
                  ) : null}
                </div>
              </div>

              <div>
                <h3 className="mb-4 text-sm font-semibold text-gray-700">
                  Location Details
                </h3>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <Input
                    label="Location Name *"
                    value={form.locationName}
                    onChange={(e) => handleChange('locationName', e.target.value)}
                  />

                  <Input
                    label="POS No"
                    value={form.posNo}
                    onChange={(e) => handleChange('posNo', e.target.value)}
                  />

                  <Input
                    label="City"
                    value={form.city}
                    onChange={(e) => handleChange('city', e.target.value)}
                  />

                  <Input
                    label="State *"
                    value={form.state}
                    onChange={(e) => handleChange('state', e.target.value)}
                  />

                  <Input
                    label="Country *"
                    value={form.country}
                    onChange={(e) => handleChange('country', e.target.value)}
                  />

                  <Input
                    label="Postal Code"
                    value={form.postalCode}
                    onChange={(e) => handleChange('postalCode', e.target.value)}
                  />
                </div>
              </div>

              {isSalesModule ? (
                <div>
                  <h3 className="mb-4 text-sm font-semibold text-gray-700">
                    Sales Details
                  </h3>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <Input
                      label="Order ID"
                      value={form.orderId}
                      onChange={(e) => handleChange('orderId', e.target.value)}
                    />
                    <Input
                      label="Sale Date *"
                      type="date"
                      value={form.saleDate}
                      onChange={(e) => handleChange('saleDate', e.target.value)}
                    />
                    <Input
                      label="Sale Amount *"
                      value={form.saleAmount}
                      onChange={(e) => handleChange('saleAmount', e.target.value)}
                    />
                    <Input
                      label="Unit Price"
                      value={form.unitPrice}
                      onChange={(e) => handleChange('unitPrice', e.target.value)}
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <h3 className="mb-4 text-sm font-semibold text-gray-700">
                    Optional Demographics
                  </h3>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <Input
                      label="Age"
                      type="number"
                      value={form.age}
                      onChange={(e) => handleChange('age', e.target.value)}
                    />

                    <Select
                      label="Gender"
                      value={form.gender}
                      onChange={(e) => handleChange('gender', e.target.value)}
                      options={[
                        { label: 'Select', value: '' },
                        { label: 'Male', value: 'male' },
                        { label: 'Female', value: 'female' },
                        { label: 'Other', value: 'other' },
                      ]}
                    />

                    <Select
                      label="Customer Type"
                      value={form.customerType}
                      onChange={(e) => handleChange('customerType', e.target.value)}
                      options={[
                        { label: 'Select', value: '' },
                        { label: 'Credit', value: 'credit' },
                        { label: 'Loyalty', value: 'loyalty' },
                      ]}
                    />

                    <Select
                      label="Customer Segment"
                      value={form.segment}
                      onChange={(e) => handleChange('segment', e.target.value)}
                      options={segmentOptions}
                    />
                  </div>
                </div>
              )}

              <div className="flex justify-end">
                <Button type="submit" isLoading={mutation.isPending}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  {isEditMode ? 'Update Customer' : 'Create Customer'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
