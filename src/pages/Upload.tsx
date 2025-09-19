import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Upload as UploadIcon, FileSpreadsheet, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { uploadExcelFile, getUploadStatus } from '../api/costs';
import { formatDate } from '../utils/formatting';

export default function Upload() {
  const [file, setFile] = useState<File | null>(null);
  const [clearExisting, setClearExisting] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const queryClient = useQueryClient();

  const { data: status } = useQuery({
    queryKey: ['upload-status'],
    queryFn: getUploadStatus,
  });

  const uploadMutation = useMutation({
    mutationFn: ({ file, clearExisting }: { file: File; clearExisting: boolean }) =>
      uploadExcelFile(file, clearExisting),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['upload-status'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
      setFile(null);
    },
  });

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.name.endsWith('.xlsx') || droppedFile.name.endsWith('.xls')) {
        setFile(droppedFile);
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = () => {
    if (file) {
      uploadMutation.mutate({ file, clearExisting });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Upload Data</h1>
        <p className="text-gray-500 mt-1">Import Excel files with cost data</p>
      </div>

      {/* Current Status */}
      {status?.hasData && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start">
            <CheckCircle className="h-5 w-5 text-blue-500 mt-0.5 mr-3" />
            <div>
              <p className="font-medium text-blue-900">Database has data</p>
              <p className="text-sm text-blue-700 mt-1">
                {status.rowCount} rows loaded • Last upload: {formatDate(status.lastUpload || new Date())}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Upload Area */}
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragActive ? 'border-[#9e1f63] bg-pink-50' : 'border-gray-300 bg-white'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        {file ? (
          <div className="space-y-4">
            <FileSpreadsheet className="h-12 w-12 text-green-500 mx-auto" />
            <div>
              <p className="font-medium text-gray-900">{file.name}</p>
              <p className="text-sm text-gray-500">
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
            <button
              onClick={() => setFile(null)}
              className="text-sm text-red-600 hover:text-red-800"
            >
              Remove file
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <UploadIcon className="h-12 w-12 text-gray-400 mx-auto" />
            <div>
              <label htmlFor="file-upload" className="cursor-pointer">
                <span className="btn-primary inline-block">Select File</span>
                <input
                  id="file-upload"
                  name="file-upload"
                  type="file"
                  className="sr-only"
                  accept=".xlsx,.xls"
                  onChange={handleFileSelect}
                />
              </label>
              <p className="text-sm text-gray-500 mt-2">
                or drag and drop your Excel file here
              </p>
            </div>
            <p className="text-xs text-gray-400">
              Supported formats: .xlsx, .xls (Max size: 50MB)
            </p>
          </div>
        )}
      </div>

      {/* Options */}
      {file && (
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={clearExisting}
              onChange={(e) => setClearExisting(e.target.checked)}
              className="h-4 w-4 text-[#9e1f63] focus:ring-[#9e1f63] border-gray-300 rounded"
            />
            <span className="ml-2 text-sm text-gray-700">
              Clear existing data before importing
            </span>
          </label>
          {clearExisting && (
            <div className="mt-2 ml-6">
              <p className="text-xs text-yellow-600 flex items-start">
                <AlertCircle className="h-3 w-3 mr-1 mt-0.5 flex-shrink-0" />
                Warning: This will delete all existing cost data in the database
              </p>
            </div>
          )}
        </div>
      )}

      {/* Upload Button */}
      {file && (
        <div className="flex justify-end">
          <button
            onClick={handleUpload}
            disabled={uploadMutation.isPending}
            className="btn-primary flex items-center"
          >
            {uploadMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <UploadIcon className="h-4 w-4 mr-2" />
                Upload File
              </>
            )}
          </button>
        </div>
      )}

      {/* Result Messages */}
      {uploadMutation.isSuccess && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-start">
            <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 mr-3" />
            <div>
              <p className="font-medium text-green-900">Upload successful!</p>
              {uploadMutation.data && (
                <div className="text-sm text-green-700 mt-1">
                  <p>• {uploadMutation.data.summary?.rowsInserted} rows imported</p>
                  <p>• {uploadMutation.data.summary?.warehouses?.length} warehouses</p>
                  <p>• {uploadMutation.data.summary?.quarters?.length} quarters</p>
                  <p>• Total cost: SAR {uploadMutation.data.summary?.totalCost?.toLocaleString()}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {uploadMutation.isError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start">
            <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 mr-3" />
            <div>
              <p className="font-medium text-red-900">Upload failed</p>
              <p className="text-sm text-red-700 mt-1">
                {uploadMutation.error?.message || 'An error occurred during upload'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="font-semibold text-gray-900 mb-3">Excel File Format</h3>
        <p className="text-sm text-gray-600 mb-3">
          Your Excel file should contain the following columns:
        </p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
          {[
            'Year', 'Quarter', 'Warehouse', 'Type',
            'GL Account No', 'GL Account Name', 'Cost Type',
            'TCO Model Categories', 'Opex/Capex',
            'Total Incurred Cost', 'Share-WH', 'Share-TRS',
            'Share-Distribution', 'Share-Last Mile',
            'Share-Proceed 3PL -WH', 'Share-Proceed 3PL-TRS',
            'Value-WH', 'Value-TRS', 'Value-Distribution',
            'Value-Last Mile', 'Value-Proceed 3PL -WH',
            'Value-Proceed 3PL-TRS'
          ].map(col => (
            <div key={col} className="bg-white px-2 py-1 rounded border border-gray-200">
              {col}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}