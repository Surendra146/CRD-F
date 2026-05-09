import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';

import ColumnMappingWorkspace from '../../components/Mapping/ColumnMappingWorkspace';
import { formatApiError } from '../../services/api';
import { excelApi } from '../../services/excel';
import { uploadsApi } from '../../services/uploads';
import { targetFieldOptionsFallback } from '../../components/Import/importConstants';

export default function ColumnMapping() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [excelData, setExcelData] = useState([]);
  const [mappings, setMappings] = useState({});
  const [targetFieldOptions, setTargetFieldOptions] = useState(targetFieldOptionsFallback);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchExcelData = async () => {
      try {
        const response = await excelApi.getByDashboardId(id);
        const data = Array.isArray(response)
          ? response
          : Array.isArray(response?.data)
            ? response.data
            : [];
        const validData = data.filter((record) => record && typeof record === 'object' && record._id);

        setExcelData(validData);

        const initialMappings = {};
        validData.forEach((record) => {
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

  useEffect(() => {
    const fetchTargetFields = async () => {
      try {
        const response = await uploadsApi.getTargetFields('customer_sales');
        const options = Array.isArray(response?.data) ? response.data : [];
        setTargetFieldOptions(options.length ? options : targetFieldOptionsFallback);
      } catch {
        setTargetFieldOptions(targetFieldOptionsFallback);
      }
    };

    fetchTargetFields();
  }, []);

  const handleChange = (excelId, header, value) => {
    setMappings((prev) => ({
      ...prev,
      [excelId]: {
        ...prev[excelId],
        [header]: value === '' ? null : value,
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
            const rows = Array.isArray(record.rawData) ? record.rawData : [];
            const headers = Object.keys(rows[0] || {});

            return {
              key: record._id,
              title: record.sourceName,
              preview: {
                title: 'Preview',
                columns: headers,
                rows: rows.slice(0, 5),
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
                    options: targetFieldOptions,
                    value: mappings[record._id]?.[header] ?? '',
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
