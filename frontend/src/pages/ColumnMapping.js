import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Layout/Navbar';
import { ArrowRight, CheckCircle } from '@phosphor-icons/react';
import { toast } from 'sonner';
import api, { formatApiError } from '../services/api';
import { Button } from '../components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';

const ColumnMapping = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [excelData, setExcelData] = useState([]);
  const [mappings, setMappings] = useState({});
  const [saving, setSaving] = useState(false);
  
  useEffect(() => {
    fetchExcelData();
  }, [id]);
  
  const fetchExcelData = async () => {
    try {
      const { data } = await api.get(`/api/excel/${id}`);
      setExcelData(data);
      
      const initialMappings = {};
      data.forEach(record => {
        initialMappings[record._id] = {
          date: '',
          store: '',
          category: '',
          amount: ''
        };
      });
      setMappings(initialMappings);
    } catch (err) {
      toast.error(formatApiError(err));
    }
  };
  
  const handleMappingChange = (excelDataId, targetField, sourceColumn) => {
    setMappings(prev => ({
      ...prev,
      [excelDataId]: {
        ...prev[excelDataId],
        [targetField]: sourceColumn
      }
    }));
  };
  
  const handleSave = async () => {
    setSaving(true);
    
    try {
      for (const excelDataId in mappings) {
        await api.post('/api/excel/map-columns', {
          excelDataId,
          columnMapping: mappings[excelDataId]
        });
      }
      
      toast.success('Column mapping saved successfully!');
      navigate(`/dashboards/${id}`);
    } catch (err) {
      toast.error(formatApiError(err));
    } finally {
      setSaving(false);
    }
  };
  
  const allMapped = Object.values(mappings).every(mapping => 
    mapping.date && mapping.amount
  );
  
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      
      <div className="p-6 md:p-8 max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-black tracking-tighter mb-2">
            Map Excel Columns
          </h1>
          <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
            Map your Excel columns to dashboard fields
          </p>
        </div>
        
        <div className="space-y-6">
          {excelData.map((record) => (
            <div key={record._id} className="border border-gray-200 p-6" data-testid={`mapping-card-${record.sourceName}`}>
              <div className="flex items-center gap-3 mb-6">
                <h3 className="text-xl font-bold tracking-tight">{record.sourceName}</h3>
                <span className="text-xs text-gray-500">({record.rawData?.length || 0} rows)</span>
              </div>
              
              {record.rawData && record.rawData.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <MappingField
                    label="Date Column *"
                    required
                    excelDataId={record._id}
                    targetField="date"
                    headers={Object.keys(record.rawData[0])}
                    value={mappings[record._id]?.date}
                    onChange={handleMappingChange}
                  />
                  
                  <MappingField
                    label="Amount Column *"
                    required
                    excelDataId={record._id}
                    targetField="amount"
                    headers={Object.keys(record.rawData[0])}
                    value={mappings[record._id]?.amount}
                    onChange={handleMappingChange}
                  />
                  
                  <MappingField
                    label="Store Column"
                    excelDataId={record._id}
                    targetField="store"
                    headers={Object.keys(record.rawData[0])}
                    value={mappings[record._id]?.store}
                    onChange={handleMappingChange}
                  />
                  
                  <MappingField
                    label="Category Column"
                    excelDataId={record._id}
                    targetField="category"
                    headers={Object.keys(record.rawData[0])}
                    value={mappings[record._id]?.category}
                    onChange={handleMappingChange}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
        
        {excelData.length > 0 && (
          <div className="mt-8 flex justify-end">
            <Button
              onClick={handleSave}
              disabled={!allMapped || saving}
              className="bg-black text-white font-bold uppercase tracking-[0.1em] text-sm rounded-none px-8 py-3 border-0 transition-all duration-200 hover:bg-gray-900 disabled:opacity-50"
              data-testid="save-mapping-button"
            >
              {saving ? 'Saving...' : 'Save Mapping & Continue'}
              <ArrowRight size={18} weight="bold" className="ml-2" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

const MappingField = ({ label, required, excelDataId, targetField, headers, value, onChange }) => {
  return (
    <div>
      <label className="text-xs font-bold uppercase tracking-[0.2em] text-gray-500 block mb-2">
        {label}
      </label>
      <Select 
        value={value} 
        onValueChange={(val) => onChange(excelDataId, targetField, val)}
      >
        <SelectTrigger 
          className="rounded-none border-gray-200 focus:ring-2 focus:ring-black"
          data-testid={`select-${targetField}-${excelDataId}`}
        >
          <SelectValue placeholder="Select column" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="">-- None --</SelectItem>
          {headers.map((header) => (
            <SelectItem key={header} value={header}>
              {header}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default ColumnMapping;
