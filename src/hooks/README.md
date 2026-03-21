# Audio Recording Hook

## useAudioRecorder

A custom React hook for recording audio using the MediaRecorder API with full browser support and error handling.

### Features

- Records audio using the browser's MediaRecorder API
- Handles microphone permissions gracefully
- Cross-browser compatible (Chrome, Safari, Firefox)
- Automatic MIME type detection
- Memory leak prevention with proper cleanup
- Error handling for common issues
- Returns audio blob and URL for playback

### Usage

```tsx
import { useAudioRecorder } from '@/hooks/useAudioRecorder';
import { AudioPlayer } from '@/components/AudioPlayer';

function MyComponent() {
  const {
    isRecording,
    audioBlob,
    audioUrl,
    startRecording,
    stopRecording,
    permissionStatus,
    error,
  } = useAudioRecorder();

  return (
    <div>
      <button onClick={startRecording} disabled={isRecording}>
        Start Recording
      </button>
      <button onClick={stopRecording} disabled={!isRecording}>
        Stop Recording
      </button>

      {error && <div>Error: {error}</div>}
      {audioUrl && <AudioPlayer audioUrl={audioUrl} />}
    </div>
  );
}
```

### Return Values

| Property | Type | Description |
|----------|------|-------------|
| `isRecording` | `boolean` | Whether recording is currently active |
| `audioBlob` | `Blob \| null` | The recorded audio as a Blob object |
| `audioUrl` | `string \| null` | Object URL for playing back the recording |
| `startRecording` | `() => Promise<void>` | Start recording audio |
| `stopRecording` | `() => void` | Stop the current recording |
| `permissionStatus` | `'prompt' \| 'granted' \| 'denied' \| 'unsupported'` | Microphone permission status |
| `error` | `string \| null` | Error message if something went wrong |

### Permission Status

- **prompt**: Initial state, permission not yet requested
- **granted**: User has granted microphone access
- **denied**: User has denied microphone access
- **unsupported**: Browser doesn't support audio recording

### Error Handling

The hook handles various error scenarios:

- **Permission denied**: User denies microphone access
- **No microphone**: No microphone device found
- **Device in use**: Microphone is being used by another application
- **Unsupported browser**: Browser doesn't support MediaRecorder API
- **Recording errors**: Issues during the recording process

### Browser Support

Works in all modern browsers:
- Chrome/Edge (WebM with Opus)
- Firefox (WebM with Opus)
- Safari (MP4/AAC)

### Notes

- The hook automatically cleans up resources when the component unmounts
- Previous recordings are automatically cleaned up when starting a new recording
- Audio URLs are revoked to prevent memory leaks
- The hook uses audio constraints for better quality (echo cancellation, noise suppression, auto gain control)

### Example with Full Error Handling

```tsx
function AudioRecorder() {
  const {
    isRecording,
    audioUrl,
    startRecording,
    stopRecording,
    permissionStatus,
    error,
  } = useAudioRecorder();

  const handleStart = async () => {
    await startRecording();
  };

  return (
    <div>
      {permissionStatus === 'denied' && (
        <p>Please enable microphone access in your browser settings</p>
      )}

      {permissionStatus === 'unsupported' && (
        <p>Your browser doesn't support audio recording</p>
      )}

      {error && <p>Error: {error}</p>}

      <button onClick={handleStart} disabled={isRecording || permissionStatus === 'unsupported'}>
        {isRecording ? 'Recording...' : 'Start Recording'}
      </button>

      {isRecording && (
        <button onClick={stopRecording}>Stop</button>
      )}

      {audioUrl && <AudioPlayer audioUrl={audioUrl} />}
    </div>
  );
}
```
