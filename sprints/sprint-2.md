# Sprint 2: Web Speech API Integration

**Focus:** Implement voice recognition using the browser's native API so the app can hear and transcribe the user's commands.

## 📋 Tasks for the Agent

- [ ] **Create `useSpeechRecognition` Hook:** Build a custom React hook to manage the `window.SpeechRecognition` API.
- [ ] **Microphone Button Logic:** Connect the existing microphone UI button to start and stop the voice recording.
- [ ] **Real-time Transcription UI:** Add a dynamic UI element to display the `interimTranscript` (live text guessing) while the user is speaking.
- [ ] **Error Handling:** Implement graceful error handling for denied microphone permissions or unsupported browsers.
