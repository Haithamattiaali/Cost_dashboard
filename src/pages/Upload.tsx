import React, { useState, useEffect } from 'react';
import { Upload as UploadIcon, FileSpreadsheet, CheckCircle, AlertCircle, Loader2, ArrowRight, X } from 'lucide-react';
import { formatDate } from '../utils/formatting';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { browserDatabase } from '../services/BrowserDatabase';
import { dataProcessor } from '../services/DataProcessor';

export default function Upload() {
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [showRedirectDialog, setShowRedirectDialog] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{
    loading: boolean;
    success: boolean;
    error: string | null;
    summary: any;
  }>({
    loading: false,
    success: false,
    error: null,
    summary: null
  });
  const [databaseStatus, setDatabaseStatus] = useState<{
    hasData: boolean;
    rowCount: number;
    lastUpload: Date | null;
  }>({
    hasData: false,
    rowCount: 0,
    lastUpload: null
  });
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Load database status on mount
  useEffect(() => {
    loadDatabaseStatus();
  }, []);

  const loadDatabaseStatus = async () => {
    try {
      await browserDatabase.initialize();
      const data = await browserDatabase.loadData();
      setDatabaseStatus({
        hasData: data.length > 0,
        rowCount: data.length,
        lastUpload: data.length > 0 ? new Date() : null // We don't track upload time in IndexedDB, using current time as placeholder
      });
    } catch (error) {
      console.error('Failed to load database status:', error);
    }
  };

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

  const handleUpload = async () => {
    if (!file) return;

    setUploadStatus({
      loading: true,
      success: false,
      error: null,
      summary: null
    });

    try {
      // Parse Excel file in browser
      console.log('[Upload] Starting to parse Excel file:', file.name);
      const data = await dataProcessor.parseExcel(file);
      console.log('[Upload] Parsed data:', data.length, 'rows');
      console.log('[Upload] First row sample:', data[0]);

      if (data.length === 0) {
        throw new Error('No valid data found in the Excel file');
      }

      // Calculate metrics for summary
      const metrics = dataProcessor.calculateMetrics(data);
      console.log('[Upload] Calculated metrics:', metrics);

      // Get unique values for summary
      const quarters = [...new Set(data.map(d => `${d.year} ${d.quarter}`))];
      const warehouses = [...new Set(data.map(d => d.warehouse).filter(Boolean))];

      // Save to IndexedDB (always clear existing to prevent duplicates)
      console.log('[Upload] Saving to IndexedDB...');
      await browserDatabase.saveData(data, true);
      console.log('[Upload] Data saved successfully');

      // IMPORTANT: Invalidate all queries to refresh dashboard data
      console.log('[Upload] Invalidating query cache...');
      await queryClient.invalidateQueries();
      console.log('[Upload] Query cache invalidated');

      const summary = {
        rowsInserted: data.length,
        totalCost: metrics.totalCost,
        quarters: quarters,
        warehouses: warehouses
      };

      setUploadStatus({
        loading: false,
        success: true,
        error: null,
        summary
      });

      // Update database status
      await loadDatabaseStatus();

      setFile(null);

      // Show redirect dialog after successful upload
      setTimeout(() => {
        setShowRedirectDialog(true);
      }, 2000);
    } catch (error) {
      setUploadStatus({
        loading: false,
        success: false,
        error: error instanceof Error ? error.message : 'Failed to process file',
        summary: null
      });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Upload Data</h1>
        <p className="text-gray-500 mt-1">Import Excel files with cost data</p>
      </div>

      {/* Current Status */}
      {databaseStatus.hasData && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start">
            <CheckCircle className="h-5 w-5 text-blue-500 mt-0.5 mr-3" />
            <div>
              <p className="font-medium text-blue-900">Browser storage has data</p>
              <p className="text-sm text-blue-700 mt-1">
                {databaseStatus.rowCount} rows stored locally
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
        <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
          <div className="flex items-start">
            <AlertCircle className="h-5 w-5 text-yellow-500 mt-0.5 mr-3 flex-shrink-0" />
            <div>
              <p className="font-medium text-gray-900">Important: Data will be replaced</p>
              <p className="text-sm text-gray-700 mt-1">
                To prevent duplicate entries, all existing data will be cleared before importing the new file.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Upload Button */}
      {file && (
        <div className="flex justify-end">
          <button
            onClick={handleUpload}
            disabled={uploadStatus.loading}
            className="btn-primary flex items-center"
          >
            {uploadStatus.loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <UploadIcon className="h-4 w-4 mr-2" />
                Process File
              </>
            )}
          </button>
        </div>
      )}

      {/* Redirect Confirmation Dialog */}
      {showRedirectDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Upload Successful!</h3>
              <button
                onClick={() => setShowRedirectDialog(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="text-gray-600 mb-6">
              Your data has been successfully processed and stored locally in your browser. Would you like to view the data in the dashboard?
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowRedirectDialog(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Stay Here
              </button>
              <button
                onClick={() => navigate('/dashboard')}
                className="px-4 py-2 bg-[#9e1f63] text-white hover:bg-[#8a1a57] rounded-lg transition-colors flex items-center gap-2"
              >
                Go to Dashboard
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Result Messages */}
      {uploadStatus.success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-start">
            <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 mr-3" />
            <div>
              <p className="font-medium text-green-900">File processed successfully!</p>
              {uploadStatus.summary && (
                <div className="text-sm text-green-700 mt-1">
                  <p>• {uploadStatus.summary.rowsInserted} rows stored</p>
                  <p>• {uploadStatus.summary.warehouses?.length} warehouses</p>
                  <p>• {uploadStatus.summary.quarters?.length} periods</p>
                  <p>• Total cost: SAR {uploadStatus.summary.totalCost?.toLocaleString()}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {uploadStatus.error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start">
            <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 mr-3" />
            <div>
              <p className="font-medium text-red-900">Processing failed</p>
              <p className="text-sm text-red-700 mt-1">
                {uploadStatus.error}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="font-semibold text-gray-900 mb-3">Excel File Format</h3>
        <div className="bg-yellow-100 border border-yellow-300 rounded p-3 mb-3">
          <p className="text-sm text-yellow-800 font-medium flex items-start">
            <AlertCircle className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
            Column headers must match EXACTLY including spaces and typos
          </p>
        </div>
        <p className="text-sm text-gray-600 mb-3">
          Your Excel file must contain these exact column headers (copy them precisely):
        </p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
          {[
            'Type',
            'Year',
            'quarter',
            'Warehouse ', // Note: trailing space
            'GL Account No.',
            'GL Account Name',
            'GL Accounts Group',
            'Cost Type',
            'TCO Model Categories',
            'Main Categories',
            'OpEx /CapEx',
            ' total incured cost ', // Note: spaces and typo
            'WH COST SHARE ',
            'TRS COST SHARE ',
            'Dist. COST SHARE ',
            'Last Mile (TRS) COST SHARE ',
            'Proceed 3PL (WH) COST SHARE ',
            'Proceed 3PL (TRS) COST SHARE ',
            ' WH COST VALUE ',
            ' TRS COST VALUE  ',
            ' Dist. COST VALUE  ',
            ' Last Mile COST VALUE  ',
            ' Proceed 3PL (WH) COST VALUE  ',
            ' Proceed 3PL (TRS) COST VALUE  ',
            ' PHs COST VALUE  ',
            ' PROCEED 3pl COST VALUE  '
          ].map(col => (
            <div key={col} className="bg-white px-2 py-1 rounded border border-gray-200 font-mono">
              {col}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}