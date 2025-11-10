"use client";
import { useState, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Upload,
  X,
  File,
  CheckCircle2,
  Loader2,
} from "lucide-react";

interface UploadedFile {
  id: string;
  file: File;
  preview: string;
  status: "uploading" | "success" | "error";
  progress: number;
  size: string;
  type: string;
}

export default function ImageUpload() {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
  };

  const handleFileSelect = useCallback((files: FileList | null) => {
    if (!files) return;

    Array.from(files).forEach((file) => {
      if (!file.type.startsWith("image/")) {
        alert(`${file.name} is not an image file`);
        return;
      }

      const reader = new FileReader();
      const fileId = Date.now().toString() + Math.random().toString(36).substr(2, 9);

      reader.onload = (e) => {
        const preview = e.target?.result as string;
        const newFile: UploadedFile = {
          id: fileId,
          file,
          preview,
          status: "uploading",
          progress: 0,
          size: formatFileSize(file.size),
          type: file.type,
        };

        setUploadedFiles((prev) => [...prev, newFile]);

        // Simulate upload progress
        const interval = setInterval(() => {
          setUploadedFiles((prev) =>
            prev.map((f) => {
              if (f.id === fileId) {
                const newProgress = Math.min(f.progress + 10, 100);
                if (newProgress === 100) {
                  clearInterval(interval);
                  setTimeout(() => {
                    setUploadedFiles((prev) =>
                      prev.map((f) =>
                        f.id === fileId ? { ...f, status: "success" as const } : f
                      )
                    );
                  }, 500);
                }
                return { ...f, progress: newProgress };
              }
              return f;
            })
          );
        }, 200);
      };

      reader.readAsDataURL(file);
    });
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      handleFileSelect(e.dataTransfer.files);
    },
    [handleFileSelect]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const removeFile = (id: string) => {
    setUploadedFiles((prev) => prev.filter((f) => f.id !== id));
  };

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <Card>
        <CardHeader>
          <CardTitle>Upload Evidence</CardTitle>
          <CardDescription>
            Upload images or evidence files for analysis. Supported formats: JPEG, PNG, TIFF, RAW
            (up to 50MB)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={`border-2 border-dashed rounded-lg p-12 text-center transition-all ${
              isDragging
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/50"
            }`}
          >
            <motion.div
              animate={{ scale: isDragging ? 1.05 : 1 }}
              transition={{ duration: 0.2 }}
            >
              <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Drag and drop files here
              </h3>
              <p className="text-muted-foreground mb-4">or</p>
              <div>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e) => handleFileSelect(e.target.files)}
                  className="hidden"
                  ref={fileInputRef}
                />
                <Button
                  type="button"
                  variant="default"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Browse Files
                </Button>
              </div>
              <p className="text-sm text-muted-foreground mt-4">
                Maximum file size: 50MB per file
              </p>
            </motion.div>
          </div>
        </CardContent>
      </Card>

      {/* Uploaded Files */}
      {uploadedFiles.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Uploaded Files ({uploadedFiles.length})</CardTitle>
            <CardDescription>Manage your uploaded evidence files</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {uploadedFiles.map((file) => (
                <motion.div
                  key={file.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="relative group border border-border rounded-lg overflow-hidden"
                >
                  <div className="aspect-video bg-muted relative">
                    <img
                      src={file.preview}
                      alt={file.file.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Button
                        variant="destructive"
                        size="icon"
                        onClick={() => removeFile(file.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    {file.status === "uploading" && (
                      <div className="absolute bottom-0 left-0 right-0 bg-black/70 p-2">
                        <div className="flex items-center gap-2 text-white text-xs">
                          <Loader2 className="h-3 w-3 animate-spin" />
                          <span>Uploading {file.progress}%</span>
                        </div>
                        <div className="h-1 bg-white/20 rounded-full mt-1 overflow-hidden">
                          <motion.div
                            className="h-full bg-primary"
                            initial={{ width: 0 }}
                            animate={{ width: `${file.progress}%` }}
                            transition={{ duration: 0.3 }}
                          />
                        </div>
                      </div>
                    )}
                    {file.status === "success" && (
                      <div className="absolute top-2 right-2">
                        <Badge className="bg-green-500 text-white">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Uploaded
                        </Badge>
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <p className="text-sm font-medium text-foreground truncate">
                      {file.file.name}
                    </p>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs text-muted-foreground">{file.size}</span>
                      <Badge variant="outline" className="text-xs">
                        {file.type.split("/")[1].toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

