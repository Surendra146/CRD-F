import { ArrowRight } from 'lucide-react';

import Button from '../UI/button';
import { Card, CardContent, CardHeader, CardTitle } from '../UI/card.jsx';
import Select from '../UI/select';

function renderCellValue(value) {
  if (value === undefined || value === null || value === '') {
    return '-';
  }

  return String(value);
}

export default function ColumnMappingWorkspace({
  title = 'Column Mapping',
  description,
  sections = [],
  primaryActionLabel = 'Save',
  secondaryActionLabel,
  onPrimaryAction,
  onSecondaryAction,
  isSaving = false,
  savingLabel = 'Saving...',
  showCard = true,
}) {
  const content = (
    <>
      {sections.map((section) => (
        <div key={section.key} className="mb-8 last:mb-0">
          {section.title ? (
            <div className="mb-4">
              <h4 className="text-base font-semibold text-gray-900">{section.title}</h4>
              {section.description ? (
                <p className="mt-1 text-sm text-gray-500">{section.description}</p>
              ) : null}
            </div>
          ) : null}

          {section.preview ? (
            <div className="mb-6">
              <h5 className="mb-2 text-sm font-medium text-gray-700">
                {section.preview.title}
              </h5>
              <div className="overflow-x-auto rounded-lg border">
                <table className="min-w-full text-sm">
                  {section.preview.mappedHeaderValues ? (
                    <thead>
                      <tr className="bg-gray-100 text-gray-600">
                        {section.preview.columns.map((column) => (
                          <th
                            key={`${section.key}-${column}-mapped`}
                            className="px-3 py-2 text-xs font-medium uppercase"
                          >
                            {section.preview.mappedHeaderValues[column] || '-'}
                          </th>
                        ))}
                      </tr>
                      <tr className="border-b bg-white">
                        {section.preview.columns.map((column) => (
                          <th
                            key={`${section.key}-${column}`}
                            className="px-3 py-2 text-left font-semibold text-gray-800"
                          >
                            {column}
                          </th>
                        ))}
                      </tr>
                    </thead>
                  ) : (
                    <thead className="bg-gray-50">
                      <tr>
                        {section.preview.columns.map((column) => (
                          <th
                            key={`${section.key}-${column}`}
                            className="px-4 py-2 text-left font-medium text-gray-600"
                          >
                            {column}
                          </th>
                        ))}
                      </tr>
                    </thead>
                  )}
                  <tbody>
                    {section.preview.rows.map((row, index) => (
                      <tr key={`${section.key}-row-${index}`} className="border-t hover:bg-gray-50">
                        {section.preview.columns.map((column) => (
                          <td
                            key={`${section.key}-row-${index}-${column}`}
                            className="max-w-50 truncate px-4 py-2 text-gray-600"
                          >
                            {renderCellValue(row[column])}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {section.preview.caption ? (
                <p className="mt-2 text-xs text-gray-500">{section.preview.caption}</p>
              ) : null}
            </div>
          ) : null}

          <div>
            <h5 className="mb-4 text-sm font-medium text-gray-700">
              {section.mappingTitle || 'Column Mapping'}
            </h5>
            <div className="space-y-4">
              {section.mappingRows.map((row, index) => (
                <div key={row.key} className="flex items-center gap-4">
                  <div className="w-1/3">
                    <div className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium">
                      {row.label}
                    </div>
                  </div>
                  <ArrowRight className="h-5 w-5 text-gray-400" />
                  {row.selects.map((select) => (
                    <div key={select.key} className={select.widthClassName || 'w-1/3'}>
                      <Select
                        className={select.className}
                        options={select.options}
                        value={select.value}
                        placeholder={select.placeholder}
                        onChange={(event) => select.onChange(event.target.value, index)}
                      />
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}
    </>
  );

  if (!showCard) {
    return (
      <div>
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-gray-900">{title}</h1>
          {description ? <p className="mt-1 text-sm text-gray-500">{description}</p> : null}
        </div>

        {content}

        <div className="flex justify-end gap-3 pt-4">
          {secondaryActionLabel ? (
            <Button variant="outline" onClick={onSecondaryAction}>
              {secondaryActionLabel}
            </Button>
          ) : null}
          <Button onClick={onPrimaryAction} isLoading={isSaving}>
            {isSaving ? savingLabel : primaryActionLabel}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>{title}</CardTitle>
          {description ? <p className="mt-1 text-sm text-gray-500">{description}</p> : null}
        </div>
        <div className="flex gap-3">
          {secondaryActionLabel ? (
            <Button variant="outline" onClick={onSecondaryAction}>
              {secondaryActionLabel}
            </Button>
          ) : null}
          <Button onClick={onPrimaryAction} isLoading={isSaving}>
            {isSaving ? savingLabel : primaryActionLabel}
          </Button>
        </div>
      </CardHeader>
      <CardContent>{content}</CardContent>
    </Card>
  );
}
