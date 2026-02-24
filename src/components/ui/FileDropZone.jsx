import { useState, useRef, useCallback } from 'react';
import { Upload, FileSpreadsheet, X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

/**
 * Drag-and-drop file upload zone for Google Ads CSV/Excel files
 */
export default function FileDropZone({ onFileLoaded, hasData }) {
  const [dragging, setDragging] = useState(false);
  const [status, setStatus] = useState(null); // null | 'loading' | 'success' | 'error'
  const [message, setMessage] = useState('');
  const [fileName, setFileName] = useState('');
  const inputRef = useRef(null);

  const handleFile = useCallback(async (file) => {
    if (!file) return;

    const ext = file.name.split('.').pop().toLowerCase();
    if (!['csv', 'tsv', 'xlsx', 'xls'].includes(ext)) {
      setStatus('error');
      setMessage('Please upload a CSV or Excel file (.csv, .xlsx, .xls)');
      return;
    }

    setFileName(file.name);
    setStatus('loading');
    setMessage('Parsing file...');

    try {
      await onFileLoaded(file);
      setStatus('success');
      setMessage(`Loaded ${file.name}`);
    } catch (err) {
      setStatus('error');
      setMessage(err.message || 'Failed to parse file');
    }
  }, [onFileLoaded]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    handleFile(file);
  }, [handleFile]);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
  }, []);

  const handleClick = () => inputRef.current?.click();

  const handleInputChange = (e) => {
    const file = e.target.files?.[0];
    handleFile(file);
    // Reset input so same file can be re-uploaded
    e.target.value = '';
  };

  const handleClear = (e) => {
    e.stopPropagation();
    setStatus(null);
    setMessage('');
    setFileName('');
  };

  // Compact badge when data is already loaded
  if (hasData && status === 'success') {
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5 text-xs text-success bg-success/10 border border-success/20 rounded-full px-3 py-1">
          <FileSpreadsheet size={12} />
          {fileName}
        </div>
        <button
          onClick={handleClick}
          className="text-xs text-text-muted hover:text-text-primary transition-colors underline"
        >
          Replace
        </button>
        <input
          ref={inputRef}
          type="file"
          accept=".csv,.tsv,.xlsx,.xls"
          onChange={handleInputChange}
          className="hidden"
        />
      </div>
    );
  }

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onClick={handleClick}
      className={`
        relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer
        transition-all duration-200
        ${dragging
          ? 'border-accent bg-accent/5 scale-[1.01]'
          : status === 'error'
            ? 'border-danger/40 bg-danger/5'
            : status === 'success'
              ? 'border-success/40 bg-success/5'
              : 'border-border hover:border-accent/40 hover:bg-bg-hover'
        }
      `}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".csv,.tsv,.xlsx,.xls"
        onChange={handleInputChange}
        className="hidden"
      />

      {status === 'loading' && (
        <div className="flex flex-col items-center gap-2">
          <Loader2 size={24} className="text-accent animate-spin" />
          <p className="text-sm text-text-secondary">{message}</p>
        </div>
      )}

      {status === 'error' && (
        <div className="flex flex-col items-center gap-2">
          <AlertCircle size={24} className="text-danger" />
          <p className="text-sm text-danger">{message}</p>
          <button
            onClick={handleClear}
            className="text-xs text-text-muted hover:text-text-primary mt-1"
          >
            Try again
          </button>
        </div>
      )}

      {status === 'success' && (
        <div className="flex flex-col items-center gap-2">
          <CheckCircle size={24} className="text-success" />
          <p className="text-sm text-success">{message}</p>
          <p className="text-xs text-text-muted">Drop another file to replace</p>
        </div>
      )}

      {status === null && (
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-bg-secondary border border-border flex items-center justify-center">
            {dragging ? (
              <FileSpreadsheet size={20} className="text-accent" />
            ) : (
              <Upload size={20} className="text-text-muted" />
            )}
          </div>
          <div>
            <p className="text-sm font-medium text-text-primary">
              {dragging ? 'Drop your file here' : 'Import Google Ads Data'}
            </p>
            <p className="text-xs text-text-muted mt-1">
              Drag & drop a CSV or Excel export from Google Ads, or click to browse
            </p>
          </div>
          <div className="flex items-center gap-4 text-[10px] text-text-muted mt-1">
            <span className="flex items-center gap-1"><FileSpreadsheet size={10} /> .csv</span>
            <span className="flex items-center gap-1"><FileSpreadsheet size={10} /> .xlsx</span>
            <span className="flex items-center gap-1"><FileSpreadsheet size={10} /> .xls</span>
          </div>
        </div>
      )}
    </div>
  );
}
