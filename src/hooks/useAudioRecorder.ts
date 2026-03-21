'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

type PermissionStatus = 'prompt' | 'granted' | 'denied' | 'unsupported';

interface UseAudioRecorderReturn {
  isRecording: boolean;
  audioBlob: Blob | null;
  audioUrl: string | null;
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  permissionStatus: PermissionStatus;
  error: string | null;
}

export function useAudioRecorder(): UseAudioRecorderReturn {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<PermissionStatus>('prompt');
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  // Check if MediaRecorder is supported
  const isMediaRecorderSupported = useCallback(() => {
    return typeof window !== 'undefined' && 'MediaRecorder' in window && 'mediaDevices' in navigator;
  }, []);

  // Clean up previous audio URL to prevent memory leaks
  const cleanupAudioUrl = useCallback(() => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }
  }, [audioUrl]);

  // Stop and clean up media stream
  const cleanupMediaStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  }, []);

  // Get supported MIME type for the browser
  const getSupportedMimeType = useCallback((): string => {
    const mimeTypes = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/ogg;codecs=opus',
      'audio/mp4',
      'audio/mpeg',
      'audio/wav',
    ];

    for (const mimeType of mimeTypes) {
      if (MediaRecorder.isTypeSupported(mimeType)) {
        return mimeType;
      }
    }

    // Fallback to default
    return '';
  }, []);

  // Start recording
  const startRecording = useCallback(async () => {
    try {
      // Reset error state
      setError(null);

      // Check browser support
      if (!isMediaRecorderSupported()) {
        setPermissionStatus('unsupported');
        setError('Audio recording is not supported in this browser');
        return;
      }

      // Clean up previous recording
      cleanupAudioUrl();
      setAudioBlob(null);
      audioChunksRef.current = [];

      // Request microphone access
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          }
        });

        streamRef.current = stream;
        setPermissionStatus('granted');

        // Get supported MIME type
        const mimeType = getSupportedMimeType();

        // Create MediaRecorder with options
        const options: MediaRecorderOptions = {};
        if (mimeType) {
          options.mimeType = mimeType;
        }

        const mediaRecorder = new MediaRecorder(stream, options);
        mediaRecorderRef.current = mediaRecorder;

        // Handle data available event
        mediaRecorder.ondataavailable = (event: BlobEvent) => {
          if (event.data && event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        // Handle recording stop event
        mediaRecorder.onstop = () => {
          // Create blob from recorded chunks
          const mimeTypeUsed = mediaRecorder.mimeType || 'audio/webm';
          const blob = new Blob(audioChunksRef.current, { type: mimeTypeUsed });
          setAudioBlob(blob);

          // Create URL for playback
          const url = URL.createObjectURL(blob);
          setAudioUrl(url);

          // Clean up stream
          cleanupMediaStream();
        };

        // Handle errors
        mediaRecorder.onerror = (event: Event) => {
          const errorEvent = event as ErrorEvent;
          setError(`Recording error: ${errorEvent.message || 'Unknown error'}`);
          setIsRecording(false);
          cleanupMediaStream();
        };

        // Start recording (request data every second for better reliability)
        mediaRecorder.start(1000);
        setIsRecording(true);

      } catch (err) {
        // Handle permission denied or other getUserMedia errors
        if (err instanceof Error) {
          if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
            setPermissionStatus('denied');
            setError('Microphone access was denied. Please grant permission to record audio.');
          } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
            setError('No microphone found. Please connect a microphone and try again.');
          } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
            setError('Microphone is already in use by another application.');
          } else {
            setError(`Failed to access microphone: ${err.message}`);
          }
        } else {
          setError('An unknown error occurred while accessing the microphone.');
        }
      }

    } catch (err) {
      setError('An unexpected error occurred while starting the recording.');
      console.error('Recording error:', err);
    }
  }, [isMediaRecorderSupported, cleanupAudioUrl, getSupportedMimeType, cleanupMediaStream]);

  // Stop recording
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      try {
        // Stop the recorder if it's recording or paused
        if (mediaRecorderRef.current.state !== 'inactive') {
          mediaRecorderRef.current.stop();
        }
        setIsRecording(false);
      } catch (err) {
        setError('Failed to stop recording');
        console.error('Stop recording error:', err);
      }
    }
  }, [isRecording]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupAudioUrl();
      cleanupMediaStream();

      // Stop recording if still active
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        try {
          mediaRecorderRef.current.stop();
        } catch (err) {
          console.error('Cleanup error:', err);
        }
      }
    };
  }, [cleanupAudioUrl, cleanupMediaStream]);

  return {
    isRecording,
    audioBlob,
    audioUrl,
    startRecording,
    stopRecording,
    permissionStatus,
    error,
  };
}
