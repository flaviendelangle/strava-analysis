import { useState } from "react";

import { useAction } from "convex/react";

import { useAthleteId } from "~/hooks/useAthleteId";
import type { SessionDataPoint, SessionSummary } from "~/sensors/types";
import { downloadFitFile, generateFitFile } from "~/utils/fitFileGenerator";

import { api } from "../../../convex/_generated/api";

interface ExportPanelProps {
  dataPoints: SessionDataPoint[];
  summary: SessionSummary;
}

export function ExportPanel(props: ExportPanelProps) {
  const { dataPoints, summary } = props;
  const athleteId = useAthleteId();
  const uploadAction = useAction(api.stravaUpload.uploadToStrava);
  const checkStatusAction = useAction(api.stravaUpload.checkUploadStatus);

  const [uploadState, setUploadState] = useState<
    "idle" | "uploading" | "processing" | "success" | "error"
  >("idle");
  const [activityId, setActivityId] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleDownloadFit = () => {
    const buffer = generateFitFile(dataPoints, summary);
    downloadFitFile(buffer);
  };

  const handleUploadToStrava = async () => {
    if (!athleteId) return;

    setUploadState("uploading");
    setErrorMsg(null);

    try {
      const buffer = generateFitFile(dataPoints, summary);
      const bytes = new Uint8Array(buffer);
      let binary = "";
      for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      const base64 = btoa(binary);

      const name = `Indoor Training ${summary.startTime.toLocaleDateString()}`;

      const result = await uploadAction({
        athleteId,
        fitFileBase64: base64,
        name,
      });

      setUploadState("processing");

      // Poll for completion
      const uploadId = result.uploadId;
      let attempts = 0;
      while (attempts < 30) {
        await new Promise((r) => setTimeout(r, 2000));
        const status = await checkStatusAction({ athleteId, uploadId });

        if (status.activityId) {
          setActivityId(status.activityId);
          setUploadState("success");
          return;
        }
        if (status.error) {
          setErrorMsg(status.error);
          setUploadState("error");
          return;
        }
        attempts++;
      }

      setErrorMsg("Upload is taking longer than expected. Check Strava.");
      setUploadState("error");
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "Upload failed");
      setUploadState("error");
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        onClick={handleDownloadFit}
        className="rounded-md bg-gray-600 px-4 py-2 text-sm font-medium text-white hover:bg-gray-500"
      >
        Download FIT
      </button>

      <button
        onClick={handleUploadToStrava}
        disabled={uploadState === "uploading" || uploadState === "processing" || !athleteId}
        className="rounded-md bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-500 disabled:opacity-50"
      >
        {uploadState === "uploading"
          ? "Uploading..."
          : uploadState === "processing"
            ? "Processing..."
            : "Upload to Strava"}
      </button>

      {uploadState === "success" && activityId && (
        <a
          href={`https://www.strava.com/activities/${activityId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-orange-400 underline"
        >
          View on Strava
        </a>
      )}

      {uploadState === "error" && errorMsg && (
        <span className="text-sm text-red-400">{errorMsg}</span>
      )}
    </div>
  );
}
