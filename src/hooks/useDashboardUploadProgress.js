import { useCallback, useEffect, useRef, useState } from 'react';
import { getSocketClient } from '../services/api';
import { excelApi } from '../services/excel';

const TERMINAL = new Set(['completed', 'failed']);

export default function useDashboardUploadProgress({ onProgress }) {
  const socketRef = useRef(null);
  const pollingRef = useRef(null);
  const activeJobIdRef = useRef(null);
  const [socketState, setSocketState] = useState('idle');

  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }, []);

  const pollJobStatus = useCallback(async (jobId) => {
    try {
      const response = await excelApi.getUploadJobStatus(jobId);
      const payload = response?.data;
      if (!payload) return;

      onProgress?.(payload);

      if (TERMINAL.has(payload.status)) {
        stopPolling();
      }
    } catch {
      // Keep polling as fallback, ignore transient errors.
    }
  }, [onProgress, stopPolling]);

  const startPolling = useCallback((jobId) => {
    stopPolling();
    pollJobStatus(jobId);
    pollingRef.current = setInterval(() => {
      pollJobStatus(jobId);
    }, 5000);
  }, [pollJobStatus, stopPolling]);

  useEffect(() => {
    const socket = getSocketClient();
    socketRef.current = socket;

    const handleConnect = () => {
      setSocketState('connected');
      if (activeJobIdRef.current) {
        socket.emit('upload-job:subscribe', { jobId: activeJobIdRef.current });
      }
    };

    const handleDisconnect = () => {
      setSocketState('disconnected');
      if (activeJobIdRef.current) {
        startPolling(activeJobIdRef.current);
      }
    };

    const handleProgress = (payload) => {
      if (!payload?.jobId || payload.jobId !== activeJobIdRef.current) {
        return;
      }

      onProgress?.(payload);

      if (TERMINAL.has(payload.status)) {
        stopPolling();
      }
    };

    const handleError = () => {
      if (activeJobIdRef.current) {
        startPolling(activeJobIdRef.current);
      }
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('upload-job:progress', handleProgress);
    socket.on('upload-job:error', handleError);

    if (!socket.connected) {
      setSocketState('connecting');
      socket.connect();
    }

    return () => {
      stopPolling();
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('upload-job:progress', handleProgress);
      socket.off('upload-job:error', handleError);
      socket.disconnect();
    };
  }, [onProgress, startPolling, stopPolling]);

  const subscribeToJob = useCallback((jobId) => {
    if (!jobId) return;

    activeJobIdRef.current = jobId;

    const socket = socketRef.current || getSocketClient();
    socketRef.current = socket;

    startPolling(jobId);

    if (socket.connected) {
      socket.emit('upload-job:subscribe', { jobId });
      return;
    }

    setSocketState('connecting');
    socket.connect();
  }, [startPolling]);

  const clearActiveJob = useCallback(() => {
    activeJobIdRef.current = null;
    stopPolling();
  }, [stopPolling]);

  return {
    socketState,
    subscribeToJob,
    clearActiveJob
  };
}
