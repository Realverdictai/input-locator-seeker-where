import React, { useRef, useState } from 'react';

interface Props {
  accept: string;
  multiple?: boolean;
  onUpload: (files: File[]) => void;
}

const FileDropZone: React.FC<Props> = ({ accept, multiple, onUpload }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    onUpload(Array.from(files));
  };

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        handleFiles(e.dataTransfer.files);
      }}
      onClick={() => inputRef.current?.click()}
      className={`border-2 border-dashed rounded p-6 text-center cursor-pointer ${dragOver ? 'bg-gray-100' : ''}`}
    >
      <input
        type="file"
        multiple={multiple}
        accept={accept}
        ref={inputRef}
        onChange={(e) => handleFiles(e.target.files)}
        className="hidden"
      />
      <p>Drag and drop files here, or click to select</p>
    </div>
  );
};

export default FileDropZone;
