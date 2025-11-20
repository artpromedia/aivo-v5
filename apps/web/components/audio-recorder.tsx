"use client";

import { useRef, useState } from "react";

interface AudioRecorderProps {
  onRecordComplete: (base64Audio: string) => void;
}

export function AudioRecorder({ onRecordComplete }: AudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);

  const startRecording = async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const base64 = await blobToBase64(blob);
        onRecordComplete(base64);
        stream.getTracks().forEach((track) => track.stop());
      };

      recorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error(err);
      setError("Microphone unavailable. Please allow access or type a response.");
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
  };

  return (
    <div className="space-y-2 rounded-xl border border-purple-200 bg-purple-50/60 p-4 text-sm">
      <p className="font-semibold">Audio response</p>
      <p className="text-purple-800/80">
        {isRecording ? "Recording..." : "Record a quick spoken response."}
      </p>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={isRecording ? stopRecording : startRecording}
          className={`rounded-full px-4 py-2 font-semibold text-white transition ${
            isRecording ? "bg-red-500" : "bg-purple-500"
          }`}
        >
          {isRecording ? "Stop" : "Start"}
        </button>
        {isRecording && <span className="text-red-500">● Recording</span>}
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result;
      if (typeof result === "string") {
        resolve(result);
      } else {
        reject(new Error("Unable to read audio"));
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
