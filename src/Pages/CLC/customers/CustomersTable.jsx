import { ChevronLeft, ChevronRight, Edit, Eye, MessageSquare, MoreHorizontal } from 'lucide-react';
import { Link } from 'react-router-dom';

import Badge from '../../../components/UI/badge.jsx';
import Button from '../../../components/UI/button.jsx';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../../components/UI/table.jsx';
import { formatCurrency, formatRelativeTime } from '../../../utils/format.js';
import { getLatestPurchase } from './utils.js';

export default function CustomersTable({
  customerRows,
  data,
  moduleType,
  isSalesModule,
  activeMenuId,
  setActiveMenuId,
  openCommentModal,
  onPageChange,
}) {
  return (
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
                    <Link to={`/customers/${customer._id}?moduleType=${moduleType}`}>
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
                          to={`/customers/${customer._id}?moduleType=${moduleType}`}
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

                        {!isSalesModule ? (
                          <Link
                            to={`/customers/${customer._id}/edit?moduleType=${moduleType}`}
                            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            onClick={() => setActiveMenuId(null)}
                          >
                            <Edit className="h-4 w-4" />
                            Edit customer
                          </Link>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
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
              onClick={() => onPageChange(data.pagination.page - 1)}
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
              onClick={() => onPageChange(data.pagination.page + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : null}
    </>
  );
}
