import { useCallback, useMemo, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

import Header from '../../components/Layout/Header';
import ImportMappingStep from '../../components/Import/ImportMappingStep';
import ImportProcessingStep from '../../components/Import/ImportProcessingStep';
import ImportResultStep from '../../components/Import/ImportResultStep';
import ImportStepper from '../../components/Import/ImportStepper';
import ImportUploadStep from '../../components/Import/ImportUploadStep';
import {
  importTypeOptions,
  maxImportFileSizeBytes,
  maxImportFileSizeMb,
  targetFieldOptionsFallback
} from '../../components/Import/importConstants';
import useImportProgress from '../../hooks/useImportProgress';
import { uploadsApi } from '../../services/uploads';
import {
  additionalTargetFieldsByImportType,
  hiddenTargetFieldsByImportType,
  mandatoryFieldsByImportType,
} from '../../config/importFormFields';
import {
  getMissingMandatoryFields,
  getValidColumnMappings,
} from '../../config/inputValidation';

const ensureTargetFieldOptions = (options, importType) => {
  const baseOptions = Array.isArray(options) ? options : [];
  const additionalOptions = additionalTargetFieldsByImportType[importType] || [];
  const optionMap = new Map(baseOptions.map((option) => [option.value, option]));

  additionalOptions.forEach((option) => {
    if (!optionMap.has(option.value)) {
      optionMap.set(option.value, option);
    }
  });

  return Array.from(optionMap.values());
};

const withDerivedCodeMappings = (mappings) => {
  const validMappings = getValidColumnMappings(mappings);
  const mappingByTarget = new Map(validMappings.map((item) => [item.targetField, item]));
  const enrichedMappings = [...validMappings];

  const phoneMapping = mappingByTarget.get('phone');
  if (!mappingByTarget.has('externalId') && phoneMapping) {
    enrichedMappings.push({
      ...phoneMapping,
      targetField: 'externalId',
    });
  }

  const locationNameMapping = mappingByTarget.get('demographics.location.locationName');
  if (!mappingByTarget.has('demographics.location.locationCode') && locationNameMapping) {
    enrichedMappings.push({
      ...locationNameMapping,
      targetField: 'demographics.location.locationCode',
    });
  }

  return enrichedMappings;
};

export default function Import() {
  const queryClient = useQueryClient();

  const [step, setStep] = useState(1);
  const [uploadData, setUploadData] = useState(null);
  const [columnMapping, setColumnMapping] = useState([]);
  const [processingStatus, setProcessingStatus] = useState(null);
  const [debugEvents, setDebugEvents] = useState([]);
  const [importType, setImportType] = useState(importTypeOptions[0].value);
  const [targetFieldOptions, setTargetFieldOptions] = useState(targetFieldOptionsFallback);

  const targetFieldOptionsWithMandatoryMarks = useMemo(() => {
    const hiddenTargetFieldSet = hiddenTargetFieldsByImportType[importType] || new Set();
    const visibleTargetOptions = ensureTargetFieldOptions(targetFieldOptions, importType).filter(
      (option) => !hiddenTargetFieldSet.has(option.value)
    );
    const mandatoryValues = new Set(
      (mandatoryFieldsByImportType[importType] || []).map((field) => field.value)
    );

    return visibleTargetOptions.map((option) => {
      if (!option.value || !mandatoryValues.has(option.value)) {
        return option;
      }

      return {
        ...option,
        label: option.label.includes('*') ? option.label : `${option.label} *`,
      };
    });
  }, [targetFieldOptions, importType]);

  const addDebugEvent = useCallback((message, details) => {
    const entry = {
      timestamp: new Date().toLocaleTimeString(),
      message,
      details: details || null,
    };

    setDebugEvents((prev) => [entry, ...prev].slice(0, 25));
  }, []);

  const finishImport = useCallback(
    (statusData, isTerminal = true) => {
      setProcessingStatus(statusData);

      if (!isTerminal) {
        return;
      }

      setStep(4);
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['upload-history'] });
    },
    [queryClient]
  );

  const { clearActiveUpload, socketState, subscribeToUpload } = useImportProgress({
    onFinish: finishImport,
    addDebugEvent,
  });

  const uploadMutation = useMutation({
    mutationFn: (file) => uploadsApi.upload(file, importType),

    onSuccess: async (response) => {
      const uploadedData = response?.data;

      addDebugEvent('Upload API succeeded', {
        uploadId: uploadedData.uploadId,
        totalRows: uploadedData.totalRows,
        columns: uploadedData.columns,
      });

      setUploadData(uploadedData);

      try {
        const [fieldsRes, suggestionsRes] = await Promise.all([
          uploadsApi.getTargetFields(importType),
          uploadsApi.suggestMappings(uploadedData.columns, importType),
        ]);

        const suggestions = Array.isArray(suggestionsRes?.data) ? suggestionsRes.data : [];

        const incomingOptions =
          Array.isArray(fieldsRes?.data) && fieldsRes.data.length
            ? fieldsRes.data
            : targetFieldOptionsFallback;

        setTargetFieldOptions(ensureTargetFieldOptions(incomingOptions, importType));

        addDebugEvent('Suggested mappings loaded', {
          uploadId: uploadedData.uploadId,
          suggestions: suggestions.length,
        });

        const mapping = uploadedData.columns.map((col) => {
          const suggestion = suggestions.find((item) => item.sourceColumn === col);
          const suggestedTarget = suggestion?.targetField || '';
          const hiddenTargetFieldSet = hiddenTargetFieldsByImportType[importType] || new Set();

          return {
            sourceColumn: col,
            targetField: hiddenTargetFieldSet.has(suggestedTarget) ? '' : suggestedTarget,
            transformation: 'none',
          };
        });

        setColumnMapping(mapping);
      } catch (error) {
        console.error('Mapping suggestions failed:', error);

        setTargetFieldOptions(targetFieldOptionsFallback);

        addDebugEvent('Suggested mappings failed', {
          uploadId: uploadedData.uploadId,
          error: error.response?.data?.message || error.message,
        });

        const mapping = uploadedData.columns.map((col) => ({
          sourceColumn: col,
          targetField: '',
          transformation: 'none',
        }));

        setColumnMapping(mapping);
      }

      setStep(2);
      toast.success('File uploaded successfully');
    },

    onError: (error) => {
      addDebugEvent('Upload API failed', {
        error: error.response?.data?.message || error.message,
        statusCode: error.response?.status || null,
      });

      toast.error(error.response?.data?.message || 'Upload failed');
    },
  });

  const processMutation = useMutation({
    mutationFn: () => {
      addDebugEvent('Sending process request', {
        uploadId: uploadData?.uploadId,
        mappedColumns: columnMapping.filter((item) => item.targetField).length,
      });

      return uploadsApi.process(uploadData.uploadId);
    },

    onSuccess: (response) => {
      const statusFromApi = response?.data?.status || 'processing';

      addDebugEvent('Process API responded', {
        uploadId: uploadData?.uploadId,
        apiStatus: statusFromApi,
        message: response?.message || null,
      });

      const nextStatus = {
        uploadId: uploadData?.uploadId,
        status: statusFromApi,
        stats: {
          processedRows: 0,
          totalRows: uploadData?.totalRows || 0,
          successRows: 0,
          errorRows: 0,
          skippedRows: 0,
          newCustomers: 0,
          updatedCustomers: 0,
          newTransactions: 0,
        },
        errors: [],
      };

      setStep(3);
      setProcessingStatus(nextStatus);
      subscribeToUpload(uploadData.uploadId);
    },

    onError: (error) => {
      addDebugEvent('Process API failed', {
        uploadId: uploadData?.uploadId,
        error: error.response?.data?.message || error.message,
        statusCode: error.response?.status || null,
      });

      toast.error(error.response?.data?.message || 'Processing failed');
      setStep(2);
    },
  });

  const mappingMutation = useMutation({
    mutationFn: () => {
      const validColumnMappings = getValidColumnMappings(columnMapping);
      const mappedWithDerivedCodes = withDerivedCodeMappings(columnMapping);

      addDebugEvent('Saving column mapping', {
        uploadId: uploadData?.uploadId,
        totalMappings: columnMapping.length,
        mappedColumns: validColumnMappings.length,
        mappedColumnsWithDerivedCodes: mappedWithDerivedCodes.length,
      });

      if (validColumnMappings.length === 0) {
        throw new Error('Please map at least one column before processing');
      }

      const missingMandatoryFields = getMissingMandatoryFields(
        mappedWithDerivedCodes,
        importType,
        mandatoryFieldsByImportType
      );

      if (missingMandatoryFields.length > 0) {
        const firstMissingField = missingMandatoryFields[0];
        const message = `${firstMissingField.label} is required`;

        addDebugEvent('Mandatory mapping validation failed', {
          uploadId: uploadData?.uploadId,
          missingFields: missingMandatoryFields.map((field) => field.label),
        });

        throw new Error(message);
      }

      return uploadsApi.setMapping(uploadData.uploadId, mappedWithDerivedCodes);
    },

    onSuccess: () => {
      addDebugEvent('Column mapping saved');
      processMutation.mutate();
    },

    onError: (error) => {
      addDebugEvent('Column mapping save failed', {
        uploadId: uploadData?.uploadId,
        error: error.response?.data?.message || error.message,
        statusCode: error.response?.status || null,
      });

      toast.error(
        error.response?.data?.message ||
          error.message ||
          'Failed to save mapping'
      );
    },
  });
  const confirmSaveMutation = useMutation({
  mutationFn: () => uploadsApi.confirmSave(uploadData.uploadId),

  onSuccess: (response) => {
    const savedData = response?.data || response;

    setProcessingStatus((prev) => ({
      ...prev,
      ...savedData,
      status: savedData?.status || 'completed',
      stats: savedData?.stats || prev?.stats,
    }));

    toast.success('Valid data saved successfully');

    queryClient.invalidateQueries({ queryKey: ['customers'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    queryClient.invalidateQueries({ queryKey: ['upload-history'] });
  },

  onError: (error) => {
    toast.error(error.response?.data?.message || error.message || 'Save failed');
  },
});

  const { data: historyData } = useQuery({
    queryKey: ['upload-history'],
    queryFn: () => uploadsApi.getHistory({ limit: 5 }),
  });

  const onDrop = useCallback(
    (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        const selectedFile = acceptedFiles[0];

        if (selectedFile.size > maxImportFileSizeBytes) {
          const message = `File is too large. Upload a CSV or Excel file up to ${maxImportFileSizeMb}MB.`;

          toast.error(message);

          addDebugEvent('Upload rejected before API request', {
            name: selectedFile.name,
            size: selectedFile.size,
            maxSize: maxImportFileSizeBytes,
            reason: 'file-too-large',
          });

          return;
        }

        clearActiveUpload();
        setDebugEvents([]);
        setProcessingStatus(null);

        addDebugEvent('Selected file for upload', {
          name: selectedFile.name,
          size: selectedFile.size,
          type: selectedFile.type,
        });

        uploadMutation.mutate(selectedFile);
      }
    },
    [addDebugEvent, clearActiveUpload, uploadMutation]
  );

  const onDropRejected = useCallback(
    (fileRejections) => {
      const firstRejection = fileRejections[0];
      const firstError = firstRejection?.errors?.[0];
      const rejectedFile = firstRejection?.file;

      const message =
        firstError?.code === 'file-too-large'
          ? `File is too large. Upload a CSV or Excel file up to ${maxImportFileSizeMb}MB.`
          : firstError?.code === 'file-invalid-type'
            ? 'Unsupported file type. Upload a CSV, XLSX, or XLS file.'
            : firstError?.message ||
              'File could not be uploaded. Please choose a valid import file.';

      toast.error(message);

      addDebugEvent('Upload rejected by file picker', {
        name: rejectedFile?.name || null,
        size: rejectedFile?.size || null,
        maxSize: maxImportFileSizeBytes,
        code: firstError?.code || null,
        message,
      });
    },
    [addDebugEvent]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    onDropRejected,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
    },
    maxFiles: 1,
    maxSize: maxImportFileSizeBytes,
  });

  const handleMappingChange = (index, field, value) => {
    const nextMapping = [...columnMapping];

    nextMapping[index] = {
      ...nextMapping[index],
      [field]: value,
    };

    setColumnMapping(nextMapping);
  };

  const resetImport = () => {
    clearActiveUpload();
    setStep(1);
    setUploadData(null);
    setColumnMapping([]);
    setProcessingStatus(null);
    setDebugEvents([]);
    setImportType(importTypeOptions[0].value);
    setTargetFieldOptions(targetFieldOptionsFallback);
  };

  const progressTotal = processingStatus?.stats?.totalRows || uploadData?.totalRows || 0;
  const progressProcessed = processingStatus?.stats?.processedRows || 0;

  const progressPercent = progressTotal
    ? ((progressProcessed / progressTotal) * 100).toFixed(2)
    : '0.00';

  return (
    <div>
      <Header
        title="Import Data"
        subtitle="Upload customer detail or customer sales data from CSV or Excel files"
      />

      <div className="p-8">
        <ImportStepper step={step} />

        {step === 1 ? (
          <ImportUploadStep
            getRootProps={getRootProps}
            getInputProps={getInputProps}
            isDragActive={isDragActive}
            isUploading={uploadMutation.isPending}
            historyData={historyData}
            maxFileSizeMb={maxImportFileSizeMb}
            importType={importType}
            onImportTypeChange={setImportType}
          />
        ) : null}

        {step === 2 && uploadData ? (
          <ImportMappingStep
            uploadData={uploadData}
            columnMapping={columnMapping}
            onCancel={resetImport}
            onProcess={() => mappingMutation.mutate()}
            isSaving={mappingMutation.isPending}
            onMappingChange={handleMappingChange}
            targetFieldOptions={targetFieldOptionsWithMandatoryMarks}
            importType={importType}
          />
        ) : null}

        {step === 3 ? (
          <ImportProcessingStep
            socketState={socketState}
            progressProcessed={progressProcessed}
            progressTotal={progressTotal}
            progressPercent={progressPercent}
            debugEvents={debugEvents}
            uploadId={uploadData?.uploadId}
          />
        ) : null}

        {step === 4 && processingStatus ? (
         <ImportResultStep
           processingStatus={processingStatus}
            onReset={resetImport}
            onConfirmSave={() => confirmSaveMutation.mutate()}
            isSaving={confirmSaveMutation.isPending}
            onExportErrors={() => uploadsApi.exportErrors(uploadData?.uploadId)}
         />
         ) : null}
      </div>
    </div>
  );
}
