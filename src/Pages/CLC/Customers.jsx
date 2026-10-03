import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

import Header from '../../components/Layout/Header.jsx';
import Button from '../../components/UI/button.jsx';
import { Card } from '../../components/UI/card.jsx';
import EmptyState from '../../components/UI/emptyState.jsx';
import Loader from '../../components/UI/loader.jsx';
import { customersApi } from '../../services/customers.js';
import { formatApiError } from '../../services/api.js';
import CustomerCommentModal from './customers/CustomerCommentModal.jsx';
import CustomersFilters from './customers/CustomersFilters.jsx';
import CustomersTable from './customers/CustomersTable.jsx';

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
    queryFn: () => customersApi.getAll(filters),
  });

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
  const loadErrorMessage = error ? formatApiError(error) : '';

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

      <div className="p-4 sm:p-6 lg:p-8">
        <Card className="mb-6">
          <CustomersFilters
            filters={filters}
            isSalesModule={isSalesModule}
            onSearch={handleSearch}
            onFilterChange={handleFilterChange}
            showFilters={showFilters}
            setShowFilters={setShowFilters}
          />
        </Card>

        <Card>
          {isLoading ? (
            <div className="py-20">
              <Loader size="lg" />
            </div>
          ) : error ? (
            <div className="py-20 text-center text-red-500">
              Failed to load customers
              {loadErrorMessage ? (
                <p className="mt-2 text-sm text-red-400">{loadErrorMessage}</p>
              ) : null}
            </div>
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
                <div className="flex flex-wrap gap-3">
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
            <CustomersTable
              customerRows={customerRows}
              data={data}
              moduleType={moduleType}
              isSalesModule={isSalesModule}
              activeMenuId={activeMenuId}
              setActiveMenuId={setActiveMenuId}
              openCommentModal={openCommentModal}
              onPageChange={handlePageChange}
            />
          )}
        </Card>
      </div>

      <CustomerCommentModal
        commentCustomer={commentCustomer}
        commentText={commentText}
        setCommentText={setCommentText}
        onSubmit={handleCommentSubmit}
        onClose={() => {
          if (addCommentMutation.isPending) return;
          setCommentCustomer(null);
          setCommentText('');
        }}
        isSaving={addCommentMutation.isPending}
      />
    </div>
  );
}
