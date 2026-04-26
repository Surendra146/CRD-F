import { useCallback, useEffect, useRef, useState } from 'react';

import { getSocketClient } from '../services/api';
import { uploadsApi } from '../services/uploads';
import { terminalStatuses } from '../components/Import/importConstants';

export default function useImportProgress({ onFinish, addDebugEvent }) {
  const socketRef = useRef(null);
  const activeUploadIdRef = useRef(null);
  const [socketState, setSocketState] = useState('idle');

  const handleProgressEvent = useCallback((statusData) => {
    if (!statusData?.uploadId || statusData.uploadId !== activeUploadIdRef.current) {
      return;
    }

    addDebugEvent('Received upload progress event', {
      uploadId: statusData.uploadId,
      status: statusData.status,
      processedRows: statusData.stats?.processedRows || 0,
      totalRows: statusData.stats?.totalRows || 0,
      errorCount: statusData.errors?.length || 0,
    });

    onFinish(statusData, terminalStatuses.has(statusData.status));
  }, [addDebugEvent, onFinish]);

  useEffect(() => {
    const socket = getSocketClient();
    socketRef.current = socket;

    const handleConnect = () => {
      setSocketState('connected');
      addDebugEvent('Socket connected', { socketId: socket.id });

      if (activeUploadIdRef.current) {
        socket.emit('upload:subscribe', { uploadId: activeUploadIdRef.current });
      }
    };

    const handleDisconnect = (reason) => {
      setSocketState('disconnected');
      addDebugEvent('Socket disconnected', { reason });
    };

    const handleSubscribed = ({ uploadId }) => {
      addDebugEvent('Subscribed to upload progress stream', { uploadId });
    };

    const handleError = async (payload) => {
      addDebugEvent('Socket upload event reported an error', payload);

      if (payload?.uploadId && payload.uploadId === activeUploadIdRef.current) {
        try {
          const response = await uploadsApi.getStatus(payload.uploadId);
          const latestStatus = response.data.data;
          onFinish(latestStatus, terminalStatuses.has(latestStatus.status));
        } catch (error) {
          addDebugEvent('Fallback status fetch failed after socket error', {
            uploadId: payload.uploadId,
            error: error.response?.data?.message || error.message,
          });
        }
      }
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('upload:subscribed', handleSubscribed);
    socket.on('upload:progress', handleProgressEvent);
    socket.on('upload:error', handleError);

    if (!socket.connected) {
      setSocketState('connecting');
      socket.connect();
    }

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('upload:subscribed', handleSubscribed);
      socket.off('upload:progress', handleProgressEvent);
      socket.off('upload:error', handleError);
      socket.disconnect();
    };
  }, [addDebugEvent, handleProgressEvent, onFinish]);

  const subscribeToUpload = useCallback((uploadId) => {
    activeUploadIdRef.current = uploadId;

    const socket = socketRef.current || getSocketClient();
    socketRef.current = socket;

    addDebugEvent('Subscribing to upload progress stream', { uploadId });

    if (socket.connected) {
      socket.emit('upload:subscribe', { uploadId });
      return;
    }

    setSocketState('connecting');
    socket.connect();
  }, [addDebugEvent]);

  const clearActiveUpload = useCallback(() => {
    activeUploadIdRef.current = null;
  }, []);

  return {
    clearActiveUpload,
    socketState,
    subscribeToUpload,
  };
}
