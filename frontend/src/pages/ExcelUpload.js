import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDashboard } from '../context/DashboardContext';
import Navbar from '../components/Layout/Navbar';
import { useDropzone } from 'react-dropzone';
import { UploadSimple, FileXls, CheckCircle, ArrowRight } from '@phosphor-icons/react';
import { toast } from 'sonner';
import api, { formatApiError } from '../services/api';
import { Button } from '../components/ui/button';

const ExcelUpload = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentDashboard, fetchDashboard } = useDashboard();
  const [uploadStatus, setUploadStatus] = useState({});
  const [uploading, setUploading] = useState(false);
  
  useEffect(() => {
    if (id) {
      fetchDashboard(id);
    }
  }, [id]);
  
  const handleUpload = async (files, sourceName) => {
    if (files.length === 0) return;
    
    const file = files[0];
    setUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('dashboardId', id);
      formData.append('sourceName', sourceName);
      
      const { data } = await api.post('/api/excel/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      setUploadStatus(prev => ({
        ...prev,
        [sourceName]: { uploaded: true, excelDataId: data.excelDataId, headers: data.headers }
      }));
      
      toast.success(`${sourceName} uploaded successfully!`);
      await fetchDashboard(id);
    } catch (err) {
      toast.error(formatApiError(err));
    } finally {
      setUploading(false);
    }
  };
  
  const allUploaded = currentDashboard?.excelSourcesConfig?.every(
    source => source.status === 'uploaded' || source.status === 'mapped'
  );
  
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      
      <div className="p-6 md:p-8 max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-black tracking-tighter mb-2">
            Upload Excel Files
          </h1>
          <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
            {currentDashboard?.name || 'Dashboard'}
          </p>
        </div>
        
        <div className="space-y-6">
          {currentDashboard?.excelSourcesConfig?.map((source, index) => (
            <SourceUploadCard
              key={index}
              source={source}
              onUpload={(files) => handleUpload(files, source.name)}
              uploading={uploading}
            />
          ))}
        </div>
        
        {allUploaded && (
          <div className="mt-8 flex justify-end">
            <Button
              onClick={() => navigate(`/dashboards/${id}/map-columns`)}
              className="bg-black text-white font-bold uppercase tracking-[0.1em] text-sm rounded-none px-8 py-3 border-0 transition-all duration-200 hover:bg-gray-900"
              data-testid="proceed-to-mapping-button"
            >
              Proceed to Column Mapping
              <ArrowRight size={18} weight="bold" className="ml-2" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

const SourceUploadCard = ({ source, onUpload, uploading }) => {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: onUpload,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls']
    },
    multiple: false,
    disabled: uploading
  });
  
  const isUploaded = source.status === 'uploaded' || source.status === 'mapped';
  
  return (
    <div className="border border-gray-200 p-6" data-testid={`upload-card-${source.name}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold tracking-tight">{source.name}</h3>
        {isUploaded && (
          <div className="flex items-center gap-2 text-green-600">
            <CheckCircle size={20} weight="fill" />
            <span className="text-xs font-bold uppercase tracking-[0.2em]">Uploaded</span>
          </div>
        )}
      </div>
      
      {isUploaded && source.uploadedFileName && (
        <div className="mb-4 p-3 bg-gray-50 border border-gray-200">
          <div className="flex items-center gap-3">
            <FileXls size={24} weight="bold" className="text-gray-600" />
            <span className="text-sm text-gray-700">{source.uploadedFileName}</span>
          </div>
        </div>
      )}
      
      <div
        {...getRootProps()}
        className={`border-2 border-dashed p-8 text-center cursor-pointer transition-all duration-200 ${
          isDragActive 
            ? 'border-black bg-gray-50' 
            : 'border-gray-200 hover:border-gray-400'
        } ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
        data-testid={`dropzone-${source.name}`}
      >
        <input {...getInputProps()} />
        <UploadSimple size={48} weight="bold" className="text-gray-300 mx-auto mb-4" />
        {isDragActive ? (
          <p className="text-sm font-bold text-gray-800">Drop the file here...</p>
        ) : (
          <>
            <p className="text-sm font-bold text-gray-800 mb-2">
              Drag & drop an Excel file here, or click to select
            </p>
            <p className="text-xs text-gray-500">Supports .xlsx and .xls files (max 50MB)</p>
          </>
        )}
      </div>
    </div>
  );
};

export default ExcelUpload;
