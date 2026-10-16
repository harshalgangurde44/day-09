import { useEffect, useState } from "react";
import UploadStatus from "./UploadStatus";

function formatFileSize(bytes) {
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function FileItem({ item, onRemove }) {
  const { file, status, progress, error } = item;
  const [previewUrl, setPreviewUrl] = useState("");

  useEffect(() => {
    if (!file.type.startsWith("image/")) {
      setPreviewUrl("");
      return;
    }

    const url = URL.createObjectURL(file);
    setPreviewUrl(url);

    return () => URL.revokeObjectURL(url);
  }, [file]);

  return (
    <article className="file-item">
      <div className="file-preview">
        {previewUrl ? (
          <img src={previewUrl} alt={`Preview of ${file.name}`} />
        ) : (
          <span className="pdf-icon" aria-label="Document">
            PDF
          </span>
        )}
      </div>

      <div className="file-info">
        <h3 title={file.name}>{file.name}</h3>
        <p>{formatFileSize(file.size)}</p>

        <UploadStatus status={status} progress={progress} error={error} />

        {status === "uploading" && (
          <div
            className="progress-track"
            role="progressbar"
            aria-label={`Uploading ${file.name}`}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progress}
          >
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>
        )}
      </div>

      {status !== "uploading" && (
        <button
          type="button"
          className="remove-btn"
          onClick={() => onRemove(item.id)}
          aria-label={`Remove ${file.name}`}
        >
          ×
        </button>
      )}
    </article>
  );
}

export default FileItem;
