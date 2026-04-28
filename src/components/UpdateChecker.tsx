import React, { useEffect, useState } from "react";
import { AlertCircle, CheckCircle2, Download, RefreshCw } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

interface UpdateInfo {
  version: string;
  releaseDate?: string;
  releaseNotes?: string;
}

const UpdateChecker: React.FC = () => {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [updateReady, setUpdateReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [noUpdatesMessage, setNoUpdatesMessage] = useState(false);

  useEffect(() => {
    if (!window.api) return;

    // Listen for update available
    window.api.onUpdateAvailable((data: UpdateInfo) => {
      console.log("Update available:", data);
      setUpdateInfo(data);
      setUpdateAvailable(true);
      setError(null);
      setNoUpdatesMessage(false);
    });

    // Listen for update not available
    window.api.onUpdateNotAvailable(() => {
      console.log("No updates available");
      setNoUpdatesMessage(true);
      setError(null);
    });

    // Listen for download progress
    window.api.onUpdateDownloadProgress((progress: number) => {
      console.log("Download progress:", progress);
      setDownloadProgress(progress);
    });

    // Listen for update downloaded
    window.api.onUpdateDownloaded((data: UpdateInfo) => {
      console.log("Update downloaded:", data);
      setUpdateReady(true);
      setDownloading(false);
      setNoUpdatesMessage(false);
    });

    // Listen for errors
    window.api.onUpdateError((error: string) => {
      console.error("Update error:", error);
      setError(error);
      setDownloading(false);
      setNoUpdatesMessage(false);
    });

    // Check for updates on mount
    window.api.checkForUpdates().catch((err: unknown) => {
      console.error("Error checking for updates:", err);
    });

    // Check for updates every hour
    const interval = setInterval(
      () => {
        window.api.checkForUpdates().catch((err: unknown) => {
          console.error("Error checking for updates:", err);
        });
      },
      60 * 60 * 1000,
    ); // 1 hour

    return () => clearInterval(interval);
  }, []);

  const handleDownload = async () => {
    setDownloading(true);
    setError(null);
    try {
      await window.api.downloadUpdate();
    } catch (err: any) {
      setError(err.message || "Failed to download update");
      setDownloading(false);
    }
  };

  const handleInstall = () => {
    window.api.installUpdate();
  };

  if (error) {
    return (
      <Alert variant="destructive" className="m-4">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (updateReady) {
    return (
      <Alert className="m-4 bg-green-50 border-green-200">
        <RefreshCw className="h-4 w-4 text-green-600" />
        <AlertTitle className="text-green-900">
          Update Ready to Install
        </AlertTitle>
        <AlertDescription className="text-green-800">
          <p className="mb-3">
            Version {updateInfo?.version} is ready to install. Restart the
            application to complete the update.
          </p>
          <Button
            size="sm"
            onClick={handleInstall}
            className="bg-green-600 hover:bg-green-700"
          >
            <RefreshCw className="w-4 h-4 mr-2" /> Restart & Install
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  if (downloading) {
    return (
      <Alert className="m-4">
        <Download className="h-4 w-4" />
        <AlertTitle>Downloading Update</AlertTitle>
        <AlertDescription>
          <p className="mb-2">
            Version {updateInfo?.version} is being downloaded...
          </p>
          <Progress value={downloadProgress} className="h-2" />
          <p className="text-xs text-slate-500 mt-1">{downloadProgress}%</p>
        </AlertDescription>
      </Alert>
    );
  }

  if (updateAvailable) {
    return (
      <Alert className="m-4 bg-blue-50 border-blue-200">
        <AlertCircle className="h-4 w-4 text-blue-600" />
        <AlertTitle className="text-blue-900">Update Available</AlertTitle>
        <AlertDescription className="text-blue-800">
          <p className="mb-3">
            Version {updateInfo?.version} is available for download.
            {updateInfo?.releaseDate && (
              <>
                {" "}
                Released on{" "}
                {new Date(updateInfo.releaseDate).toLocaleDateString()}
              </>
            )}
          </p>
          {updateInfo?.releaseNotes && (
            <p className="mb-3 text-sm opacity-75">{updateInfo.releaseNotes}</p>
          )}
          <Button
            size="sm"
            onClick={handleDownload}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Download className="w-4 h-4 mr-2" /> Download & Install
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  if (noUpdatesMessage) {
    return (
      <Alert className="m-4 bg-slate-50 border-slate-200">
        <CheckCircle2 className="h-4 w-4 text-slate-600" />
        <AlertTitle className="text-slate-900">Up to date</AlertTitle>
        <AlertDescription className="text-slate-700">
          No updates available yet.
        </AlertDescription>
      </Alert>
    );
  }

  return null;
};

export default UpdateChecker;
