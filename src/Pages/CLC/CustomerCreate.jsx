import { useState } from 'react';
import { ArrowLeft, PlusCircle } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

import Header from '../../components/Layout/Header.jsx';
import Button from '../../components/UI/button.jsx';
import Input from '../../components/UI/input.jsx';
import Select from '../../components/UI/select.jsx';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/UI/card.jsx';
import { customersApi } from '../../services/customers.js';

const initialForm = {
  name: '',
  email: '',
  phone: '',
  whatsappNumber: '',
  address: '',
  customerCreatedDate: '',
  age: '',
  gender: '',
  locationName: '',
  posNo: '',
  city: '',
  state: '',
  country: '',
  postalCode: '',
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

export default function CustomerCreate() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEditMode = Boolean(id);

  const [form, setForm] = useState(initialForm);

  useQuery({
    queryKey: ['customer-edit', id],
    queryFn: () => customersApi.getById(id).then(normalizeCustomer),
    enabled: isEditMode,
    onSuccess: (customer) => {
      if (!customer) return;

      setForm({
        name: customer.name || '',
        email: customer.email || '',
        phone: customer.phone || '',
        whatsappNumber: customer.whatsappNumber || '',
        address: customer.address || '',
        customerCreatedDate: formatDateInputValue(customer.customerCreatedDate),
        age:
          customer.demographics?.age !== undefined && customer.demographics?.age !== null
            ? String(customer.demographics.age)
            : '',
        gender: customer.demographics?.gender || '',
        locationName: customer.demographics?.location?.locationName || '',
        posNo: customer.demographics?.location?.posNo || '',
        city: customer.demographics?.location?.city || '',
        state: customer.demographics?.location?.state || '',
        country: customer.demographics?.location?.country || '',
        postalCode: customer.demographics?.location?.postalCode || '',
      });
    },
  });

  const mutation = useMutation({
    mutationFn: (data) => (isEditMode ? customersApi.update(id, data) : customersApi.create(data)),
    onSuccess: () => {
      toast.success(isEditMode ? 'Customer updated successfully' : 'Customer created successfully');
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      if (id) {
        queryClient.invalidateQueries({ queryKey: ['customer', id] });
        queryClient.invalidateQueries({ queryKey: ['customer-edit', id] });
      }
      navigate('/customers');
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || (isEditMode ? 'Failed to update customer' : 'Failed to create customer'));
    },
  });

  const handleChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const validateForm = () => {
    const requiredFields = [
      { key: 'name', label: 'Customer Name' },
      { key: 'locationName', label: 'Location Name' },
      { key: 'phone', label: 'Phone Number' },
      { key: 'address', label: 'Address' },
      { key: 'country', label: 'Country' },
      { key: 'state', label: 'State' },
      { key: 'postalCode', label: 'Postal Code' },
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

    const payload = {
      externalId: normalizedPhone,
      name: form.name.trim(),
      email: form.email || undefined,
      phone: normalizedPhone,
      whatsappNumber: form.whatsappNumber || undefined,
      address: form.address.trim(),
      customerCreatedDate: form.customerCreatedDate
        ? new Date(form.customerCreatedDate)
        : undefined,
      demographics: {
        age: form.age ? Number(form.age) : undefined,
        gender: form.gender || undefined,
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
    };

    mutation.mutate(payload);
  };

  return (
    <div>
      <Header
        title={isEditMode ? 'Edit Customer' : 'Add Customer'}
        subtitle={isEditMode ? 'Update customer information' : 'Create a new customer record'}
        actions={
          <Link to="/customers">
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </Link>
        }
      />

      <div className="p-8">
        <Card>
          <CardHeader>
            <CardTitle>{isEditMode ? 'Customer Details' : 'New Customer'}</CardTitle>
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

                  <Input
                    label="Email"
                    value={form.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                  />

                  <Input
                    label="WhatsApp Number"
                    value={form.whatsappNumber}
                    onChange={(e) => handleChange('whatsappNumber', e.target.value)}
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
                    label="Postal Code *"
                    value={form.postalCode}
                    onChange={(e) => handleChange('postalCode', e.target.value)}
                  />
                </div>
              </div>

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
                </div>
              </div>

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
