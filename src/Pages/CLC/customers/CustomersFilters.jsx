import { Filter, Search } from 'lucide-react';

import Button from '../../../components/UI/button.jsx';
import Select from '../../../components/UI/select.jsx';
import { segmentOptions, sortOptions, statusOptions } from './constants.js';

export default function CustomersFilters({
  filters,
  isSalesModule,
  onSearch,
  onFilterChange,
  showFilters,
  setShowFilters,
}) {
  return (
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
            onChange={onSearch}
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
            onChange={(e) => onFilterChange('status', e.target.value)}
          />

          <Select
            label="Segment"
            options={segmentOptions}
            value={filters.segment}
            onChange={(e) => onFilterChange('segment', e.target.value)}
          />

          <Select
            label="Sort By"
            options={sortOptions}
            value={filters.sortBy}
            onChange={(e) => onFilterChange('sortBy', e.target.value)}
          />
        </div>
      ) : null}
    </div>
  );
}
