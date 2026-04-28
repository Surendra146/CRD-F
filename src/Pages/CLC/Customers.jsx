import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ChevronLeft,
  ChevronRight,
  Edit,
  Eye,
  Filter,
  MessageSquare,
  MoreHorizontal,
  Plus,
  Search,
  Users,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

import Header from '../../components/Layout/Header.jsx';
import Badge from '../../components/UI/badge.jsx';
import Button from '../../components/UI/button.jsx';
import { Card } from '../../components/UI/card.jsx';
import EmptyState from '../../components/UI/emptyState.jsx';
import Loader from '../../components/UI/loader.jsx';
import Modal from '../../components/UI/modal.jsx';
import Select from '../../components/UI/select.jsx';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/UI/table.jsx';
import { customersApi } from '../../services/customers.js';
import { formatCurrency, formatRelativeTime } from '../../utils/format.js';

const statusOptions = [
  { value: '', label: 'All Statuses' },
  { value: 'active', label: 'Active' },
  { value: 'at_risk', label: 'At Risk' },
  { value: 'churned', label: 'Churned' },
  { value: 'loyal', label: 'Loyal' },
  { value: 'new', label: 'New' },
];

const segmentOptions = [
  { value: '', label: 'All Segments' },
  { value: 'champions', label: 'Champions' },
  { value: 'loyal_customers', label: 'Loyal Customers' },
  { value: 'potential_loyalist', label: 'Potential Loyalist' },
  { value: 'new_customers', label: 'New Customers' },
  { value: 'at_risk', label: 'At Risk' },
  { value: 'hibernating', label: 'Hibernating' },
  { value: 'lost', label: 'Lost' },
];

export default function Customers({ moduleType = 'customer_details' }) {
  const queryClient = useQueryClient();

  const [filters, setFilters] = useState({
    page: 1,
    limit: 20,
    moduleType,
    search: '',
    status: '',
    segment: '',
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });

  const isSalesModule = moduleType === 'customer_sales';

  const [showFilters, setShowFilters] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState(null);
  const [commentCustomer, setCommentCustomer] = useState(null);
  const [commentText, setCommentText] = useState('');

  useEffect(() => {
    setFilters((prev) => ({ ...prev, page: 1, moduleType }));
  }, [moduleType]);

  const { data, isLoading, error } = useQuery({
    queryKey: ['customers', filters],
    queryFn: () => customersApi.getAll(filters),});

  const addCommentMutation = useMutation({
    mutationFn: ({ customerId, message }) =>
      customersApi.addInteraction(customerId, {
        type: 'comment',
        description: message,
        notes: message,
        message,
      }),
    onSuccess: () => {
      toast.success('Comment added successfully');
      queryClient.invalidateQueries({ queryKey: ['customers'] });

      if (commentCustomer?._id) {
        queryClient.invalidateQueries({ queryKey: ['customer', commentCustomer._id] });
        queryClient.invalidateQueries({ queryKey: ['customer-timeline', commentCustomer._id] });
      }

      setCommentCustomer(null);
      setCommentText('');
    },
    onError: () => {
      toast.error('Failed to add comment');
    },
  });

  const customerRows = useMemo(() => data?.data || [], [data?.data]);
  const getLatestPurchase = (customer) => {
    const purchases = Array.isArray(customer?.purchases) ? customer.purchases : [];
    if (!purchases.length) return null;

    return [...purchases]
      .sort((a, b) => new Date(b?.date || 0) - new Date(a?.date || 0))[0];
  };

  const handleSearch = (e) => {
    setFilters({ ...filters, search: e.target.value, page: 1 });
  };

  const handleFilterChange = (key, value) => {
    setFilters({ ...filters, [key]: value, page: 1 });
  };

  const handlePageChange = (newPage) => {
    setFilters({ ...filters, page: newPage });
  };

  const openCommentModal = (customer) => {
    setActiveMenuId(null);
    setCommentCustomer(customer);
    setCommentText('');
  };

  const handleCommentSubmit = (e) => {
    e.preventDefault();

    if (!commentCustomer?._id) {
      toast.error('Customer is missing');
      return;
    }

    const trimmedComment = commentText.trim();

    if (!trimmedComment) {
      toast.error('Please enter a comment');
      return;
    }

    addCommentMutation.mutate({
      customerId: commentCustomer._id,
      message: trimmedComment,
    });
  };

  return (
    <div>
      <Header
        title={isSalesModule ? 'Customer Sales Module' : 'Customer Detail Module'}
        subtitle={`${data?.pagination?.total || 0} total records`}
        actions={
          !isSalesModule ? (
            <Link to="/customers/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Customer
              </Button>
            </Link>
          ) : null
        }
      />

      <div className="p-8">
        <Card className="mb-6">
          <div className="p-4">
            <div className="flex flex-col gap-4 lg:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder={
                    isSalesModule
                      ? 'Search by customer, phone, location, order, POS...'
                      : 'Search by name, phone, location...'
                  }
                  value={filters.search}
                  onChange={handleSearch}
                  className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <Button variant="outline" onClick={() => setShowFilters(!showFilters)}>
                <Filter className="mr-2 h-4 w-4" />
                Filters
              </Button>
            </div>

            {showFilters ? (
              <div className="mt-4 grid grid-cols-1 gap-4 border-t pt-4 md:grid-cols-3">
                <Select
                  label="Status"
                  options={statusOptions}
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                />

                <Select
                  label="Segment"
                  options={segmentOptions}
                  value={filters.segment}
                  onChange={(e) => handleFilterChange('segment', e.target.value)}
                />

                <Select
                  label="Sort By"
                  options={[
                    { value: 'createdAt', label: 'Date Added' },
                    { value: 'customerCreatedDate', label: 'Customer Created Date' },
                    { value: 'lifecycle.lastPurchaseDate', label: 'Last Purchase' },
                    { value: 'lifecycle.totalSpent', label: 'Total Spent' },
                    { value: 'lifecycle.totalPurchases', label: 'Total Orders' },
                  ]}
                  value={filters.sortBy}
                  onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                />
              </div>
            ) : null}
          </div>
        </Card>

        <Card>
          {isLoading ? (
            <div className="py-20">
              <Loader size="lg" />
            </div>
          ) : error ? (
            <div className="py-20 text-center text-red-500">Failed to load customers</div>
          ) : !customerRows.length ? (
            <EmptyState
              icon={Users}
              title="No customers found"
              description={
                isSalesModule
                  ? 'Import customer sales data to view sales records'
                  : 'Get started by adding your first customer or importing data'
              }
              action={
                <div className="flex gap-3">
                  {!isSalesModule ? (
                    <Link to="/customers/new">
                      <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Customer
                      </Button>
                    </Link>
                  ) : null}

                  <Link to="/import">
                    <Button variant="outline">Import Data</Button>
                  </Link>
                </div>
              }
            />
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Location</TableHead>
                    {isSalesModule ? (
                      <>
                        <TableHead>Order ID</TableHead>
                        <TableHead>POS No</TableHead>
                        <TableHead>Unit Price</TableHead>
                        <TableHead>Sales Details</TableHead>
                      </>
                    ) : (
                      <>
                        <TableHead>Status</TableHead>
                        <TableHead>Total Spent</TableHead>
                        <TableHead>Orders</TableHead>
                        <TableHead>Last Purchase</TableHead>
                      </>
                    )}
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {customerRows.map((customer) => {
                    const latestPurchase = getLatestPurchase(customer);

                    return (
                    <TableRow key={customer._id}>
                      <TableCell>
                        <div>
                          <Link
                            to={`/customers/${customer._id}`}
                            className="font-medium text-gray-900 hover:text-primary-600"
                          >
                            {customer.name}
                          </Link>

                          <p className="text-sm text-gray-500">
                            {customer.phone || customer.email || 'No contact'}
                          </p>

                          <p className="text-xs text-gray-500">
                            Type: {customer.demographics?.customerType || '-'}
                          </p>

                          {customer.address ? (
                            <p className="text-xs text-gray-400">{customer.address}</p>
                          ) : null}
                        </div>
                      </TableCell>

                      <TableCell>
                        <div>
                          <p className="text-sm font-medium text-gray-700">
                            {latestPurchase?.locationName || customer.demographics?.location?.locationName || '-'}
                          </p>

                          <p className="text-xs text-gray-400">
                            {[
                              customer.demographics?.location?.state,
                              customer.demographics?.location?.country,
                              customer.demographics?.location?.postalCode,
                            ]
                              .filter(Boolean)
                              .join(', ') || '-'}
                          </p>
                        </div>
                      </TableCell>

                      {isSalesModule ? (
                        <>
                          <TableCell>{latestPurchase?.orderId || '-'}</TableCell>
                          <TableCell>{latestPurchase?.posNo || '-'}</TableCell>
                          <TableCell>
                            {formatCurrency(latestPurchase?.items?.[0]?.price || 0)}
                          </TableCell>
                          <TableCell>
                            <div className="text-sm text-gray-600">
                              <p>{formatCurrency(latestPurchase?.amount || 0)}</p>
                              <p className="text-xs text-gray-500">
                                {latestPurchase?.date
                                  ? formatRelativeTime(latestPurchase.date)
                                  : 'No sale date'}
                              </p>
                            </div>
                          </TableCell>
                        </>
                      ) : (
                        <>
                          <TableCell>
                            <Badge
                              variant={
                                customer.lifecycle?.status === 'active'
                                  ? 'success'
                                  : customer.lifecycle?.status === 'at_risk'
                                    ? 'warning'
                                    : customer.lifecycle?.status === 'churned'
                                      ? 'danger'
                                      : customer.lifecycle?.status === 'loyal'
                                        ? 'info'
                                        : 'default'
                              }
                            >
                              {customer.lifecycle?.status?.replace(/_/g, ' ') || 'Unknown'}
                            </Badge>
                          </TableCell>

                          <TableCell>
                            <span className="font-medium">
                              {formatCurrency(customer.lifecycle?.totalSpent || 0)}
                            </span>
                          </TableCell>

                          <TableCell>{customer.lifecycle?.totalPurchases || 0}</TableCell>

                          <TableCell>
                            {customer.lifecycle?.lastPurchaseDate ? (
                              <span className="text-sm text-gray-500">
                                {formatRelativeTime(customer.lifecycle.lastPurchaseDate)}
                              </span>
                            ) : (
                              <span className="text-sm text-gray-400">Never</span>
                            )}
                          </TableCell>
                        </>
                      )}

                      <TableCell>
                        <div className="relative flex items-center justify-end gap-2">
                          <Link to={`/customers/${customer._id}`}>
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openCommentModal(customer)}
                          >
                            <MessageSquare className="h-4 w-4" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              setActiveMenuId((currentId) =>
                                currentId === customer._id ? null : customer._id
                              )
                            }
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>

                          {activeMenuId === customer._id ? (
                            <div className="absolute right-0 top-11 z-20 w-48 rounded-xl border border-gray-200 bg-white p-2 shadow-lg">
                              <Link
                                to={`/customers/${customer._id}`}
                                className="block rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                onClick={() => setActiveMenuId(null)}
                              >
                                View profile
                              </Link>

                              <button
                                type="button"
                                className="block w-full rounded-lg px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
                                onClick={() => openCommentModal(customer)}
                              >
                                Add comment
                              </button>

                              <Link
                                to={`/customers/${customer._id}/edit`}
                                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                onClick={() => setActiveMenuId(null)}
                              >
                                <Edit className="h-4 w-4" />
                                Edit customer
                              </Link>
                            </div>
                          ) : null}
                        </div>
                      </TableCell>
                    </TableRow>
                  )})}
                </TableBody>
              </Table>

              {data.pagination ? (
                <div className="flex items-center justify-between border-t px-6 py-4">
                  <p className="text-sm text-gray-500">
                    Showing {((data.pagination.page - 1) * data.pagination.limit) + 1} to{' '}
                    {Math.min(data.pagination.page * data.pagination.limit, data.pagination.total)} of{' '}
                    {data.pagination.total} results
                  </p>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={data.pagination.page === 1}
                      onClick={() => handlePageChange(data.pagination.page - 1)}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>

                    <span className="text-sm text-gray-600">
                      Page {data.pagination.page} of {data.pagination.pages}
                    </span>

                    <Button
                      variant="outline"
                      size="sm"
                      disabled={data.pagination.page === data.pagination.pages}
                      onClick={() => handlePageChange(data.pagination.page + 1)}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ) : null}
            </>
          )}
        </Card>
      </div>

      <Modal
        isOpen={Boolean(commentCustomer)}
        onClose={() => {
          if (addCommentMutation.isPending) return;
          setCommentCustomer(null);
          setCommentText('');
        }}
        title={commentCustomer ? `Add Comment for ${commentCustomer.name || 'Customer'}` : 'Add Comment'}
      >
        <form className="space-y-4" onSubmit={handleCommentSubmit}>
          <div>
            <label
              htmlFor="customer-comment"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Comment
            </label>

            <textarea
              id="customer-comment"
              rows={4}
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Add a note about this customer..."
              className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div className="flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setCommentCustomer(null);
                setCommentText('');
              }}
              disabled={addCommentMutation.isPending}
            >
              Cancel
            </Button>

            <Button type="submit" isLoading={addCommentMutation.isPending}>
              Save Comment
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
