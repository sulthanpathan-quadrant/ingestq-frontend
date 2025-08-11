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
  X
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

interface SourceConfig {
  accessKey?: string;
  secretKey?: string;
  connectionString?: string;
  databaseName?: string;
  username?: string;
  password?: string;
  port?: string;
  databasePath?: string;
}

interface DestinationConfig {
  type: string;
  accessKey?: string;
  secretKey?: string;
  connectionString?: string;
  databaseName?: string;
  username?: string;
  password?: string;
  port?: string;
  databasePath?: string;
  filename?: string;
}

interface S3Object {
  key: string;
  type: 'folder' | 'file';
  size?: number;
  lastModified?: string;
}

export default function Upload() {
  const [selectedSource, setSelectedSource] = useState<string>('');
  const [selectedDestination, setSelectedDestination] = useState<string>('');
  const [sourceConfig, setSourceConfig] = useState<SourceConfig>({});
  const [destinationConfig, setDestinationConfig] = useState<DestinationConfig>({ type: '' });
  const [isSourceConnected, setIsSourceConnected] = useState<boolean>(false);
  const [isSourceConnecting, setIsSourceConnecting] = useState<boolean>(false);
  const [isDestConnected, setIsDestConnected] = useState<boolean>(false);
  const [isDestConnecting, setIsDestConnecting] = useState<boolean>(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [showS3Browser, setShowS3Browser] = useState<boolean>(false);
  const [showAzureBrowser, setShowAzureBrowser] = useState<boolean>(false);
  const [s3Objects, setS3Objects] = useState<S3Object[]>([]);
  const [azureObjects, setAzureObjects] = useState<S3Object[]>([]);
  const [currentPath, setCurrentPath] = useState<string>('');
  const [selectedSourcePath, setSelectedSourcePath] = useState<string>('');
  const [selectedDestPath, setSelectedDestPath] = useState<string>('');
  const { toast } = useToast();
  const navigate = useNavigate();
  const summaryRef = useRef<HTMLDivElement>(null);

  const dataSources = [
    { value: 'local', label: 'Local', icon: HardDrive },
    { value: 's3', label: 'S3', icon: Cloud },
    { value: 'azure-blob', label: 'Azure Blob', icon: CloudRain },
    { value: 'database', label: 'Database', icon: Server }
  ];

  const destinations = [
    { value: 's3', label: 'S3', icon: Cloud },
    { value: 'azure-blob', label: 'Azure Blob', icon: Database },
    { value: 'database', label: 'Database', icon: Server }
  ];

  
  useEffect(() => {
    if (['s3', 'azure-blob'].includes(selectedDestination) && selectedSourcePath && !destinationConfig.filename) {
      const sourceFilename = selectedSourcePath.split('/').pop() || 'output.csv';
      if (selectedDestination === 's3' && destinationConfig.accessKey && destinationConfig.secretKey) {
        setDestinationConfig(prev => ({ ...prev, filename: `${sourceFilename}` }));
      } else if (selectedDestination === 'azure-blob' && destinationConfig.connectionString) {
        setDestinationConfig(prev => ({ ...prev, filename: `${sourceFilename}` }));
      }
    }
  }, [selectedDestination, selectedSourcePath, destinationConfig]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setUploadedFiles(acceptedFiles);
    setSelectedSourcePath(acceptedFiles.map(file => file.name).join(', '));
    setIsSourceConnected(true);
    // Suggest destination filename based on first uploaded file
    if (acceptedFiles.length > 0 && ['s3', 'azure-blob'].includes(selectedDestination)) {
      setDestinationConfig(prev => ({
        ...prev,
        filename: prev.filename || `output_${acceptedFiles[0].name}`
      }));
    }
    toast({
      title: "Files Uploaded",
      description: `${acceptedFiles.length} file(s) uploaded successfully`,
    });
  }, [toast, selectedDestination]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  const mockS3Objects: S3Object[] = [
    { key: 'data-lake/', type: 'folder' },
    { key: 'raw-data/', type: 'folder' },
    { key: 'processed/', type: 'folder' },
    { key: 'customers.csv', type: 'file', size: 1024000, lastModified: '2024-01-15' },
    { key: 'orders.json', type: 'file', size: 2048000, lastModified: '2024-01-14' },
  ];

  const scrollToSummary = () => {
    setTimeout(() => {
      console.log('Scrolling to summary:', {
        summaryRef: summaryRef.current,
        isSourceConnected,
        isDestConnected
      });
      if (summaryRef.current) {
        summaryRef.current.scrollIntoView({ behavior: 'smooth' });
      } else {
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
      }
    }, 100);
  };

  const handleConnect = async (type: 'source' | 'destination') => {
    if (type === 'source') {
      if (!sourceConfig.accessKey && selectedSource === 's3') {
        toast({ title: "Error", description: "AWS Access Key is required", variant: "destructive" });
        return;
      }
      if (!sourceConfig.secretKey && selectedSource === 's3') {
        toast({ title: "Error", description: "AWS Secret Key is required", variant: "destructive" });
        return;
      }
      if (!sourceConfig.connectionString && selectedSource === 'azure-blob') {
        toast({ title: "Error", description: "Connection String is required", variant: "destructive" });
        return;
      }
      if (!sourceConfig.databaseName && selectedSource === 'database') {
        toast({ title: "Error", description: "Database Name is required", variant: "destructive" });
        return;
      }
      if (!sourceConfig.username && selectedSource === 'database') {
        toast({ title: "Error", description: "Username is required", variant: "destructive" });
        return;
      }
      setIsSourceConnecting(true);
      await new Promise(resolve => setTimeout(resolve, 2000));
      if (selectedSource === 's3') {
        setS3Objects(mockS3Objects);
        setShowS3Browser(true);
      } else if (selectedSource === 'azure-blob') {
        setAzureObjects(mockS3Objects);
        setShowAzureBrowser(true);
      } else if (selectedSource === 'database') {
        setSelectedSourcePath(sourceConfig.databasePath || '');
        setIsSourceConnected(true);
      }
      setIsSourceConnecting(false);
      toast({
        title: "Connection Successful",
        description: `Connected to ${selectedSource} successfully`,
      });
    } else {
      if (!destinationConfig.accessKey && selectedDestination === 's3') {
        toast({ title: "Error", description: "AWS Access Key is required", variant: "destructive" });
        return;
      }
      if (!destinationConfig.secretKey && selectedDestination === 's3') {
        toast({ title: "Error", description: "AWS Secret Key is required", variant: "destructive" });
        return;
      }
      if (!destinationConfig.connectionString && selectedDestination === 'azure-blob') {
        toast({ title: "Error", description: "Connection String is required", variant: "destructive" });
        return;
      }
      if (!destinationConfig.databaseName && selectedDestination === 'database') {
        toast({ title: "Error", description: "Database Name is required", variant: "destructive" });
        return;
      }
      if (!destinationConfig.username && selectedDestination === 'database') {
        toast({ title: "Error", description: "Username is required", variant: "destructive" });
        return;
      }
      if (!destinationConfig.filename && ['s3', 'azure-blob'].includes(selectedDestination)) {
        toast({ title: "Error", description: "Destination filename is required", variant: "destructive" });
        return;
      }
      setIsDestConnecting(true);
      await new Promise(resolve => setTimeout(resolve, 2000));
      if (selectedDestination === 's3') {
        setS3Objects(mockS3Objects);
        setShowS3Browser(true);
      } else if (selectedDestination === 'azure-blob') {
        setAzureObjects(mockS3Objects);
        setShowAzureBrowser(true);
      } else if (selectedDestination === 'database') {
        setSelectedDestPath(destinationConfig.databasePath || '');
        setIsDestConnected(true);
        toast({
          title: "Connection Successful",
          description: `Connected to ${selectedDestination} successfully`,
        });
        scrollToSummary();
      }
      setIsDestConnecting(false);
    }
  };

  const handleRemoveSourcePath = () => {
    setSelectedSourcePath('');
    setUploadedFiles([]);
    setIsSourceConnected(false);
    setSourceConfig({});
  };

  const handleRemoveDestPath = () => {
    setSelectedDestPath('');
    setIsDestConnected(false);
    setDestinationConfig({ type: selectedDestination });
  };

  const renderSourceFields = () => {
    switch (selectedSource) {
      case 's3':
        return (
          <div className="grid grid-cols-1 gap-4">
            <div>
              <Label htmlFor="source-access-key">AWS Access Key</Label>
              <Input
                id="source-access-key"
                placeholder="AKIA..."
                value={sourceConfig.accessKey || ''}
                onChange={(e) => setSourceConfig(prev => ({ ...prev, accessKey: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="source-secret-key">AWS Secret Key</Label>
              <Input
                id="source-secret-key"
                type="password"
                placeholder="••••••••"
                value={sourceConfig.secretKey || ''}
                onChange={(e) => setSourceConfig(prev => ({ ...prev, secretKey: e.target.value }))}
              />
            </div>
            {selectedSourcePath && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <File className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium text-green-800">File selected:</span>
                    <span className="text-sm text-green-700">{selectedSourcePath}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleRemoveSourcePath}
                    className="h-6 w-6 p-0 text-green-600 hover:text-green-800 hover:bg-green-100"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
            <Button 
              onClick={() => handleConnect('source')} 
              disabled={isSourceConnecting || isSourceConnected || !sourceConfig.accessKey || !sourceConfig.secretKey}
              className="w-fit flex items-center gap-2"
            >
              {isSourceConnecting ? <Loader2 className="w-4 h-4 animate-spin" /> : isSourceConnected ? <CheckCircle className="w-4 h-4" /> : null}
              {isSourceConnecting ? 'Connecting...' : isSourceConnected ? 'Connected' : 'Connect'}
            </Button>
          </div>
        );
      
      case 'azure-blob':
        return (
          <div className="grid grid-cols-1 gap-4">
            <div>
              <Label htmlFor="source-connection-string">Connection String</Label>
              <Input
                id="source-connection-string"
                placeholder="DefaultEndpointsProtocol=https;AccountName=..."
                value={sourceConfig.connectionString || ''}
                onChange={(e) => setSourceConfig(prev => ({ ...prev, connectionString: e.target.value }))}
              />
            </div>
            {selectedSourcePath && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <File className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium text-green-800">File selected:</span>
                    <span className="text-sm text-green-700">{selectedSourcePath}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleRemoveSourcePath}
                    className="h-6 w-6 p-0 text-green-600 hover:text-green-800 hover:bg-green-100"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
            <Button 
              onClick={() => handleConnect('source')} 
              disabled={isSourceConnecting || isSourceConnected || !sourceConfig.connectionString}
              className="w-fit flex items-center gap-2"
            >
              {isSourceConnecting ? <Loader2 className="w-4 h-4 animate-spin" /> : isSourceConnected ? <CheckCircle className="w-4 h-4" /> : null}
              {isSourceConnecting ? 'Connecting...' : isSourceConnected ? 'Connected' : 'Connect'}
            </Button>
          </div>
        );
      
      case 'database':
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="source-database-name">Database Name</Label>
              <Input
                id="source-database-name"
                placeholder="database_name"
                value={sourceConfig.databaseName || ''}
                onChange={(e) => setSourceConfig(prev => ({ ...prev, databaseName: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="source-username">Username</Label>
              <Input
                id="source-username"
                placeholder="username"
                value={sourceConfig.username || ''}
                onChange={(e) => setSourceConfig(prev => ({ ...prev, username: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="source-password">Password</Label>
              <Input
                id="source-password"
                type="password"
                placeholder="••••••••"
                value={sourceConfig.password || ''}
                onChange={(e) => setSourceConfig(prev => ({ ...prev, password: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="source-port">Port</Label>
              <Input
                id="source-port"
                placeholder="5432"
                value={sourceConfig.port || ''}
                onChange={(e) => setSourceConfig(prev => ({ ...prev, port: e.target.value }))}
              />
            </div>
            <div className="col-span-full">
              <Label htmlFor="source-database-path">Database Table/Path</Label>
              <Input
                id="source-database-path"
                placeholder="schema.table or /path/to/database"
                value={sourceConfig.databasePath || ''}
                onChange={(e) => setSourceConfig(prev => ({ ...prev, databasePath: e.target.value }))}
              />
            </div>
            {selectedSourcePath && (
              <div className="col-span-full bg-green-50 border border-green-200 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Database className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium text-green-800">Table/Path selected:</span>
                    <span className="text-sm text-green-700">{selectedSourcePath}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleRemoveSourcePath}
                    className="h-6 w-6 p-0 text-green-600 hover:text-green-800 hover:bg-green-100"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
            <div className="col-span-full">
              <Button 
                onClick={() => handleConnect('source')} 
                disabled={isSourceConnecting || isSourceConnected || !sourceConfig.databaseName || !sourceConfig.username}
                className="w-fit flex items-center gap-2"
              >
                {isSourceConnecting ? <Loader2 className="w-4 h-4 animate-spin" /> : isSourceConnected ? <CheckCircle className="w-4 h-4" /> : null}
                {isSourceConnecting ? 'Connecting...' : isSourceConnected ? 'Connected' : 'Connect'}
              </Button>
            </div>
          </div>
        );
      
      case 'local':
        return (
          <div 
            {...getRootProps()} 
            className={`text-center py-8 border-2 border-dashed rounded-lg cursor-pointer transition-colors
              ${isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'}
            `}
          >
            <input {...getInputProps()} />
            <UploadIcon className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            {isDragActive ? (
              <p className="text-primary">Drop the files here...</p>
            ) : (
              <div>
                <p className="text-muted-foreground mb-2">Drag & drop files here, or click to select</p>
                {selectedSourcePath && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 mt-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <File className="w-4 h-4 text-green-600" />
                        <span className="text-sm font-medium text-green-800">Files selected:</span>
                        <span className="text-sm text-green-700">{selectedSourcePath}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleRemoveSourcePath}
                        className="h-6 w-6 p-0 text-green-600 hover:text-green-800 hover:bg-green-100"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      
      default:
        return null;
    }
  };

  const renderDestinationFields = () => {
    switch (selectedDestination) {
      case 's3':
        return (
          <div className="grid grid-cols-1 gap-4">
            <div>
              <Label htmlFor="dest-access-key">AWS Access Key</Label>
              <Input
                id="dest-access-key"
                placeholder="AKIA..."
                value={destinationConfig.accessKey || ''}
                onChange={(e) => setDestinationConfig(prev => ({ ...prev, accessKey: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="dest-secret-key">AWS Secret Key</Label>
              <Input
                id="dest-secret-key"
                type="password"
                placeholder="••••••••"
                value={destinationConfig.secretKey || ''}
                onChange={(e) => setDestinationConfig(prev => ({ ...prev, secretKey: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="dest-filename">Destination Filename</Label>
              <Input
                id="dest-filename"
                placeholder="e.g., output.csv"
                value={destinationConfig.filename || ''}
                onChange={(e) => setDestinationConfig(prev => ({ ...prev, filename: e.target.value }))}
              />
            </div>
            {selectedDestPath && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <File className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium text-green-800">Destination selected:</span>
                    <span className="text-sm text-green-700">{selectedDestPath}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleRemoveDestPath}
                    className="h-6 w-6 p-0 text-green-600 hover:text-green-800 hover:bg-green-100"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
            <Button 
              onClick={() => handleConnect('destination')} 
              disabled={isDestConnecting || isDestConnected || !destinationConfig.accessKey || !destinationConfig.secretKey || !destinationConfig.filename}
              className="w-fit flex items-center gap-2"
            >
              {isDestConnecting ? <Loader2 className="w-4 h-4 animate-spin" /> : isDestConnected ? <CheckCircle className="w-4 h-4" /> : null}
              {isDestConnecting ? 'Connecting...' : isDestConnected ? 'Connected' : 'Connect'}
            </Button>
          </div>
        );
      
      case 'azure-blob':
        return (
          <div className="grid grid-cols-1 gap-4">
            <div>
              <Label htmlFor="dest-connection-string">Connection String</Label>
              <Input
                id="dest-connection-string"
                placeholder="DefaultEndpointsProtocol=https;AccountName=..."
                value={destinationConfig.connectionString || ''}
                onChange={(e) => setDestinationConfig(prev => ({ ...prev, connectionString: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="dest-filename">Destination Filename</Label>
              <Input
                id="dest-filename"
                placeholder="e.g., output.csv"
                value={destinationConfig.filename || ''}
                onChange={(e) => setDestinationConfig(prev => ({ ...prev, filename: e.target.value }))}
              />
            </div>
            {selectedDestPath && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <File className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium text-green-800">Destination selected:</span>
                    <span className="text-sm text-green-700">{selectedDestPath}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleRemoveDestPath}
                    className="h-6 w-6 p-0 text-green-600 hover:text-green-800 hover:bg-green-100"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
            <Button 
              onClick={() => handleConnect('destination')} 
              disabled={isDestConnecting || isDestConnected || !destinationConfig.connectionString || !destinationConfig.filename}
              className="w-fit flex items-center gap-2"
            >
              {isDestConnecting ? <Loader2 className="w-4 h-4 animate-spin" /> : isDestConnected ? <CheckCircle className="w-4 h-4" /> : null}
              {isDestConnecting ? 'Connecting...' : isDestConnected ? 'Connected' : 'Connect'}
            </Button>
          </div>
        );
      
      case 'database':
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="dest-database-name">Database Name</Label>
              <Input
                id="dest-database-name"
                placeholder="database_name"
                value={destinationConfig.databaseName || ''}
                onChange={(e) => setDestinationConfig(prev => ({ ...prev, databaseName: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="dest-username">Username</Label>
              <Input
                id="dest-username"
                placeholder="username"
                value={destinationConfig.username || ''}
                onChange={(e) => setDestinationConfig(prev => ({ ...prev, username: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="dest-password">Password</Label>
              <Input
                id="dest-password"
                type="password"
                placeholder="••••••••"
                value={destinationConfig.password || ''}
                onChange={(e) => setDestinationConfig(prev => ({ ...prev, password: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="dest-port">Port</Label>
              <Input
                id="dest-port"
                placeholder="5432"
                value={destinationConfig.port || ''}
                onChange={(e) => setDestinationConfig(prev => ({ ...prev, port: e.target.value }))}
              />
            </div>
            <div className="col-span-full">
              <Label htmlFor="dest-database-path">Database Table/Path</Label>
              <Input
                id="dest-database-path"
                placeholder="schema.table or /path/to/database"
                value={destinationConfig.databasePath || ''}
                onChange={(e) => setDestinationConfig(prev => ({ ...prev, databasePath: e.target.value }))}
              />
            </div>
            {selectedDestPath && (
              <div className="col-span-full bg-green-50 border border-green-200 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Database className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium text-green-800">Table/Path selected:</span>
                    <span className="text-sm text-green-700">{selectedDestPath}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleRemoveDestPath}
                    className="h-6 w-6 p-0 text-green-600 hover:text-green-800 hover:bg-green-100"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
            <div className="col-span-full">
              <Button 
                onClick={() => handleConnect('destination')} 
                disabled={isDestConnecting || isDestConnected || !destinationConfig.databaseName || !destinationConfig.username}
                className="w-fit flex items-center gap-2"
              >
                {isDestConnecting ? <Loader2 className="w-4 h-4 animate-spin" /> : isDestConnected ? <CheckCircle className="w-4 h-4" /> : null}
                {isDestConnecting ? 'Connecting...' : isDestConnected ? 'Connected' : 'Connect'}
              </Button>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  const handleProceed = () => {
    if (!isSourceConnected || !isDestConnected || !selectedSourcePath || !selectedDestPath) {
      toast({
        title: "Error",
        description: "Please connect and select both source and destination paths",
        variant: "destructive"
      });
      return;
    }
    navigate('/dashboard/schema');
  };

  const handleGoBack = () => {
    navigate('/dashboard/jobs');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 p-6">
      <div className="max-w-7xl mt-14 mx-auto">
        {/* Header with Navigation */}
        <div className="flex items-center justify-between mb-8">
          <Button
            variant="outline"
            onClick={handleGoBack}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Jobs
          </Button>
          
          <div className="text-center">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent mb-4">
              Data Upload Center
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Configure your data source and destination for seamless data transfer
            </p>
          </div>

          <div className="w-[120px]" /> {/* Spacer for centering */}
        </div>

        {/* S3 Browser Dialog */}
        <Dialog open={showS3Browser} onOpenChange={setShowS3Browser}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Browse S3 Buckets</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">
                Path: /{currentPath}
              </div>
              <div className="border rounded-lg max-h-96 overflow-y-auto">
                {s3Objects.map((obj, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 p-3 hover:bg-muted/50 cursor-pointer border-b last:border-b-0"
                    onClick={() => {
                      if (selectedSource === 's3' && obj.type === 'file') {
                        setSelectedSourcePath(`s3://${obj.key}`);
                        setIsSourceConnected(true);
                        // Suggest destination filename based on source file, if not already set
                        if (['s3', 'azure-blob'].includes(selectedDestination) && !destinationConfig.filename) {
                          setDestinationConfig(prev => ({ ...prev, filename: `output_${obj.key.split('/').pop()}` }));
                        }
                        setShowS3Browser(false);
                        toast({
                          title: "File Selected",
                          description: `Selected: ${obj.key}`,
                        });
                      } else if (selectedDestination === 's3' && obj.type === 'folder') {
                        const filename = destinationConfig.filename || 'output.csv';
                        setSelectedDestPath(`s3://${obj.key}${filename}`);
                        setIsDestConnected(true);
                        setShowS3Browser(false);
                        toast({
                          title: "Folder Selected",
                          description: `Selected: ${obj.key}${filename} for destination`,
                        });
                        scrollToSummary();
                      }
                    }}
                  >
                    {obj.type === 'folder' ? (
                      <Folder className="w-4 h-4 text-blue-500" />
                    ) : (
                      <File className="w-4 h-4 text-gray-500" />
                    )}
                    <div className="flex-1">
                      <div className="font-medium">{obj.key}</div>
                      {obj.type === 'file' && (
                        <div className="text-xs text-muted-foreground">
                          {(obj.size! / 1024).toFixed(1)} KB • {obj.lastModified}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Azure Browser Dialog */}
        <Dialog open={showAzureBrowser} onOpenChange={setShowAzureBrowser}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Browse Azure Containers</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">
                Container: {currentPath || 'root'}
              </div>
              <div className="border rounded-lg max-h-96 overflow-y-auto">
                {azureObjects.map((obj, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 p-3 hover:bg-muted/50 cursor-pointer border-b last:border-b-0"
                    onClick={() => {
                      if (selectedSource === 'azure-blob' && obj.type === 'file') {
                        setSelectedSourcePath(`azure://${obj.key}`);
                        setIsSourceConnected(true);
                        // Suggest destination filename based on source file, if not already set
                        if (['s3', 'azure-blob'].includes(selectedDestination) && !destinationConfig.filename) {
                          setDestinationConfig(prev => ({ ...prev, filename: `output_${obj.key.split('/').pop()}` }));
                        }
                        setShowAzureBrowser(false);
                        toast({
                          title: "File Selected",
                          description: `Selected: ${obj.key}`,
                        });
                      } else if (selectedDestination === 'azure-blob' && obj.type === 'folder') {
                        const filename = destinationConfig.filename || 'output.csv';
                        setSelectedDestPath(`azure://${obj.key}${filename}`);
                        setIsDestConnected(true);
                        setShowAzureBrowser(false);
                        toast({
                          title: "Folder Selected",
                          description: `Selected: ${obj.key}${filename} for destination`,
                        });
                        scrollToSummary();
                      }
                    }}
                  >
                    {obj.type === 'folder' ? (
                      <Folder className="w-4 h-4 text-blue-500" />
                    ) : (
                      <File className="w-4 h-4 text-gray-500" />
                    )}
                    <div className="flex-1">
                      <div className="font-medium">{obj.key}</div>
                      {obj.type === 'file' && (
                        <div className="text-xs text-muted-foreground">
                          {(obj.size! / 1024).toFixed(1)} KB • {obj.lastModified}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Data Source Section */}
          <Card className="h-fit">
            <CardHeader>
              <CardTitle>
                Data Source
              </CardTitle>
              <CardDescription>
                Select and configure your data source
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="source-select">Data Source</Label>
                <Select value={selectedSource} onValueChange={(value) => {
                  setSelectedSource(value);
                  setSelectedSourcePath('');
                  setIsSourceConnected(false);
                  setSourceConfig({});
                }}>
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

              {selectedSource && (
                <div className="space-y-4 animate-fade-in">
                  {renderSourceFields()}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Destination Section */}
          <Card className="h-fit">
            <CardHeader>
              <CardTitle>
                Destination
              </CardTitle>
              <CardDescription>
                Select and configure your destination
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="destination-select">Destination</Label>
                <Select value={selectedDestination} onValueChange={(value) => {
                  setSelectedDestination(value);
                  setSelectedDestPath('');
                  setIsDestConnected(false);
                  setDestinationConfig({ type: value });
                }}>
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

              {selectedDestination && (
                <div className="space-y-4 animate-fade-in">
                  {renderDestinationFields()}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Configuration Summary */}
        {selectedSource && selectedDestination && isSourceConnected && isDestConnected && (
          <Card ref={summaryRef} className="mt-8 animate-fade-in">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                Configuration Summary
              </CardTitle>
              <CardDescription>
                Review your selected source and destination
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <h4 className="font-semibold text-primary">Source</h4>
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      {React.createElement(dataSources.find(s => s.value === selectedSource)?.icon || HardDrive, {
                        className: "w-4 h-4"
                      })}
                      <span className="font-medium">
                        {dataSources.find(s => s.value === selectedSource)?.label}
                      </span>
                    </div>
                    <p className="text-sm text-green-600">✓ Connected Successfully</p>
                    <p className="text-sm text-muted-foreground">Path: {selectedSourcePath}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-semibold text-primary">Destination</h4>
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      {React.createElement(destinations.find(d => d.value === selectedDestination)?.icon || Database, {
                        className: "w-4 h-4"
                      })}
                      <span className="font-medium">
                        {destinations.find(d => d.value === selectedDestination)?.label}
                      </span>
                    </div>
                    <p className="text-sm text-green-600">✓ Connected Successfully</p>
                    <p className="text-sm text-muted-foreground">Path: {selectedDestPath}</p>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-between gap-4">
                <Button 
                  onClick={handleGoBack} 
                  variant="outline"
                  size="lg" 
                  className="px-8"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
                <Button 
                  onClick={handleProceed} 
                  size="lg" 
                  className="px-8"
                >
                  <ArrowRight className="w-4 h-4 mr-2" />
                  Proceed
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}