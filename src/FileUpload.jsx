import { useEffect, useRef, useState } from "react";
import FileItem from "./FileItem";

const MAX_SIZE = 5 * 1024 * 1024; // 5 MB
const MAX_FILES = 5;

const ALLOWED_TYPES = ["image/png", "image/jpeg", "application/pdf"];

function getFileKey(file) {
  return `${file.name}-${file.size}-${file.lastModified}`;
}

function FileUpload() {
  const [items, setItems] = useState([]);
  const [message, setMessage] = useState("");
  const [isDragging, setIsDragging] = useState(false);

  const inputRef = useRef(null);
  const timerRef = useRef(null);

  // Prevent duplicate files across rapid or repeated events.
  const fileKeysRef = useRef(new Set());

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  function addFiles(fileList) {
    const incomingFiles = Array.from(fileList);
    const errors = [];
    const accepted = [];

    // Check and reserve file keys synchronously.
    const existingKeys = fileKeysRef.current;

    for (const file of incomingFiles) {
      const key = getFileKey(file);

      if (existingKeys.has(key)) {
        errors.push(`${file.name}: duplicate file.`);
        continue;
      }

      if (!ALLOWED_TYPES.includes(file.type)) {
        errors.push(`${file.name}: only PNG, JPG, JPEG and PDF are allowed.`);
        continue;
      }

      if (file.size > MAX_SIZE) {
        errors.push(`${file.name}: exceeds the 5 MB limit.`);
        continue;
      }

      // Account for files already selected and accepted in this batch.
      if (items.length + accepted.length >= MAX_FILES) {
        errors.push(`Maximum ${MAX_FILES} files allowed.`);
        break;
      }

      // Reserve the key before another event can add the same file.
      existingKeys.add(key);

      accepted.push({
        id: key,
        key,
        file,
        status: "pending",
        progress: 0,
        error: "",
      });
    }

    if (accepted.length > 0) {
      setItems((currentItems) => [...currentItems, ...accepted]);
    }

    setMessage(
      errors.length > 0
        ? errors.join(" ")
        : accepted.length > 0
        ? `${accepted.length} file(s) added successfully.`
        : "No files were added."
    );
  }

  function handleInputChange(event) {
    const files = event.target.files;

    if (files?.length > 0) {
      addFiles(files);
    }

    // Allow selecting the same file again after removal.
    event.target.value = "";
  }

  function handleDrop(event) {
    event.preventDefault();
    event.stopPropagation();

    setIsDragging(false);

    const files = event.dataTransfer.files;

    if (files?.length > 0) {
      addFiles(files);
    }
  }

  function handleRemove(id) {
    const itemToRemove = items.find((item) => item.id === id);

    if (itemToRemove) {
      fileKeysRef.current.delete(itemToRemove.key);
    }

    setItems((currentItems) => currentItems.filter((item) => item.id !== id));

    setMessage("");
  }

  function handleUpload() {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    const pendingItems = items.filter((item) => item.status === "pending");

    if (pendingItems.length === 0) {
      setMessage("There are no files waiting to upload.");
      return;
    }

    setMessage("Uploading files...");

    setItems((currentItems) =>
      currentItems.map((item) =>
        item.status === "pending"
          ? {
              ...item,
              status: "uploading",
              progress: 0,
              error: "",
            }
          : item
      )
    );

    timerRef.current = setInterval(() => {
      setItems((currentItems) => {
        const updatedItems = currentItems.map((item) => {
          if (item.status !== "uploading") {
            return item;
          }

          const progress = Math.min(item.progress + 20, 100);

          return {
            ...item,
            progress,
            status: progress === 100 ? "uploaded" : "uploading",
          };
        });

        const stillUploading = updatedItems.some(
          (item) => item.status === "uploading"
        );

        if (!stillUploading && timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
          setMessage("All files uploaded successfully.");
        }

        return updatedItems;
      });
    }, 300);
  }

  const uploadedCount = items.filter(
    (item) => item.status === "uploaded"
  ).length;

  const canAddFiles = items.length < MAX_FILES;

  return (
    <section className="upload-card">
      <div className="upload-heading">
        <div>
          <p className="eyebrow">YOUR DOCUMENTS</p>
          <h2>Upload files</h2>
          <p className="muted">Add images or PDFs to get started.</p>
        </div>

        <span className="file-counter">
          {items.length}/{MAX_FILES}
        </span>
      </div>

      <div
        className={`dropzone ${isDragging ? "dragging" : ""}`}
        onDragEnter={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragOver={(event) => {
          event.preventDefault();
        }}
        onDragLeave={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) {
            setIsDragging(false);
          }
        }}
        onDrop={handleDrop}
      >
        <div className="upload-icon">↑</div>

        <h3>Drag and drop your files here</h3>
        <p>or choose files from your device</p>

        <button
          type="button"
          className="browse-btn"
          onClick={() => inputRef.current?.click()}
          disabled={!canAddFiles}
        >
          Browse files
        </button>

        <input
          ref={inputRef}
          type="file"
          hidden
          multiple
          accept=".png,.jpg,.jpeg,.pdf"
          onChange={handleInputChange}
        />

        <p className="file-rules">
          PNG, JPG, JPEG or PDF · Maximum 5 MB each · Up to 5 files
        </p>
      </div>

      {message && (
        <p className="message" role="status">
          {message}
        </p>
      )}

      {items.length > 0 && (
        <div className="selected-files">
          <div className="files-heading">
            <h3>Selected files</h3>
            <span>
              {uploadedCount} of {items.length} uploaded
            </span>
          </div>

          {items.map((item) => (
            <FileItem key={item.id} item={item} onRemove={handleRemove} />
          ))}
        </div>
      )}

      <div className="upload-footer">
        <span className="muted">{items.length} file(s) selected</span>

        <button
          type="button"
          className="upload-btn"
          onClick={handleUpload}
          disabled={!items.some((item) => item.status === "pending")}
        >
          Upload files
        </button>
      </div>
    </section>
  );
}

export default FileUpload;
