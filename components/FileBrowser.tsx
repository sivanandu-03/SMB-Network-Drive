import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Folder, FolderOpen, File, Download, Trash2, Upload, ChevronRight, ChevronDown, CheckSquare, Square, Eye } from 'lucide-react';

interface FileItem {
    name: string;
    type: 'file' | 'directory';
    size: number;
    lastModified: string;
}

const directoryCache: Record<string, FileItem[]> = {};

const Breadcrumb = ({ path, onNavigate }: { path: string, onNavigate: (p: string) => void }) => {
    const segments = path.split('/').filter(Boolean);

    return (
        <div data-test-id="breadcrumb-bar" className="flex items-center space-x-2 py-4 px-4 bg-gray-50 dark:bg-zinc-800 border-b dark:border-zinc-700 text-sm">
            <span
                data-test-id="breadcrumb-link-root"
                className="cursor-pointer text-blue-600 dark:text-blue-400 font-medium hover:underline flex items-center"
                onClick={() => onNavigate('/')}
            >
                Root
            </span>
            {segments.map((segment, idx) => {
                const route = '/' + segments.slice(0, idx + 1).join('/');
                const isLast = idx === segments.length - 1;

                return (
                    <React.Fragment key={route}>
                        <span className="text-gray-400">/</span>
                        {isLast ? (
                            <span className="text-gray-800 dark:text-gray-100 font-semibold">{segment}</span>
                        ) : (
                            <span
                                data-test-id={`breadcrumb-link-${segment}`}
                                className="cursor-pointer text-blue-600 dark:text-blue-400 font-medium hover:underline"
                                onClick={() => onNavigate(route)}
                            >
                                {segment}
                            </span>
                        )}
                    </React.Fragment>
                );
            })}
        </div>
    );
}

const TreeNode = ({ node, pathPrefix, onSelect, currentPath }: any) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [children, setChildren] = useState<FileItem[] | null>(null);

    const fullPath = pathPrefix === '/' ? `/${node.name}` : `${pathPrefix}/${node.name}`;
    const isSelected = currentPath === fullPath;

    const handleToggle = async (e: React.MouseEvent) => {
        e.stopPropagation();

        // Always navigate to this folder
        onSelect(fullPath);

        if (!isExpanded && !children) {
            setIsLoading(true);
            if (directoryCache[fullPath]) {
                setChildren(directoryCache[fullPath]);
                setIsLoading(false);
            } else {
                try {
                    const res = await fetch(`/api/smb/list?path=${encodeURIComponent(fullPath)}`);
                    if (res.ok) {
                        const data = await res.json();
                        directoryCache[fullPath] = data;
                        setChildren(data);
                    }
                } finally {
                    setIsLoading(false);
                }
            }
        }
        setIsExpanded(!isExpanded);
    };

    if (node.type !== 'directory') return null;

    return (
        <div className="pl-4 select-none">
            <div
                className="flex items-center space-x-2 cursor-pointer p-1.5 rounded hover:bg-white dark:hover:bg-zinc-700 transition-colors"
                onClick={handleToggle}
            >
                <div data-test-id={`tree-folder-node-${node.name}`} className="flex items-center space-x-2 flex-grow">
                    {isExpanded ? <ChevronDown size={16} className="text-gray-500" /> : <ChevronRight size={16} className="text-gray-500" />}
                    {isExpanded ? <FolderOpen size={16} className="text-blue-500" /> : <Folder size={16} className="text-blue-500" />}
                    <span className={`text-sm ${isSelected ? 'font-bold text-blue-600' : 'text-gray-700 dark:text-gray-200'}`}>
                        {node.name}
                    </span>
                </div>
                {isLoading && <span data-test-id={`tree-loading-${node.name}`} className="text-xs text-gray-500 animate-pulse bg-gray-100 dark:bg-zinc-800 px-2 py-0.5 rounded">Loading...</span>}
            </div>
            {isExpanded && children && (
                <div data-test-id={`tree-children-${node.name}`} className="border-l border-gray-200 dark:border-zinc-700 ml-2">
                    {children.map((child: any) => (
                        <TreeNode key={child.name} node={child} pathPrefix={fullPath} onSelect={onSelect} currentPath={currentPath} />
                    ))}
                </div>
            )}
        </div>
    );
};

export default function FileBrowser() {
    const [currentPath, setCurrentPath] = useState<string>('/');
    const [files, setFiles] = useState<FileItem[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
    const [rootFolders, setRootFolders] = useState<FileItem[]>([]);
    const [uploadProgress, setUploadProgress] = useState<number | null>(null);
    const [previewContent, setPreviewContent] = useState<{ url: string, type: string, name: string } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const fetchRoot = async () => {
        try {
            if (directoryCache['/']) {
                setRootFolders(directoryCache['/']);
            } else {
                const res = await fetch(`/api/smb/list?path=/`);
                if (res.ok) {
                    const data = await res.json();
                    directoryCache['/'] = data;
                    setRootFolders(data);
                }
            }
        } catch (e: any) {
            console.error(e);
        }
    };

    const fetchCurrentPath = async () => {
        setLoading(true);
        setError(null);
        setSelectedFiles(new Set());
        try {
            if (directoryCache[currentPath]) {
                setFiles(directoryCache[currentPath]);
            } else {
                const res = await fetch(`/api/smb/list?path=${encodeURIComponent(currentPath)}`);
                if (res.ok) {
                    const data = await res.json();
                    directoryCache[currentPath] = data;
                    setFiles(data);
                } else {
                    const err = await res.json();
                    setError(err.error || 'Failed to load directory');
                }
            }
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRoot();
    }, []);

    useEffect(() => {
        fetchCurrentPath();
    }, [currentPath]);

    const toggleSelection = (name: string) => {
        const newSelection = new Set(selectedFiles);
        if (newSelection.has(name)) newSelection.delete(name);
        else newSelection.add(name);
        setSelectedFiles(newSelection);
    };

    const handleDownloadZip = async () => {
        if (selectedFiles.size === 0) return;
        const paths = Array.from(selectedFiles).map(f => currentPath === '/' ? `/${f}` : `${currentPath}/${f}`);

        try {
            const res = await fetch('/api/smb/download-zip', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ paths })
            });

            if (!res.ok) throw new Error('Failed to download ZIP');

            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'archive.zip';
            a.click();
            window.URL.revokeObjectURL(url);
        } catch (e) {
            console.error(e);
            alert('Error downloading ZIP archive');
        }
    };

    const handleDelete = async (filename: string) => {
        if (!confirm(`Delete ${filename}?`)) return;
        const targetPath = currentPath === '/' ? `/${filename}` : `${currentPath}/${filename}`;
        try {
            const res = await fetch(`/api/smb/delete?path=${encodeURIComponent(targetPath)}`, { method: 'DELETE' });
            if (res.ok) {
                // Invalidate caches
                delete directoryCache[currentPath];
                if (currentPath === '/') {
                    const newData = files.filter(f => f.name !== filename);
                    directoryCache['/'] = newData;
                    setRootFolders(newData);
                }
                fetchCurrentPath();
            } else {
                alert('Failed to delete file');
            }
        } catch (e) {
            console.error(e);
        }
    };

    const handlePreview = (filename: string) => {
        const targetPath = currentPath === '/' ? `/${filename}` : `${currentPath}/${filename}`;
        const url = `/api/smb/preview?path=${encodeURIComponent(targetPath)}`;
        const ext = filename.split('.').pop()?.toLowerCase();

        let type = 'unknown';
        if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(ext || '')) type = 'image';
        else if (['txt', 'md', 'json', 'csv', 'js', 'ts', 'html', 'css'].includes(ext || '')) type = 'text';

        if (type !== 'unknown') {
            setPreviewContent({ url, type, name: filename });
        } else {
            // Just download
            window.open(`/api/smb/download?path=${encodeURIComponent(targetPath)}`, '_blank');
        }
    };

    const uploadFile = (file: File) => {
        const xhr = new XMLHttpRequest();
        const formData = new FormData();
        formData.append('file', file);

        xhr.upload.onprogress = (event) => {
            if (event.lengthComputable) {
                setUploadProgress(Math.round((event.loaded / event.total) * 100));
            }
        };

        xhr.onload = () => {
            setUploadProgress(null);
            if (xhr.status === 201) {
                delete directoryCache[currentPath];
                fetchCurrentPath();
            } else {
                alert('Upload failed: ' + xhr.responseText);
            }
        };

        xhr.open('POST', `/api/smb/upload?path=${encodeURIComponent(currentPath)}`);
        xhr.send(formData);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            uploadFile(e.target.files[0]);
            e.target.value = '';
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            uploadFile(e.dataTransfer.files[0]);
        }
    };

    return (
        <div data-test-id="file-browser-container" className="flex h-screen bg-white dark:bg-zinc-900 text-gray-900 dark:text-gray-100 overflow-hidden font-sans">
            {/* Sidebar */}
            <div className="w-72 bg-gray-50 dark:bg-zinc-800 border-r dark:border-zinc-700 flex flex-col overflow-y-auto">
                <div className="p-4 border-b dark:border-zinc-700 flex items-center space-x-2 text-indigo-600 dark:text-indigo-400 font-bold text-lg">
                    <FolderOpen />
                    <span>SMB Explorer</span>
                </div>
                <div className="p-2">
                    {rootFolders.map((node) => (
                        <TreeNode key={node.name} node={node} pathPrefix="/" onSelect={setCurrentPath} currentPath={currentPath} />
                    ))}
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-zinc-900">
                <Breadcrumb path={currentPath} onNavigate={setCurrentPath} />

                {/* Toolbar */}
                <div className="p-4 border-b dark:border-zinc-700 flex items-center justify-between bg-white dark:bg-zinc-900">
                    <div className="flex space-x-2">
                        <button
                            onClick={handleDownloadZip}
                            disabled={selectedFiles.size === 0}
                            className={`flex items-center space-x-2 px-3 py-1.5 rounded text-sm font-medium transition ${selectedFiles.size > 0 ? 'bg-indigo-600 hover:bg-indigo-700 text-white' : 'bg-gray-200 dark:bg-zinc-800 text-gray-400 cursor-not-allowed'
                                }`}
                        >
                            <Download size={16} />
                            <span>Download ZIP</span>
                        </button>
                    </div>

                    <div className="flex space-x-2 items-center">
                        <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} />
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="flex items-center space-x-2 bg-zinc-800 hover:bg-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white text-white px-3 py-1.5 rounded text-sm font-medium transition"
                        >
                            <Upload size={16} />
                            <span>Upload File</span>
                        </button>
                    </div>
                </div>

                {/* Upload Progress */}
                {uploadProgress !== null && (
                    <div className="px-4 py-2 bg-indigo-50 dark:bg-indigo-900/40 border-b border-indigo-100 dark:border-indigo-800 flex items-center space-x-4">
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 flex-1">
                            <div className="bg-indigo-600 h-2 rounded-full" style={{ width: `${uploadProgress}%` }}></div>
                        </div>
                        <div className="text-sm font-semibold">{uploadProgress}%</div>
                    </div>
                )}

                {/* File List */}
                <div
                    className="flex-1 overflow-y-auto p-4"
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={handleDrop}
                >
                    {error && (
                        <div className="p-4 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded-lg flex items-center space-x-3">
                            <span className="font-semibold">Error:</span>
                            <span>{error}</span>
                        </div>
                    )}

                    {!error && loading && (
                        <div className="flex flex-col items-center justify-center p-12 text-gray-400">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-4"></div>
                            <p>Loading directory contents...</p>
                        </div>
                    )}

                    {!error && !loading && files.length === 0 && (
                        <div className="flex flex-col items-center justify-center p-16 text-gray-400 dark:text-zinc-500 border-2 border-dashed border-gray-200 dark:border-zinc-700 rounded-xl">
                            <FolderOpen size={48} className="mb-4 opacity-50" />
                            <p className="text-lg font-medium">This folder is empty</p>
                            <p className="text-sm mt-1">Drag and drop files here to upload</p>
                        </div>
                    )}

                    {!error && !loading && files.length > 0 && (
                        <div className="bg-white dark:bg-zinc-800 rounded-lg border dark:border-zinc-700 shadow-sm overflow-hidden">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gray-50 dark:bg-zinc-900 border-b dark:border-zinc-700 text-sm font-medium text-gray-500 dark:text-gray-400">
                                        <th className="p-3 w-12 text-center">
                                            <div
                                                className="cursor-pointer"
                                                onClick={() => {
                                                    if (selectedFiles.size === files.length) setSelectedFiles(new Set());
                                                    else setSelectedFiles(new Set(files.map(f => f.name)));
                                                }}
                                            >
                                                {selectedFiles.size === files.length && files.length > 0 ? <CheckSquare size={18} /> : <Square size={18} />}
                                            </div>
                                        </th>
                                        <th className="p-3 w-10"></th>
                                        <th className="p-3">Name</th>
                                        <th className="p-3 w-32 text-right">Size</th>
                                        <th className="p-3 w-48 text-right">Modified</th>
                                        <th className="p-3 w-24 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {files.map((file) => {
                                        const isSelected = selectedFiles.has(file.name);
                                        return (
                                            <tr
                                                key={file.name}
                                                onClick={() => {
                                                    if (file.type === 'directory') {
                                                        setCurrentPath(currentPath === '/' ? `/${file.name}` : `${currentPath}/${file.name}`);
                                                    } else {
                                                        toggleSelection(file.name);
                                                    }
                                                }}
                                                className={`border-b border-gray-100 dark:border-zinc-800 cursor-pointer transition ${isSelected ? 'bg-indigo-50 dark:bg-indigo-900/20' : 'hover:bg-gray-50 dark:hover:bg-zinc-700'}`}
                                            >
                                                <td className="p-3 text-center" onClick={(e) => { e.stopPropagation(); toggleSelection(file.name); }}>
                                                    {isSelected ? <CheckSquare size={18} className="text-indigo-600" /> : <Square size={18} className="text-gray-400" />}
                                                </td>
                                                <td className="p-3 text-center">
                                                    {file.type === 'directory' ? <Folder size={20} className="text-blue-500" /> : <File size={20} className="text-gray-500" />}
                                                </td>
                                                <td className="p-3 font-medium text-gray-800 dark:text-gray-200">{file.name}</td>
                                                <td className="p-3 text-right text-sm text-gray-500">
                                                    {file.type === 'file' ? (file.size > 1024 * 1024 ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : `${(file.size / 1024).toFixed(1)} KB`) : '--'}
                                                </td>
                                                <td className="p-3 text-right text-sm text-gray-500">
                                                    {new Date(file.lastModified).toLocaleDateString()} {new Date(file.lastModified).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </td>
                                                <td className="p-3 text-right space-x-3">
                                                    {file.type === 'file' && (
                                                        <>
                                                            <button title="Preview" onClick={(e) => { e.stopPropagation(); handlePreview(file.name); }} className="text-gray-400 hover:text-indigo-600 transition"><Eye size={18} /></button>
                                                            <a title="Download" href={`/api/smb/download?path=${currentPath === '/' ? `/${file.name}` : encodeURIComponent(`${currentPath}/${file.name}`)}`} download
                                                                onClick={(e) => e.stopPropagation()}
                                                                className="text-gray-400 hover:text-green-600 inline-flex transition"><Download size={18} /></a>
                                                            <button title="Delete" onClick={(e) => { e.stopPropagation(); handleDelete(file.name); }} className="text-gray-400 hover:text-red-600 transition"><Trash2 size={18} /></button>
                                                        </>
                                                    )}
                                                    {file.type === 'directory' && (
                                                        <button title="Delete" onClick={(e) => { e.stopPropagation(); handleDelete(file.name); }} className="text-gray-400 hover:text-red-600 transition"><Trash2 size={18} /></button>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Detail/Preview Side Panel */}
            {previewContent && (
                <div className="w-80 bg-white dark:bg-zinc-800 border-l dark:border-zinc-700 flex flex-col items-center">
                    <div className="p-4 border-b dark:border-zinc-700 w-full flex justify-between items-center">
                        <span className="font-semibold text-gray-800 dark:text-gray-200">File Preview</span>
                        <button onClick={() => setPreviewContent(null)} className="text-gray-500 hover:text-gray-800 dark:hover:text-gray-200">&times;</button>
                    </div>
                    <div className="p-4 flex-1 w-full overflow-y-auto flex flex-col items-center space-y-4">
                        {previewContent.type === 'image' && (
                            <img src={previewContent.url} alt={previewContent.name} className="max-w-full rounded shadow-sm border border-gray-200 dark:border-zinc-700" />
                        )}
                        {previewContent.type === 'text' && (
                            <iframe src={previewContent.url} title={previewContent.name} className="w-full h-full bg-gray-50 border border-gray-200 dark:border-zinc-700 rounded p-2" />
                        )}
                        <h3 className="font-medium mt-4 text-center break-all">{previewContent.name}</h3>
                        <a
                            href={previewContent.url}
                            download
                            className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded font-medium hover:bg-indigo-700 transition"
                        >
                            Download File
                        </a>
                    </div>
                </div>
            )}
        </div>
    );
}
