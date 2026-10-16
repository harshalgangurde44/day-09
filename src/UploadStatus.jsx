function UploadStatus({ status, progress, error }) {
  if (error) {
    return <p className="status-text error">{error}</p>;
  }

  switch (status) {
    case "uploading":
      return <p className="status-text">Uploading... {progress}%</p>;

    case "uploaded":
      return <p className="status-text success">Upload complete</p>;

    default:
      return <p className="status-text">Ready to upload</p>;
  }
}

export default UploadStatus;
