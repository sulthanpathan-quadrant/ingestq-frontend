import React, { useState, useCallback, useRef, useEffect } from "react";
import * as XLSX from "xlsx";
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
  ChevronRight,
  CloudCog,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { getBuckets, getObjects, getFile, getAzureContainers, getAzureBlobs, getAzureBlobFile, getOneLakeWorkspaces, getOneLakeLakehouses, getOneLakeContents, getOneLakeFile, getDatabaseTables } from "@/lib/api";

interface SourceConfig {
  connectionString?: string;
  username?: string;
  password?: string;
  port?: string;
  bucket?: string;
  currentPath?: string;
  databaseName?: string;
  workspace?: string;
  lakehouse?: string;
}

interface DestinationConfig {
  type: string;
  connectionString?: string;
  username?: string;
  password?: string;
  port?: string;
  bucket?: string;
  currentPath?: string;
  workspace?: string;
  lakehouse?: string;
}

interface Bucket {
  name: string;
}

interface Object {
  key: string;
  isFolder?: boolean;
}

interface OneLakeResponse {
  folders?: string[];
  files?: { name: string; size: string }[];
  current_path: string;
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
  const [sourceSelectedItem, setSourceSelectedItem] = useState<string | null>(null);
  const [destSelectedItem, setDestSelectedItem] = useState<string | null>(null);
  const [sourceDBSelectedTable, setSourceDBSelectedTable] = useState<string>("");
  const [excelSheets, setExcelSheets] = useState<string[]>([]);
  const [selectedSheet, setSelectedSheet] = useState<string>("");
  const [showSheetSelector, setShowSheetSelector] = useState<boolean>(false);
  const [currentExcelFile, setCurrentExcelFile] = useState<File | null>(null);
  const [databaseTables, setDatabaseTables] = useState<string[]>([]);
  const [buckets, setBuckets] = useState<Bucket[]>([]);
  const [objects, setObjects] = useState<Object[]>([]);
  const [cloudFileKey, setCloudFileKey] = useState<string>("");
  const [isLoadingLakehouses, setIsLoadingLakehouses] = useState<boolean>(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const summaryRef = useRef<HTMLDivElement>(null);

  const dataSources = [
    { value: "local", label: "Local", icon: HardDrive },
    { value: "s3", label: "S3", icon: Cloud },
    { value: "azure-blob", label: "Azure Blob", icon: CloudRain },
    { value: "onelake", label: "OneLake", icon: CloudCog },
    { value: "database", label: "Database", icon: Server },
  ];

  const destinations = [
    { value: "s3", label: "S3", icon: Cloud },
    { value: "azure-blob", label: "Azure Blob", icon: Database },
    { value: "onelake", label: "OneLake", icon: CloudCog },
    { value: "database", label: "Database", icon: Server }
  ];

  const mockTables = ["customers", "orders", "products", "employees", "departments"];

  useEffect(() => {
    localStorage.removeItem("selectedBucket");
    localStorage.removeItem("selectedFile");
    localStorage.removeItem("selectedDestFolder");
    localStorage.removeItem("selectedDestBucket");
    localStorage.removeItem("selectedSheet");
    setSelectedSource("");
    setSelectedDestination("");
    setSourceConfig({});
    setDestinationConfig({ type: "" });
    setSelectedSourcePath("");
    setSelectedDestPath("");
    setIsSourceConnected(false);
    setIsDestConnected(false);
    setUploadedFiles([]);
    setSourceDBSelectedTable("");
    setObjects([]);
    setBuckets([]);
    setExcelSheets([]);
    setSelectedSheet("");
    setCurrentExcelFile(null);
    setDatabaseTables([]);
  }, []);

  useEffect(() => {
    if (selectedSourcePath) setIsSourceConnected(true);
    else setIsSourceConnected(false);
  }, [selectedSourcePath]);

  useEffect(() => {
    if (selectedDestPath) setIsDestConnected(true);
    else setIsDestConnected(false);
  }, [selectedDestPath]);

  const isSupportedDataFile = (filename: string): boolean => {
    const extension = filename.toLowerCase().split('.').pop();
    return extension === 'xlsx' || extension === 'xls' || extension === 'xlsm' || 
           extension === 'csv' || extension === 'parquet';
  };

  const isExcelFile = (filename: string): boolean => {
    const extension = filename.toLowerCase().split('.').pop();
    return extension === 'xlsx' || extension === 'xls' || extension === 'xlsm';
  };

  const isCSVFile = (filename: string): boolean => {
    const extension = filename.toLowerCase().split('.').pop();
    return extension === 'csv';
  };

  const isParquetFile = (filename: string): boolean => {
    const extension = filename.toLowerCase().split('.').pop();
    return extension === 'parquet';
  };

  const extractExcelSheets = async (file: File): Promise<string[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          resolve(workbook.SheetNames);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsArrayBuffer(file);
    });
  };
// Add this function to your component (place it near other handler functions like handleConnect, handleSelectBucket, etc.)

const handleRemoveSourcePath = () => {
  setSelectedSourcePath("");
  setIsSourceConnected(false);
  setSourceConfig({});
  setUploadedFiles([]);
  setExcelSheets([]);
  setSelectedSheet("");
  setCurrentExcelFile(null);
  setSourceDBSelectedTable("");
  setDatabaseTables([]);
  localStorage.removeItem("selectedFile");
  localStorage.removeItem("selectedBucket");
  localStorage.removeItem("selectedSheet");
};

// Also add this function for removing destination path (if you need it):
const handleRemoveDestPath = () => {
  setSelectedDestPath("");
  setIsDestConnected(false);
  setDestinationConfig({ type: selectedDestination });
  localStorage.removeItem("selectedDestFolder");
  localStorage.removeItem("selectedDestBucket");
};
  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const dataFiles = acceptedFiles.filter(file => isSupportedDataFile(file.name));

      if (dataFiles.length === 0) {
        toast({ 
          title: "Invalid File Type", 
          description: "Please select Excel (.xlsx, .xls, .xlsm), CSV (.csv), or Parquet (.parquet) files", 
          variant: "destructive" 
        });
        return;
      }

      if (dataFiles.length > 1) {
        toast({ 
          title: "Multiple Files Detected", 
          description: "Please select only one file at a time", 
          variant: "destructive" 
        });
        return;
      }

      const dataFile = dataFiles[0];
      setUploadedFiles([dataFile]);
      setCurrentExcelFile(dataFile);

      if (isExcelFile(dataFile.name)) {
        try {
          toast({ title: "Reading Excel File", description: "Extracting sheet names..." });
          const sheets = await extractExcelSheets(dataFile);
          setExcelSheets(sheets);
          setShowSheetSelector(true);
        } catch (error) {
          toast({ 
            title: "Error", 
            description: "Failed to read Excel file. Please ensure it's a valid Excel file.", 
            variant: "destructive" 
          });
        }
      } else {
        const filePath = dataFile.name;
        setSelectedSourcePath(filePath);
        setIsSourceConnected(true);
        setShowSourceBrowser(false);
        localStorage.setItem("selectedBucket", "local");
        localStorage.setItem("selectedFile", dataFile.name);
        localStorage.removeItem("selectedSheet");
        
        const fileType = isCSVFile(dataFile.name) ? "CSV" : "Parquet";
        toast({ 
          title: "File Selected", 
          description: `Selected ${fileType} file: ${dataFile.name}` 
        });
      }
    },
    [toast]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.ms-excel.sheet.macroEnabled.12': ['.xlsm'],
      'text/csv': ['.csv'],
      'application/octet-stream': ['.parquet']
    }
  });

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
      let data: any;
      if (selectedSource === "onelake" || selectedDestination === "onelake") {
        data = await getOneLakeWorkspaces();
      } else if (selectedSource === "azure-blob" || selectedDestination === "azure-blob") {
        data = await getAzureContainers();
      } else {
        data = await getBuckets();
      }

      if (Array.isArray(data)) {
        const formattedBuckets = data.map((name: string) => ({ name }));
        setBuckets(formattedBuckets);
      } else {
        setBuckets([]);
        toast({
          title: "Warning",
          description: `Unexpected ${selectedSource === "onelake" || selectedDestination === "onelake" ? "workspace" : selectedSource === "azure-blob" || selectedDestination === "azure-blob" ? "container" : "bucket"} data format.`,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to fetch ${selectedSource === "onelake" || selectedDestination === "onelake" ? "workspaces" : selectedSource === "azure-blob" || selectedDestination === "azure-blob" ? "containers" : "buckets"}.`,
        variant: "destructive",
      });
      setBuckets([]);
    }
  };

  const fetchObjects = async (bucketName: string, prefix?: string) => {
    try {
      let data: Object[] = [];

      if (selectedSource === "onelake" || selectedDestination === "onelake") {
        const config = selectedSource === "onelake" ? sourceConfig : destinationConfig;
        const setConfig = selectedSource === "onelake" ? setSourceConfig : setDestinationConfig;

        if (!config.lakehouse) {
          setIsLoadingLakehouses(true);
          const lakehouses = await getOneLakeLakehouses(bucketName);
          setIsLoadingLakehouses(false);
          
          data = lakehouses.map((lh: string) => ({
            key: lh,
            isFolder: true,
          }));
        } else {
          let effectivePrefix = prefix ?? '';
          if (effectivePrefix.startsWith(`${config.lakehouse}.Lakehouse/`)) {
            effectivePrefix = effectivePrefix.slice(`${config.lakehouse}.Lakehouse/`.length);
          }
          
          const response: OneLakeResponse = await getOneLakeContents(
            bucketName, 
            config.lakehouse, 
            effectivePrefix
          );
          const folders = Array.isArray(response.folders) ? response.folders : [];
          const files = Array.isArray(response.files) ? response.files : [];
          
          const validFiles = files.filter(file => typeof file.name === 'string');
          
          data = [
            ...folders.map((folder: string) => {
              let cleanFolder = folder;
              if (cleanFolder.startsWith(`${config.lakehouse}.Lakehouse/`)) {
                cleanFolder = cleanFolder.slice(`${config.lakehouse}.Lakehouse/`.length);
              }
              return {
                key: cleanFolder,
                isFolder: true,
              };
            }),
            ...validFiles.map((file: { name: string; size: string }) => {
              let cleanFile = file.name;
              if (cleanFile.startsWith(`${config.lakehouse}.Lakehouse/`)) {
                cleanFile = cleanFile.slice(`${config.lakehouse}.Lakehouse/`.length);
              }
              return {
                key: cleanFile,
                isFolder: false,
              };
            }),
          ];

          const lakehousePrefix = `${config.lakehouse}.Lakehouse/`;
          let normalizedPath = response.current_path;
          if (normalizedPath.startsWith(lakehousePrefix)) {
            normalizedPath = normalizedPath.slice(lakehousePrefix.length);
          }
          normalizedPath = normalizedPath.replace(/\/+$/, '');
          setConfig((prev) => ({
            ...prev,
            currentPath: normalizedPath,
          }));
        }
      } else if (selectedSource === "azure-blob" || selectedDestination === "azure-blob") {
        data = await getAzureBlobs(bucketName, prefix);
      } else {
        data = await getObjects(bucketName, prefix);
      }

      setObjects(data || []);
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to fetch ${selectedSource === "onelake" || selectedDestination === "onelake" ? "contents" : selectedSource === "azure-blob" || selectedDestination === "azure-blob" ? "blobs" : "objects"}: ${error instanceof Error ? error.message : "Unknown error"}`,
        variant: "destructive",
      });
      setObjects([]);
    }
  };

  const fetchExcelSheetsFromCloud = async (workspace: string, lakehouse: string, fileKey: string) => {
    try {
      toast({ title: "Reading Excel File", description: "Extracting sheet names..." });
      
      let fileData: Blob;
      if (selectedSource === "onelake") {
        fileData = await getOneLakeFile(workspace, lakehouse, fileKey);
      } else if (selectedSource === "azure-blob") {
        fileData = await getAzureBlobFile(workspace, fileKey);
      } else {
        fileData = await getFile(workspace, fileKey);
      }
      
      const arrayBuffer = await fileData.arrayBuffer();
      const data = new Uint8Array(arrayBuffer);
      const workbook = XLSX.read(data, { type: 'array' });
      setExcelSheets(workbook.SheetNames);
      setShowSheetSelector(true);
    } catch (error) {
      toast({ 
        title: "Error", 
        description: "Failed to read Excel file from cloud storage.", 
        variant: "destructive" 
      });
    }
  };

const handleS3Navigation = async (item: string, isFolder: boolean, type: "source" | "destination") => {
  const config = type === "source" ? sourceConfig : destinationConfig;
  const setConfig = type === "source" ? setSourceConfig : setDestinationConfig;
  const setSelectedPath = type === "source" ? setSelectedSourcePath : setSelectedDestPath;
  const setIsConnected = type === "source" ? setIsSourceConnected : setIsDestConnected;
  const setShowBrowser = type === "source" ? setShowSourceBrowser : setShowDestBrowser;
  const setSelectedItem = type === "source" ? setSourceSelectedItem : setDestSelectedItem;
  const prefix = type === "source" ? selectedSource : selectedDestination;

  try {
    if (prefix === "onelake") {
      if (item === "..") {
        setSelectedPath("");
        setIsConnected(false);
        if (type === "source") {
          localStorage.removeItem("selectedFile");
          localStorage.removeItem("selectedSheet");
        } else {
          localStorage.removeItem("selectedDestFolder");
        }

        if (!config.workspace) {
          setConfig((prev) => ({ ...prev, workspace: undefined, lakehouse: undefined, currentPath: "" }));
          setObjects([]);
          if (type === "source") {
            localStorage.removeItem("selectedBucket");
          } else {
            localStorage.removeItem("selectedDestBucket");
          }
          await fetchBuckets(type);
          return;
        }
        
        if (!config.lakehouse) {
          setConfig((prev) => ({ ...prev, workspace: undefined, lakehouse: undefined, currentPath: "" }));
          setObjects([]);
          if (type === "source") {
            localStorage.removeItem("selectedBucket");
          } else {
            localStorage.removeItem("selectedDestBucket");
          }
          await fetchBuckets(type);
          return;
        }

        let currentPath = config.currentPath || '';
        if (currentPath.startsWith(`${config.lakehouse}.Lakehouse/`)) {
          currentPath = currentPath.slice(`${config.lakehouse}.Lakehouse/`.length);
        }
        const lakehouseName = config.lakehouse;
        if (currentPath.includes(`${lakehouseName}/${lakehouseName}`)) {
          currentPath = currentPath.replace(new RegExp(`${lakehouseName}/${lakehouseName}`, 'g'), lakehouseName);
        }
        const parts = currentPath.split('/').filter((p) => p);
        
        // FIX: When at Files level, go back to lakehouses list (keep workspace, clear lakehouse)
        if (parts.length === 0 || (parts.length === 1 && parts[0] === 'Files')) {
          setConfig((prev) => ({ ...prev, lakehouse: undefined, currentPath: "" }));
          setSelectedPath("");
          setIsConnected(false);
          if (type === "source") {
            localStorage.removeItem("selectedFile");
            localStorage.removeItem("selectedSheet");
          } else {
            localStorage.removeItem("selectedDestFolder");
          }
          
          // Fetch lakehouses for the workspace
          setIsLoadingLakehouses(true);
          try {
            const lakehouses = await getOneLakeLakehouses(config.workspace!);
            const lakehouseObjects = lakehouses.map((lh: string) => ({
              key: lh,
              isFolder: true,
            }));
            setObjects(lakehouseObjects);
          } catch (error) {
            toast({
              title: "Error",
              description: `Failed to fetch lakehouses: ${error instanceof Error ? error.message : "Unknown error"}`,
              variant: "destructive",
            });
            setObjects([]);
          } finally {
            setIsLoadingLakehouses(false);
          }
          return;
        }
        
        parts.pop();
        const newPath = parts.join('/');
        setConfig((prev) => ({ ...prev, currentPath: newPath }));
        await fetchObjects(config.workspace!, newPath);
      } else if (isFolder && !config.lakehouse) {
        // Selecting a lakehouse, auto-navigate to 'Files'
        const newLakehouse = item;
        setConfig((prev) => ({
          ...prev,
          lakehouse: newLakehouse,
          currentPath: "Files",
        }));

        const workspaceToUse = config.workspace;

        try {
          // Fetch lakehouse contents
          const response: OneLakeResponse = await getOneLakeContents(
            workspaceToUse!,
            newLakehouse,
            "Files"
          );

          const folders = Array.isArray(response.folders) ? response.folders : [];
          const files = Array.isArray(response.files) ? response.files : [];

          const validFiles = files.filter(file => typeof file.name === 'string');

          const data = [
            ...folders.map((folder: string) => ({
              key: folder,
              isFolder: true,
            })),
            ...validFiles.map((file: { name: string; size: string }) => ({
              key: file.name,
              isFolder: false,
            })),
          ];

          setObjects(data);
        } catch (error) {
          toast({
            title: "Error",
            description: `Failed to load lakehouse contents: ${
              error instanceof Error ? error.message : "Unknown error"
            }`,
            variant: "destructive",
          });
        }

        setSelectedPath("");
        setIsConnected(false);
        if (type === "source") {
          localStorage.removeItem("selectedFile");
          localStorage.removeItem("selectedSheet");
        } else {
          localStorage.removeItem("selectedDestFolder");
        }

        setSelectedItem(null);
        return;
      } else if (isFolder) {
        let currentPath = config.currentPath || '';
        if (currentPath.startsWith(`${config.lakehouse}.Lakehouse/`)) {
          currentPath = currentPath.slice(`${config.lakehouse}.Lakehouse/`.length);
        }
        let cleanItem = item;
        if (item.startsWith(`${config.lakehouse}.Lakehouse/`)) {
          cleanItem = item.slice(`${config.lakehouse}.Lakehouse/`.length);
        }
        if (cleanItem.startsWith('Files/')) {
          cleanItem = cleanItem.slice(6);
        }
        if (cleanItem === config.lakehouse) {
          toast({
            title: "Invalid Navigation",
            description: "Cannot navigate into lakehouse name. Please select a folder inside Files.",
            variant: "destructive",
          });
          return;
        }
        const newPath = currentPath ? `${currentPath}/${cleanItem}` : cleanItem;
        setConfig((prev) => ({ ...prev, currentPath: newPath }));
        await fetchObjects(config.workspace!, newPath);
        setSelectedPath("");
        setIsConnected(false);
        if (type === "source") {
          localStorage.removeItem("selectedFile");
          localStorage.removeItem("selectedSheet");
        } else {
          localStorage.removeItem("selectedDestFolder");
        }
      } else {
        if (type === "source" && !isSupportedDataFile(item)) {
          toast({
            title: "Invalid File Type",
            description: "Please select Excel (.xlsx, .xls, .xlsm), CSV (.csv), or Parquet (.parquet) files",
            variant: "destructive",
          });
          setSelectedItem(null);
          return;
        }
        let currentPath = config.currentPath || '';
        if (currentPath.startsWith(`${config.lakehouse}.Lakehouse/`)) {
          currentPath = currentPath.slice(`${config.lakehouse}.Lakehouse/`.length);
        }
        let cleanItem = item;
        if (item.startsWith(`${config.lakehouse}.Lakehouse/`)) {
          cleanItem = item.slice(`${config.lakehouse}.Lakehouse/`.length);
        }
        const fileKey = currentPath ? `${currentPath}/${cleanItem}` : cleanItem;
        if (type === "source") {
          setCurrentExcelFile({ name: item } as File);
          setCloudFileKey(fileKey);
          const fullPath = `${prefix}://${config.workspace}/${config.lakehouse}/${fileKey}`;
          if (isExcelFile(item)) {
            await fetchExcelSheetsFromCloud(config.workspace!, config.lakehouse!, fileKey);
          } else {
            setSelectedSourcePath(fullPath);
            setIsSourceConnected(true);
            setShowBrowser(false);
            localStorage.setItem("selectedBucket", config.workspace!);
            localStorage.setItem("selectedFile", item);
            localStorage.removeItem("selectedSheet");
            const fileType = isCSVFile(item) ? "CSV" : isParquetFile(item) ? "Parquet" : "file";
            toast({ title: "File Selected", description: `Selected ${fileType}: ${fullPath}` });
          }
        } else {
          const fullPath = `${prefix}://${config.workspace}/${config.lakehouse}/${fileKey}`;
          setSelectedPath(fullPath);
          setIsConnected(true);
          localStorage.setItem("selectedDestFolder", fileKey);
          setShowBrowser(false);
          toast({ title: "Folder Selected", description: `Selected: ${fullPath}` });
        }
      }
      setSelectedItem(null);
      return;
    }

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
        await fetchObjects(config.bucket!, newPath);
        setSelectedPath("");
        setIsConnected(false);
        if (type === "source") {
          localStorage.removeItem("selectedFile");
        } else {
          localStorage.removeItem("selectedDestFolder");
        }
      }
    } else if (isFolder) {
      const cleanItem = item.endsWith('/') ? item : item + '/';
      const currentPath = config.currentPath || "";
      const newPath = item.includes(currentPath) ? item : currentPath + cleanItem;
      setConfig((prev) => ({ ...prev, currentPath: newPath }));
      await fetchObjects(config.bucket!, newPath);
      setSelectedPath("");
      setIsConnected(false);
      if (type === "source") {
        localStorage.removeItem("selectedFile");
      } else {
        localStorage.removeItem("selectedDestFolder");
      }
    } else {
      const currentPath = config.currentPath || "";
      const fileKey = item.includes(currentPath) ? item : currentPath + item;
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
  } catch (error) {
    console.error(`Navigation failed for ${type}:`, error);
    toast({
      title: "Navigation Error",
      description: `Failed to navigate: ${error instanceof Error ? error.message : "Unknown error"}`,
      variant: "destructive",
    });
  }
};

  const handleSelectBucket = async (bucket: string, type: "source" | "destination") => {
    const setConfig = type === "source" ? setSourceConfig : setDestinationConfig;
    const setSelectedPath = type === "source" ? setSelectedSourcePath : setSelectedDestPath;
    const setIsConnected = type === "source" ? setIsSourceConnected : setIsDestConnected;
    const setSelectedItem = type === "source" ? setSourceSelectedItem : setDestSelectedItem;

    if (selectedSource === "onelake" || selectedDestination === "onelake") {
      setConfig((prev) => ({
        ...prev,
        workspace: bucket,
        lakehouse: undefined,
        currentPath: "",
      }));

      try {
        await fetchObjects(bucket, "");
      } catch (error) {
        toast({
          title: "Error",
          description: `Failed to fetch objects: ${error instanceof Error ? error.message : "Unknown error"}`,
          variant: "destructive",
        });
      }
    } else {
      setConfig((prev) => ({ ...prev, bucket, currentPath: "" }));
      try {
        await fetchObjects(bucket, "");
      } catch (error) {
        toast({
          title: "Error",
          description: `Failed to fetch objects: ${error instanceof Error ? error.message : "Unknown error"}`,
          variant: "destructive",
        });
      }
    }

    setSelectedPath("");
    setIsConnected(false);
    if (type === "source") {
      localStorage.setItem("selectedBucket", bucket);
      localStorage.removeItem("selectedFile");
    } else {
      localStorage.setItem("selectedDestBucket", bucket);
      localStorage.removeItem("selectedDestFolder");
    }
    setSelectedItem(null);
  };

  const handleSelectDestinationFolder = () => {
    if (!selectedSourcePath) {
      toast({ title: "Error", description: "Please select a source file first", variant: "destructive" });
      return;
    }
    const sourceFilename = selectedSourcePath.split("/").pop() || "output.csv";
    const destPath = `${selectedDestination}://${destinationConfig.workspace || destinationConfig.bucket}/${destinationConfig.lakehouse ? destinationConfig.lakehouse + "/" : ""}${destinationConfig.currentPath || ""}${destSelectedItem || sourceFilename}`;
    setSelectedDestPath(destPath);
    setIsDestConnected(true);
    localStorage.setItem("selectedDestFolder", destSelectedItem || destinationConfig.currentPath || "");
    setShowDestBrowser(false);
    toast({ title: "Destination Selected", description: `Selected: ${destPath}` });
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
    toast({ title: "Destination Selected", description: `Selected: ${destPath}` });
    scrollToSummary();
  };

  const handleConnect = async (type: "source" | "destination") => {
    if (type === "source") {
      if (selectedSource === "local") {
        setShowSourceBrowser(true);
        toast({ title: "Connection Initiated", description: "Please select a data file to upload" });
      } else if (selectedSource === "s3" || selectedSource === "azure-blob" || selectedSource === "onelake") {
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
        if (!sourceConfig.username || !sourceConfig.password || !sourceConfig.connectionString || !sourceConfig.port || !sourceConfig.databaseName) {
          toast({ title: "Error", description: "Username, Password, Connection String, Port No, and Database Name are required", variant: "destructive" });
          return;
        }
        setIsSourceConnecting(true);
        await new Promise((resolve) => setTimeout(resolve, 1000));
        setDatabaseTables(mockTables);
        setShowSourceDBBrowser(true);
        setIsSourceConnecting(false);
        toast({ title: "Connection Successful", description: "Connected to database successfully" });
      }
    } else {
      if (selectedDestination === "s3" || selectedDestination === "azure-blob" || selectedDestination === "onelake") {
        setIsDestConnecting(true);
        try {
          await fetchBuckets(type);
          setShowDestBrowser(true);
        } catch (error) {
          toast({ title: "Error", description: "Failed to connect. Check console for details.", variant: "destructive" });
        } finally {
          setIsDestConnecting(false);
        }
      }
    }
  };

  const renderSourceFields = () => {
    switch (selectedSource) {
      case "local":
        return (
          <div {...getRootProps()} className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer ${isDragActive ? "border-primary bg-primary/10" : "border-muted"}`}>
            <input {...getInputProps()} />
            <UploadIcon className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Drag & drop your data file here, or click to select</p>
            <p className="text-xs text-muted-foreground mt-1">Supported: Excel, CSV, Parquet</p>
          </div>
        );
      case "s3":
      case "azure-blob":
      case "onelake":
        return (
          <div className="flex justify-start">
            <Button
              onClick={() => handleConnect("source")}
              disabled={isSourceConnecting}
              className="flex items-center gap-2"
            >
              {isSourceConnecting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <ArrowRight className="w-4 h-4" />
              )}
              Connect to {dataSources.find((s) => s.value === selectedSource)?.label}
            </Button>
          </div>
        );
// In your renderSourceFields() function, replace the database case with:

case "database":
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="username">Username</Label>
          <Input
            id="username"
            value={sourceConfig.username || ""}
            onChange={(e) => setSourceConfig((prev) => ({ ...prev, username: e.target.value }))}
            placeholder="Enter username"
          />
        </div>
        <div>
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            value={sourceConfig.password || ""}
            onChange={(e) => setSourceConfig((prev) => ({ ...prev, password: e.target.value }))}
            placeholder="Enter password"
          />
        </div>
        <div>
          <Label htmlFor="connection-string">Connection String</Label>
          <Input
            id="connection-string"
            value={sourceConfig.connectionString || ""}
            onChange={(e) => setSourceConfig((prev) => ({ ...prev, connectionString: e.target.value }))}
            placeholder="Enter connection string"
          />
        </div>
        <div>
          <Label htmlFor="port">Port No</Label>
          <Input
            id="port"
            value={sourceConfig.port || ""}
            onChange={(e) => setSourceConfig((prev) => ({ ...prev, port: e.target.value }))}
            placeholder="Enter port number"
          />
        </div>
        <div className="col-span-2">
          <Label htmlFor="database-name">Database Name</Label>
          <Input
            id="database-name"
            value={sourceConfig.databaseName || ""}
            onChange={(e) => setSourceConfig((prev) => ({ ...prev, databaseName: e.target.value }))}
            placeholder="Enter database name"
          />
        </div>
      </div>
      <Button
        onClick={() => handleConnect("source")}
        disabled={isSourceConnecting || !sourceConfig.username || !sourceConfig.password || !sourceConfig.connectionString || !sourceConfig.port || !sourceConfig.databaseName}
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
      
      {/* ADD THIS SECTION - Display the selected path */}
      {selectedSourcePath && (
        <div className="flex items-center gap-2 p-2 bg-muted rounded-md">
          <div className="flex-1 text-sm truncate">{selectedSourcePath}</div>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleRemoveSourcePath}
          >
            X {/* or use: <X className="w-4 h-4" /> if X icon is imported */}
          </Button>
        </div>
      )}
    </div>
  );
      default:
        return null;
    }
  };

  const renderDestinationFields = () => {
    return (
      <div className="flex justify-start">
        <Button
          onClick={() => handleConnect("destination")}
          disabled={isDestConnecting}
          className="flex items-center gap-2"
        >
          {isDestConnecting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <ArrowRight className="w-4 h-4" />
          )}
          Connect to {destinations.find((d) => d.value === selectedDestination)?.label}
        </Button>
      </div>
    );
  };

  const handleSelectSheet = () => {
    if (!selectedSheet) {
      toast({ title: "Error", description: "Please select a sheet", variant: "destructive" });
      return;
    }
    setShowSheetSelector(false);
    localStorage.setItem("selectedSheet", selectedSheet);
    const fileName = currentExcelFile?.name || "";
    const fullPath = selectedSource === "local" ? fileName : `${selectedSource}://${sourceConfig.workspace || sourceConfig.bucket}/${sourceConfig.lakehouse ? sourceConfig.lakehouse + "/" : ""}${cloudFileKey}`;
    setSelectedSourcePath(`${fullPath}#${selectedSheet}`);
    setIsSourceConnected(true);
    toast({ title: "Sheet Selected", description: `Selected sheet: ${selectedSheet}` });
    scrollToSummary();
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
    navigate("/dashboard/schema");
  };

  const handleGoBack = () => {
    setIsSourceConnected(false);
    setIsDestConnected(false);
    setSelectedSourcePath("");
    setSelectedDestPath("");
  };

  const Breadcrumbs = ({ type }: { type: "source" | "destination" }) => {
    const config = type === "source" ? sourceConfig : destinationConfig;
    const prefix = type === "source" ? selectedSource : selectedDestination;
    const isOneLake = prefix === "onelake";
    const setConfig = type === "source" ? setSourceConfig : setDestinationConfig;
    const setSelectedPath = type === "source" ? setSelectedSourcePath : setSelectedDestPath;
    const setIsConnected = type === "source" ? setIsSourceConnected : setIsDestConnected;
    const setSelectedItem = type === "source" ? setSourceSelectedItem : setDestSelectedItem;

    let path = config.currentPath || "";
    let parts: string[] = path.split("/").filter(p => p);

    const handleBreadcrumbClick = async (idx: number) => {
      try {
        if (isOneLake && config.lakehouse && path.startsWith(`${config.lakehouse}.Lakehouse/`)) {
          const relativePath = path.slice(`${config.lakehouse}.Lakehouse/`.length);
          parts = relativePath.split("/").filter(p => p);
        }
        if (isOneLake) {
          if (idx === -2) {
            setConfig((prev) => ({ ...prev, workspace: undefined, lakehouse: undefined, currentPath: "" }));
            setObjects([]);
            setSelectedPath("");
            setIsConnected(false);
            if (type === "source") {
              localStorage.removeItem("selectedBucket");
              localStorage.removeItem("selectedFile");
              localStorage.removeItem("selectedSheet");
            } else {
              localStorage.removeItem("selectedDestFolder");
              localStorage.removeItem("selectedDestBucket");
            }
            await fetchBuckets(type);
          } else if (idx === -1) {
            const relativePath = "Files";
            setConfig((prev) => ({ ...prev, currentPath: relativePath }));
            setSelectedPath("");
            setIsConnected(false);
            if (type === "source") {
              localStorage.removeItem("selectedFile");
              localStorage.removeItem("selectedSheet");
            } else {
              localStorage.removeItem("selectedDestFolder");
            }
            await fetchObjects(config.workspace!, relativePath);
          } else {
            const newPath = parts.slice(0, idx + 1).join("/");
            setConfig((prev) => ({ ...prev, currentPath: newPath }));
            setSelectedPath("");
            setIsConnected(false);
            if (type === "source") {
              localStorage.removeItem("selectedFile");
              localStorage.removeItem("selectedSheet");
            } else {
              localStorage.removeItem("selectedDestFolder");
            }
            await fetchObjects(config.workspace!, newPath);
          }
        } else {
          if (idx === -2) {
            setConfig((prev) => ({ ...prev, bucket: undefined, currentPath: "" }));
            setObjects([]);
            setSelectedPath("");
            setIsConnected(false);
            if (type === "source") {
              localStorage.removeItem("selectedBucket");
              localStorage.removeItem("selectedFile");
              localStorage.removeItem("selectedSheet");
            } else {
              localStorage.removeItem("selectedDestFolder");
              localStorage.removeItem("selectedDestBucket");
            }
            await fetchBuckets(type);
          } else {
            const newPath = parts.slice(0, idx + 1).join("/") + "/";
            setConfig((prev) => ({ ...prev, currentPath: newPath }));
            setSelectedPath("");
            setIsConnected(false);
            if (type === "source") {
              localStorage.removeItem("selectedFile");
              localStorage.removeItem("selectedSheet");
            } else {
              localStorage.removeItem("selectedDestFolder");
            }
            await fetchObjects(config.bucket!, newPath);
          }
        }
        setSelectedItem(null);
      } catch (error) {
        toast({
          title: "Navigation Error",
          description: `Failed to navigate to the selected path: ${error instanceof Error ? error.message : "Unknown error"}`,
          variant: "destructive",
        });
      }
    };

    return (
      <div className="flex flex-wrap items-center gap-1 text-sm text-muted-foreground mb-2">
        {isOneLake && config.workspace && (
          <div className="flex flex-wrap items-center gap-1">
            <span
              onClick={() => handleBreadcrumbClick(-2)}
              className="cursor-pointer hover:underline"
            >
              {config.workspace}
            </span>
            {config.lakehouse && (
              <div className="flex items-center gap-1">
                <ChevronRight className="w-4 h-4" />
                <span
                  onClick={() => handleBreadcrumbClick(-1)}
                  className="cursor-pointer hover:underline"
                >
                  {config.lakehouse}
                </span>
              </div>
            )}
            {parts.map((part, idx) => (
              <div key={`breadcrumb-${idx}`} className="flex items-center gap-1">
                <ChevronRight className="w-4 h-4" />
                <span
                  onClick={() => handleBreadcrumbClick(idx)}
                  className="cursor-pointer hover:underline"
                >
                  {part}
                </span>
              </div>
            ))}
          </div>
        )}
        {!isOneLake && config.bucket && (
          <div className="flex flex-wrap items-center gap-1">
            <span
              onClick={() => handleBreadcrumbClick(-2)}
              className="cursor-pointer hover:underline"
            >
              {config.bucket}
            </span>
            {parts.map((part, idx) => (
              <div key={`breadcrumb-${idx}`} className="flex items-center gap-1">
                <ChevronRight className="w-4 h-4" />
                <span
                  onClick={() => handleBreadcrumbClick(idx)}
                  className="cursor-pointer hover:underline"
                >
                  {part}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6">Upload Data</h1>

        <Dialog open={showSheetSelector} onOpenChange={setShowSheetSelector}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Select Excel Sheet</DialogTitle>
              <DialogDescription>Choose a sheet from the Excel file to use as data source.</DialogDescription>
            </DialogHeader>
            <Select value={selectedSheet} onValueChange={setSelectedSheet}>
              <SelectTrigger>
                <SelectValue placeholder="Select sheet" />
              </SelectTrigger>
              <SelectContent>
                {excelSheets.map((sheet) => (
                  <SelectItem key={sheet} value={sheet}>
                    {sheet}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={handleSelectSheet} disabled={!selectedSheet}>
              Confirm Sheet
            </Button>
          </DialogContent>
        </Dialog>

        <Dialog
          open={showSourceBrowser}
          onOpenChange={(open) => {
            setShowSourceBrowser(open);
            if (!open) {
              setSourceConfig((prev) => ({ ...prev, bucket: undefined, workspace: undefined, lakehouse: undefined, currentPath: "" }));
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
              <DialogTitle>Browse {selectedSource === "azure-blob" ? "Azure Containers" : selectedSource === "onelake" ? "OneLake Workspaces" : "S3 Buckets"}</DialogTitle>
              <DialogDescription>
                Select a {selectedSource === "azure-blob" ? "container" : selectedSource === "onelake" ? "workspace and lakehouse" : "bucket"} and file for the data source. Supported: Excel, CSV, Parquet files.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <Breadcrumbs type="source" />
              
              <div className="border rounded-lg max-h-96 overflow-y-auto">
                {!sourceConfig.workspace && !sourceConfig.bucket ? (
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
                      No {selectedSource === "azure-blob" ? "containers" : selectedSource === "onelake" ? "workspaces" : "buckets"} available.
                    </div>
                  )
                ) : null}

                {sourceConfig.workspace && !sourceConfig.lakehouse ? (
                  <>
                    <div
                      className="flex items-center gap-3 p-3 hover:bg-primary/10 cursor-pointer border-b"
                      onDoubleClick={() => {
                        setSourceConfig((prev) => ({ ...prev, workspace: undefined, currentPath: "" }));
                        setObjects([]);
                        setSourceSelectedItem(null);
                        fetchBuckets("source");
                      }}
                    >
                      <Folder className="w-4 h-4 text-blue-500" />
                      <div className="flex-1 font-medium">..</div>
                    </div>
                    {isLoadingLakehouses ? (
                      <div className="p-3 text-center text-muted-foreground">
                        <Loader2 className="w-4 h-4 inline animate-spin mr-2" />
                        Loading lakehouses...
                      </div>
                    ) : objects.length > 0 ? (
                      objects.map((obj) => (
                        <div
                          key={obj.key}
                          className={`flex items-center gap-3 p-3 hover:bg-primary/10 cursor-pointer border-b last:border-b-0 ${
                            sourceSelectedItem === obj.key ? "bg-primary/20 border-primary/50" : ""
                          }`}
                          onDoubleClick={() => handleS3Navigation(obj.key, obj.isFolder || false, "source")}
                          onClick={() => setSourceSelectedItem(obj.key)}
                        >
                          <Folder className="w-4 h-4 text-blue-500" />
                          <div className="flex-1 font-medium">{obj.key.split("/").pop() || obj.key}</div>
                        </div>
                      ))
                    ) : (
                      <div className="p-3 text-center text-muted-foreground">
                        No lakehouses available.
                      </div>
                    )}
                  </>
                ) : null}

                {sourceConfig.workspace && sourceConfig.lakehouse ? (
                  <>
                    <div
                      className="flex items-center gap-3 p-3 hover:bg-primary/10 cursor-pointer border-b"
                      onDoubleClick={() => handleS3Navigation("..", true, "source")}
                    >
                      <Folder className="w-4 h-4 text-blue-500" />
                      <div className="flex-1 font-medium">..</div>
                    </div>

                    {objects && objects.length > 0 ? (
                      objects.map((obj) => (
                        <div
                          key={`${sourceConfig.lakehouse}-${obj.key}`}
                          className={`flex items-center gap-3 p-3 hover:bg-primary/10 cursor-pointer border-b last:border-b-0 ${
                            sourceSelectedItem === obj.key ? "bg-primary/20 border-primary/50" : ""
                          }`}
                          onDoubleClick={() => handleS3Navigation(obj.key, obj.isFolder || false, "source")}
                          onClick={() => setSourceSelectedItem(obj.key)}
                        >
                          {obj.isFolder ? (
                            <Folder className="w-4 h-4 text-blue-500" />
                          ) : (
                            <File className="w-4 h-4 text-gray-500" />
                          )}
                          <div className="flex-1 font-medium">{obj.key.split("/").pop() || obj.key}</div>
                        </div>
                      ))
                    ) : (
                      <div className="p-3 text-center text-muted-foreground">
                        No {selectedSource === "azure-blob" ? "blobs" : selectedSource === "onelake" ? "contents" : "objects"} available.
                      </div>
                    )}
                  </>
                ) : null}

                {sourceConfig.bucket && !sourceConfig.lakehouse ? (
                  <>
                    <div
                      className="flex items-center gap-3 p-3 hover:bg-primary/10 cursor-pointer border-b"
                      onDoubleClick={() => {
                        setSourceConfig((prev) => ({ ...prev, bucket: undefined, currentPath: "" }));
                        setObjects([]);
                        setSourceSelectedItem(null);
                        fetchBuckets("source");
                      }}
                    >
                      <Folder className="w-4 h-4 text-blue-500" />
                      <div className="flex-1 font-medium">..</div>
                    </div>
                    {isLoadingLakehouses ? (
                      <div className="p-3 text-center text-muted-foreground">
                        <Loader2 className="w-4 h-4 inline animate-spin mr-2" />
                        Loading contents...
                      </div>
                    ) : objects.length > 0 ? (
                      objects.map((obj) => (
                        <div
                          key={obj.key}
                          className={`flex items-center gap-3 p-3 hover:bg-primary/10 cursor-pointer border-b last:border-b-0 ${
                            sourceSelectedItem === obj.key ? "bg-primary/20 border-primary/50" : ""
                          }`}
                          onDoubleClick={() => handleS3Navigation(obj.key, obj.isFolder || false, "source")}
                          onClick={() => setSourceSelectedItem(obj.key)}
                        >
                          {obj.isFolder ? (
                            <Folder className="w-4 h-4 text-blue-500" />
                          ) : (
                            <File className="w-4 h-4 text-gray-500" />
                          )}
                          <div className="flex-1 font-medium">{obj.key.split("/").pop() || obj.key}</div>
                        </div>
                      ))
                    ) : (
                      <div className="p-3 text-center text-muted-foreground">
                        No {selectedSource === "azure-blob" ? "blobs" : "objects"} available.
                      </div>
                    )}
                  </>
                ) : null}
              </div>

              {(sourceConfig.bucket || sourceConfig.workspace) && sourceSelectedItem && !sourceSelectedItem.endsWith("/") && !sourceConfig.lakehouse && (
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
              setDestinationConfig((prev) => ({ ...prev, bucket: undefined, workspace: undefined, lakehouse: undefined, currentPath: "" }));
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
              <DialogTitle>Browse {selectedDestination === "azure-blob" ? "Azure Containers" : selectedDestination === "onelake" ? "OneLake Workspaces" : "S3 Buckets"}</DialogTitle>
              <DialogDescription>
                Select a {selectedDestination === "azure-blob" ? "container" : selectedDestination === "onelake" ? "workspace and lakehouse" : "bucket"} and folder for the destination.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <Breadcrumbs type="destination" />

              <div className="border rounded-lg max-h-96 overflow-y-auto">
                {!destinationConfig.workspace && !destinationConfig.bucket ? (
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
                      No {selectedDestination === "azure-blob" ? "containers" : selectedDestination === "onelake" ? "workspaces" : "buckets"} available.
                    </div>
                  )
                ) : null}

                {destinationConfig.workspace && !destinationConfig.lakehouse ? (
                  <>
                    <div
                      className="flex items-center gap-3 p-3 hover:bg-primary/10 cursor-pointer border-b"
                      onDoubleClick={() => {
                        setDestinationConfig((prev) => ({ ...prev, workspace: undefined, currentPath: "" }));
                        setObjects([]);
                        setDestSelectedItem(null);
                        fetchBuckets("destination");
                      }}
                    >
                      <Folder className="w-4 h-4 text-blue-500" />
                      <div className="flex-1 font-medium">..</div>
                    </div>
                    {isLoadingLakehouses ? (
                      <div className="p-3 text-center text-muted-foreground">
                        <Loader2 className="w-4 h-4 inline animate-spin mr-2" />
                        Loading lakehouses...
                      </div>
                    ) : objects.length > 0 ? (
                      objects.map((obj) => (
                        <div
                          key={obj.key}
                          className={`flex items-center gap-3 p-3 hover:bg-primary/10 cursor-pointer border-b last:border-b-0 ${
                            destSelectedItem === obj.key ? "bg-primary/20 border-primary/50" : ""
                          }`}
                          onDoubleClick={() => handleS3Navigation(obj.key, obj.isFolder || false, "destination")}
                          onClick={() => setDestSelectedItem(obj.key)}
                        >
                          <Folder className="w-4 h-4 text-blue-500" />
                          <div className="flex-1 font-medium">{obj.key.split("/").pop() || obj.key}</div>
                        </div>
                      ))
                    ) : (
                      <div className="p-3 text-center text-muted-foreground">
                        No lakehouses available.
                      </div>
                    )}
                  </>
                ) : null}

                {destinationConfig.workspace && destinationConfig.lakehouse ? (
                  <>
                    <div
                      className="flex items-center gap-3 p-3 hover:bg-primary/10 cursor-pointer border-b"
                      onDoubleClick={() => handleS3Navigation("..", true, "destination")}
                    >
                      <Folder className="w-4 h-4 text-blue-500" />
                      <div className="flex-1 font-medium">..</div>
                    </div>

                    {objects && objects.length > 0 ? (
                      objects.map((obj) => (
                        <div
                          key={`${destinationConfig.lakehouse}-${obj.key}`}
                          className={`flex items-center gap-3 p-3 hover:bg-primary/10 cursor-pointer border-b last:border-b-0 ${
                            destSelectedItem === obj.key ? "bg-primary/20 border-primary/50" : ""
                          }`}
                          onDoubleClick={() => handleS3Navigation(obj.key, obj.isFolder || false, "destination")}
                          onClick={() => setDestSelectedItem(obj.key)}
                        >
                          {obj.isFolder ? (
                            <Folder className="w-4 h-4 text-blue-500" />
                          ) : (
                            <File className="w-4 h-4 text-gray-500" />
                          )}
                          <div className="flex-1 font-medium">{obj.key.split("/").pop() || obj.key}</div>
                        </div>
                      ))
                    ) : (
                      <div className="p-3 text-center text-muted-foreground">
                        No {selectedDestination === "azure-blob" ? "blobs" : selectedDestination === "onelake" ? "contents" : "objects"} available.
                      </div>
                    )}
                  </>
                ) : null}

                {destinationConfig.bucket && !destinationConfig.lakehouse ? (
                  <>
                    <div
                      className="flex items-center gap-3 p-3 hover:bg-primary/10 cursor-pointer border-b"
                      onDoubleClick={() => {
                        setDestinationConfig((prev) => ({ ...prev, bucket: undefined, currentPath: "" }));
                        setObjects([]);
                        setDestSelectedItem(null);
                        fetchBuckets("destination");
                      }}
                    >
                      <Folder className="w-4 h-4 text-blue-500" />
                      <div className="flex-1 font-medium">..</div>
                    </div>
                    {isLoadingLakehouses ? (
                      <div className="p-3 text-center text-muted-foreground">
                        <Loader2 className="w-4 h-4 inline animate-spin mr-2" />
                        Loading contents...
                      </div>
                    ) : objects.length > 0 ? (
                      objects.map((obj) => (
                        <div
                          key={obj.key}
                          className={`flex items-center gap-3 p-3 hover:bg-primary/10 cursor-pointer border-b last:border-b-0 ${
                            destSelectedItem === obj.key ? "bg-primary/20 border-primary/50" : ""
                          }`}
                          onDoubleClick={() => handleS3Navigation(obj.key, obj.isFolder || false, "destination")}
                          onClick={() => setDestSelectedItem(obj.key)}
                        >
                          {obj.isFolder ? (
                            <Folder className="w-4 h-4 text-blue-500" />
                          ) : (
                            <File className="w-4 h-4 text-gray-500" />
                          )}
                          <div className="flex-1 font-medium">{obj.key.split("/").pop() || obj.key}</div>
                        </div>
                      ))
                    ) : (
                      <div className="p-3 text-center text-muted-foreground">
                        No {selectedDestination === "azure-blob" ? "blobs" : "objects"} available.
                      </div>
                    )}
                  </>
                ) : null}
              </div>

              {(destinationConfig.bucket || destinationConfig.workspace) && destSelectedItem && destSelectedItem !== ".." && (
                <div className="text-sm text-muted-foreground">
                  Selected Path: {`${selectedDestination}://${destinationConfig.workspace || destinationConfig.bucket}/${destinationConfig.lakehouse ? destinationConfig.lakehouse + "/" : ""}${destinationConfig.currentPath || ""}${destSelectedItem}`}
                </div>
              )}

              {!(destinationConfig.bucket || destinationConfig.workspace) && destSelectedItem && (
                <Button
                  onClick={handleSelectDestBucketOrContainer}
                  className="w-fit flex items-center gap-2"
                >
                  Select This {selectedDestination === "azure-blob" ? "Container" : selectedDestination === "onelake" ? "Workspace" : "Bucket"}
                </Button>
              )}
              {(destinationConfig.bucket || destinationConfig.workspace) && destSelectedItem && destSelectedItem !== ".." && (
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
              setSourceDBSelectedTable("");
              localStorage.removeItem("selectedFile");
              localStorage.removeItem("selectedBucket");
              setDatabaseTables([]);
            }
          }}
        >
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Browse Database Tables</DialogTitle>
              <DialogDescription>Select a single table from the database for the data source.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">Connection: {sourceConfig.connectionString}</div>
              <div className="border rounded-lg max-h-96 overflow-y-auto">
                {databaseTables.length > 0 ? (
                  databaseTables.map((table) => (
                    <div
                      key={table}
                      className={`flex items-center gap-3 p-3 hover:bg-primary/10 cursor-pointer border-b last:border-b-0 ${
                        sourceDBSelectedTable === table ? "bg-primary/20 border-primary/50" : ""
                      }`}
                      onClick={() => setSourceDBSelectedTable(table)}
                    >
                      <Database className="w-4 h-4 text-gray-500" />
                      <div className="flex-1">
                        <div className="font-medium">{table}</div>
                      </div>
                      {sourceDBSelectedTable === table && <CheckCircle className="w-5 h-5 text-green-500" />}
                    </div>
                  ))
                ) : (
                  <div className="p-3 text-center text-muted-foreground">
                    No tables available.
                  </div>
                )}
              </div>
<Button
  onClick={() => {
    if (sourceDBSelectedTable) {
      const fullPath = `${sourceConfig.connectionString}.${sourceConfig.databaseName}.${sourceDBSelectedTable}`;
      // ADD THESE TWO LINES:
      setSelectedSourcePath(fullPath);
      setIsSourceConnected(true);
      
      setShowSourceDBBrowser(false);
      localStorage.setItem("selectedBucket", sourceConfig.connectionString!);
      localStorage.setItem("selectedFile", sourceDBSelectedTable);
      toast({ title: "Table Selected", description: `Selected: ${fullPath}` });
      setSourceDBSelectedTable("");
    } else {
      toast({ title: "Error", description: "Please select a table", variant: "destructive" });
    }
  }}
  disabled={!sourceDBSelectedTable}
  className="w-fit flex items-center gap-2"
>
  Select Table
</Button>
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
                    setExcelSheets([]);
                    setSelectedSheet("");
                    setCurrentExcelFile(null);
                    setSourceDBSelectedTable("");
                    setDatabaseTables([]);
                    localStorage.removeItem("selectedBucket");
                    localStorage.removeItem("selectedFile");
                    localStorage.removeItem("selectedSheet");
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