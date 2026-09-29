import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDashboard } from '../../context/useDashboard';
import { useDropzone } from 'react-dropzone';
import { UploadSimple, ArrowRight } from '@phosphor-icons/react';
import { toast } from 'sonner';
import { formatApiError } from '../../services/api';
import { excelApi } from '../../services/excel';
import Button from '../../components/UI/button';
import useDashboardUploadProgress from '../../hooks/useDashboardUploadProgress';

const ExcelUpload = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentDashboard, fetchDashboard } = useDashboard();
  const [uploading, setUploading] = useState(false);
  const [jobStatusBySource, setJobStatusBySource] = useState({});

  const { socketState, subscribeToJob, clearActiveJob } = useDashboardUploadProgress({
    onProgress: async (payload) => {
      if (!payload?.sourceName) return;

      setJobStatusBySource((prev) => ({
        ...prev,
        [payload.sourceName]: payload
      }));

      if (payload.status === 'completed') {
        toast.success(`${payload.sourceName} processed successfully`);
        await fetchDashboard(id);
        clearActiveJob();
      }

      if (payload.status === 'failed') {
        toast.error(payload.errorMessage || `${payload.sourceName} processing failed`);
        await fetchDashboard(id);
        clearActiveJob();
      }
    }
  });

  useEffect(() => {
    if (id) fetchDashboard(id);
  }, [id, fetchDashboard]);

  const handleUpload = async (files, sourceName) => {
    if (!files.length) return;

    setUploading(true);

    try {
      const response = await excelApi.upload({
        file: files[0],
        dashboardId: id,
        sourceName,
      });

      if (response?.data?.uploadJobId && response?.data?.status === 'queued') {
        setJobStatusBySource((prev) => ({
          ...prev,
          [sourceName]: {
            jobId: response.data.uploadJobId,
            sourceName,
            status: 'queued'
          }
        }));
        toast.success(`${sourceName} queued for background processing`);
        subscribeToJob(response.data.uploadJobId);
      } else {
        toast.success(`${sourceName} uploaded successfully`);
      }

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
      <div className="p-6 md:p-8 max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-black mb-2">
            Upload Excel Files
          </h1>
          <p className="text-gray-600">
            {currentDashboard?.name}
          </p>
        </div>

        <div className="space-y-6">
          {currentDashboard?.excelSourcesConfig?.map(source => (
            <SourceUploadCard
              key={source.name}
              source={source}
              uploading={uploading}
              jobStatus={jobStatusBySource[source.name]}
              onUpload={(files) =>
                handleUpload(files, source.name)
              }
            />
          ))}
        </div>

        {allUploaded && (
          <div className="mt-8 flex justify-end">
            <Button
              onClick={() =>
                navigate(`/dashboards/${id}/map-columns`)
              }
            >
              Proceed to Column Mapping
              <ArrowRight size={18} className="ml-2" />
            </Button>
          </div>
        )}

        <p className="mt-4 text-xs text-gray-500">
          Upload channel: {socketState}
        </p>
      </div>
    </div>
  );
};

export default ExcelUpload;

const SourceUploadCard = ({ source, onUpload, uploading, jobStatus }) => {
  const { getRootProps, getInputProps, isDragActive } =
    useDropzone({
      onDrop: files => onUpload(files),
      accept: {
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': [
          '.xlsx'
        ],
        'application/vnd.ms-excel': ['.xls']
      },
      multiple: false,
      disabled: uploading
    });

  const isUploaded =
    source.status === 'uploaded' ||
    source.status === 'mapped';
  const isProcessing =
    source.status === 'processing' ||
    jobStatus?.status === 'queued' ||
    jobStatus?.status === 'processing';

  return (
    <div className="border border-gray-200 p-6">
      <div className="flex justify-between mb-4">
        <h3 className="text-xl font-bold">{source.name}</h3>
        {isUploaded && (
          <span className="text-green-600 text-sm font-bold">
            Uploaded
          </span>
        )}
        {isProcessing && (
          <span className="text-amber-600 text-sm font-bold">
            {jobStatus?.status === 'queued' ? 'Queued' : 'Processing'}
          </span>
        )}
      </div>

      <div
        {...getRootProps()}
        className={`border-2 border-dashed p-8 text-center cursor-pointer ${
          isDragActive
            ? 'border-black bg-gray-50'
            : 'border-gray-200'
        }`}
      >
        <input {...getInputProps()} />
        <UploadSimple
          size={40}
          className="mx-auto text-gray-400 mb-3"
        />
        <p className="text-sm font-semibold">
          Drag & drop Excel or click to upload
        </p>
      </div>
    </div>
  );
};
