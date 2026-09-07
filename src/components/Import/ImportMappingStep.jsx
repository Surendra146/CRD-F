import ColumnMappingWorkspace from '../Mapping/ColumnMappingWorkspace';
import { formatNumber } from '../../utils/format';
import { targetFieldOptionsFallback, transformationOptions } from './importConstants';

export default function ImportMappingStep({
  uploadData,
  columnMapping,
  onCancel,
  onProcess,
  isSaving,
  onMappingChange,
  targetFieldOptions,
  importType,
}) {
  const mappingOptions = targetFieldOptions?.length ? targetFieldOptions : targetFieldOptionsFallback;
  const isSalesImport = importType === 'customer_sales';
  const columns = Array.isArray(uploadData?.columns) ? uploadData.columns : [];
  const previewRows = Array.isArray(uploadData?.preview) ? uploadData.preview : [];
  const mappings = Array.isArray(columnMapping) ? columnMapping : [];

  const sections = [
    {
      key: 'import-file',
      preview: {
        title: `File Preview (${formatNumber(uploadData?.totalRows)} rows)`,
        columns,
        rows: previewRows.slice(0, 3),
      },
      mappingTitle: 'Column Mapping',
      mappingRows: mappings.map((mapping, index) => ({
        key: `${mapping.sourceColumn}-${index}`,
        label: mapping.sourceColumn,
        selects: [
          {
            key: 'target-field',
            options: mappingOptions,
            value: mapping.targetField,
            onChange: (value) => onMappingChange(index, 'targetField', value),
            widthClassName: 'w-1/3',
          },
          {
            key: 'transformation',
            options: transformationOptions,
            value: mapping.transformation,
            onChange: (value) => onMappingChange(index, 'transformation', value),
            widthClassName: 'w-1/4',
          },
        ],
      })),
    },
  ];

  return (
    <ColumnMappingWorkspace
      title={isSalesImport ? 'Map Customer Sales Columns' : 'Map Customer Detail Columns'}
      description={
        isSalesImport
          ? 'Match your file columns to sales target fields'
          : 'Match your file columns to customer-related target fields'
      }
      sections={sections}
      secondaryActionLabel="Cancel"
      primaryActionLabel="Process Data"
      onSecondaryAction={onCancel}
      onPrimaryAction={onProcess}
      isSaving={isSaving}
      savingLabel="Processing..."
    />
  );
}
