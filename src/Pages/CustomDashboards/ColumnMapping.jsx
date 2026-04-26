import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';

import ColumnMappingWorkspace from '../../components/Mapping/ColumnMappingWorkspace';
import { formatApiError } from '../../services/api';
import { excelApi } from '../../services/excel';

const mappingOptions = [
  { value: 'none', label: 'None' },
  { value: 'date', label: 'Date' },
  { value: 'amount', label: 'Amount' },
  { value: 'store', label: 'Store' },
  { value: 'category', label: 'Category' },
];

export default function ColumnMapping() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [excelData, setExcelData] = useState([]);
  const [mappings, setMappings] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchExcelData = async () => {
      try {
        const { data } = await excelApi.getByDashboardId(id);
        setExcelData(data);

        const initialMappings = {};
        data.forEach((record) => {
          initialMappings[record._id] = {};
        });
        setMappings(initialMappings);
      } catch (error) {
        toast.error(formatApiError(error));
      }
    };

    if (id) {
      fetchExcelData();
    }
  }, [id]);

  const handleChange = (excelId, header, value) => {
    setMappings((prev) => ({
      ...prev,
      [excelId]: {
        ...prev[excelId],
        [header]: value === 'none' ? null : value,
      },
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      for (const excelId of Object.keys(mappings)) {
        await excelApi.mapColumns(excelId, mappings[excelId]);
      }

      toast.success('Mapping saved');
      navigate(`/dashboards/${id}`);
    } catch (error) {
      toast.error(formatApiError(error));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-6 py-8">
        <ColumnMappingWorkspace
          title="Column Mapping"
          description="Map your Excel columns to system fields before building dashboards"
          showCard={false}
          sections={excelData.map((record) => {
            const headers = Object.keys(record.rawData?.[0] || {});

            return {
              key: record._id,
              title: record.sourceName,
              preview: {
                title: 'Preview',
                columns: headers,
                rows: record.rawData.slice(0, 5),
                mappedHeaderValues: mappings[record._id] || {},
                caption: 'Showing first 5 rows for preview',
              },
              mappingTitle: 'Column Mapping',
              mappingRows: headers.map((header) => ({
                key: `${record._id}-${header}`,
                label: header,
                selects: [
                  {
                    key: 'target-field',
                    options: mappingOptions,
                    value: mappings[record._id]?.[header] ?? 'none',
                    onChange: (value) => handleChange(record._id, header, value),
                    widthClassName: 'w-1/3',
                    placeholder: 'Map to',
                  },
                ],
              })),
            };
          })}
          primaryActionLabel="Save Mapping & Continue"
          savingLabel="Saving..."
          onPrimaryAction={handleSave}
          isSaving={saving}
        />
      </div>
    </div>
  );
}
