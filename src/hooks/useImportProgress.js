import { useCallback, useEffect, useRef, useState } from 'react';

import { SOCKET_PROGRESS_ENABLED, getSocketClient } from '../services/api';
import { uploadsApi } from '../services/uploads';
import { terminalStatuses } from '../components/Import/importConstants';

export default function useImportProgress({ onFinish, addDebugEvent }) {
  const socketRef = useRef(null);
  const pollingRef = useRef(null);
  const socketFallbackRef = useRef(null);
  const activeUploadIdRef = useRef(null);
  const [socketState, setSocketState] = useState('idle');

  const clearSocketFallback = useCallback(() => {
    if (socketFallbackRef.current) {
      clearTimeout(socketFallbackRef.current);
      socketFallbackRef.current = null;
    }
  }, []);

  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }, []);

  const pollUploadStatus = useCallback(async (uploadId) => {
    try {
      const response = await uploadsApi.getStatus(uploadId);
      const latestStatus = response?.data;
      if (!latestStatus) return;

      onFinish(latestStatus, terminalStatuses.has(latestStatus.status));

      if (terminalStatuses.has(latestStatus.status)) {
        stopPolling();
      }
    } catch (error) {
      addDebugEvent('Fallback status fetch failed', {
        uploadId,
        error: error.response?.data?.message || error.response?.data?.detail || error.message,
      });
    }
  }, [addDebugEvent, onFinish, stopPolling]);

  const startPolling = useCallback((uploadId) => {
    stopPolling();
    setSocketState('polling');
    pollUploadStatus(uploadId);
    pollingRef.current = setInterval(() => {
      pollUploadStatus(uploadId);
    }, 5000);
  }, [pollUploadStatus, stopPolling]);

  const startPollingIfActive = useCallback(() => {
    const activeUploadId = activeUploadIdRef.current;
    if (activeUploadId) {
      startPolling(activeUploadId);
    }
  }, [startPolling]);

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
    if (!SOCKET_PROGRESS_ENABLED) {
      setSocketState('polling');
      return () => {
        stopPolling();
      };
    }

    const socket = getSocketClient();
    socketRef.current = socket;

    const handleConnect = () => {
      clearSocketFallback();
      stopPolling();
      setSocketState('connected');
      addDebugEvent('Socket connected', { socketId: socket.id });

      if (activeUploadIdRef.current) {
        socket.emit('upload:subscribe', { uploadId: activeUploadIdRef.current });
      }
    };

    const handleDisconnect = (reason) => {
      setSocketState('disconnected');
      addDebugEvent('Socket disconnected', { reason });
      startPollingIfActive();
    };

    const handleConnectError = (error) => {
      addDebugEvent('Socket connection failed; using status polling', {
        error: error?.message || 'Unable to connect to live updates',
      });
      startPollingIfActive();
    };

    const handleSubscribed = ({ uploadId }) => {
      addDebugEvent('Subscribed to upload progress stream', { uploadId });
    };

    const handleError = async (payload) => {
      addDebugEvent('Socket upload event reported an error', payload);

      if (payload?.uploadId && payload.uploadId === activeUploadIdRef.current) {
        try {
          const response = await uploadsApi.getStatus(payload.uploadId);
          const latestStatus = response?.data;
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
    socket.on('connect_error', handleConnectError);
    socket.on('disconnect', handleDisconnect);
    socket.on('upload:subscribed', handleSubscribed);
    socket.on('upload:progress', handleProgressEvent);
    socket.on('upload:error', handleError);

    if (!socket.connected) {
      setSocketState('connecting');
      socket.connect();
    }

    return () => {
      stopPolling();
      clearSocketFallback();
      socket.off('connect', handleConnect);
      socket.off('connect_error', handleConnectError);
      socket.off('disconnect', handleDisconnect);
      socket.off('upload:subscribed', handleSubscribed);
      socket.off('upload:progress', handleProgressEvent);
      socket.off('upload:error', handleError);
      socket.disconnect();
    };
  }, [
    addDebugEvent,
    clearSocketFallback,
    handleProgressEvent,
    onFinish,
    startPollingIfActive,
    stopPolling,
  ]);

  const subscribeToUpload = useCallback((uploadId) => {
    activeUploadIdRef.current = uploadId;

    addDebugEvent('Subscribing to upload progress stream', { uploadId });

    if (!SOCKET_PROGRESS_ENABLED) {
      startPolling(uploadId);
      return;
    }

    const socket = socketRef.current || getSocketClient();
    socketRef.current = socket;

    if (socket.connected) {
      socket.emit('upload:subscribe', { uploadId });
      return;
    }

    setSocketState('connecting');
    socket.connect();
    clearSocketFallback();
    socketFallbackRef.current = setTimeout(() => {
      if (!socket.connected && activeUploadIdRef.current === uploadId) {
        addDebugEvent('Live updates unavailable; using status polling', { uploadId });
        startPolling(uploadId);
      }
    }, 3000);
  }, [addDebugEvent, clearSocketFallback, startPolling]);

  const clearActiveUpload = useCallback(() => {
    activeUploadIdRef.current = null;
    clearSocketFallback();
    stopPolling();
  }, [clearSocketFallback, stopPolling]);

  return {
    clearActiveUpload,
    socketState,
    subscribeToUpload,
  };
}
