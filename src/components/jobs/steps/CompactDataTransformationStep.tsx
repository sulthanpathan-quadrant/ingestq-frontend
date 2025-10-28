import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  FileText, 
  Cloud,
  Folder,
  File,
  ChevronRight,
  X,
  Upload,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { getBuckets, getObjects, uploadFile } from "@/lib/api";

interface DataSource {
  id: string;
  name: string;
  type: "S3 Bucket" | "Local File" | "Azure Blob";
  status: "Connected" | "Error" | "Pending";
  bucketName?: string;
  fileName?: string;
  inputPath?: string;
  outputPath?: string;
  localFile?: File;
  s3Path?: string;
}

interface Bucket {
  name: string;
}

interface Object {
  key: string;
  isFolder?: boolean;
}

interface CompactDataTransformationStepProps {
  config?: Record<string, any>;
  onConfigChange?: (config: Record<string, any>) => void;
  jobDatasource?: string;
  jobDatadestination?: string;
}

const getBucketFromS3Path = (s3Path: string): string => {
  const match = s3Path.match(/s3:\/\/([^\/]+)/);
  return match ? match[1] : "";
};

const getFileNameWithoutExtension = (fileName: string): string => {
  return fileName.replace(/\.[^/.]+$/, "");
};

export default function CompactDataTransformationStep({ 
  config = {}, 
  onConfigChange,
  jobDatasource,
  jobDatadestination
}: CompactDataTransformationStepProps) {
  const { toast } = useToast();
  const [dataSources, setDataSources] = useState<DataSource[]>([]);
  const [isUploadToggleOn, setIsUploadToggleOn] = useState<boolean>(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [showS3Browser, setShowS3Browser] = useState<boolean>(false);
  const [buckets, setBuckets] = useState<Bucket[]>([]);
  const [objects, setObjects] = useState<Object[]>([]);
  const [currentPath, setCurrentPath] = useState<string>("");
  const [selectedBucket, setSelectedBucket] = useState<string>("");
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ✅ Track previous values to detect changes
  const prevJobDataRef = useRef<{
    datasource?: string;
    datadestination?: string;
    configSourcePath?: string;
  }>({});

  // Clear localStorage to avoid stale data
  const clearLocalStorage = () => {
    localStorage.removeItem("selectedFiles");
    localStorage.removeItem("selectedLocalFiles");
    localStorage.removeItem("datasource");
    localStorage.removeItem("datadestination");
    console.log('🧹 Cleared localStorage to prevent stale data');
  };

  // Load data sources from config or jobDatasource/jobDatadestination
  const loadDataSources = () => {
    console.log('📂 Loading data sources for ETL...');
    console.log('Config:', config);
    console.log('Job Datasource:', jobDatasource);
    console.log('Job Datadestination:', jobDatadestination);

    const newDataSources: DataSource[] = [];

    // Priority 1: Load from config.dataSources if available (already transformed data)
    if (config.dataSources && Array.isArray(config.dataSources) && config.dataSources.length > 0) {
      console.log('✅ Priority 1: Loading from config.dataSources:', config.dataSources);
      setDataSources(config.dataSources);
      return;
    }

    // Priority 2: Load from config.sourcePath (synced from DataUploadCenterStep)
    if (config.sourcePath && config.sourcePath.trim()) {
      console.log('✅ Priority 2: Loading from config.sourcePath:', config.sourcePath);
      const sourcePaths = config.sourcePath.split(",").map(p => p.trim()).filter(p => p);
      const numSources = sourcePaths.length;
      const preferredOutput = config.destinationPath || "";

      sourcePaths.forEach((path: string, index: number) => {
        const trimmedPath = path.trim();
        if (trimmedPath) {
          const bucketName = getBucketFromS3Path(trimmedPath);
          const fileName = trimmedPath.split('/').pop() || '';
          const baseName = getFileNameWithoutExtension(fileName);

          let outputPath: string;
          if (preferredOutput) {
            if (numSources > 1 || preferredOutput.endsWith('/')) {
              const dir = preferredOutput.endsWith('/') ? preferredOutput : `${preferredOutput}/`;
              outputPath = `${dir}${baseName}.parquet`;
            } else {
              outputPath = preferredOutput;
            }
          } else {
            outputPath = `s3://${bucketName}/parquet/${baseName}.parquet`;
          }
          
          newDataSources.push({
            id: `config-source-${Date.now() + index}`,
            name: `S3 Data - ${fileName}`,
            type: "S3 Bucket",
            status: "Connected",
            bucketName: bucketName,
            fileName: fileName,
            inputPath: trimmedPath,
            outputPath: outputPath,
          });
        }
      });

      if (newDataSources.length > 0) {
        console.log('✅ Loaded data sources from config.sourcePath:', newDataSources);
        setDataSources(newDataSources);
        return;
      }
    }

    // Priority 3: Load from jobDatasource (existing job data from API)
    if (jobDatasource && jobDatasource.trim()) {
      console.log('✅ Priority 3: Loading from jobDatasource:', jobDatasource);
      const datasourcePaths = jobDatasource.split(",").map(p => p.trim()).filter(p => p);
      const numSources = datasourcePaths.length;
      const preferredOutput = jobDatadestination || "";

      datasourcePaths.forEach((path: string, index: number) => {
        const trimmedPath = path.trim();
        if (trimmedPath) {
          const bucketName = getBucketFromS3Path(trimmedPath);
          const fileName = trimmedPath.split('/').pop() || '';
          const baseName = getFileNameWithoutExtension(fileName);

          let outputPath: string;
          if (preferredOutput) {
            if (numSources > 1 || preferredOutput.endsWith('/')) {
              const dir = preferredOutput.endsWith('/') ? preferredOutput : `${preferredOutput}/`;
              outputPath = `${dir}${baseName}.parquet`;
            } else {
              outputPath = preferredOutput;
            }
          } else {
            outputPath = `s3://${bucketName}/parquet/${baseName}.parquet`;
          }
          
          newDataSources.push({
            id: `job-source-${Date.now() + index}`,
            name: `S3 Data - ${fileName}`,
            type: "S3 Bucket",
            status: "Connected",
            bucketName: bucketName,
            fileName: fileName,
            inputPath: trimmedPath,
            outputPath: outputPath,
          });
        }
      });

      if (newDataSources.length > 0) {
        console.log('✅ Loaded data sources from jobDatasource:', newDataSources);
        setDataSources(newDataSources);
        return;
      }
    }

    // No localStorage fallback if jobDatasource exists
    console.log('ℹ️ No data sources found from any source');
    setDataSources([]);
  };

  // Initial load on mount
  useEffect(() => {
    clearLocalStorage();
    loadDataSources();
  }, []);

  // ✅ Watch for changes in config or job data and reload if changed
  useEffect(() => {
    const currentDatasource = jobDatasource;
    const currentDatadestination = jobDatadestination;
    const currentConfigSourcePath = config.sourcePath;

    // Check if any relevant value has changed
    const hasChanged = 
      prevJobDataRef.current.datasource !== currentDatasource ||
      prevJobDataRef.current.datadestination !== currentDatadestination ||
      prevJobDataRef.current.configSourcePath !== currentConfigSourcePath;

    if (hasChanged) {
      console.log('🔄 Detected change in job/config data, reloading data sources...', {
        oldDatasource: prevJobDataRef.current.datasource,
        newDatasource: currentDatasource,
        oldDestination: prevJobDataRef.current.datadestination,
        newDestination: currentDatadestination,
        oldConfigPath: prevJobDataRef.current.configSourcePath,
        newConfigPath: currentConfigSourcePath,
      });

      // Update the ref with current values
      prevJobDataRef.current = {
        datasource: currentDatasource,
        datadestination: currentDatadestination,
        configSourcePath: currentConfigSourcePath,
      };

      // Reload data sources with new data
      clearLocalStorage();
      loadDataSources();
    }
  }, [jobDatasource, jobDatadestination, config.sourcePath, config.destinationPath]);

  // Update config when dataSources change
  useEffect(() => {
    if (onConfigChange && dataSources.length > 0) {
      onConfigChange({
        ...config,
        dataSources: dataSources,
        status: 'configured'
      });
    }
  }, [dataSources]);

  const getBucketFromExistingSources = (): string => {
    const s3Source = dataSources.find(source => source.type === "S3 Bucket" && source.bucketName);
    if (s3Source?.bucketName) {
      return s3Source.bucketName;
    }

    if (jobDatasource) {
      return getBucketFromS3Path(jobDatasource.split(",")[0]);
    }

    const selectedFiles = JSON.parse(localStorage.getItem("selectedFiles") || "[]");
    if (selectedFiles.length > 0 && selectedFiles[0].bucket) {
      return selectedFiles[0].bucket;
    }

    return "";
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      const file = files[0];
      if (!file.name.endsWith('.py')) {
        toast({
          title: "Invalid File Type",
          description: "Please select a Python (.py) file.",
          variant: "destructive",
        });
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleUploadLocalFile = async () => {
    if (!selectedFile) {
      toast({
        variant: "destructive",
        title: "No File Selected",
        description: "Please select a file first",
      });
      return;
    }

    const getUserId = () => {
      const userId = localStorage.getItem("userId");
      if (userId) return userId;
      
      const token = localStorage.getItem("authToken");
      if (token) {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          return payload.user_id || payload.sub || payload.id;
        } catch (e) {
          console.warn("Could not extract user ID from token");
        }
      }
      
      return "default-user";
    };

    setIsUploading(true);
    
    try {
      const userId = getUserId();
      console.log("Uploading file:", selectedFile.name, "for user:", userId);
      
      const uploadResponse = await uploadFile(selectedFile, userId, "scripts");
      
      if (uploadResponse.success && uploadResponse.s3_path) {
        const existingSource = dataSources.find(
          source => source.fileName === selectedFile.name && source.type === "Local File"
        );
        
        if (existingSource) {
          toast({
            title: "File Already Uploaded",
            description: `${selectedFile.name} is already in your sources`,
            variant: "destructive",
          });
          setIsUploading(false);
          return;
        }

        const preferredOutput = jobDatadestination || config.destinationPath || "";
        const inputPath = uploadResponse.s3_path;
        const bucketName = getBucketFromS3Path(inputPath);
        const fileName = selectedFile.name;
        const baseName = getFileNameWithoutExtension(fileName);
        const isMultiple = dataSources.length > 0;

        let outputPath: string;
        if (preferredOutput) {
          if (isMultiple || preferredOutput.endsWith('/')) {
            const dir = preferredOutput.endsWith('/') ? preferredOutput : `${preferredOutput}/`;
            outputPath = `${dir}${baseName}.parquet`;
          } else {
            outputPath = preferredOutput;
          }
        } else {
          outputPath = `s3://${bucketName}/parquet/${baseName}.parquet`;
        }

        const newDataSource: DataSource = {
          id: `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          name: `Local File - ${selectedFile.name}`,
          type: "Local File",
          status: "Connected",
          fileName: selectedFile.name,
          inputPath: inputPath,
          outputPath: outputPath,
          localFile: selectedFile,
          s3Path: uploadResponse.s3_path,
        };

        setDataSources(prev => [...prev, newDataSource]);
        
        toast({
          title: "Upload Successful",
          description: `${selectedFile.name} uploaded successfully`,
        });
        
        setSelectedFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } else {
        throw new Error(uploadResponse.message || "Upload failed");
      }
      
    } catch (error: any) {
      console.error("Upload error:", error);
      toast({
        variant: "destructive",
        title: "Upload Failed",
        description: error.message || "Failed to upload the file. Please try again.",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleBrowseS3 = async () => {
    setIsConnecting(true);
    try {
      const bucketData = await getBuckets();
      if (Array.isArray(bucketData)) {
        const formattedBuckets = bucketData.map((name: string) => ({ name }));
        setBuckets(formattedBuckets);
      } else {
        setBuckets([]);
        toast({
          title: "Warning",
          description: "Unexpected bucket data format.",
          variant: "destructive",
        });
      }
      setShowS3Browser(true);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch buckets",
        variant: "destructive",
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const handleSelectBucket = async (bucketName: string) => {
    setSelectedBucket(bucketName);
    setCurrentPath("");
    try {
      const objectData = await getObjects(bucketName, "");
      setObjects(objectData || []);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to fetch bucket contents: ${error instanceof Error ? error.message : "Unknown error"}`,
      });
      setObjects([]);
    }
    setSelectedItem(null);
  };

  const handleS3Navigation = async (item: string, isFolder: boolean) => {
    if (item === "..") {
      const parts = currentPath.split("/").filter((p) => p);
      if (parts.length === 0) {
        setSelectedBucket("");
        setCurrentPath("");
        setObjects([]);
        try {
          const bucketData = await getBuckets();
          if (Array.isArray(bucketData)) {
            const formattedBuckets = bucketData.map((name: string) => ({ name }));
            setBuckets(formattedBuckets);
          }
        } catch (error) {
          console.error("Error fetching buckets:", error);
        }
      } else {
        parts.pop();
        const newPath = parts.join("/") + (parts.length > 0 ? "/" : "");
        setCurrentPath(newPath);
        try {
          const objectData = await getObjects(selectedBucket, newPath);
          setObjects(objectData || []);
        } catch (error) {
          console.error("Error navigating back:", error);
        }
      }
    } else if (isFolder) {
      const newPath = (currentPath || "") + item + "/";
      setCurrentPath(newPath);
      try {
        const objectData = await getObjects(selectedBucket, newPath);
        setObjects(objectData || []);
      } catch (error) {
        console.error("Error navigating into folder:", error);
      }
    } else {
      const fileKey = (currentPath || "") + item;
      const fileName = fileKey.split('/').pop() || fileKey;
      const baseName = getFileNameWithoutExtension(fileName);
      const preferredOutput = jobDatadestination || config.destinationPath || "";
      const isMultiple = dataSources.length > 0;

      let outputPath: string;
      if (preferredOutput) {
        if (isMultiple || preferredOutput.endsWith('/')) {
          const dir = preferredOutput.endsWith('/') ? preferredOutput : `${preferredOutput}/`;
          outputPath = `${dir}${baseName}.parquet`;
        } else {
          outputPath = preferredOutput;
        }
      } else {
        outputPath = `s3://${selectedBucket}/parquet/${baseName}.parquet`;
      }
      
      const existingSource = dataSources.find(
        source => source.inputPath === `s3://${selectedBucket}/${fileKey}`
      );
      
      if (existingSource) {
        toast({
          title: "File Already Selected",
          description: `${selectedBucket}/${fileKey} is already in your sources`,
          variant: "destructive",
        });
        return;
      }

      const newId = `s3-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      const newDataSource: DataSource = {
        id: newId,
        name: `S3 Data - ${fileName}`,
        type: "S3 Bucket",
        status: "Connected",
        bucketName: selectedBucket,
        fileName: fileKey,
        inputPath: `s3://${selectedBucket}/${fileKey}`,
        outputPath: outputPath,
      };

      setDataSources(prev => [...prev, newDataSource]);
      
      setShowS3Browser(false);
      toast({
        title: "S3 File Added",
        description: `Added: ${selectedBucket}/${fileKey}`,
      });
    }
    setSelectedItem(null);
  };

  const handleRemoveDataSource = (sourceId: string) => {
    const sourceToRemove = dataSources.find(source => source.id === sourceId);
    
    if (sourceToRemove) {
      setDataSources(prev => prev.filter(source => source.id !== sourceId));
      
      toast({
        title: "Data Source Removed",
        description: `Removed: ${sourceToRemove.name}`,
      });
    }
  };

  const Breadcrumbs = () => {
    return (
      <div className="flex flex-wrap items-center gap-1 text-sm text-muted-foreground mb-2">
        <span
          onClick={async () => {
            setSelectedBucket("");
            setCurrentPath("");
            setObjects([]);
            setSelectedItem(null);
            try {
              const bucketData = await getBuckets();
              if (Array.isArray(bucketData)) {
                const formattedBuckets = bucketData.map((name: string) => ({ name }));
                setBuckets(formattedBuckets);
              }
            } catch (error) {
              console.error("Error resetting to root:", error);
            }
          }}
          className="cursor-pointer hover:underline flex items-center"
        >
          <Folder className="w-4 h-4 mr-1" /> Root
        </span>
        {selectedBucket && (
          <>
            <ChevronRight className="w-4 h-4" />
            <span
              onClick={async () => {
                setCurrentPath("");
                setSelectedItem(null);
                try {
                  const objectData = await getObjects(selectedBucket, "");
                  setObjects(objectData || []);
                } catch (error) {
                  console.error("Error navigating to bucket root:", error);
                }
              }}
              className="cursor-pointer hover:underline"
            >
              {selectedBucket}
            </span>
          </>
        )}
        {currentPath &&
          currentPath
            .split("/")
            .filter((p) => p)
            .map((part, idx, arr) => (
              <div key={idx} className="flex items-center">
                <ChevronRight className="w-4 h-4" />
                <span
                  onClick={async () => {
                    const newPath = arr.slice(0, idx + 1).join("/") + "/";
                    setCurrentPath(newPath);
                    setSelectedItem(null);
                    try {
                      const objectData = await getObjects(selectedBucket, newPath);
                      setObjects(objectData || []);
                    } catch (error) {
                      console.error("Error navigating to path:", error);
                    }
                  }}
                  className="cursor-pointer hover:underline"
                >
                  {part}
                </span>
              </div>
            ))}
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Cloud className="w-5 h-5" />
          Data Transformation Sources
        </CardTitle>
        <CardDescription>
          Select input data sources for ETL processing
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Upload Toggle */}
        <div className="flex items-center gap-4">
          <Switch
            checked={isUploadToggleOn}
            onCheckedChange={setIsUploadToggleOn}
          />
          <div className="space-y-1">
            <Label>Upload File</Label>
            <p className="text-xs text-muted-foreground">
              Enable to upload files
            </p>
          </div>
        </div>

        {/* Show Browse S3 and Upload Section when toggle is ON */}
        {isUploadToggleOn && (
          <div className="space-y-4">
            {/* Browse S3 Button */}
            <Button
              onClick={handleBrowseS3}
              disabled={isConnecting}
              variant="outline"
              className="w-full flex items-center gap-2"
            >
              <Cloud className="w-4 h-4" />
              Browse S3
            </Button>

            {/* Upload from Local Section */}
            <div className="space-y-4">
              <div className="border-2 border-dashed rounded-lg p-6 text-center">
                <Input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  accept=".py"
                  className="hidden"
                />
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  variant="outline"
                  className="flex items-center gap-2 mx-auto"
                >
                  <Upload className="w-4 h-4" />
                  Upload from local (.py) File
                </Button>
              </div>

              {selectedFile && (
                <div className="p-4 border rounded-lg bg-muted/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      <span className="text-sm truncate max-w-xs">{selectedFile.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        onClick={handleUploadLocalFile}
                        disabled={isUploading}
                        size="sm"
                        className="flex items-center gap-1"
                      >
                        <Upload className="w-3 h-3" />
                        {isUploading ? "Uploading..." : "Upload"}
                      </Button>
                      <Button 
                        onClick={() => {
                          setSelectedFile(null);
                          if (fileInputRef.current) {
                            fileInputRef.current.value = '';
                          }
                        }}
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-1"
                      >
                        <X className="w-3 h-3" />
                        Cancel
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Data Sources List */}
        <div className="max-h-64 overflow-y-auto space-y-2">
          {dataSources.map((source) => (
            <div key={source.id} className="p-3 border rounded-lg bg-background">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="rounded-full p-2 bg-muted">
                    <FileText className="w-4 h-4 text-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{source.name}</p>
                    {source.type === "S3 Bucket" && (
                      <>
                        <p className="text-xs text-muted-foreground truncate">Bucket: {source.bucketName || "N/A"}</p>
                        <p className="text-xs text-muted-foreground truncate">File: {source.fileName || "N/A"}</p>
                        <p className="text-xs text-green-600 truncate">Output: {source.outputPath}</p>
                      </>
                    )}
                    {source.type === "Local File" && (
                      <>
                        <p className="text-xs text-muted-foreground truncate">File: {source.fileName || "N/A"}</p>
                        {source.s3Path && (
                          <p className="text-xs text-muted-foreground truncate">Uploaded to: {source.s3Path}</p>
                        )}
                        <p className="text-xs text-green-600 truncate">Output: {source.outputPath}</p>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    className={cn(
                      "text-white text-xs",
                      source.status === "Connected" && "bg-green-500 hover:bg-green-600",
                      source.status === "Error" && "bg-red-500 hover:bg-red-600",
                      source.status === "Pending" && "bg-yellow-500 hover:bg-yellow-600"
                    )}
                  >
                    {source.status}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                    onClick={() => handleRemoveDataSource(source.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
          {dataSources.length === 0 && (
            <div className="p-6 text-center text-muted-foreground border rounded-lg border-dashed">
              <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No sources added yet</p>
              <p className="text-xs">Enable "Upload File" to browse S3 or upload local files</p>
            </div>
          )}
        </div>
      </CardContent>

      {/* S3 Browser Dialog */}
      <Dialog open={showS3Browser} onOpenChange={setShowS3Browser}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Browse S3 Buckets</DialogTitle>
            <DialogDescription>Select a file from S3 for transformation.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Breadcrumbs />
            <div className="border rounded-lg max-h-96 overflow-y-auto">
              {!selectedBucket ? (
                buckets.length > 0 ? (
                  buckets.map((bucket) => (
                    <div
                      key={bucket.name}
                      className={`flex items-center gap-3 p-3 hover:bg-primary/10 cursor-pointer border-b last:border-b-0 ${
                        selectedItem === bucket.name ? "bg-primary/20 border-primary/50" : ""
                      }`}
                      onDoubleClick={() => handleSelectBucket(bucket.name)}
                      onClick={() => setSelectedItem(bucket.name)}
                    >
                      <Folder className="w-4 h-4 text-blue-500" />
                      <div className="flex-1 font-medium">{bucket.name}</div>
                    </div>
                  ))
                ) : (
                  <div className="p-3 text-center text-muted-foreground">
                    No buckets available.
                  </div>
                )
              ) : (
                <>
                  <div
                    className="flex items-center gap-3 p-3 hover:bg-primary/10 cursor-pointer border-b last:border-b-0"
                    onDoubleClick={() => handleS3Navigation("..", true)}
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
                            selectedItem === obj.key ? "bg-primary/20 border-primary/50" : ""
                          }`}
                          onDoubleClick={() => handleS3Navigation(obj.key, isFolder)}
                          onClick={() => setSelectedItem(obj.key)}
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
                      No objects available.
                    </div>
                  )}
                </>
              )}
            </div>
            {selectedBucket && selectedItem && !selectedItem.endsWith("/") && (
              <Button
                onClick={() => handleS3Navigation(selectedItem, false)}
                className="w-fit flex items-center gap-2"
              >
                Select {selectedItem}
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}