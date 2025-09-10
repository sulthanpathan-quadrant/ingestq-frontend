// import React, { useState, useCallback, useRef, useEffect } from "react";
// import { useNavigate } from "react-router-dom";
// import { useDropzone } from "react-dropzone";
// import { 
//   Database, 
//   Cloud, 
//   HardDrive, 
//   ArrowRight,
//   CheckCircle,
//   Upload as UploadIcon,
//   Server,
//   CloudRain,
//   ArrowLeft,
//   Loader2,
//   Folder,
//   File,
//   X,
//   ChevronRight
// } from "lucide-react";
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { Label } from "@/components/ui/label";
// import { Input } from "@/components/ui/input";
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
// import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
// import { Checkbox } from "@/components/ui/checkbox";
// import { useToast } from "@/hooks/use-toast";

// // Mock data for S3
// const mockBuckets = ["s3-bucket-1", "s3-bucket-2"];
// const mockFolders: Record<string, string[]> = {
//   "s3-bucket-1": ["logs/", "exports/", "raw-data/", "logs/sublog/"],
//   "s3-bucket-2": ["images/", "backups/"]
// };
// const mockFiles: Record<string, string[]> = {
//   "logs/": ["2023-01-01.log", "2023-01-02.log"],
//   "logs/sublog/": ["sub-2023.log"],
//   "exports/": ["sales.csv", "users.csv", "customer_data_v2.xlsx"],
//   "raw-data/": ["dump1.json", "dump12.json", "dump11.json", "dump23.json", "dump33.json", "dump22.json", "dump13.json", "dump42.json"],
//   "images/": ["logo.png", "banner.jpg"],
//   "backups/": ["backup1.zip", "backup2.zip"]
// };

// // Mock data for Azure Blob
// const mockAzureContainers = ["container1", "container2"];
// const mockAzureFolders: Record<string, string[]> = {
//   "container1": ["data/", "reports/", "data/subdata/"],
//   "container2": ["archives/", "media/"]
// };
// const mockAzureBlobs: Record<string, string[]> = {
//   "data/": ["data1.csv", "data2.csv", "customer_data_v2.xlsx"],
//   "data/subdata/": ["subdata1.json"],
//   "reports/": ["report1.pdf", "report2.csv"],
//   "archives/": ["archive1.zip"],
//   "media/": ["image1.png", "video1.mp4"]
// };

// // Mock tables for database
// const mockTables = ["customers", "orders", "products", "employees", "departments"];

// interface SourceConfig {
//   connectionString?: string;
//   databaseName?: string;
//   username?: string;
//   password?: string;
//   port?: string;
//   bucket?: string;
//   currentPath?: string;
// }

// interface DestinationConfig {
//   type: string;
//   connectionString?: string;
//   databaseName?: string;
//   username?: string;
//   password?: string;
//   port?: string;
//   bucket?: string;
//   currentPath?: string;
// }

// export default function Upload() {
//   const [selectedSource, setSelectedSource] = useState<string>('');
//   const [selectedDestination, setSelectedDestination] = useState<string>('');
//   const [sourceConfig, setSourceConfig] = useState<SourceConfig>({});
//   const [destinationConfig, setDestinationConfig] = useState<DestinationConfig>({ type: '' });
//   const [isSourceConnected, setIsSourceConnected] = useState<boolean>(false);
//   const [isSourceConnecting, setIsSourceConnecting] = useState<boolean>(false);
//   const [isDestConnected, setIsDestConnected] = useState<boolean>(false);
//   const [isDestConnecting, setIsDestConnecting] = useState<boolean>(false);
//   const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
//   const [selectedSourcePath, setSelectedSourcePath] = useState<string>('');
//   const [selectedDestPath, setSelectedDestPath] = useState<string>('');
//   const [showSourceBrowser, setShowSourceBrowser] = useState<boolean>(false);
//   const [showDestBrowser, setShowDestBrowser] = useState<boolean>(false);
//   const [showSourceDBBrowser, setShowSourceDBBrowser] = useState<boolean>(false);
//   const [showDestDBBrowser, setShowDestDBBrowser] = useState<boolean>(false);
//   const [sourceSelectedItem, setSourceSelectedItem] = useState<string | null>(null);
//   const [destSelectedItem, setDestSelectedItem] = useState<string | null>(null);
//   const [sourceDBSelectedTables, setSourceDBSelectedTables] = useState<string[]>([]);
//   const [selectAllTables, setSelectAllTables] = useState<boolean>(false);
//   const { toast } = useToast();
//   const navigate = useNavigate();
//   const summaryRef = useRef<HTMLDivElement>(null);

//   const dataSources = [
//     { value: 'local', label: 'Local', icon: HardDrive },
//     { value: 's3', label: 'S3', icon: Cloud },
//     { value: 'azure-blob', label: 'Azure Blob', icon: CloudRain },
//     { value: 'database', label: 'Database', icon: Server }
//   ];

//   const destinations = [
//     { value: 's3', label: 'S3', icon: Cloud },
//     { value: 'azure-blob', label: 'Azure Blob', icon: Database },
//     { value: 'database', label: 'Database', icon: Server }
//   ];

//   useEffect(() => {
//     if (['s3', 'azure-blob'].includes(selectedDestination) && selectedSourcePath && destinationConfig.currentPath !== undefined) {
//       const sourceFilename = selectedSourcePath.split('/').pop() || 'output.csv';
//       if (selectedDestination === 's3' && destinationConfig.bucket) {
//         setSelectedDestPath(`s3://${destinationConfig.bucket}/${destSelectedItem || destinationConfig.currentPath || ''}${sourceFilename}`);
//       } else if (selectedDestination === 'azure-blob' && destinationConfig.connectionString) {
//         setSelectedDestPath(`azure://${destinationConfig.connectionString}/${destSelectedItem || destinationConfig.currentPath || ''}${sourceFilename}`);
//       }
//     }
//   }, [selectedDestination, selectedSourcePath, destinationConfig.bucket, destinationConfig.currentPath, destinationConfig.connectionString, destSelectedItem]);

//   useEffect(() => {
//     // Update selectAllTables based on sourceDBSelectedTables
//     if (sourceDBSelectedTables.length === mockTables.length) {
//       setSelectAllTables(true);
//     } else {
//       setSelectAllTables(false);
//     }
//   }, [sourceDBSelectedTables]);

//   const onDrop = useCallback((acceptedFiles: File[]) => {
//     setUploadedFiles(acceptedFiles);
//     const fileNames = acceptedFiles.map(file => file.name).join(', ');
//     setSelectedSourcePath(fileNames);
//     setIsSourceConnected(true);
//     localStorage.setItem("selectedFile", fileNames.split(', ')[0]);
//     toast({
//       title: "Files Uploaded",
//       description: `${acceptedFiles.length} file(s) uploaded successfully`,
//     });
//   }, [toast]);

//   const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

//   const scrollToSummary = () => {
//     setTimeout(() => {
//       if (summaryRef.current) {
//         summaryRef.current.scrollIntoView({ behavior: 'smooth' });
//       } else {
//         window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
//       }
//     }, 100);
//   };

//   const getS3Items = (bucket: string, path: string) => {
//     const allFolders = mockFolders[bucket] || [];
//     const subfolders = new Set<string>();
//     allFolders.forEach(f => {
//       if (f.startsWith(path)) {
//         const relative = f.slice(path.length);
//         if (relative) {
//           const sub = relative.split('/')[0] + '/';
//           if (sub !== '/') subfolders.add(sub);
//         }
//       }
//     });
//     const folders = Array.from(subfolders);
//     const files = mockFiles[path] || [];
//     return { folders, files };
//   };

//   const getAzureItems = (container: string, path: string) => {
//     const allFolders = mockAzureFolders[container] || [];
//     const subfolders = new Set<string>();
//     allFolders.forEach(f => {
//       if (f.startsWith(path)) {
//         const relative = f.slice(path.length);
//         if (relative) {
//           const sub = relative.split('/')[0] + '/';
//           if (sub !== '/') subfolders.add(sub);
//         }
//       }
//     });
//     const folders = Array.from(subfolders);
//     const blobs = mockAzureBlobs[path] || [];
//     return { folders, files: blobs };
//   };

//   const handleS3Navigation = (item: string, isFolder: boolean) => {
//     if (item === '..') {
//       const parts = (sourceConfig.currentPath || '').split('/').filter(p => p);
//       if (parts.length === 0) {
//         // At bucket level, go back to bucket list
//         setSourceConfig(prev => ({ ...prev, bucket: undefined, currentPath: '' }));
//       } else {
//         // Inside a folder, go up one level
//         parts.pop();
//         const newPath = parts.join('/') + (parts.length > 0 ? '/' : '');
//         setSourceConfig(prev => ({ ...prev, currentPath: newPath }));
//       }
//       setSelectedSourcePath('');
//       setIsSourceConnected(false);
//     } else if (isFolder) {
//       const newPath = (sourceConfig.currentPath || '') + item;
//       setSourceConfig(prev => ({ ...prev, currentPath: newPath }));
//       setSelectedSourcePath('');
//       setIsSourceConnected(false);
//     } else {
//       const fullPath = `s3://${sourceConfig.bucket}/${sourceConfig.currentPath || ''}${item}`;
//       setSelectedSourcePath(fullPath);
//       setIsSourceConnected(true);
//       localStorage.setItem("selectedFile", item);
//       setShowSourceBrowser(false);
//       toast({
//         title: "File Selected",
//         description: `Selected: ${fullPath}`,
//       });
//     }
//     setSourceSelectedItem(null);
//   };

//   const handleAzureNavigation = (item: string, isFolder: boolean) => {
//     if (item === '..') {
//       const parts = (sourceConfig.currentPath || '').split('/').filter(p => p);
//       if (parts.length === 0) {
//         // At container level, go back to container list
//         setSourceConfig(prev => ({ ...prev, connectionString: undefined, currentPath: '' }));
//       } else {
//         // Inside a folder, go up one level
//         parts.pop();
//         const newPath = parts.join('/') + (parts.length > 0 ? '/' : '');
//         setSourceConfig(prev => ({ ...prev, currentPath: newPath }));
//       }
//       setSelectedSourcePath('');
//       setIsSourceConnected(false);
//     } else if (isFolder) {
//       const newPath = (sourceConfig.currentPath || '') + item;
//       setSourceConfig(prev => ({ ...prev, currentPath: newPath }));
//       setSelectedSourcePath('');
//       setIsSourceConnected(false);
//     } else {
//       const fullPath = `azure://${sourceConfig.connectionString}/${sourceConfig.currentPath || ''}${item}`;
//       setSelectedSourcePath(fullPath);
//       setIsSourceConnected(true);
//       localStorage.setItem("selectedFile", item);
//       setShowSourceBrowser(false);
//       toast({
//         title: "File Selected",
//         description: `Selected: ${fullPath}`,
//       });
//     }
//     setSourceSelectedItem(null);
//   };

//   const handleDestS3Navigation = (item: string, isFolder: boolean) => {
//     if (item === '..') {
//       const parts = (destinationConfig.currentPath || '').split('/').filter(p => p);
//       if (parts.length === 0) {
//         // At bucket level, go back to bucket list
//         setDestinationConfig(prev => ({ ...prev, bucket: undefined, currentPath: '' }));
//       } else {
//         // Inside a folder, go up one level
//         parts.pop();
//         const newPath = parts.join('/') + (parts.length > 0 ? '/' : '');
//         setDestinationConfig(prev => ({ ...prev, currentPath: newPath }));
//       }
//       setSelectedDestPath('');
//       setIsDestConnected(false);
//     } else if (isFolder) {
//       const newPath = (destinationConfig.currentPath || '') + item;
//       setDestinationConfig(prev => ({ ...prev, currentPath: newPath }));
//       setSelectedDestPath('');
//       setIsDestConnected(false);
//     }
//     setDestSelectedItem(null);
//   };

//   const handleDestAzureNavigation = (item: string, isFolder: boolean) => {
//     if (item === '..') {
//       const parts = (destinationConfig.currentPath || '').split('/').filter(p => p);
//       if (parts.length === 0) {
//         // At container level, go back to container list
//         setDestinationConfig(prev => ({ ...prev, connectionString: undefined, currentPath: '' }));
//       } else {
//         // Inside a folder, go up one level
//         parts.pop();
//         const newPath = parts.join('/') + (parts.length > 0 ? '/' : '');
//         setDestinationConfig(prev => ({ ...prev, currentPath: newPath }));
//       }
//       setSelectedDestPath('');
//       setIsDestConnected(false);
//     } else if (isFolder) {
//       const newPath = (destinationConfig.currentPath || '') + item;
//       setDestinationConfig(prev => ({ ...prev, currentPath: newPath }));
//       setSelectedDestPath('');
//       setIsDestConnected(false);
//     }
//     setDestSelectedItem(null);
//   };

//   const handleSelectSourceBucket = (bucket: string) => {
//     setSourceConfig(prev => ({ ...prev, bucket, currentPath: '' }));
//     setSelectedSourcePath('');
//     setIsSourceConnected(false);
//     setSourceSelectedItem(null);
//   };

//   const handleSelectSourceContainer = (container: string) => {
//     setSourceConfig(prev => ({ ...prev, connectionString: container, currentPath: '' }));
//     setSelectedSourcePath('');
//     setIsSourceConnected(false);
//     setSourceSelectedItem(null);
//   };

//   const handleSelectDestBucket = (bucket: string) => {
//     setDestinationConfig(prev => ({ ...prev, bucket, currentPath: '' }));
//     setSelectedDestPath('');
//     setIsDestConnected(false);
//     setDestSelectedItem(null);
//   };

//   const handleSelectDestContainer = (container: string) => {
//     setDestinationConfig(prev => ({ ...prev, connectionString: container, currentPath: '' }));
//     setSelectedDestPath('');
//     setIsDestConnected(false);
//     setDestSelectedItem(null);
//   };

//   const handleSelectDestinationFolder = () => {
//     if (!selectedSourcePath) {
//       toast({
//         title: "Error",
//         description: "Please select a source file first",
//         variant: "destructive"
//       });
//       return;
//     }
//     const sourceFilename = selectedSourcePath.split('/').pop() || 'output.csv';
//     const destPath = selectedDestination === 's3' 
//       ? `s3://${destinationConfig.bucket}/${destSelectedItem || destinationConfig.currentPath || ''}${sourceFilename}`
//       : `azure://${destinationConfig.connectionString}/${destSelectedItem || destinationConfig.currentPath || ''}${sourceFilename}`;
//     setSelectedDestPath(destPath);
//     setIsDestConnected(true);
//     localStorage.setItem("selectedDestFolder", destSelectedItem || destinationConfig.currentPath || '');
//     setShowDestBrowser(false);
//     toast({
//       title: "Destination Selected",
//       description: `Selected: ${destSelectedItem || destinationConfig.currentPath || ''}${sourceFilename}`,
//     });
//     scrollToSummary();
//   };

//   const handleSelectDestBucketOrContainer = () => {
//     if (!selectedSourcePath) {
//       toast({
//         title: "Error",
//         description: "Please select a source file first",
//         variant: "destructive"
//       });
//       return;
//     }
//     const sourceFilename = selectedSourcePath.split('/').pop() || 'output.csv';
//     const destPath = selectedDestination === 's3' 
//       ? `s3://${destSelectedItem}/${sourceFilename}`
//       : `azure://${destSelectedItem}/${sourceFilename}`;
//     setSelectedDestPath(destPath);
//     setIsDestConnected(true);
//     localStorage.setItem("selectedDestFolder", '');
//     setShowDestBrowser(false);
//     toast({
//       title: "Destination Selected",
//       description: `Selected: ${destSelectedItem}`,
//     });
//     scrollToSummary();
//   };

//   const handleSelectSourceTables = () => {
//     if (sourceDBSelectedTables.length === 0) {
//       toast({
//         title: "Error",
//         description: "Please select at least one table",
//         variant: "destructive"
//       });
//       return;
//     }
//     const fullPath = sourceDBSelectedTables.map(table => `${sourceConfig.databaseName}.${table}`).join(', ');
//     setSelectedSourcePath(fullPath);
//     setIsSourceConnected(true);
//     setShowSourceDBBrowser(false);
//     localStorage.setItem("selectedFile", sourceDBSelectedTables.join(','));
//     toast({
//       title: "Tables Selected",
//       description: `Selected: ${fullPath}`,
//     });
//     setSourceDBSelectedTables([]);
//     setSelectAllTables(false);
//   };

//   const handleSelectDestTable = (table: string) => {
//     setSelectedDestPath(`${destinationConfig.databaseName}.${table}`);
//     setIsDestConnected(true);
//     setShowDestDBBrowser(false);
//     localStorage.setItem("selectedDestFolder", table);
//     toast({
//       title: "Table Selected",
//       description: `Selected: ${table}`,
//     });
//     scrollToSummary();
//   };

//   const toggleSelectAllTables = () => {
//     if (selectAllTables) {
//       setSourceDBSelectedTables([]);
//     } else {
//       setSourceDBSelectedTables(mockTables);
//     }
//     setSelectAllTables(!selectAllTables);
//   };

//   const Breadcrumbs = ({ type }: { type: 'source' | 'destination' }) => {
//     const config = type === 'source' ? sourceConfig : destinationConfig;
//     const path = config.currentPath || '';
//     const parts = path.split('/').filter(p => p);
//     const bucketOrContainer = type === 'source' ? (config.bucket || config.connectionString) : (config.bucket || config.connectionString);
    
//     return (
//       <div className="flex flex-wrap items-center gap-1 text-sm text-muted-foreground mb-2">
//         <span 
//           onClick={() => {
//             if (type === 'source') {
//               setSourceConfig(prev => ({ ...prev, bucket: undefined, connectionString: undefined, currentPath: '' }));
//               setSelectedSourcePath('');
//               setIsSourceConnected(false);
//             } else {
//               setDestinationConfig(prev => ({ ...prev, bucket: undefined, connectionString: undefined, currentPath: '' }));
//               setSelectedDestPath('');
//               setIsDestConnected(false);
//             }
//           }} 
//           className="cursor-pointer hover:underline flex items-center"
//         >
//           <Folder className="w-4 h-4 mr-1" /> Root
//         </span>
//         {bucketOrContainer && (
//           <>
//             <ChevronRight className="w-4 h-4" />
//             <span 
//               onClick={() => {
//                 if (type === 'source') {
//                   setSourceConfig(prev => ({ ...prev, currentPath: '' }));
//                   setSelectedSourcePath('');
//                   setIsSourceConnected(false);
//                 } else {
//                   setDestinationConfig(prev => ({ ...prev, currentPath: '' }));
//                   setSelectedDestPath('');
//                   setIsDestConnected(false);
//                 }
//               }} 
//               className="cursor-pointer hover:underline"
//             >
//               {bucketOrContainer}
//             </span>
//           </>
//         )}
//         {parts.map((part, idx) => (
//           <React.Fragment key={idx}>
//             <ChevronRight className="w-4 h-4" />
//             <span 
//               onClick={() => {
//                 const newPath = parts.slice(0, idx + 1).join('/') + '/';
//                 if (type === 'source') {
//                   setSourceConfig(prev => ({ ...prev, currentPath: newPath }));
//                   setSelectedSourcePath('');
//                   setIsSourceConnected(false);
//                 } else {
//                   setDestinationConfig(prev => ({ ...prev, currentPath: newPath }));
//                   setSelectedDestPath('');
//                   setIsDestConnected(false);
//                 }
//               }} 
//               className="cursor-pointer hover:underline"
//             >
//               {part}
//             </span>
//           </React.Fragment>
//         ))}
//       </div>
//     );
//   };

//   const handleConnect = async (type: 'source' | 'destination') => {
//     if (type === 'source') {
//       if (selectedSource === 's3' || selectedSource === 'azure-blob') {
//         setIsSourceConnecting(true);
//         await new Promise(resolve => setTimeout(resolve, 1000));
//         setShowSourceBrowser(true);
//         setIsSourceConnecting(false);
//         toast({
//           title: "Connection Initiated",
//           description: `Please select a ${selectedSource === 's3' ? 'bucket' : 'container'}`,
//         });
//       } else if (selectedSource === 'database') {
//         if (!sourceConfig.databaseName) {
//           toast({ title: "Error", description: "Database Name is required", variant: "destructive" });
//           return;
//         }
//         if (!sourceConfig.username) {
//           toast({ title: "Error", description: "Username is required", variant: "destructive" });
//           return;
//         }
//         setIsSourceConnecting(true);
//         await new Promise(resolve => setTimeout(resolve, 1000));
//         setShowSourceDBBrowser(true);
//         setIsSourceConnecting(false);
//         toast({
//           title: "Connection Successful",
//           description: `Connected to database successfully`,
//         });
//       }
//     } else {
//       if (selectedDestination === 's3' || selectedDestination === 'azure-blob') {
//         if (!selectedSourcePath) {
//           toast({ title: "Error", description: "Please select a source first", variant: "destructive" });
//           return;
//         }
//         setIsDestConnecting(true);
//         await new Promise(resolve => setTimeout(resolve, 1000));
//         setShowDestBrowser(true);
//         setIsDestConnecting(false);
//         toast({
//           title: "Connection Initiated",
//           description: `Please select a ${selectedDestination === 's3' ? 'bucket' : 'container'}`,
//         });
//       } else if (selectedDestination === 'database') {
//         if (!destinationConfig.databaseName) {
//           toast({ title: "Error", description: "Database Name is required", variant: "destructive" });
//           return;
//         }
//         if (!destinationConfig.username) {
//           toast({ title: "Error", description: "Username is required", variant: "destructive" });
//           return;
//         }
//         setIsDestConnecting(true);
//         await new Promise(resolve => setTimeout(resolve, 1000));
//         setIsDestConnected(true);
//         setSelectedDestPath(destinationConfig.databaseName!);
//         setIsDestConnecting(false);
//         toast({
//           title: "Connection Successful",
//           description: `Connected to database successfully`,
//         });
//         scrollToSummary();
//       }
//     }
//   };

//   const handleRemoveSourcePath = () => {
//     setSelectedSourcePath('');
//     setUploadedFiles([]);
//     setIsSourceConnected(false);
//     setSourceConfig({ bucket: sourceConfig.bucket, currentPath: sourceConfig.currentPath });
//     localStorage.removeItem("selectedFile");
//   };

//   const handleRemoveDestPath = () => {
//     setSelectedDestPath('');
//     setIsDestConnected(false);
//     setDestinationConfig({ type: selectedDestination, bucket: destinationConfig.bucket, currentPath: destinationConfig.currentPath });
//     localStorage.removeItem("selectedDestFolder");
//   };

//   const renderSourceFields = () => {
//     switch (selectedSource) {
//       case 's3':
//       case 'azure-blob':
//         return (
//           <div className="space-y-6">
//             {selectedSourcePath && (
//               <div className="bg-green-50 border border-green-200 rounded-lg p-3">
//                 <div className="flex items-center justify-between">
//                   <div className="flex items-center gap-2">
//                     <File className="w-4 h-4 text-green-600" />
//                     <span className="text-sm font-medium text-green-800">Selected:</span>
//                     <span className="text-sm text-green-700">{selectedSourcePath}</span>
//                   </div>
//                   <Button
//                     variant="ghost"
//                     size="sm"
//                     onClick={handleRemoveSourcePath}
//                     className="h-6 w-6 p-0 text-green-600 hover:text-green-800 hover:bg-green-100"
//                   >
//                     <X className="w-4 h-4" />
//                   </Button>
//                 </div>
//               </div>
//             )}
//             <Button 
//               onClick={() => handleConnect('source')} 
//               disabled={isSourceConnecting}
//               className="w-fit flex items-center gap-2"
//             >
//               {isSourceConnecting ? <Loader2 className="w-4 h-4 animate-spin" /> : isSourceConnected ? <CheckCircle className="w-4 h-4" /> : null}
//               {isSourceConnecting ? 'Connecting...' : isSourceConnected ? 'Connected' : 'Connect'}
//             </Button>
//           </div>
//         );
      
//       case 'database':
//         return (
//           <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
//             <div>
//               <Label htmlFor="source-database-name">Database Name</Label>
//               <Input
//                 id="source-database-name"
//                 placeholder="database_name"
//                 value={sourceConfig.databaseName || ''}
//                 onChange={(e) => setSourceConfig(prev => ({ ...prev, databaseName: e.target.value }))}
//               />
//             </div>
//             <div>
//               <Label htmlFor="source-username">Username</Label>
//               <Input
//                 id="source-username"
//                 placeholder="username"
//                 value={sourceConfig.username || ''}
//                 onChange={(e) => setSourceConfig(prev => ({ ...prev, username: e.target.value }))}
//               />
//             </div>
//             <div>
//               <Label htmlFor="source-password">Password</Label>
//               <Input
//                 id="source-password"
//                 type="password"
//                 placeholder="••••••••"
//                 value={sourceConfig.password || ''}
//                 onChange={(e) => setSourceConfig(prev => ({ ...prev, password: e.target.value }))}
//               />
//             </div>
//             <div>
//               <Label htmlFor="source-port">Port</Label>
//               <Input
//                 id="source-port"
//                 placeholder="5432"
//                 value={sourceConfig.port || ''}
//                 onChange={(e) => setSourceConfig(prev => ({ ...prev, port: e.target.value }))}
//               />
//             </div>
//             {selectedSourcePath && (
//               <div className="col-span-full bg-green-50 border border-green-200 rounded-lg p-3">
//                 <div className="flex items-center justify-between">
//                   <div className="flex items-center gap-2">
//                     <Database className="w-4 h-4 text-green-600" />
//                     <span className="text-sm font-medium text-green-800">Tables selected:</span>
//                     <span className="text-sm text-green-700">{selectedSourcePath}</span>
//                   </div>
//                   <Button
//                     variant="ghost"
//                     size="sm"
//                     onClick={handleRemoveSourcePath}
//                     className="h-6 w-6 p-0 text-green-600 hover:text-green-800 hover:bg-green-100"
//                   >
//                     <X className="w-4 h-4" />
//                   </Button>
//                 </div>
//               </div>
//             )}
//             <div className="col-span-full">
//               <Button 
//                 onClick={() => handleConnect('source')} 
//                 disabled={isSourceConnecting || isSourceConnected || !sourceConfig.databaseName || !sourceConfig.username}
//                 className="w-fit flex items-center gap-2"
//               >
//                 {isSourceConnecting ? <Loader2 className="w-4 h-4 animate-spin" /> : isSourceConnected ? <CheckCircle className="w-4 h-4" /> : null}
//                 {isSourceConnecting ? 'Connecting...' : isSourceConnected ? 'Connected' : 'Connect'}
//               </Button>
//             </div>
//           </div>
//         );
      
//       case 'local':
//         return (
//           <div 
//             {...getRootProps()} 
//             className={`text-center py-8 border-2 border-dashed rounded-lg cursor-pointer transition-colors
//               ${isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'}
//             `}
//           >
//             <input {...getInputProps()} />
//             <UploadIcon className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
//             {isDragActive ? (
//               <p className="text-primary">Drop the files here...</p>
//             ) : (
//               <div>
//                 <p className="text-muted-foreground mb-2">Drag & drop files here, or click to select</p>
//                 {selectedSourcePath && (
//                   <div className="bg-green-50 border border-green-200 rounded-lg p-3 mt-4">
//                     <div className="flex items-center justify-between">
//                       <div className="flex items-center gap-2">
//                         <File className="w-4 h-4 text-green-600" />
//                         <span className="text-sm font-medium text-green-800">Files selected:</span>
//                         <span className="text-sm text-green-700">{selectedSourcePath}</span>
//                       </div>
//                       <Button
//                         variant="ghost"
//                         size="sm"
//                         onClick={handleRemoveSourcePath}
//                         className="h-6 w-6 p-0 text-green-600 hover:text-green-800 hover:bg-green-100"
//                       >
//                         <X className="w-4 h-4" />
//                       </Button>
//                     </div>
//                   </div>
//                 )}
//               </div>
//             )}
//           </div>
//         );
      
//       default:
//         return null;
//     }
//   };

//   const renderDestinationFields = () => {
//     switch (selectedDestination) {
//       case 's3':
//       case 'azure-blob':
//         return (
//           <div className="space-y-6">
//             {selectedDestPath && (
//               <div className="bg-green-50 border border-green-200 rounded-lg p-3">
//                 <div className="flex items-center justify-between">
//                   <div className="flex items-center gap-2">
//                     <File className="w-4 h-4 text-green-600" />
//                     <span className="text-sm font-medium text-green-800">Destination selected:</span>
//                     <span className="text-sm text-green-700">{selectedDestPath}</span>
//                   </div>
//                   <Button
//                     variant="ghost"
//                     size="sm"
//                     onClick={handleRemoveDestPath}
//                     className="h-6 w-6 p-0 text-green-600 hover:text-green-800 hover:bg-green-100"
//                   >
//                     <X className="w-4 h-4" />
//                   </Button>
//                 </div>
//               </div>
//             )}
//             <Button 
//               onClick={() => handleConnect('destination')} 
//               disabled={isDestConnecting || !selectedSourcePath}
//               className="w-fit flex items-center gap-2"
//             >
//               {isDestConnecting ? <Loader2 className="w-4 h-4 animate-spin" /> : isDestConnected ? <CheckCircle className="w-4 h-4" /> : null}
//               {isDestConnecting ? 'Connecting...' : isDestConnected ? 'Connected' : 'Connect'}
//             </Button>
//           </div>
//         );
      
//       case 'database':
//         return (
//           <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
//             <div>
//               <Label htmlFor="dest-database-name">Database Name</Label>
//               <Input
//                 id="dest-database-name"
//                 placeholder="database_name"
//                 value={destinationConfig.databaseName || ''}
//                 onChange={(e) => setDestinationConfig(prev => ({ ...prev, databaseName: e.target.value }))}
//               />
//             </div>
//             <div>
//               <Label htmlFor="dest-username">Username</Label>
//               <Input
//                 id="dest-username"
//                 placeholder="username"
//                 value={destinationConfig.username || ''}
//                 onChange={(e) => setDestinationConfig(prev => ({ ...prev, username: e.target.value }))}
//               />
//             </div>
//             <div>
//               <Label htmlFor="dest-password">Password</Label>
//               <Input
//                 id="dest-password"
//                 type="password"
//                 placeholder="••••••••"
//                 value={destinationConfig.password || ''}
//                 onChange={(e) => setDestinationConfig(prev => ({ ...prev, password: e.target.value }))}
//               />
//             </div>
//             <div>
//               <Label htmlFor="dest-port">Port</Label>
//               <Input
//                 id="dest-port"
//                 placeholder="5432"
//                 value={destinationConfig.port || ''}
//                 onChange={(e) => setDestinationConfig(prev => ({ ...prev, port: e.target.value }))}
//               />
//             </div>
//             {selectedDestPath && (
//               <div className="col-span-full bg-green-50 border border-green-200 rounded-lg p-3">
//                 <div className="flex items-center justify-between">
//                   <div className="flex items-center gap-2">
//                     <Database className="w-4 h-4 text-green-600" />
//                     <span className="text-sm font-medium text-green-800">Database selected:</span>
//                     <span className="text-sm text-green-700">{selectedDestPath}</span>
//                   </div>
//                   <Button
//                     variant="ghost"
//                     size="sm"
//                     onClick={handleRemoveDestPath}
//                     className="h-6 w-6 p-0 text-green-600 hover:text-green-800 hover:bg-green-100"
//                   >
//                     <X className="w-4 h-4" />
//                   </Button>
//                 </div>
//               </div>
//             )}
//             <div className="col-span-full">
//               <Button 
//                 onClick={() => handleConnect('destination')} 
//                 disabled={isDestConnecting || isDestConnected || !destinationConfig.databaseName || !destinationConfig.username}
//                 className="w-fit flex items-center gap-2"
//               >
//                 {isDestConnecting ? <Loader2 className="w-4 h-4 animate-spin" /> : isDestConnected ? <CheckCircle className="w-4 h-4" /> : null}
//                 {isDestConnecting ? 'Connecting...' : isDestConnected ? 'Connected' : 'Connect'}
//               </Button>
//             </div>
//           </div>
//         );
      
//       default:
//         return null;
//     }
//   };

//   const handleProceed = () => {
//     if (!isSourceConnected || !isDestConnected || !selectedSourcePath || !selectedDestPath) {
//       toast({
//         title: "Error",
//         description: "Please connect and select both source and destination paths",
//         variant: "destructive"
//       });
//       return;
//     }
//     navigate('/dashboard/schema');
//   };

//   const handleGoBack = () => {
//     navigate('/dashboard/jobs');
//   };

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 p-6">
//       <div className="max-w-7xl mt-14 mx-auto">
//         {/* Header with Navigation */}
//         <div className="flex items-center justify-between mb-8">
//           <Button
//             variant="outline"
//             onClick={handleGoBack}
//             className="flex items-center gap-2"
//           >
//             <ArrowLeft className="w-4 h-4" />
//             Back to Jobs
//           </Button>
          
//           <div className="text-center">
//             <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent mb-4">
//               Data Upload Center
//             </h1>
//             <p className="text-muted-foreground max-w-2xl mx-auto">
//               Configure your data source and destination for seamless data transfer
//             </p>
//           </div>

//           <div className="w-[120px]" /> {/* Spacer for centering */}
//         </div>

//         {/* Source Browser Dialog for S3/Azure */}
//         <Dialog open={showSourceBrowser} onOpenChange={(open) => {
//           setShowSourceBrowser(open);
//           if (!open) {
//             setSourceConfig(prev => ({ ...prev, bucket: undefined, connectionString: undefined, currentPath: '' }));
//             setSelectedSourcePath('');
//             setIsSourceConnected(false);
//             localStorage.removeItem("selectedFile");
//             setSourceSelectedItem(null);
//           }
//         }}>
//           <DialogContent className="max-w-2xl">
//             <DialogHeader>
//               <DialogTitle>
//                 {selectedSource === 's3' ? 'Browse S3 Buckets' : 'Browse Azure Containers'}
//               </DialogTitle>
//             </DialogHeader>
//             <div className="space-y-4">
//               <Breadcrumbs type="source" />
//               <div className="border rounded-lg max-h-96 overflow-y-auto">
//                 {(!sourceConfig.bucket && selectedSource === 's3') || (!sourceConfig.connectionString && selectedSource === 'azure-blob') ? (
//                   <>
//                     {selectedSource === 's3' ? (
//                       mockBuckets.map((bucket, index) => (
//                         <div
//                           key={index}
//                           className={`flex items-center gap-3 p-3 hover:bg-primary/10 cursor-pointer border-b last:border-b-0 ${sourceSelectedItem === bucket ? 'bg-primary/20 border-primary/50' : ''}`}
//                           onDoubleClick={() => handleSelectSourceBucket(bucket)}
//                         >
//                           <Folder className="w-4 h-4 text-blue-500" />
//                           <div className="flex-1 font-medium">{bucket}</div>
//                         </div>
//                       ))
//                     ) : (
//                       mockAzureContainers.map((container, index) => (
//                         <div
//                           key={index}
//                           className={`flex items-center gap-3 p-3 hover:bg-primary/10 cursor-pointer border-b last:border-b-0 ${sourceSelectedItem === container ? 'bg-primary/20 border-primary/50' : ''}`}
//                           onDoubleClick={() => handleSelectSourceContainer(container)}
//                         >
//                           <Folder className="w-4 h-4 text-blue-500" />
//                           <div className="flex-1 font-medium">{container}</div>
//                         </div>
//                       ))
//                     )}
//                   </>
//                 ) : (
//                   <>
//                     {(sourceConfig.bucket || sourceConfig.connectionString) && (
//                       <div
//                         className="flex items-center gap-3 p-3 hover:bg-primary/10 cursor-pointer border-b last:border-b-0"
//                         onDoubleClick={() => (selectedSource === 's3' ? handleS3Navigation('..', true) : handleAzureNavigation('..', true))}
//                       >
//                         <Folder className="w-4 h-4 text-blue-500" />
//                         <div className="flex-1 font-medium">..</div>
//                       </div>
//                     )}
//                     {(selectedSource === 's3' ? getS3Items(sourceConfig.bucket!, sourceConfig.currentPath || '') : getAzureItems(sourceConfig.connectionString!, sourceConfig.currentPath || '')).folders.map((folder, index) => (
//                       <div
//                         key={folder}
//                         className={`flex items-center gap-3 p-3 hover:bg-primary/10 cursor-pointer border-b last:border-b-0 ${sourceSelectedItem === folder ? 'bg-primary/20 border-primary/50' : ''}`}
//                         onDoubleClick={() => (selectedSource === 's3' ? handleS3Navigation(folder, true) : handleAzureNavigation(folder, true))}
//                       >
//                         <Folder className="w-4 h-4 text-blue-500" />
//                         <div className="flex-1 font-medium">{folder}</div>
//                       </div>
//                     ))}
//                     {(selectedSource === 's3' ? getS3Items(sourceConfig.bucket!, sourceConfig.currentPath || '') : getAzureItems(sourceConfig.connectionString!, sourceConfig.currentPath || '')).files.map((file, index) => (
//                       <div
//                         key={file}
//                         className={`flex items-center gap-3 p-3 hover:bg-primary/10 cursor-pointer border-b ${index === (selectedSource === 's3' ? getS3Items(sourceConfig.bucket!, sourceConfig.currentPath || '').files.length : getAzureItems(sourceConfig.connectionString!, sourceConfig.currentPath || '').files.length) - 1 ? 'last:border-b-0' : ''} ${sourceSelectedItem === file ? 'bg-primary/20 border-primary/50' : ''}`}
//                         onClick={() => setSourceSelectedItem(file)}
//                       >
//                         <File className="w-4 h-4 text-gray-500" />
//                         <div className="flex-1 font-medium">{file}</div>
//                       </div>
//                     ))}
//                   </>
//                 )}
//               </div>
//               {(sourceConfig.bucket || sourceConfig.connectionString) && sourceSelectedItem && !sourceSelectedItem.endsWith('/') && (
//                 <Button 
//                   onClick={() => {
//                     const isFolder = sourceSelectedItem.endsWith('/');
//                     if (selectedSource === 's3') handleS3Navigation(sourceSelectedItem, isFolder);
//                     else handleAzureNavigation(sourceSelectedItem, isFolder);
//                   }}
//                   className="w-fit flex items-center gap-2"
//                 >
//                   Select {sourceSelectedItem}
//                 </Button>
//               )}
//             </div>
//           </DialogContent>
//         </Dialog>

//         {/* Destination Browser Dialog for S3/Azure */}
//         <Dialog open={showDestBrowser} onOpenChange={(open) => {
//           setShowDestBrowser(open);
//           if (!open) {
//             setDestinationConfig(prev => ({ ...prev, bucket: undefined, connectionString: undefined, currentPath: '' }));
//             setSelectedDestPath('');
//             setIsDestConnected(false);
//             localStorage.removeItem("selectedDestFolder");
//             setDestSelectedItem(null);
//           }
//         }}>
//           <DialogContent className="max-w-2xl">
//             <DialogHeader>
//               <DialogTitle>
//                 {selectedDestination === 's3' ? 'Browse S3 Buckets' : 'Browse Azure Containers'}
//               </DialogTitle>
//             </DialogHeader>
//             <div className="space-y-4">
//               <Breadcrumbs type="destination" />
//               <div className="border rounded-lg max-h-96 overflow-y-auto">
//                 {(!destinationConfig.bucket && selectedDestination === 's3') || (!destinationConfig.connectionString && selectedDestination === 'azure-blob') ? (
//                   <>
//                     {selectedDestination === 's3' ? (
//                       mockBuckets.map((bucket, index) => (
//                         <div
//                           key={index}
//                           className={`flex items-center gap-3 p-3 hover:bg-primary/10 cursor-pointer border-b last:border-b-0 ${destSelectedItem === bucket ? 'bg-primary/20 border-primary/50' : ''}`}
//                           onClick={() => setDestSelectedItem(bucket)}
//                           onDoubleClick={() => handleSelectDestBucket(bucket)}
//                         >
//                           <Folder className="w-4 h-4 text-blue-500" />
//                           <div className="flex-1 font-medium">{bucket}</div>
//                         </div>
//                       ))
//                     ) : (
//                       mockAzureContainers.map((container, index) => (
//                         <div
//                           key={index}
//                           className={`flex items-center gap-3 p-3 hover:bg-primary/10 cursor-pointer border-b last:border-b-0 ${destSelectedItem === container ? 'bg-primary/20 border-primary/50' : ''}`}
//                           onClick={() => setDestSelectedItem(container)}
//                           onDoubleClick={() => handleSelectDestContainer(container)}
//                         >
//                           <Folder className="w-4 h-4 text-blue-500" />
//                           <div className="flex-1 font-medium">{container}</div>
//                         </div>
//                       ))
//                     )}
//                   </>
//                 ) : (
//                   <>
//                     {(destinationConfig.bucket || destinationConfig.connectionString) && (
//                       <div
//                         className="flex items-center gap-3 p-3 hover:bg-primary/10 cursor-pointer border-b last:border-b-0"
//                         onDoubleClick={() => (selectedDestination === 's3' ? handleDestS3Navigation('..', true) : handleDestAzureNavigation('..', true))}
//                       >
//                         <Folder className="w-4 h-4 text-blue-500" />
//                         <div className="flex-1 font-medium">..</div>
//                       </div>
//                     )}
//                     {(selectedDestination === 's3' ? getS3Items(destinationConfig.bucket!, destinationConfig.currentPath || '') : getAzureItems(destinationConfig.connectionString!, destinationConfig.currentPath || '')).folders.map((folder, index) => (
//                       <div
//                         key={folder}
//                         className={`flex items-center gap-3 p-3 hover:bg-primary/10 cursor-pointer border-b last:border-b-0 ${destSelectedItem === folder ? 'bg-primary/20 border-primary/50' : ''}`}
//                         onClick={() => setDestSelectedItem(folder)}
//                         onDoubleClick={() => (selectedDestination === 's3' ? handleDestS3Navigation(folder, true) : handleDestAzureNavigation(folder, true))}
//                       >
//                         <Folder className="w-4 h-4 text-blue-500" />
//                         <div className="flex-1 font-medium">{folder}</div>
//                       </div>
//                     ))}
//                   </>
//                 )}
//               </div>
//               {((!destinationConfig.bucket && selectedDestination === 's3') || (!destinationConfig.connectionString && selectedDestination === 'azure-blob')) && destSelectedItem && (
//                 <Button 
//                   onClick={handleSelectDestBucketOrContainer}
//                   className="w-fit flex items-center gap-2"
//                 >
//                   Select This {selectedDestination === 's3' ? 'Bucket' : 'Container'}
//                 </Button>
//               )}
//               {(destinationConfig.bucket || destinationConfig.connectionString) && destSelectedItem && destSelectedItem !== '..' && (
//                 <Button 
//                   onClick={handleSelectDestinationFolder}
//                   disabled={!selectedSourcePath}
//                   className="w-fit flex items-center gap-2"
//                 >
//                   Select This Folder
//                 </Button>
//               )}
//             </div>
//           </DialogContent>
//         </Dialog>

//         {/* Source Database Browser Dialog */}
//         <Dialog open={showSourceDBBrowser} onOpenChange={(open) => {
//           setShowSourceDBBrowser(open);
//           if (!open) {
//             setSourceDBSelectedTables([]);
//             setSelectAllTables(false);
//           }
//         }}>
//           <DialogContent className="max-w-2xl">
//             <DialogHeader>
//               <DialogTitle>Browse Database Tables</DialogTitle>
//             </DialogHeader>
//             <div className="space-y-4">
//               <div className="text-sm text-muted-foreground">
//                 Database: {sourceConfig.databaseName}
//               </div>
//               <div className="flex items-center gap-2">
//                 <Checkbox
//                   id="select-all-tables"
//                   checked={selectAllTables}
//                   onCheckedChange={toggleSelectAllTables}
//                 />
//                 <Label htmlFor="select-all-tables">Select All Tables</Label>
//               </div>
//               <div className="border rounded-lg max-h-96 overflow-y-auto">
//                 {mockTables.map((table, index) => (
//                   <div
//                     key={index}
//                     className="flex items-center gap-3 p-3 border-b last:border-b-0"
//                   >
//                     <Checkbox
//                       id={`table-${table}`}
//                       checked={sourceDBSelectedTables.includes(table)}
//                       onCheckedChange={(checked) => {
//                         if (checked) {
//                           setSourceDBSelectedTables(prev => [...prev, table]);
//                         } else {
//                           setSourceDBSelectedTables(prev => prev.filter(t => t !== table));
//                         }
//                       }}
//                     />
//                     <Database className="w-4 h-4 text-gray-500" />
//                     <div className="flex-1">
//                       <div className="font-medium">{table}</div>
//                     </div>
//                   </div>
//                 ))}
//               </div>
//               <Button
//                 onClick={handleSelectSourceTables}
//                 disabled={sourceDBSelectedTables.length === 0}
//                 className="w-fit flex items-center gap-2"
//               >
//                 Select {sourceDBSelectedTables.length} Table{sourceDBSelectedTables.length !== 1 ? 's' : ''}
//               </Button>
//             </div>
//           </DialogContent>
//         </Dialog>

//         {/* Destination Database Browser Dialog */}
//         <Dialog open={showDestDBBrowser} onOpenChange={setShowDestDBBrowser}>
//           <DialogContent className="max-w-2xl">
//             <DialogHeader>
//               <DialogTitle>Browse Database Tables</DialogTitle>
//             </DialogHeader>
//             <div className="space-y-4">
//               <div className="text-sm text-muted-foreground">
//                 Database: {destinationConfig.databaseName}
//               </div>
//               <div className="border rounded-lg max-h-96 overflow-y-auto">
//                 {mockTables.map((table, index) => (
//                   <div
//                     key={index}
//                     className="flex items-center gap-3 p-3 hover:bg-primary/10 cursor-pointer border-b last:border-b-0"
//                     onClick={() => handleSelectDestTable(table)}
//                   >
//                     <Database className="w-4 h-4 text-gray-500" />
//                     <div className="flex-1">
//                       <div className="font-medium">{table}</div>
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             </div>
//           </DialogContent>
//         </Dialog>

//         <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
//           {/* Data Source Section */}
//           <Card className="h-fit">
//             <CardHeader>
//               <CardTitle>
//                 Data Source
//               </CardTitle>
//               <CardDescription>
//                 Select and configure your data source
//               </CardDescription>
//             </CardHeader>
//             <CardContent className="space-y-6">
//               <div>
//                 <Label htmlFor="source-select">Data Source</Label>
//                 <Select value={selectedSource} onValueChange={(value) => {
//                   setSelectedSource(value);
//                   setSelectedSourcePath('');
//                   setIsSourceConnected(false);
//                   setSourceConfig({});
//                 }}>
//                   <SelectTrigger>
//                     <SelectValue placeholder="Select data source" />
//                   </SelectTrigger>
//                   <SelectContent>
//                     {dataSources.map((source) => {
//                       const Icon = source.icon;
//                       return (
//                         <SelectItem key={source.value} value={source.value}>
//                           <div className="flex items-center gap-2">
//                             <Icon className="w-4 h-4" />
//                             {source.label}
//                           </div>
//                         </SelectItem>
//                       );
//                     })}
//                   </SelectContent>
//                 </Select>
//               </div>

//               {selectedSource && (
//                 <div className="space-y-4 animate-fade-in">
//                   {renderSourceFields()}
//                 </div>
//               )}
//             </CardContent>
//           </Card>

//           {/* Destination Section */}
//           <Card className="h-fit">
//             <CardHeader>
//               <CardTitle>
//                 Destination
//               </CardTitle>
//               <CardDescription>
//                 Select and configure your destination
//               </CardDescription>
//             </CardHeader>
//             <CardContent className="space-y-6">
//               <div>
//                 <Label htmlFor="destination-select">Destination</Label>
//                 <Select value={selectedDestination} onValueChange={(value) => {
//                   setSelectedDestination(value);
//                   setSelectedDestPath('');
//                   setIsDestConnected(false);
//                   setDestinationConfig({ type: value });
//                 }}>
//                   <SelectTrigger>
//                     <SelectValue placeholder="Select destination" />
//                   </SelectTrigger>
//                   <SelectContent>
//                     {destinations.map((dest) => {
//                       const Icon = dest.icon;
//                       return (
//                         <SelectItem key={dest.value} value={dest.value}>
//                           <div className="flex items-center gap-2">
//                             <Icon className="w-4 h-4" />
//                             {dest.label}
//                           </div>
//                         </SelectItem>
//                       );
//                     })}
//                   </SelectContent>
//                 </Select>
//               </div>

//               {selectedDestination && (
//                 <div className="space-y-4 animate-fade-in">
//                   {renderDestinationFields()}
//                 </div>
//               )}
//             </CardContent>
//           </Card>
//         </div>

//         {/* Configuration Summary */}
//         {selectedSource && selectedDestination && isSourceConnected && isDestConnected && (
//           <Card ref={summaryRef} className="mt-8 animate-fade-in">
//             <CardHeader>
//               <CardTitle className="flex items-center gap-2">
//                 <CheckCircle className="w-5 h-5 text-green-500" />
//                 Configuration Summary
//               </CardTitle>
//               <CardDescription>
//                 Review your selected source and destination
//               </CardDescription>
//             </CardHeader>
//             <CardContent>
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                 <div className="space-y-2">
//                   <h4 className="font-semibold text-primary">Source</h4>
//                   <div className="p-4 bg-muted/50 rounded-lg">
//                     <div className="flex items-center gap-2 mb-2">
//                       {React.createElement(dataSources.find(s => s.value === selectedSource)?.icon || HardDrive, {
//                         className: "w-4 h-4"
//                       })}
//                       <span className="font-medium">
//                         {dataSources.find(s => s.value === selectedSource)?.label}
//                       </span>
//                     </div>
//                     <p className="text-sm text-green-600">✓ Connected Successfully</p>
//                     <p className="text-sm text-muted-foreground">Path: {selectedSourcePath}</p>
//                   </div>
//                 </div>

//                 <div className="space-y-2">
//                   <h4 className="font-semibold text-primary">Destination</h4>
//                   <div className="p-4 bg-muted/50 rounded-lg">
//                     <div className="flex items-center gap-2 mb-2">
//                       {React.createElement(destinations.find(d => d.value === selectedDestination)?.icon || Database, {
//                         className: "w-4 h-4"
//                       })}
//                       <span className="font-medium">
//                         {destinations.find(d => d.value === selectedDestination)?.label}
//                       </span>
//                     </div>
//                     <p className="text-sm text-green-600">✓ Connected Successfully</p>
//                     <p className="text-sm text-muted-foreground">Path: {selectedDestPath}</p>
//                   </div>
//                 </div>
//               </div>

//               <div className="mt-6 flex justify-between gap-4">
//                 <Button 
//                   onClick={handleGoBack} 
//                   variant="outline"
//                   size="lg" 
//                   className="px-8"
//                 >
//                   <ArrowLeft className="w-4 h-4 mr-2" />
//                   Back
//                 </Button>
//                 <Button 
//                   onClick={handleProceed} 
//                   size="lg" 
//                   className="px-8"
//                 >
//                   <ArrowRight className="w-4 h-4 mr-2" />
//                   Proceed
//                 </Button>
//               </div>
//             </CardContent>
//           </Card>
//         )}
//       </div>
//     </div>
//   );
// }

//---------------------------------------------------------------------------------------




// import React, { useState, useCallback, useRef, useEffect } from "react";
// import { useNavigate } from "react-router-dom";
// import { useDropzone } from "react-dropzone";
// import {
//   Database,
//   Cloud,
//   HardDrive,
//   ArrowRight,
//   CheckCircle,
//   Upload as UploadIcon,
//   Server,
//   CloudRain,
//   ArrowLeft,
//   Loader2,
//   Folder,
//   File,
//   X,
//   ChevronRight,
// } from "lucide-react";
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { Label } from "@/components/ui/label";
// import { Input } from "@/components/ui/input";
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
// import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
// import { Checkbox } from "@/components/ui/checkbox";
// import { useToast } from "@/hooks/use-toast";
// import { getBuckets, getObjects, getFile, getAzureContainers, getAzureBlobs, getAzureBlobFile } from "@/lib/api";

// interface SourceConfig {
//   connectionString?: string;
//   databaseName?: string;
//   username?: string;
//   password?: string;
//   port?: string;
//   bucket?: string;
//   currentPath?: string;
// }

// interface DestinationConfig {
//   type: string;
//   connectionString?: string;
//   databaseName?: string;
//   username?: string;
//   password?: string;
//   port?: string;
//   bucket?: string;
//   currentPath?: string;
// }

// interface Bucket {
//   name: string;
// }

// interface Object {
//   key: string;
//   isFolder?: boolean;
// }

// export default function Upload() {
//   const [selectedSource, setSelectedSource] = useState<string>("");
//   const [selectedDestination, setSelectedDestination] = useState<string>("");
//   const [sourceConfig, setSourceConfig] = useState<SourceConfig>({});
//   const [destinationConfig, setDestinationConfig] = useState<DestinationConfig>({ type: "" });
//   const [isSourceConnected, setIsSourceConnected] = useState<boolean>(false);
//   const [isSourceConnecting, setIsSourceConnecting] = useState<boolean>(false);
//   const [isDestConnected, setIsDestConnected] = useState<boolean>(false);
//   const [isDestConnecting, setIsDestConnecting] = useState<boolean>(false);
//   const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
//   const [selectedSourcePath, setSelectedSourcePath] = useState<string>("");
//   const [selectedDestPath, setSelectedDestPath] = useState<string>("");
//   const [showSourceBrowser, setShowSourceBrowser] = useState<boolean>(false);
//   const [showDestBrowser, setShowDestBrowser] = useState<boolean>(false);
//   const [showSourceDBBrowser, setShowSourceDBBrowser] = useState<boolean>(false);
//   const [showDestDBBrowser, setShowDestDBBrowser] = useState<boolean>(false);
//   const [sourceSelectedItem, setSourceSelectedItem] = useState<string | null>(null);
//   const [destSelectedItem, setDestSelectedItem] = useState<string | null>(null);
//   const [sourceDBSelectedTables, setSourceDBSelectedTables] = useState<string[]>([]);
//   const [selectAllTables, setSelectAllTables] = useState<boolean>(false);
//   const { toast } = useToast();
//   const navigate = useNavigate();
//   const summaryRef = useRef<HTMLDivElement>(null);
//   const [buckets, setBuckets] = useState<Bucket[]>([]);
//   const [objects, setObjects] = useState<Object[]>([]);

//   const dataSources = [
//     { value: "local", label: "Local", icon: HardDrive },
//     { value: "s3", label: "S3", icon: Cloud },
//     { value: "azure-blob", label: "Azure Blob", icon: CloudRain },
//     { value: "database", label: "Database", icon: Server },
//   ];

//   const destinations = [
//     { value: "s3", label: "S3", icon: Cloud },
//     { value: "azure-blob", label: "Azure Blob", icon: Database },
//     { value: "database", label: "Database", icon: Server },
//   ];

//   useEffect(() => {
//     if (selectedSourcePath) setIsSourceConnected(true);
//   }, [selectedSourcePath]);

//   useEffect(() => {
//     if (selectedDestPath) setIsDestConnected(true);
//   }, [selectedDestPath]);

//   const onDrop = useCallback(
//     (acceptedFiles: File[]) => {
//       setUploadedFiles(acceptedFiles);
//       const fileNames = acceptedFiles.map((file) => file.name).join(", ");
//       setSelectedSourcePath(fileNames);
//       setIsSourceConnected(true);
//       // Change: Store bucket and file in localStorage for local source
//       localStorage.setItem("selectedBucket", "local");
//       localStorage.setItem("selectedFile", acceptedFiles[0].name);
//       toast({ title: "Files Uploaded", description: `${acceptedFiles.length} file(s) uploaded successfully` });
//     },
//     [toast]
//   );

//   const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

//   const scrollToSummary = () => {
//     setTimeout(() => {
//       if (summaryRef.current) {
//         summaryRef.current.scrollIntoView({ behavior: "smooth" });
//       } else {
//         window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
//       }
//     }, 100);
//   };

//   const fetchBuckets = async (type: "source" | "destination") => {
//     try {
//       const data = selectedSource === "azure-blob" || selectedDestination === "azure-blob" ? await getAzureContainers() : await getBuckets();
//       if (Array.isArray(data)) {
//         const formattedBuckets = data.map((name: string) => ({ name }));
//         setBuckets(formattedBuckets);
//       } else {
//         setBuckets([]);
//         toast({
//           title: "Warning",
//           description: `Unexpected ${selectedSource === "azure-blob" ? "container" : "bucket"} data format.`,
//           variant: "destructive",
//         });
//       }
//     } catch (error) {
//       toast({
//         title: "Error",
//         description: `Failed to fetch ${selectedSource === "azure-blob" ? "containers" : "buckets"}.`,
//         variant: "destructive",
//       });
//       setBuckets([]);
//     }
//   };

//   const fetchObjects = async (bucketName: string, prefix?: string) => {
//     try {
//       const data =
//         selectedSource === "azure-blob" || selectedDestination === "azure-blob"
//           ? await getAzureBlobs(bucketName, prefix)
//           : await getObjects(bucketName, prefix);
//       setObjects(data || []);
//     } catch (error) {
//       toast({
//         title: "Error",
//         description: `Failed to fetch ${selectedSource === "azure-blob" || selectedDestination === "azure-blob" ? "blobs" : "objects"}: ${error instanceof Error ? error.message : "Unknown error"}`,
//         variant: "destructive",
//       });
//       setObjects([]);
//     }
//   };

//   const handleS3Navigation = (item: string, isFolder: boolean, type: "source" | "destination") => {
//     const config = type === "source" ? sourceConfig : destinationConfig;
//     const setConfig = type === "source" ? setSourceConfig : setDestinationConfig;
//     const setSelectedPath = type === "source" ? setSelectedSourcePath : setSelectedDestPath;
//     const setIsConnected = type === "source" ? setIsSourceConnected : setIsDestConnected;
//     const setShowBrowser = type === "source" ? setShowSourceBrowser : setShowDestBrowser;
//     const setSelectedItem = type === "source" ? setSourceSelectedItem : setDestSelectedItem;
//     const prefix = type === "source" ? selectedSource : selectedDestination;

//     if (item === "..") {
//       const parts = (config.currentPath || "").split("/").filter((p) => p);
//       if (parts.length === 0) {
//         setConfig((prev) => ({ ...prev, bucket: undefined, currentPath: "" }));
//         setObjects([]);
//         setSelectedPath("");
//         setIsConnected(false);
//         // Change: Clear localStorage when navigating back to root
//         if (type === "source") {
//           localStorage.removeItem("selectedBucket");
//           localStorage.removeItem("selectedFile");
//         } else {
//           localStorage.removeItem("selectedDestFolder");
//         }
//       } else {
//         parts.pop();
//         const newPath = parts.join("/") + (parts.length > 0 ? "/" : "");
//         setConfig((prev) => ({ ...prev, currentPath: newPath }));
//         fetchObjects(config.bucket!, newPath);
//         setSelectedPath("");
//         setIsConnected(false);
//         // Change: Clear localStorage when navigating up a directory
//         if (type === "source") {
//           localStorage.removeItem("selectedFile");
//         } else {
//           localStorage.removeItem("selectedDestFolder");
//         }
//       }
//     } else if (isFolder) {
//       const newPath = (config.currentPath || "") + item;
//       setConfig((prev) => ({ ...prev, currentPath: newPath }));
//       fetchObjects(config.bucket!, newPath);
//       setSelectedPath("");
//       setIsConnected(false);
//       // Change: Clear selectedFile when navigating to a folder
//       if (type === "source") {
//         localStorage.removeItem("selectedFile");
//       } else {
//         localStorage.removeItem("selectedDestFolder");
//       }
//     } else {
//       const fileKey = (config.currentPath || "") + item;
//       const fullPath = `${prefix}://${config.bucket}/${fileKey}`;
//       setSelectedPath(fullPath);
//       setIsConnected(true);
//       // Change: Store bucket and file in localStorage for source
//       if (type === "source") {
//         localStorage.setItem("selectedBucket", config.bucket!);
//         localStorage.setItem("selectedFile", fileKey);
        
//       } else {
//         localStorage.setItem("selectedDestFolder", fileKey);
//       }
//       setShowBrowser(false);
//       toast({ title: `${type === "source" ? "File" : "Folder"} Selected`, description: `Selected: ${fullPath}` });
//     }
//     setSelectedItem(null);
//   };

//   const handleSelectBucket = (bucket: string, type: "source" | "destination") => {
//     const setConfig = type === "source" ? setSourceConfig : setDestinationConfig;
//     const setSelectedPath = type === "source" ? setSelectedSourcePath : setSelectedDestPath;
//     const setIsConnected = type === "source" ? setIsSourceConnected : setIsDestConnected;
//     const setSelectedItem = type === "source" ? setSourceSelectedItem : setDestSelectedItem;

//     setConfig((prev) => ({ ...prev, bucket, currentPath: "" }));
//     fetchObjects(bucket, "");
//     setSelectedPath("");
//     setIsConnected(false);
//     // Change: Store selected bucket in localStorage
//     if (type === "source") {
//       localStorage.setItem("selectedBucket", bucket);
//       localStorage.removeItem("selectedFile");
//     } else {
//       localStorage.setItem("selectedDestFolder", "");
//     }
//     setSelectedItem(null);
//   };

//   const handleSelectDestinationFolder = () => {
//     if (!selectedSourcePath) {
//       toast({ title: "Error", description: "Please select a source file first", variant: "destructive" });
//       return;
//     }
//     const sourceFilename = selectedSourcePath.split("/").pop() || "output.csv";
//     const destPath = `${selectedDestination}://${destinationConfig.bucket}/${destinationConfig.currentPath || ""}${destSelectedItem || sourceFilename}`;
//     setSelectedDestPath(destPath);
//     setIsDestConnected(true);
//     localStorage.setItem("selectedDestFolder", destSelectedItem || destinationConfig.currentPath || "");
//     setShowDestBrowser(false);
//     toast({ title: "Destination Selected", description: `Selected: ${destSelectedItem || destinationConfig.currentPath || ""}${sourceFilename}` });
//     scrollToSummary();
//   };

//   const handleSelectDestBucketOrContainer = () => {
//     if (!selectedSourcePath) {
//       toast({ title: "Error", description: "Please select a source file first", variant: "destructive" });
//       return;
//     }
//     const sourceFilename = selectedSourcePath.split("/").pop() || "output.csv";
//     const destPath = `${selectedDestination}://${destSelectedItem}/${sourceFilename}`;
//     setSelectedDestPath(destPath);
//     setIsDestConnected(true);
//     localStorage.setItem("selectedDestFolder", "");
//     setShowDestBrowser(false);
//     toast({ title: "Destination Selected", description: `Selected: ${destSelectedItem}` });
//     scrollToSummary();
//   };

//   const handleConnect = async (type: "source" | "destination") => {
//     if (type === "source") {
//       if (selectedSource === "local") {
//         setShowSourceBrowser(true);
//         toast({ title: "Connection Initiated", description: "Please select files to upload" });
//       } else if (selectedSource === "s3" || selectedSource === "azure-blob") {
//         setIsSourceConnecting(true);
//         try {
//           await fetchBuckets(type);
//           setShowSourceBrowser(true);
//           // if (buckets.length == 0) {
//           //   toast({
//           //     title: "Connection Initiated",
//           //     description: `Please select a ${selectedSource === "azure-blob" ? "container" : "bucket"}`,
//           //   });
//           // } else {
//           //   toast({
//           //     title: `No ${selectedSource === "azure-blob" ? "Containers" : "Buckets"}`,
//           //     description: `No ${selectedSource === "azure-blob" ? "containers" : "buckets"} found. Check API or credentials.`,
//           //     variant: "destructive",
//           //   });
//           // }
//         } catch (error) {
//           toast({ title: "Error", description: "Failed to connect. Check console for details.", variant: "destructive" });
//         } finally {
//           setIsSourceConnecting(false);
//         }
//       } else if (selectedSource === "database") {
//         if (!sourceConfig.databaseName || !sourceConfig.username) {
//           toast({ title: "Error", description: "Database Name and Username are required", variant: "destructive" });
//           return;
//         }
//         setIsSourceConnecting(true);
//         await new Promise((resolve) => setTimeout(resolve, 1000));
//         setShowSourceDBBrowser(true);
//         setIsSourceConnecting(false);
//         toast({ title: "Connection Successful", description: "Connected to database successfully" });
//       }
//     } else {
//       if (selectedDestination === "s3" || selectedDestination === "azure-blob") {
//         if (!selectedSourcePath) {
//           toast({ title: "Error", description: "Please select a source file first", variant: "destructive" });
//           return;
//         }
//         setIsDestConnecting(true);
//         try {
//           await fetchBuckets(type);
//           setShowDestBrowser(true);
//           if (buckets.length > 0) {
//             toast({
//               title: "Connection Initiated",
//               description: `Please select a ${selectedDestination === "azure-blob" ? "container" : "bucket"}`,
//             });
//           } else {
//             toast({
//               title: `No ${selectedDestination === "azure-blob" ? "Containers" : "Buckets"}`,
//               description: `No ${selectedDestination === "azure-blob" ? "containers" : "buckets"} found. Check API or credentials.`,
//               variant: "destructive",
//             });
//           }
//         } catch (error) {
//           toast({ title: "Error", description: "Failed to connect. Check console for details.", variant: "destructive" });
//         } finally {
//           setIsDestConnecting(false);
//         }
//       } else if (selectedDestination === "database") {
//         if (!destinationConfig.databaseName || !destinationConfig.username) {
//           toast({ title: "Error", description: "Database Name and Username are required", variant: "destructive" });
//           return;
//         }
//         setIsDestConnecting(true);
//         await new Promise((resolve) => setTimeout(resolve, 1000));
//         setIsDestConnected(true);
//         setSelectedDestPath(destinationConfig.databaseName!);
//         setIsDestConnecting(false);
//         toast({ title: "Connection Successful", description: "Connected to database successfully" });
//         scrollToSummary();
//       }
//     }
//   };

//   const handleRemoveSourcePath = () => {
//     setSelectedSourcePath("");
//     setIsSourceConnected(false);
//     setSourceConfig({});
//     setUploadedFiles([]);
//     // Change: Clear localStorage when removing source path
//     localStorage.removeItem("selectedFile");
//     localStorage.removeItem("selectedBucket");
//   };

//   const handleRemoveDestPath = () => {
//     setSelectedDestPath("");
//     setIsDestConnected(false);
//     setDestinationConfig({ type: selectedDestination });
//     localStorage.removeItem("selectedDestFolder");
//   };

//   const renderSourceFields = () => {
//     if (selectedSource === "local") {
//       return (
//         <div className="space-y-4">
//           <Button
//             onClick={() => handleConnect("source")}
//             disabled={isSourceConnecting}
//             className="w-full flex items-center gap-2"
//           >
//             {isSourceConnecting ? (
//               <>
//                 <Loader2 className="w-4 h-4 animate-spin" />
//                 Connecting...
//               </>
//             ) : (
//               <>
//                 <HardDrive className="w-4 h-4" />
//                 Connect to Local
//               </>
//             )}
//           </Button>
//           {selectedSourcePath && (
//             <div className="flex items-center gap-2 p-2 bg-muted rounded-md">
//               <div className="flex-1 text-sm truncate">{selectedSourcePath}</div>
//               <Button variant="ghost" size="icon" onClick={handleRemoveSourcePath}>
//                 <X className="w-4 h-4" />
//               </Button>
//             </div>
//           )}
//         </div>
//       );
//     } else if (selectedSource === "s3" || selectedSource === "azure-blob") {
//       return (
//         <div className="space-y-4">
//           <Button
//             onClick={() => handleConnect("source")}
//             disabled={isSourceConnecting}
//             className="w-full flex items-center gap-2"
//           >
//             {isSourceConnecting ? (
//               <>
//                 <Loader2 className="w-4 h-4 animate-spin" />
//                 Connecting...
//               </>
//             ) : (
//               <>
//                 <Cloud className="w-4 h-4" />
//                 Connect to {selectedSource === "azure-blob" ? "Azure Blob" : "S3"}
//               </>
//             )}
//           </Button>
//           {selectedSourcePath && (
//             <div className="flex items-center gap-2 p-2 bg-muted rounded-md">
//               <div className="flex-1 text-sm truncate">{selectedSourcePath}</div>
//               <Button variant="ghost" size="icon" onClick={handleRemoveSourcePath}>
//                 <X className="w-4 h-4" />
//               </Button>
//             </div>
//           )}
//         </div>
//       );
//     } else if (selectedSource === "database") {
//       return (
//         <div className="space-y-4">
//           <div className="grid grid-cols-2 gap-4">
//             <div>
//               <Label htmlFor="db-name">Database Name</Label>
//               <Input
//                 id="db-name"
//                 value={sourceConfig.databaseName || ""}
//                 onChange={(e) => setSourceConfig((prev) => ({ ...prev, databaseName: e.target.value }))}
//                 placeholder="Enter database name"
//               />
//             </div>
//             <div>
//               <Label htmlFor="username">Username</Label>
//               <Input
//                 id="username"
//                 value={sourceConfig.username || ""}
//                 onChange={(e) => setSourceConfig((prev) => ({ ...prev, username: e.target.value }))}
//                 placeholder="Enter username"
//               />
//             </div>
//           </div>
//           <Button
//             onClick={() => handleConnect("source")}
//             disabled={isSourceConnecting || !sourceConfig.databaseName || !sourceConfig.username}
//             className="w-full flex items-center gap-2"
//           >
//             {isSourceConnecting ? (
//               <>
//                 <Loader2 className="w-4 h-4 animate-spin" />
//                 Connecting...
//               </>
//             ) : (
//               <>
//                 <Database className="w-4 h-4" />
//                 Connect to Database
//               </>
//             )}
//           </Button>
//           {selectedSourcePath && (
//             <div className="flex items-center gap-2 p-2 bg-muted rounded-md">
//               <div className="flex-1 text-sm truncate">{selectedSourcePath}</div>
//               <Button variant="ghost" size="icon" onClick={handleRemoveSourcePath}>
//                 <X className="w-4 h-4" />
//               </Button>
//             </div>
//           )}
//         </div>
//       );
//     }
//     return null;
//   };

//   const renderDestinationFields = () => {
//     if (selectedDestination === "s3" || selectedDestination === "azure-blob") {
//       return (
//         <div className="space-y-4">
//           <Button
//             onClick={() => handleConnect("destination")}
//             disabled={isDestConnecting}
//             className="w-full flex items-center gap-2"
//           >
//             {isDestConnecting ? (
//               <>
//                 <Loader2 className="w-4 h-4 animate-spin" />
//                 Connecting...
//               </>
//             ) : (
//               <>
//                 <Cloud className="w-4 h-4" />
//                 Connect to {selectedDestination === "azure-blob" ? "Azure Blob" : "S3"}
//               </>
//             )}
//           </Button>
//           {selectedDestPath && (
//             <div className="flex items-center gap-2 p-2 bg-muted rounded-md">
//               <div className="flex-1 text-sm truncate">{selectedDestPath}</div>
//               <Button variant="ghost" size="icon" onClick={handleRemoveDestPath}>
//                 <X className="w-4 h-4" />
//               </Button>
//             </div>
//           )}
//         </div>
//       );
//     } else if (selectedDestination === "database") {
//       return (
//         <div className="space-y-4">
//           <div className="grid grid-cols-2 gap-4">
//             <div>
//               <Label htmlFor="db-name-dest">Database Name</Label>
//               <Input
//                 id="db-name-dest"
//                 value={destinationConfig.databaseName || ""}
//                 onChange={(e) => setDestinationConfig((prev) => ({ ...prev, databaseName: e.target.value }))}
//                 placeholder="Enter database name"
//               />
//             </div>
//             <div>
//               <Label htmlFor="username-dest">Username</Label>
//               <Input
//                 id="username-dest"
//                 value={destinationConfig.username || ""}
//                 onChange={(e) => setDestinationConfig((prev) => ({ ...prev, username: e.target.value }))}
//                 placeholder="Enter username"
//               />
//             </div>
//           </div>
//           <Button
//             onClick={() => handleConnect("destination")}
//             disabled={isDestConnecting || !destinationConfig.databaseName || !destinationConfig.username}
//             className="w-full flex items-center gap-2"
//           >
//             {isDestConnecting ? (
//               <>
//                 <Loader2 className="w-4 h-4 animate-spin" />
//                 Connecting...
//               </>
//             ) : (
//               <>
//                 <Database className="w-4 h-4" />
//                 Connect to Database
//               </>
//             )}
//           </Button>
//           {selectedDestPath && (
//             <div className="flex items-center gap-2 p-2 bg-muted rounded-md">
//               <div className="flex-1 text-sm truncate">{selectedDestPath}</div>
//               <Button variant="ghost" size="icon" onClick={handleRemoveDestPath}>
//                 <X className="w-4 h-4" />
//               </Button>
//             </div>
//           )}
//         </div>
//       );
//     }
//     return null;
//   };

//   const handleProceed = () => {
//     if (!isSourceConnected || !selectedSourcePath) {
//       toast({ title: "Error", description: "Please connect and select a source path", variant: "destructive" });
//       return;
//     }
//     if (!isDestConnected || !selectedDestPath) {
//       toast({ title: "Error", description: "Please connect and select a destination path", variant: "destructive" });
//       return;
//     }
//     if (!localStorage.getItem("selectedBucket") || !localStorage.getItem("selectedFile")) {
//       toast({ title: "Error", description: "Bucket or file not properly set. Please reselect the source.", variant: "destructive" });
//       return;
//     }
//     navigate("/dashboard/schema");
//   };

//   const handleGoBack = () => {
//     navigate("/dashboard/jobs");
//   };

//   const Breadcrumbs = ({ type }: { type: "source" | "destination" }) => {
//     const config = type === "source" ? sourceConfig : destinationConfig;
//     const path = config.currentPath || "";
//     const bucketOrContainer = config.bucket;
//     const prefix = type === "source" ? selectedSource : selectedDestination;

//     return (
//       <div className="flex flex-wrap items-center gap-1 text-sm text-muted-foreground mb-2">
//         <span
//           onClick={() => {
//             if (type === "source") {
//               setSourceConfig((prev) => ({ ...prev, bucket: undefined, currentPath: "" }));
//               setSelectedSourcePath("");
//               setIsSourceConnected(false);
//               setObjects([]);
//               // Change: Clear localStorage when resetting to root
//               localStorage.removeItem("selectedBucket");
//               localStorage.removeItem("selectedFile");
//             } else {
//               setDestinationConfig((prev) => ({ ...prev, bucket: undefined, currentPath: "" }));
//               setSelectedDestPath("");
//               setIsDestConnected(false);
//               setObjects([]);
//               localStorage.removeItem("selectedDestFolder");
//             }
//           }}
//           className="cursor-pointer hover:underline flex items-center"
//         >
//           <Folder className="w-4 h-4 mr-1" /> Root
//         </span>
//         {bucketOrContainer && (
//           <>
//             <ChevronRight className="w-4 h-4" />
//             <span
//               onClick={() => {
//                 if (type === "source") {
//                   setSourceConfig((prev) => ({ ...prev, currentPath: "" }));
//                   fetchObjects(bucketOrContainer, "");
//                   setSelectedSourcePath("");
//                   setIsSourceConnected(false);
//                   localStorage.removeItem("selectedFile");
//                 } else {
//                   setDestinationConfig((prev) => ({ ...prev, currentPath: "" }));
//                   fetchObjects(bucketOrContainer, "");
//                   setSelectedDestPath("");
//                   setIsDestConnected(false);
//                   localStorage.removeItem("selectedDestFolder");
//                 }
//               }}
//               className="cursor-pointer hover:underline"
//             >
//               {bucketOrContainer}
//             </span>
//           </>
//         )}
//         {path
//           .split("/")
//           .filter((p) => p)
//           .map((part, idx) => (
//             <React.Fragment key={idx}>
//               <ChevronRight className="w-4 h-4" />
//               <span
//                 onClick={() => {
//                   const newPath = path.split("/").slice(0, idx + 1).join("/") + "/";
//                   if (type === "source") {
//                     setSourceConfig((prev) => ({ ...prev, currentPath: newPath }));
//                     fetchObjects(sourceConfig.bucket!, newPath);
//                     setSelectedSourcePath("");
//                     setIsSourceConnected(false);
//                     localStorage.removeItem("selectedFile");
//                   } else {
//                     setDestinationConfig((prev) => ({ ...prev, currentPath: newPath }));
//                     fetchObjects(destinationConfig.bucket!, newPath);
//                     setSelectedDestPath("");
//                     setIsDestConnected(false);
//                     localStorage.removeItem("selectedDestFolder");
//                   }
//                 }}
//                 className="cursor-pointer hover:underline"
//               >
//                 {part}
//               </span>
//             </React.Fragment>
//           ))}
//       </div>
//     );
//   };

//   const mockTables = ["customers", "orders", "products", "employees", "departments"];

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 p-6">
//       <div className="max-w-7xl mt-14 mx-auto">
//         <div className="flex items-center justify-between mb-8">
//           <Button variant="outline" onClick={handleGoBack} className="flex items-center gap-2">
//             <ArrowLeft className="w-4 h-4" />
//             Back to Jobs
//           </Button>
//           <div className="text-center">
//             <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent mb-4">
//               Data Upload Center
//             </h1>
//             <p className="text-muted-foreground max-w-2xl mx-auto">
//               Configure your data Source and destination for seamless data transfer
//             </p>
//           </div>
//           <div className="w-[120px]" />
//         </div>

//         <Dialog
//           open={showSourceBrowser && selectedSource === "local"}
//           onOpenChange={(open) => {
//             setShowSourceBrowser(open);
//             if (!open) {
//               setSelectedSourcePath("");
//               setIsSourceConnected(false);
//               setUploadedFiles([]);
//               // Change: Clear localStorage when closing local file browser
//               localStorage.removeItem("selectedFile");
//               localStorage.removeItem("selectedBucket");
//             }
//           }}
//         >
//           <DialogContent className="max-w-2xl">
//             <DialogHeader>
//               <DialogTitle>Upload Local Files</DialogTitle>
//               <DialogDescription>Select files to upload from your local device.</DialogDescription>
//             </DialogHeader>
//             <div className="space-y-4">
//               <div
//                 {...getRootProps()}
//                 className={`border-2 border-dashed rounded-lg p-8 text-center ${
//                   isDragActive ? "border-primary bg-primary/10" : "border-muted-foreground/50"
//                 }`}
//               >
//                 <input {...getInputProps()} />
//                 <UploadIcon className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
//                 <p className="text-sm text-muted-foreground">
//                   {isDragActive ? "Drop the files here ..." : "Drag & drop files here, or click to select files"}
//                 </p>
//               </div>
//               {uploadedFiles.length > 0 && (
//                 <div className="border rounded-lg max-h-96 overflow-y-auto">
//                   {uploadedFiles.map((file, index) => (
//                     <div key={index} className="flex items-center gap-3 p-3 border-b last:border-b-0">
//                       <File className="w-4 h-4 text-gray-500" />
//                       <div className="flex-1 text-sm truncate">{file.name}</div>
//                     </div>
//                   ))}
//                 </div>
//               )}
//               {uploadedFiles.length > 0 && (
//                 <Button
//                   onClick={() => {
//                     setShowSourceBrowser(false);
//                     toast({ title: "Files Selected", description: `Selected: ${selectedSourcePath}` });
//                   }}
//                   className="w-fit flex items-center gap-2"
//                 >
//                   Select {uploadedFiles.length} File{uploadedFiles.length !== 1 ? "s" : ""}
//                 </Button>
//               )}
//             </div>
//           </DialogContent>
//         </Dialog>

//         <Dialog
//           open={showSourceBrowser && (selectedSource === "s3" || selectedSource === "azure-blob")}
//           onOpenChange={(open) => {
//             setShowSourceBrowser(open);
//             if (!open) {
//               setSourceConfig((prev) => ({ ...prev, bucket: undefined, currentPath: "" }));
//               setSelectedSourcePath("");
//               setIsSourceConnected(false);
//               setObjects([]);
//               // Change: Clear localStorage when closing S3/Azure browser
//               localStorage.removeItem("selectedFile");
//               localStorage.removeItem("selectedBucket");
//               setSourceSelectedItem(null);
//             }
//           }}
//         >
//           <DialogContent className="max-w-2xl">
//             <DialogHeader>
//               <DialogTitle>Browse {selectedSource === "azure-blob" ? "Azure Containers" : "S3 Buckets"}</DialogTitle>
//               <DialogDescription>
//                 Select a {selectedSource === "azure-blob" ? "container" : "bucket"} and file for the data source.
//               </DialogDescription>
//             </DialogHeader>
//             <div className="space-y-4">
//               <Breadcrumbs type="source" />
//               <div className="border rounded-lg max-h-96 overflow-y-auto">
//                 {!sourceConfig.bucket ? (
//                   buckets.length > 0 ? (
//                     buckets.map((bucket) => (
//                       <div
//                         key={bucket.name}
//                         className={`flex items-center gap-3 p-3 hover:bg-primary/10 cursor-pointer border-b last:border-b-0 ${
//                           sourceSelectedItem === bucket.name ? "bg-primary/20 border-primary/50" : ""
//                         }`}
//                         onDoubleClick={() => handleSelectBucket(bucket.name, "source")}
//                         onClick={() => setSourceSelectedItem(bucket.name)}
//                       >
//                         <Folder className="w-4 h-4 text-blue-500" />
//                         <div className="flex-1 font-medium">{bucket.name}</div>
//                       </div>
//                     ))
//                   ) : (
//                     <div className="p-3 text-center text-muted-foreground">
//                       No {selectedSource === "azure-blob" ? "containers" : "buckets"} available.
//                     </div>
//                   )
//                 ) : (
//                   <>
//                     <div
//                       className="flex items-center gap-3 p-3 hover:bg-primary/10 cursor-pointer border-b last:border-b-0"
//                       onDoubleClick={() => handleS3Navigation("..", true, "source")}
//                     >
//                       <Folder className="w-4 h-4 text-blue-500" />
//                       <div className="flex-1 font-medium">..</div>
//                     </div>
//                     {objects.length > 0 ? (
//                       objects.map((obj) => {
//                         const isFolder = obj.isFolder || obj.key.endsWith("/");
//                         return (
//                           <div
//                             key={obj.key}
//                             className={`flex items-center gap-3 p-3 hover:bg-primary/10 cursor-pointer border-b last:border-b-0 ${
//                               sourceSelectedItem === obj.key ? "bg-primary/20 border-primary/50" : ""
//                             }`}
//                             onDoubleClick={() => handleS3Navigation(obj.key, isFolder, "source")}
//                             onClick={() => setSourceSelectedItem(obj.key)}
//                           >
//                             {isFolder ? (
//                               <Folder className="w-4 h-4 text-blue-500" />
//                             ) : (
//                               <File className="w-4 h-4 text-gray-500" />
//                             )}
//                             <div className="flex-1 font-medium">{obj.key.split("/").pop() || obj.key}</div>
//                           </div>
//                         );
//                       })
//                     ) : (
//                       <div className="p-3 text-center text-muted-foreground">
//                         No {selectedSource === "azure-blob" ? "blobs" : "objects"} available.
//                       </div>
//                     )}
//                   </>
//                 )}
//               </div>
//               {sourceConfig.bucket && sourceSelectedItem && !sourceSelectedItem.endsWith("/") && (
//                 <Button
//                   onClick={() => handleS3Navigation(sourceSelectedItem, false, "source")}
//                   className="w-fit flex items-center gap-2"
//                 >
//                   Select {sourceSelectedItem}
//                 </Button>
//               )}
//             </div>
//           </DialogContent>
//         </Dialog>

//         <Dialog
//           open={showDestBrowser}
//           onOpenChange={(open) => {
//             setShowDestBrowser(open);
//             if (!open) {
//               setDestinationConfig((prev) => ({ ...prev, bucket: undefined, currentPath: "" }));
//               setSelectedDestPath("");
//               setIsDestConnected(false);
//               setObjects([]);
//               localStorage.removeItem("selectedDestFolder");
//               setDestSelectedItem(null);
//             }
//           }}
//         >
//           <DialogContent className="max-w-2xl">
//             <DialogHeader>
//               <DialogTitle>Browse {selectedDestination === "azure-blob" ? "Azure Containers" : "S3 Buckets"}</DialogTitle>
//               <DialogDescription>
//                 Select a {selectedDestination === "azure-blob" ? "container" : "bucket"} and folder for the destination.
//               </DialogDescription>
//             </DialogHeader>
//             <div className="space-y-4">
//               <Breadcrumbs type="destination" />
//               <div className="border rounded-lg max-h-96 overflow-y-auto">
//                 {!destinationConfig.bucket ? (
//                   buckets.length > 0 ? (
//                     buckets.map((bucket) => (
//                       <div
//                         key={bucket.name}
//                         className={`flex items-center gap-3 p-3 hover:bg-primary/10 cursor-pointer border-b last:border-b-0 ${
//                           destSelectedItem === bucket.name ? "bg-primary/20 border-primary/50" : ""
//                         }`}
//                         onDoubleClick={() => handleSelectBucket(bucket.name, "destination")}
//                         onClick={() => setDestSelectedItem(bucket.name)}
//                       >
//                         <Folder className="w-4 h-4 text-blue-500" />
//                         <div className="flex-1 font-medium">{bucket.name}</div>
//                       </div>
//                     ))
//                   ) : (
//                     <div className="p-3 text-center text-muted-foreground">
//                       No {selectedDestination === "azure-blob" ? "containers" : "buckets"} available.
//                     </div>
//                   )
//                 ) : (
//                   <>
//                     <div
//                       className="flex items-center gap-3 p-3 hover:bg-primary/10 cursor-pointer border-b last:border-b-0"
//                       onDoubleClick={() => handleS3Navigation("..", true, "destination")}
//                     >
//                       <Folder className="w-4 h-4 text-blue-500" />
//                       <div className="flex-1 font-medium">..</div>
//                     </div>
//                     {objects.length > 0 ? (
//                       objects.map((obj) => {
//                         const isFolder = obj.isFolder || obj.key.endsWith("/");
//                         return (
//                           <div
//                             key={obj.key}
//                             className={`flex items-center gap-3 p-3 hover:bg-primary/10 cursor-pointer border-b last:border-b-0 ${
//                               destSelectedItem === obj.key ? "bg-primary/20 border-primary/50" : ""
//                             }`}
//                             onDoubleClick={() => handleS3Navigation(obj.key, isFolder, "destination")}
//                             onClick={() => setDestSelectedItem(obj.key)}
//                           >
//                             {isFolder ? (
//                               <Folder className="w-4 h-4 text-blue-500" />
//                             ) : (
//                               <File className="w-4 h-4 text-gray-500" />
//                             )}
//                             <div className="flex-1 font-medium">{obj.key}</div>
//                           </div>
//                         );
//                       })
//                     ) : (
//                       <div className="p-3 text-center text-muted-foreground">
//                         No {selectedDestination === "azure-blob" ? "blobs" : "objects"} available.
//                       </div>
//                     )}
//                   </>
//                 )}
//               </div>
//               {destinationConfig.bucket && destSelectedItem && destSelectedItem !== ".." && (
//                 <div className="text-sm text-muted-foreground">
//                   Selected Path: {`${selectedDestination}://${destinationConfig.bucket}/${destinationConfig.currentPath || ""}${destSelectedItem}`}
//                 </div>
//               )}
//               {!destinationConfig.bucket && destSelectedItem && (
//                 <Button
//                   onClick={handleSelectDestBucketOrContainer}
//                   className="w-fit flex items-center gap-2"
//                 >
//                   Select This {selectedDestination === "azure-blob" ? "Container" : "Bucket"}
//                 </Button>
//               )}
//               {destinationConfig.bucket && destSelectedItem && destSelectedItem !== ".." && (
//                 <Button
//                   onClick={handleSelectDestinationFolder}
//                   disabled={!selectedSourcePath}
//                   className="w-fit flex items-center gap-2"
//                 >
//                   Select This Folder
//                 </Button>
//               )}
//             </div>
//           </DialogContent>
//         </Dialog>

//         <Dialog
//           open={showSourceDBBrowser}
//           onOpenChange={(open) => {
//             setShowSourceDBBrowser(open);
//             if (!open) {
//               setSourceDBSelectedTables([]);
//               setSelectAllTables(false);
//               // Change: Clear localStorage when closing database browser
//               localStorage.removeItem("selectedFile");
//               localStorage.removeItem("selectedBucket");
//             }
//           }}
//         >
//           <DialogContent className="max-w-2xl">
//             <DialogHeader>
//               <DialogTitle>Browse Database Tables</DialogTitle>
//               <DialogDescription>Select tables from the database for the data source.</DialogDescription>
//             </DialogHeader>
//             <div className="space-y-4">
//               <div className="text-sm text-muted-foreground">Database: {sourceConfig.databaseName}</div>
//               <div className="flex items-center gap-2">
//                 <Checkbox
//                   id="select-all-tables"
//                   checked={selectAllTables}
//                   onCheckedChange={(checked) => setSelectAllTables(checked as boolean)}
//                 />
//                 <Label htmlFor="select-all-tables">Select All Tables</Label>
//               </div>
//               <div className="border rounded-lg max-h-96 overflow-y-auto">
//                 {mockTables.map((table) => (
//                   <div key={table} className="flex items-center gap-3 p-3 border-b last:border-b-0">
//                     <Checkbox
//                       id={`table-${table}`}
//                       checked={sourceDBSelectedTables.includes(table)}
//                       onCheckedChange={(checked) => {
//                         if (checked) setSourceDBSelectedTables((prev) => [...prev, table]);
//                         else setSourceDBSelectedTables((prev) => prev.filter((t) => t !== table));
//                       }}
//                     />
//                     <Database className="w-4 h-4 text-gray-500" />
//                     <div className="flex-1">
//                       <div className="font-medium">{table}</div>
//                     </div>
//                   </div>
//                 ))}
//               </div>
//               <Button
//                 onClick={() => {
//                   if (sourceDBSelectedTables.length > 0) {
//                     const fullPath = sourceDBSelectedTables.map((table) => `${sourceConfig.databaseName}.${table}`).join(", ");
//                     setSelectedSourcePath(fullPath);
//                     setIsSourceConnected(true);
//                     setShowSourceDBBrowser(false);
//                     // Change: Store bucket (database name) and file (tables) in localStorage
//                     localStorage.setItem("selectedBucket", sourceConfig.databaseName!);
//                     localStorage.setItem("selectedFile", sourceDBSelectedTables.join(","));
//                     toast({ title: "Tables Selected", description: `Selected: ${fullPath}` });
//                     setSourceDBSelectedTables([]);
//                     setSelectAllTables(false);
//                   } else {
//                     toast({ title: "Error", description: "Please select at least one table", variant: "destructive" });
//                   }
//                 }}
//                 disabled={sourceDBSelectedTables.length === 0}
//                 className="w-fit flex items-center gap-2"
//               >
//                 Select {sourceDBSelectedTables.length} Table{sourceDBSelectedTables.length !== 1 ? "s" : ""}
//               </Button>
//             </div>
//           </DialogContent>
//         </Dialog>

//         <Dialog open={showDestDBBrowser} onOpenChange={setShowDestDBBrowser}>
//           <DialogContent className="max-w-2xl">
//             <DialogHeader>
//               <DialogTitle>Browse Database Tables</DialogTitle>
//               <DialogDescription>Select a table from the database for the destination.</DialogDescription>
//             </DialogHeader>
//             <div className="space-y-4">
//               <div className="text-sm text-muted-foreground">Database: {destinationConfig.databaseName}</div>
//               <div className="border rounded-lg max-h-96 overflow-y-auto">
//                 {mockTables.map((table) => (
//                   <div
//                     key={table}
//                     className="flex items-center gap-3 p-3 hover:bg-primary/10 cursor-pointer border-b last:border-b-0"
//                     onClick={() => {
//                       setSelectedDestPath(`${destinationConfig.databaseName}.${table}`);
//                       setIsDestConnected(true);
//                       setShowDestDBBrowser(false);
//                       localStorage.setItem("selectedDestFolder", table);
//                       toast({ title: "Table Selected", description: `Selected: ${table}` });
//                       scrollToSummary();
//                     }}
//                   >
//                     <Database className="w-4 h-4 text-gray-500" />
//                     <div className="flex-1">
//                       <div className="font-medium">{table}</div>
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             </div>
//           </DialogContent>
//         </Dialog>

//         <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
//           <Card className="h-fit">
//             <CardHeader>
//               <CardTitle>Data Source</CardTitle>
//               <CardDescription>Select and configure your data source</CardDescription>
//             </CardHeader>
//             <CardContent className="space-y-6">
//               <div>
//                 <Label htmlFor="source-select">Data Source</Label>
//                 <Select
//                   value={selectedSource}
//                   onValueChange={(value) => {
//                     setSelectedSource(value);
//                     setSelectedSourcePath("");
//                     setIsSourceConnected(false);
//                     setSourceConfig({});
//                     // Change: Clear localStorage when changing source
//                     localStorage.removeItem("selectedBucket");
//                     localStorage.removeItem("selectedFile");
//                   }}
//                 >
//                   <SelectTrigger>
//                     <SelectValue placeholder="Select data source" />
//                   </SelectTrigger>
//                   <SelectContent>
//                     {dataSources.map((source) => {
//                       const Icon = source.icon;
//                       return (
//                         <SelectItem key={source.value} value={source.value}>
//                           <div className="flex items-center gap-2">
//                             <Icon className="w-4 h-4" />
//                             {source.label}
//                           </div>
//                         </SelectItem>
//                       );
//                     })}
//                   </SelectContent>
//                 </Select>
//               </div>
//               {selectedSource && <div className="space-y-4 animate-fade-in">{renderSourceFields()}</div>}
//             </CardContent>
//           </Card>

//           <Card className="h-fit">
//             <CardHeader>
//               <CardTitle>Destination</CardTitle>
//               <CardDescription>Select and configure your destination</CardDescription>
//             </CardHeader>
//             <CardContent className="space-y-6">
//               <div>
//                 <Label htmlFor="destination-select">Destination</Label>
//                 <Select
//                   value={selectedDestination}
//                   onValueChange={(value) => {
//                     setSelectedDestination(value);
//                     setSelectedDestPath("");
//                     setIsDestConnected(false);
//                     setDestinationConfig({ type: value });
//                     localStorage.removeItem("selectedDestFolder");
//                   }}
//                 >
//                   <SelectTrigger>
//                     <SelectValue placeholder="Select destination" />
//                   </SelectTrigger>
//                   <SelectContent>
//                     {destinations.map((dest) => {
//                       const Icon = dest.icon;
//                       return (
//                         <SelectItem key={dest.value} value={dest.value}>
//                           <div className="flex items-center gap-2">
//                             <Icon className="w-4 h-4" />
//                             {dest.label}
//                           </div>
//                         </SelectItem>
//                       );
//                     })}
//                   </SelectContent>
//                 </Select>
//               </div>
//               {selectedDestination && <div className="space-y-4 animate-fade-in">{renderDestinationFields()}</div>}
//             </CardContent>
//           </Card>
//         </div>
//         {selectedSource && selectedDestination && isSourceConnected && isDestConnected && (
//           <Card ref={summaryRef} className="mt-8 animate-fade-in">
//             <CardHeader>
//               <CardTitle className="flex items-center gap-2">
//                 <CheckCircle className="w-5 h-5 text-green-500" />
//                 Configuration Summary
//               </CardTitle>
//               <CardDescription>Review your selected source and destination</CardDescription>
//             </CardHeader>
//             <CardContent>
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                 <div className="space-y-2">
//                   <h4 className="font-semibold text-primary">Source</h4>
//                   <div className="p-4 bg-muted/50 rounded-lg">
//                     <div className="flex items-center gap-2 mb-2">
//                       {React.createElement(dataSources.find((s) => s.value === selectedSource)?.icon || HardDrive, {
//                         className: "w-4 h-4",
//                       })}
//                       <span className="font-medium">{dataSources.find((s) => s.value === selectedSource)?.label}</span>
//                     </div>
//                     <p className="text-sm text-green-600">✓ Connected Successfully</p>
//                     <p className="text-sm text-muted-foreground">Path: {selectedSourcePath}</p>
//                   </div>
//                 </div>
//                 <div className="space-y-2">
//                   <h4 className="font-semibold text-primary">Destination</h4>
//                   <div className="p-4 bg-muted/50 rounded-lg">
//                     <div className="flex items-center gap-2 mb-2">
//                       {React.createElement(destinations.find((d) => d.value === selectedDestination)?.icon || Database, {
//                         className: "w-4 h-4",
//                       })}
//                       <span className="font-medium">{destinations.find((d) => d.value === selectedDestination)?.label}</span>
//                     </div>
//                     <p className="text-sm text-green-600">✓ Connected Successfully</p>
//                     <p className="text-sm text-muted-foreground">Path: {selectedDestPath}</p>
//                   </div>
//                 </div>
//               </div>
//               <div className="mt-6 flex justify-between gap-4">
//                 <Button onClick={handleGoBack} variant="outline" size="lg" className="px-8">
//                   <ArrowLeft className="w-4 h-4 mr-2" /> Back
//                 </Button>
//                 <Button onClick={handleProceed} size="lg" className="px-8">
//                   <ArrowRight className="w-4 h-4 mr-2" /> Proceed
//                 </Button>
//               </div>
//             </CardContent>
//           </Card>
//         )}
//       </div>
//     </div>
//   );
// }


import React, { useState, useCallback, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDropzone } from "react-dropzone";
import {
  Database,
  Cloud,
  HardDrive,
  ArrowRight,
  CheckCircle,
  Upload as UploadIcon,
  Server,
  CloudRain,
  ArrowLeft,
  Loader2,
  Folder,
  File,
  X,
  ChevronRight,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { getBuckets, getObjects, getFile, getAzureContainers, getAzureBlobs, getAzureBlobFile } from "@/lib/api";

interface SourceConfig {
  connectionString?: string;
  databaseName?: string;
  username?: string;
  password?: string;
  port?: string;
  bucket?: string;
  currentPath?: string;
}

interface DestinationConfig {
  type: string;
  connectionString?: string;
  databaseName?: string;
  username?: string;
  password?: string;
  port?: string;
  bucket?: string;
  currentPath?: string;
}

interface Bucket {
  name: string;
}

interface Object {
  key: string;
  isFolder?: boolean;
}

export default function Upload() {
  const [selectedSource, setSelectedSource] = useState<string>("");
  const [selectedDestination, setSelectedDestination] = useState<string>("");
  const [sourceConfig, setSourceConfig] = useState<SourceConfig>({});
  const [destinationConfig, setDestinationConfig] = useState<DestinationConfig>({ type: "" });
  const [isSourceConnected, setIsSourceConnected] = useState<boolean>(false);
  const [isSourceConnecting, setIsSourceConnecting] = useState<boolean>(false);
  const [isDestConnected, setIsDestConnected] = useState<boolean>(false);
  const [isDestConnecting, setIsDestConnecting] = useState<boolean>(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [selectedSourcePath, setSelectedSourcePath] = useState<string>("");
  const [selectedDestPath, setSelectedDestPath] = useState<string>("");
  const [showSourceBrowser, setShowSourceBrowser] = useState<boolean>(false);
  const [showDestBrowser, setShowDestBrowser] = useState<boolean>(false);
  const [showSourceDBBrowser, setShowSourceDBBrowser] = useState<boolean>(false);
  const [showDestDBBrowser, setShowDestDBBrowser] = useState<boolean>(false);
  const [sourceSelectedItem, setSourceSelectedItem] = useState<string | null>(null);
  const [destSelectedItem, setDestSelectedItem] = useState<string | null>(null);
  const [sourceDBSelectedTables, setSourceDBSelectedTables] = useState<string[]>([]);
  const [selectAllTables, setSelectAllTables] = useState<boolean>(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const summaryRef = useRef<HTMLDivElement>(null);
  const [buckets, setBuckets] = useState<Bucket[]>([]);
  const [objects, setObjects] = useState<Object[]>([]);

  const dataSources = [
    { value: "local", label: "Local", icon: HardDrive },
    { value: "s3", label: "S3", icon: Cloud },
    { value: "azure-blob", label: "Azure Blob", icon: CloudRain },
    { value: "database", label: "Database", icon: Server },
  ];

  const destinations = [
    { value: "s3", label: "S3", icon: Cloud },
    { value: "azure-blob", label: "Azure Blob", icon: Database },
    { value: "database", label: "Database", icon: Server },
  ];

  useEffect(() => {
    if (selectedSourcePath) setIsSourceConnected(true);
  }, [selectedSourcePath]);

  useEffect(() => {
    if (selectedDestPath) setIsDestConnected(true);
  }, [selectedDestPath]);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      setUploadedFiles(acceptedFiles);
      const fileNames = acceptedFiles.map((file) => file.name).join(", ");
      setSelectedSourcePath(fileNames);
      setIsSourceConnected(true);
      localStorage.setItem("selectedBucket", "local");
      localStorage.setItem("selectedFile", acceptedFiles[0].name);
      toast({ title: "Files Uploaded", description: `${acceptedFiles.length} file(s) uploaded successfully` });
    },
    [toast]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  const scrollToSummary = () => {
    setTimeout(() => {
      if (summaryRef.current) {
        summaryRef.current.scrollIntoView({ behavior: "smooth" });
      } else {
        window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
      }
    }, 100);
  };

  const fetchBuckets = async (type: "source" | "destination") => {
    try {
      const data = selectedSource === "azure-blob" || selectedDestination === "azure-blob" ? await getAzureContainers() : await getBuckets();
      if (Array.isArray(data)) {
        const formattedBuckets = data.map((name: string) => ({ name }));
        setBuckets(formattedBuckets);
      } else {
        setBuckets([]);
        toast({
          title: "Warning",
          description: `Unexpected ${selectedSource === "azure-blob" ? "container" : "bucket"} data format.`,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to fetch ${selectedSource === "azure-blob" ? "containers" : "buckets"}.`,
        variant: "destructive",
      });
      setBuckets([]);
    }
  };

  const fetchObjects = async (bucketName: string, prefix?: string) => {
    try {
      const data =
        selectedSource === "azure-blob" || selectedDestination === "azure-blob"
          ? await getAzureBlobs(bucketName, prefix)
          : await getObjects(bucketName, prefix);
      setObjects(data || []);
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to fetch ${selectedSource === "azure-blob" || selectedDestination === "azure-blob" ? "blobs" : "objects"}: ${error instanceof Error ? error.message : "Unknown error"}`,
        variant: "destructive",
      });
      setObjects([]);
    }
  };

  const handleS3Navigation = (item: string, isFolder: boolean, type: "source" | "destination") => {
    const config = type === "source" ? sourceConfig : destinationConfig;
    const setConfig = type === "source" ? setSourceConfig : setDestinationConfig;
    const setSelectedPath = type === "source" ? setSelectedSourcePath : setSelectedDestPath;
    const setIsConnected = type === "source" ? setIsSourceConnected : setIsDestConnected;
    const setShowBrowser = type === "source" ? setShowSourceBrowser : setShowDestBrowser;
    const setSelectedItem = type === "source" ? setSourceSelectedItem : setDestSelectedItem;
    const prefix = type === "source" ? selectedSource : selectedDestination;

    if (item === "..") {
      const parts = (config.currentPath || "").split("/").filter((p) => p);
      if (parts.length === 0) {
        setConfig((prev) => ({ ...prev, bucket: undefined, currentPath: "" }));
        setObjects([]);
        setSelectedPath("");
        setIsConnected(false);
        if (type === "source") {
          localStorage.removeItem("selectedBucket");
          localStorage.removeItem("selectedFile");
        } else {
          localStorage.removeItem("selectedDestFolder");
          localStorage.removeItem("selectedDestBucket");
        }
      } else {
        parts.pop();
        const newPath = parts.join("/") + (parts.length > 0 ? "/" : "");
        setConfig((prev) => ({ ...prev, currentPath: newPath }));
        fetchObjects(config.bucket!, newPath);
        setSelectedPath("");
        setIsConnected(false);
        if (type === "source") {
          localStorage.removeItem("selectedFile");
        } else {
          localStorage.removeItem("selectedDestFolder");
        }
      }
    } else if (isFolder) {
      const newPath = (config.currentPath || "") + item;
      setConfig((prev) => ({ ...prev, currentPath: newPath }));
      fetchObjects(config.bucket!, newPath);
      setSelectedPath("");
      setIsConnected(false);
      if (type === "source") {
        localStorage.removeItem("selectedFile");
      } else {
        localStorage.removeItem("selectedDestFolder");
      }
    } else {
      const fileKey = (config.currentPath || "") + item;
      const fullPath = `${prefix}://${config.bucket}/${fileKey}`;
      setSelectedPath(fullPath);
      setIsConnected(true);
      if (type === "source") {
        localStorage.setItem("selectedBucket", config.bucket!);
        localStorage.setItem("selectedFile", fileKey);
      } else {
        localStorage.setItem("selectedDestFolder", fileKey);
      }
      setShowBrowser(false);
      toast({ title: `${type === "source" ? "File" : "Folder"} Selected`, description: `Selected: ${fullPath}` });
    }
    setSelectedItem(null);
  };

  const handleSelectBucket = (bucket: string, type: "source" | "destination") => {
    const setConfig = type === "source" ? setSourceConfig : setDestinationConfig;
    const setSelectedPath = type === "source" ? setSelectedSourcePath : setSelectedDestPath;
    const setIsConnected = type === "source" ? setIsSourceConnected : setIsDestConnected;
    const setSelectedItem = type === "source" ? setSourceSelectedItem : setDestSelectedItem;

    setConfig((prev) => ({ ...prev, bucket, currentPath: "" }));
    fetchObjects(bucket, "");
    setSelectedPath("");
    setIsConnected(false);
    if (type === "source") {
      localStorage.setItem("selectedBucket", bucket);
      localStorage.removeItem("selectedFile");
    } else {
      localStorage.setItem("selectedDestBucket", bucket);
      localStorage.setItem("selectedDestFolder", "");
    }
    setSelectedItem(null);
  };

  const handleSelectDestinationFolder = () => {
    if (!selectedSourcePath) {
      toast({ title: "Error", description: "Please select a source file first", variant: "destructive" });
      return;
    }
    const sourceFilename = selectedSourcePath.split("/").pop() || "output.csv";
    const destPath = `${selectedDestination}://${destinationConfig.bucket}/${destinationConfig.currentPath || ""}${destSelectedItem || sourceFilename}`;
    setSelectedDestPath(destPath);
    setIsDestConnected(true);
    localStorage.setItem("selectedDestFolder", destSelectedItem || destinationConfig.currentPath || "");
    setShowDestBrowser(false);
    toast({ title: "Destination Selected", description: `Selected: ${destSelectedItem || destinationConfig.currentPath || ""}${sourceFilename}` });
    scrollToSummary();
  };

  const handleSelectDestBucketOrContainer = () => {
    if (!selectedSourcePath) {
      toast({ title: "Error", description: "Please select a source file first", variant: "destructive" });
      return;
    }
    const sourceFilename = selectedSourcePath.split("/").pop() || "output.csv";
    const destPath = `${selectedDestination}://${destSelectedItem}/${sourceFilename}`;
    setSelectedDestPath(destPath);
    setIsDestConnected(true);
    localStorage.setItem("selectedDestBucket", destSelectedItem!);
    localStorage.setItem("selectedDestFolder", "");
    setShowDestBrowser(false);
    toast({ title: "Destination Selected", description: `Selected: ${destSelectedItem}` });
    scrollToSummary();
  };

  const handleConnect = async (type: "source" | "destination") => {
    if (type === "source") {
      if (selectedSource === "local") {
        setShowSourceBrowser(true);
        toast({ title: "Connection Initiated", description: "Please select files to upload" });
      } else if (selectedSource === "s3" || selectedSource === "azure-blob") {
        setIsSourceConnecting(true);
        try {
          await fetchBuckets(type);
          setShowSourceBrowser(true);
        } catch (error) {
          toast({ title: "Error", description: "Failed to connect. Check console for details.", variant: "destructive" });
        } finally {
          setIsSourceConnecting(false);
        }
      } else if (selectedSource === "database") {
        if (!sourceConfig.databaseName || !sourceConfig.username) {
          toast({ title: "Error", description: "Database Name and Username are required", variant: "destructive" });
          return;
        }
        setIsSourceConnecting(true);
        await new Promise((resolve) => setTimeout(resolve, 1000));
        setShowSourceDBBrowser(true);
        setIsSourceConnecting(false);
        toast({ title: "Connection Successful", description: "Connected to database successfully" });
      }
    } else {
      if (selectedDestination === "s3" || selectedDestination === "azure-blob") {
        if (!selectedSourcePath) {
          toast({ title: "Error", description: "Please select a source file first", variant: "destructive" });
          return;
        }
        setIsDestConnecting(true);
        try {
          await fetchBuckets(type);
          setShowDestBrowser(true);
          if (buckets.length > 0) {
            toast({
              title: "Connection Initiated",
              description: `Please select a ${selectedDestination === "azure-blob" ? "container" : "bucket"}`,
            });
          } else {
            toast({
              title: `No ${selectedDestination === "azure-blob" ? "Containers" : "Buckets"}`,
              description: `No ${selectedDestination === "azure-blob" ? "containers" : "buckets"} found. Check API or credentials.`,
              variant: "destructive",
            });
          }
        } catch (error) {
          toast({ title: "Error", description: "Failed to connect. Check console for details.", variant: "destructive" });
        } finally {
          setIsDestConnecting(false);
        }
      } else if (selectedDestination === "database") {
        if (!destinationConfig.databaseName || !destinationConfig.username) {
          toast({ title: "Error", description: "Database Name and Username are required", variant: "destructive" });
          return;
        }
        setIsDestConnecting(true);
        await new Promise((resolve) => setTimeout(resolve, 1000));
        setIsDestConnected(true);
        setSelectedDestPath(destinationConfig.databaseName!);
        setIsDestConnecting(false);
        toast({ title: "Connection Successful", description: "Connected to database successfully" });
        scrollToSummary();
      }
    }
  };

  const handleRemoveSourcePath = () => {
    setSelectedSourcePath("");
    setIsSourceConnected(false);
    setSourceConfig({});
    setUploadedFiles([]);
    localStorage.removeItem("selectedFile");
    localStorage.removeItem("selectedBucket");
  };

  const handleRemoveDestPath = () => {
    setSelectedDestPath("");
    setIsDestConnected(false);
    setDestinationConfig({ type: selectedDestination });
    localStorage.removeItem("selectedDestFolder");
    localStorage.removeItem("selectedDestBucket");
  };

  const renderSourceFields = () => {
    if (selectedSource === "local") {
      return (
        <div className="space-y-4">
          <Button
            onClick={() => handleConnect("source")}
            disabled={isSourceConnecting}
            className="w-full flex items-center gap-2"
          >
            {isSourceConnecting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                <HardDrive className="w-4 h-4" />
                Connect to Local
              </>
            )}
          </Button>
          {selectedSourcePath && (
            <div className="flex items-center gap-2 p-2 bg-muted rounded-md">
              <div className="flex-1 text-sm truncate">{selectedSourcePath}</div>
              <Button variant="ghost" size="icon" onClick={handleRemoveSourcePath}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      );
    } else if (selectedSource === "s3" || selectedSource === "azure-blob") {
      return (
        <div className="space-y-4">
          <Button
            onClick={() => handleConnect("source")}
            disabled={isSourceConnecting}
            className="w-full flex items-center gap-2"
          >
            {isSourceConnecting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                <Cloud className="w-4 h-4" />
                Connect to {selectedSource === "azure-blob" ? "Azure Blob" : "S3"}
              </>
            )}
          </Button>
          {selectedSourcePath && (
            <div className="flex items-center gap-2 p-2 bg-muted rounded-md">
              <div className="flex-1 text-sm truncate">{selectedSourcePath}</div>
              <Button variant="ghost" size="icon" onClick={handleRemoveSourcePath}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      );
    } else if (selectedSource === "database") {
      return (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="db-name">Database Name</Label>
              <Input
                id="db-name"
                value={sourceConfig.databaseName || ""}
                onChange={(e) => setSourceConfig((prev) => ({ ...prev, databaseName: e.target.value }))}
                placeholder="Enter database name"
              />
            </div>
            <div>
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={sourceConfig.username || ""}
                onChange={(e) => setSourceConfig((prev) => ({ ...prev, username: e.target.value }))}
                placeholder="Enter username"
              />
            </div>
          </div>
          <Button
            onClick={() => handleConnect("source")}
            disabled={isSourceConnecting || !sourceConfig.databaseName || !sourceConfig.username}
            className="w-full flex items-center gap-2"
          >
            {isSourceConnecting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                <Database className="w-4 h-4" />
                Connect to Database
              </>
            )}
          </Button>
          {selectedSourcePath && (
            <div className="flex items-center gap-2 p-2 bg-muted rounded-md">
              <div className="flex-1 text-sm truncate">{selectedSourcePath}</div>
              <Button variant="ghost" size="icon" onClick={handleRemoveSourcePath}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  const renderDestinationFields = () => {
    if (selectedDestination === "s3" || selectedDestination === "azure-blob") {
      return (
        <div className="space-y-4">
          <Button
            onClick={() => handleConnect("destination")}
            disabled={isDestConnecting}
            className="w-full flex items-center gap-2"
          >
            {isDestConnecting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                <Cloud className="w-4 h-4" />
                Connect to {selectedDestination === "azure-blob" ? "Azure Blob" : "S3"}
              </>
            )}
          </Button>
          {selectedDestPath && (
            <div className="flex items-center gap-2 p-2 bg-muted rounded-md">
              <div className="flex-1 text-sm truncate">{selectedDestPath}</div>
              <Button variant="ghost" size="icon" onClick={handleRemoveDestPath}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      );
    } else if (selectedDestination === "database") {
      return (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="db-name-dest">Database Name</Label>
              <Input
                id="db-name-dest"
                value={destinationConfig.databaseName || ""}
                onChange={(e) => setDestinationConfig((prev) => ({ ...prev, databaseName: e.target.value }))}
                placeholder="Enter database name"
              />
            </div>
            <div>
              <Label htmlFor="username-dest">Username</Label>
              <Input
                id="username-dest"
                value={destinationConfig.username || ""}
                onChange={(e) => setDestinationConfig((prev) => ({ ...prev, username: e.target.value }))}
                placeholder="Enter username"
              />
            </div>
          </div>
          <Button
            onClick={() => handleConnect("destination")}
            disabled={isDestConnecting || !destinationConfig.databaseName || !destinationConfig.username}
            className="w-full flex items-center gap-2"
          >
            {isDestConnecting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                <Database className="w-4 h-4" />
                Connect to Database
              </>
            )}
          </Button>
          {selectedDestPath && (
            <div className="flex items-center gap-2 p-2 bg-muted rounded-md">
              <div className="flex-1 text-sm truncate">{selectedDestPath}</div>
              <Button variant="ghost" size="icon" onClick={handleRemoveDestPath}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  const handleProceed = () => {
    if (!isSourceConnected || !selectedSourcePath) {
      toast({ title: "Error", description: "Please connect and select a source path", variant: "destructive" });
      return;
    }
    if (!isDestConnected || !selectedDestPath) {
      toast({ title: "Error", description: "Please connect and select a destination path", variant: "destructive" });
      return;
    }
    if (!localStorage.getItem("selectedBucket") || !localStorage.getItem("selectedFile")) {
      toast({ title: "Error", description: "Bucket or file not properly set. Please reselect the source.", variant: "destructive" });
      return;
    }
    if ((selectedDestination === "s3" || selectedDestination === "azure-blob") && !localStorage.getItem("selectedDestBucket")) {
      toast({ title: "Error", description: "Destination bucket not properly set. Please reselect the destination.", variant: "destructive" });
      return;
    }
    navigate("/dashboard/schema");
  };

  const handleGoBack = () => {
    navigate("/dashboard/jobs");
  };

  const Breadcrumbs = ({ type }: { type: "source" | "destination" }) => {
    const config = type === "source" ? sourceConfig : destinationConfig;
    const path = config.currentPath || "";
    const bucketOrContainer = config.bucket;
    const prefix = type === "source" ? selectedSource : selectedDestination;

    return (
      <div className="flex flex-wrap items-center gap-1 text-sm text-muted-foreground mb-2">
        <span
          onClick={() => {
            if (type === "source") {
              setSourceConfig((prev) => ({ ...prev, bucket: undefined, currentPath: "" }));
              setSelectedSourcePath("");
              setIsSourceConnected(false);
              setObjects([]);
              localStorage.removeItem("selectedBucket");
              localStorage.removeItem("selectedFile");
            } else {
              setDestinationConfig((prev) => ({ ...prev, bucket: undefined, currentPath: "" }));
              setSelectedDestPath("");
              setIsDestConnected(false);
              setObjects([]);
              localStorage.removeItem("selectedDestFolder");
              localStorage.removeItem("selectedDestBucket");
            }
          }}
          className="cursor-pointer hover:underline flex items-center"
        >
          <Folder className="w-4 h-4 mr-1" /> Root
        </span>
        {bucketOrContainer && (
          <>
            <ChevronRight className="w-4 h-4" />
            <span
              onClick={() => {
                if (type === "source") {
                  setSourceConfig((prev) => ({ ...prev, currentPath: "" }));
                  fetchObjects(bucketOrContainer, "");
                  setSelectedSourcePath("");
                  setIsSourceConnected(false);
                  localStorage.removeItem("selectedFile");
                } else {
                  setDestinationConfig((prev) => ({ ...prev, currentPath: "" }));
                  fetchObjects(bucketOrContainer, "");
                  setSelectedDestPath("");
                  setIsDestConnected(false);
                  localStorage.removeItem("selectedDestFolder");
                }
              }}
              className="cursor-pointer hover:underline"
            >
              {bucketOrContainer}
            </span>
          </>
        )}
        {path
          .split("/")
          .filter((p) => p)
          .map((part, idx) => (
            <React.Fragment key={idx}>
              <ChevronRight className="w-4 h-4" />
              <span
                onClick={() => {
                  const newPath = path.split("/").slice(0, idx + 1).join("/") + "/";
                  if (type === "source") {
                    setSourceConfig((prev) => ({ ...prev, currentPath: newPath }));
                    fetchObjects(sourceConfig.bucket!, newPath);
                    setSelectedSourcePath("");
                    setIsSourceConnected(false);
                    localStorage.removeItem("selectedFile");
                  } else {
                    setDestinationConfig((prev) => ({ ...prev, currentPath: newPath }));
                    fetchObjects(destinationConfig.bucket!, newPath);
                    setSelectedDestPath("");
                    setIsDestConnected(false);
                    localStorage.removeItem("selectedDestFolder");
                  }
                }}
                className="cursor-pointer hover:underline"
              >
                {part}
              </span>
            </React.Fragment>
          ))}
      </div>
    );
  };

  const mockTables = ["customers", "orders", "products", "employees", "departments"];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 p-6">
      <div className="max-w-7xl mt-14 mx-auto">
        <div className="flex items-center justify-between mb-8">
          <Button variant="outline" onClick={handleGoBack} className="flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Jobs
          </Button>
          <div className="text-center">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent mb-4">
              Data Upload Center
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Configure your data Source and destination for seamless data transfer
            </p>
          </div>
          <div className="w-[120px]" />
        </div>

        <Dialog
          open={showSourceBrowser && selectedSource === "local"}
          onOpenChange={(open) => {
            setShowSourceBrowser(open);
            if (!open) {
              setSelectedSourcePath("");
              setIsSourceConnected(false);
              setUploadedFiles([]);
              localStorage.removeItem("selectedFile");
              localStorage.removeItem("selectedBucket");
            }
          }}
        >
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Upload Local Files</DialogTitle>
              <DialogDescription>Select files to upload from your local device.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-8 text-center ${
                  isDragActive ? "border-primary bg-primary/10" : "border-muted-foreground/50"
                }`}
              >
                <input {...getInputProps()} />
                <UploadIcon className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-sm text-muted-foreground">
                  {isDragActive ? "Drop the files here ..." : "Drag & drop files here, or click to select files"}
                </p>
              </div>
              {uploadedFiles.length > 0 && (
                <div className="border rounded-lg max-h-96 overflow-y-auto">
                  {uploadedFiles.map((file, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 border-b last:border-b-0">
                      <File className="w-4 h-4 text-gray-500" />
                      <div className="flex-1 text-sm truncate">{file.name}</div>
                    </div>
                  ))}
                </div>
              )}
              {uploadedFiles.length > 0 && (
                <Button
                  onClick={() => {
                    setShowSourceBrowser(false);
                    toast({ title: "Files Selected", description: `Selected: ${selectedSourcePath}` });
                  }}
                  className="w-fit flex items-center gap-2"
                >
                  Select {uploadedFiles.length} File{uploadedFiles.length !== 1 ? "s" : ""}
                </Button>
              )}
            </div>
          </DialogContent>
        </Dialog>

        <Dialog
          open={showSourceBrowser && (selectedSource === "s3" || selectedSource === "azure-blob")}
          onOpenChange={(open) => {
            setShowSourceBrowser(open);
            if (!open) {
              setSourceConfig((prev) => ({ ...prev, bucket: undefined, currentPath: "" }));
              setSelectedSourcePath("");
              setIsSourceConnected(false);
              setObjects([]);
              localStorage.removeItem("selectedFile");
              localStorage.removeItem("selectedBucket");
              setSourceSelectedItem(null);
            }
          }}
        >
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Browse {selectedSource === "azure-blob" ? "Azure Containers" : "S3 Buckets"}</DialogTitle>
              <DialogDescription>
                Select a {selectedSource === "azure-blob" ? "container" : "bucket"} and file for the data source.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <Breadcrumbs type="source" />
              <div className="border rounded-lg max-h-96 overflow-y-auto">
                {!sourceConfig.bucket ? (
                  buckets.length > 0 ? (
                    buckets.map((bucket) => (
                      <div
                        key={bucket.name}
                        className={`flex items-center gap-3 p-3 hover:bg-primary/10 cursor-pointer border-b last:border-b-0 ${
                          sourceSelectedItem === bucket.name ? "bg-primary/20 border-primary/50" : ""
                        }`}
                        onDoubleClick={() => handleSelectBucket(bucket.name, "source")}
                        onClick={() => setSourceSelectedItem(bucket.name)}
                      >
                        <Folder className="w-4 h-4 text-blue-500" />
                        <div className="flex-1 font-medium">{bucket.name}</div>
                      </div>
                    ))
                  ) : (
                    <div className="p-3 text-center text-muted-foreground">
                      No {selectedSource === "azure-blob" ? "containers" : "buckets"} available.
                    </div>
                  )
                ) : (
                  <>
                    <div
                      className="flex items-center gap-3 p-3 hover:bg-primary/10 cursor-pointer border-b last:border-b-0"
                      onDoubleClick={() => handleS3Navigation("..", true, "source")}
                    >
                      <Folder className="w-4 h-4 text-blue-500" />
                      <div className="flex-1 font-medium">..</div>
                    </div>
                    {objects.length > 0 ? (
                      objects.map((obj) => {
                        const isFolder = obj.isFolder || obj.key.endsWith("/");
                        return (
                          <div
                            key={obj.key}
                            className={`flex items-center gap-3 p-3 hover:bg-primary/10 cursor-pointer border-b last:border-b-0 ${
                              sourceSelectedItem === obj.key ? "bg-primary/20 border-primary/50" : ""
                            }`}
                            onDoubleClick={() => handleS3Navigation(obj.key, isFolder, "source")}
                            onClick={() => setSourceSelectedItem(obj.key)}
                          >
                            {isFolder ? (
                              <Folder className="w-4 h-4 text-blue-500" />
                            ) : (
                              <File className="w-4 h-4 text-gray-500" />
                            )}
                            <div className="flex-1 font-medium">{obj.key.split("/").pop() || obj.key}</div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="p-3 text-center text-muted-foreground">
                        No {selectedSource === "azure-blob" ? "blobs" : "objects"} available.
                      </div>
                    )}
                  </>
                )}
              </div>
              {sourceConfig.bucket && sourceSelectedItem && !sourceSelectedItem.endsWith("/") && (
                <Button
                  onClick={() => handleS3Navigation(sourceSelectedItem, false, "source")}
                  className="w-fit flex items-center gap-2"
                >
                  Select {sourceSelectedItem}
                </Button>
              )}
            </div>
          </DialogContent>
        </Dialog>

        <Dialog
          open={showDestBrowser}
          onOpenChange={(open) => {
            setShowDestBrowser(open);
            if (!open) {
              setDestinationConfig((prev) => ({ ...prev, bucket: undefined, currentPath: "" }));
              setSelectedDestPath("");
              setIsDestConnected(false);
              setObjects([]);
              localStorage.removeItem("selectedDestFolder");
              localStorage.removeItem("selectedDestBucket");
              setDestSelectedItem(null);
            }
          }}
        >
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Browse {selectedDestination === "azure-blob" ? "Azure Containers" : "S3 Buckets"}</DialogTitle>
              <DialogDescription>
                Select a {selectedDestination === "azure-blob" ? "container" : "bucket"} and folder for the destination.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <Breadcrumbs type="destination" />
              <div className="border rounded-lg max-h-96 overflow-y-auto">
                {!destinationConfig.bucket ? (
                  buckets.length > 0 ? (
                    buckets.map((bucket) => (
                      <div
                        key={bucket.name}
                        className={`flex items-center gap-3 p-3 hover:bg-primary/10 cursor-pointer border-b last:border-b-0 ${
                          destSelectedItem === bucket.name ? "bg-primary/20 border-primary/50" : ""
                        }`}
                        onDoubleClick={() => handleSelectBucket(bucket.name, "destination")}
                        onClick={() => setDestSelectedItem(bucket.name)}
                      >
                        <Folder className="w-4 h-4 text-blue-500" />
                        <div className="flex-1 font-medium">{bucket.name}</div>
                      </div>
                    ))
                  ) : (
                    <div className="p-3 text-center text-muted-foreground">
                      No {selectedDestination === "azure-blob" ? "containers" : "buckets"} available.
                    </div>
                  )
                ) : (
                  <>
                    <div
                      className="flex items-center gap-3 p-3 hover:bg-primary/10 cursor-pointer border-b last:border-b-0"
                      onDoubleClick={() => handleS3Navigation("..", true, "destination")}
                    >
                      <Folder className="w-4 h-4 text-blue-500" />
                      <div className="flex-1 font-medium">..</div>
                    </div>
                    {objects.length > 0 ? (
                      objects.map((obj) => {
                        const isFolder = obj.isFolder || obj.key.endsWith("/");
                        return (
                          <div
                            key={obj.key}
                            className={`flex items-center gap-3 p-3 hover:bg-primary/10 cursor-pointer border-b last:border-b-0 ${
                              destSelectedItem === obj.key ? "bg-primary/20 border-primary/50" : ""
                            }`}
                            onDoubleClick={() => handleS3Navigation(obj.key, isFolder, "destination")}
                            onClick={() => setDestSelectedItem(obj.key)}
                          >
                            {isFolder ? (
                              <Folder className="w-4 h-4 text-blue-500" />
                            ) : (
                              <File className="w-4 h-4 text-gray-500" />
                            )}
                            <div className="flex-1 font-medium">{obj.key}</div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="p-3 text-center text-muted-foreground">
                        No {selectedDestination === "azure-blob" ? "blobs" : "objects"} available.
                      </div>
                    )}
                  </>
                )}
              </div>
              {destinationConfig.bucket && destSelectedItem && destSelectedItem !== ".." && (
                <div className="text-sm text-muted-foreground">
                  Selected Path: {`${selectedDestination}://${destinationConfig.bucket}/${destinationConfig.currentPath || ""}${destSelectedItem}`}
                </div>
              )}
              {!destinationConfig.bucket && destSelectedItem && (
                <Button
                  onClick={handleSelectDestBucketOrContainer}
                  className="w-fit flex items-center gap-2"
                >
                  Select This {selectedDestination === "azure-blob" ? "Container" : "Bucket"}
                </Button>
              )}
              {destinationConfig.bucket && destSelectedItem && destSelectedItem !== ".." && (
                <Button
                  onClick={handleSelectDestinationFolder}
                  disabled={!selectedSourcePath}
                  className="w-fit flex items-center gap-2"
                >
                  Select This Folder
                </Button>
              )}
            </div>
          </DialogContent>
        </Dialog>

        <Dialog
          open={showSourceDBBrowser}
          onOpenChange={(open) => {
            setShowSourceDBBrowser(open);
            if (!open) {
              setSourceDBSelectedTables([]);
              setSelectAllTables(false);
              localStorage.removeItem("selectedFile");
              localStorage.removeItem("selectedBucket");
            }
          }}
        >
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Browse Database Tables</DialogTitle>
              <DialogDescription>Select tables from the database for the data source.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">Database: {sourceConfig.databaseName}</div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="select-all-tables"
                  checked={selectAllTables}
                  onCheckedChange={(checked) => setSelectAllTables(checked as boolean)}
                />
                <Label htmlFor="select-all-tables">Select All Tables</Label>
              </div>
              <div className="border rounded-lg max-h-96 overflow-y-auto">
                {mockTables.map((table) => (
                  <div key={table} className="flex items-center gap-3 p-3 border-b last:border-b-0">
                    <Checkbox
                      id={`table-${table}`}
                      checked={sourceDBSelectedTables.includes(table)}
                      onCheckedChange={(checked) => {
                        if (checked) setSourceDBSelectedTables((prev) => [...prev, table]);
                        else setSourceDBSelectedTables((prev) => prev.filter((t) => t !== table));
                      }}
                    />
                    <Database className="w-4 h-4 text-gray-500" />
                    <div className="flex-1">
                      <div className="font-medium">{table}</div>
                    </div>
                  </div>
                ))}
              </div>
              <Button
                onClick={() => {
                  if (sourceDBSelectedTables.length > 0) {
                    const fullPath = sourceDBSelectedTables.map((table) => `${sourceConfig.databaseName}.${table}`).join(", ");
                    setSelectedSourcePath(fullPath);
                    setIsSourceConnected(true);
                    setShowSourceDBBrowser(false);
                    localStorage.setItem("selectedBucket", sourceConfig.databaseName!);
                    localStorage.setItem("selectedFile", sourceDBSelectedTables.join(","));
                    toast({ title: "Tables Selected", description: `Selected: ${fullPath}` });
                    setSourceDBSelectedTables([]);
                    setSelectAllTables(false);
                  } else {
                    toast({ title: "Error", description: "Please select at least one table", variant: "destructive" });
                  }
                }}
                disabled={sourceDBSelectedTables.length === 0}
                className="w-fit flex items-center gap-2"
              >
                Select {sourceDBSelectedTables.length} Table{sourceDBSelectedTables.length !== 1 ? "s" : ""}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={showDestDBBrowser} onOpenChange={setShowDestDBBrowser}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Browse Database Tables</DialogTitle>
              <DialogDescription>Select a table from the database for the destination.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">Database: {destinationConfig.databaseName}</div>
              <div className="border rounded-lg max-h-96 overflow-y-auto">
                {mockTables.map((table) => (
                  <div
                    key={table}
                    className="flex items-center gap-3 p-3 hover:bg-primary/10 cursor-pointer border-b last:border-b-0"
                    onClick={() => {
                      setSelectedDestPath(`${destinationConfig.databaseName}.${table}`);
                      setIsDestConnected(true);
                      setShowDestDBBrowser(false);
                      localStorage.setItem("selectedDestFolder", table);
                      toast({ title: "Table Selected", description: `Selected: ${table}` });
                      scrollToSummary();
                    }}
                  >
                    <Database className="w-4 h-4 text-gray-500" />
                    <div className="flex-1">
                      <div className="font-medium">{table}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="h-fit">
            <CardHeader>
              <CardTitle>Data Source</CardTitle>
              <CardDescription>Select and configure your data source</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="source-select">Data Source</Label>
                <Select
                  value={selectedSource}
                  onValueChange={(value) => {
                    setSelectedSource(value);
                    setSelectedSourcePath("");
                    setIsSourceConnected(false);
                    setSourceConfig({});
                    localStorage.removeItem("selectedBucket");
                    localStorage.removeItem("selectedFile");
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select data source" />
                  </SelectTrigger>
                  <SelectContent>
                    {dataSources.map((source) => {
                      const Icon = source.icon;
                      return (
                        <SelectItem key={source.value} value={source.value}>
                          <div className="flex items-center gap-2">
                            <Icon className="w-4 h-4" />
                            {source.label}
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
              {selectedSource && <div className="space-y-4 animate-fade-in">{renderSourceFields()}</div>}
            </CardContent>
          </Card>

          <Card className="h-fit">
            <CardHeader>
              <CardTitle>Destination</CardTitle>
              <CardDescription>Select and configure your destination</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="destination-select">Destination</Label>
                <Select
                  value={selectedDestination}
                  onValueChange={(value) => {
                    setSelectedDestination(value);
                    setSelectedDestPath("");
                    setIsDestConnected(false);
                    setDestinationConfig({ type: value });
                    localStorage.removeItem("selectedDestFolder");
                    localStorage.removeItem("selectedDestBucket");
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select destination" />
                  </SelectTrigger>
                  <SelectContent>
                    {destinations.map((dest) => {
                      const Icon = dest.icon;
                      return (
                        <SelectItem key={dest.value} value={dest.value}>
                          <div className="flex items-center gap-2">
                            <Icon className="w-4 h-4" />
                            {dest.label}
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
              {selectedDestination && <div className="space-y-4 animate-fade-in">{renderDestinationFields()}</div>}
            </CardContent>
          </Card>
        </div>
        {selectedSource && selectedDestination && isSourceConnected && isDestConnected && (
          <Card ref={summaryRef} className="mt-8 animate-fade-in">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                Configuration Summary
              </CardTitle>
              <CardDescription>Review your selected source and destination</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <h4 className="font-semibold text-primary">Source</h4>
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      {React.createElement(dataSources.find((s) => s.value === selectedSource)?.icon || HardDrive, {
                        className: "w-4 h-4",
                      })}
                      <span className="font-medium">{dataSources.find((s) => s.value === selectedSource)?.label}</span>
                    </div>
                    <p className="text-sm text-green-600">✓ Connected Successfully</p>
                    <p className="text-sm text-muted-foreground">Path: {selectedSourcePath}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold text-primary">Destination</h4>
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      {React.createElement(destinations.find((d) => d.value === selectedDestination)?.icon || Database, {
                        className: "w-4 h-4",
                      })}
                      <span className="font-medium">{destinations.find((d) => d.value === selectedDestination)?.label}</span>
                    </div>
                    <p className="text-sm text-green-600">✓ Connected Successfully</p>
                    <p className="text-sm text-muted-foreground">Path: {selectedDestPath}</p>
                  </div>
                </div>
              </div>
              <div className="mt-6 flex justify-between gap-4">
                <Button onClick={handleGoBack} variant="outline" size="lg" className="px-8">
                  <ArrowLeft className="w-4 h-4 mr-2" /> Back
                </Button>
                <Button onClick={handleProceed} size="lg" className="px-8">
                  <ArrowRight className="w-4 h-4 mr-2" /> Proceed
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}