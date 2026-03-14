"use client";

import { useState, useCallback } from "react";
import { Upload, FileText, CheckCircle2, AlertCircle } from "lucide-react";

interface UploadResult {
  created: number;
  duplicates: number;
  autoCategorized: number;
  total: number;
}

export default function UploadPage() {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleUpload = useCallback(async (file: File) => {
    setUploading(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error || "Upload failed");
    } else {
      setResult(data);
    }

    setUploading(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleUpload(file);
    },
    [handleUpload]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleUpload(file);
    },
    [handleUpload]
  );

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">
          Upload Statement
        </h1>
        <p className="mt-1 text-sm text-muted">
          Upload a bank or credit card statement (CSV). Existing merchant rules
          will auto-categorize matching transactions.
        </p>
      </div>

      <div
        className={`rounded-xl border-2 border-dashed p-16 text-center transition-colors ${
          isDragging
            ? "border-accent bg-accent/5"
            : "border-border bg-surface hover:border-muted"
        }`}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
      >
        <Upload className="mx-auto h-12 w-12 text-muted" />
        <p className="mt-4 text-lg font-medium text-foreground">
          Drop your statement here
        </p>
        <p className="mt-1 text-sm text-muted">or click to browse</p>
        <label className="mt-4 inline-block cursor-pointer rounded-lg bg-accent px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover">
          Choose File
          <input
            type="file"
            accept=".csv"
            className="hidden"
            onChange={handleFileSelect}
            disabled={uploading}
          />
        </label>
      </div>

      {uploading && (
        <div className="mt-6 rounded-xl border border-border bg-surface p-6">
          <div className="flex items-center gap-3">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-accent border-t-transparent" />
            <span className="text-sm text-foreground">
              Parsing and categorizing transactions...
            </span>
          </div>
        </div>
      )}

      {error && (
        <div className="mt-6 rounded-xl border border-danger/30 bg-danger/5 p-6">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-danger" />
            <span className="text-sm text-danger">{error}</span>
          </div>
        </div>
      )}

      {result && (
        <div className="mt-6 rounded-xl border border-border bg-surface p-6">
          <div className="flex items-center gap-3 mb-4">
            <CheckCircle2 className="h-5 w-5 text-success" />
            <span className="text-sm font-medium text-foreground">
              Upload complete
            </span>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div>
              <p className="text-2xl font-bold text-foreground">
                {result.total}
              </p>
              <p className="text-xs text-muted">Total in file</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-success">
                {result.created}
              </p>
              <p className="text-xs text-muted">New transactions</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-accent">
                {result.autoCategorized}
              </p>
              <p className="text-xs text-muted">Auto-categorized</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-muted">
                {result.duplicates}
              </p>
              <p className="text-xs text-muted">Duplicates skipped</p>
            </div>
          </div>

          {result.created - result.autoCategorized > 0 && (
            <a
              href="/transactions"
              className="mt-4 inline-block rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
            >
              Review {result.created - result.autoCategorized} uncategorized
              transactions
            </a>
          )}
        </div>
      )}

      <div className="mt-8 rounded-xl border border-border bg-surface p-6">
        <h3 className="text-sm font-medium text-foreground mb-3">
          Supported Formats
        </h3>
        <div className="flex gap-3">
          <div className="flex items-center gap-2 rounded-lg border border-border px-3 py-2">
            <FileText className="h-4 w-4 text-accent" />
            <span className="text-sm text-muted">CSV</span>
          </div>
        </div>
        <p className="mt-3 text-xs text-muted">
          Most banks allow you to download transactions as CSV. Works with
          Chase, Bank of America, American Express, Capital One, and more.
        </p>
      </div>
    </div>
  );
}
