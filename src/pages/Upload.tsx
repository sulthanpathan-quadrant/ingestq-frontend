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
  Snowflake,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { getBuckets, getObjects, getFile, getAzureContainers, getAzureBlobs, getAzureBlobFile, getOneLakeWorkspaces, getOneLakeLakehouses, getOneLakeContents, getOneLakeFile, getDatabaseTables, transferInputToS3, getDeltaTables, exportDeltaToS3, getExcelSheets, uploadFile, getSnowflakeDatabases, getSnowflakeTables } from "@/lib/api";

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
  const [deltaTables, setDeltaTables] = useState<Array<{ name: string, id: string }>>([]);
  const [showDeltaBrowser, setShowDeltaBrowser] = useState<boolean>(false);
  const [selectedDeltaTable, setSelectedDeltaTable] = useState<string>(""); const [buckets, setBuckets] = useState<Bucket[]>([]);
  const [objects, setObjects] = useState<Object[]>([]);
  const [cloudFileKey, setCloudFileKey] = useState<string>("");
  const [isLoadingLakehouses, setIsLoadingLakehouses] = useState<boolean>(false);
  const [isLoadingDeltaTables, setIsLoadingDeltaTables] = useState<boolean>(false);
  const [isUploadingLocal, setIsUploadingLocal] = useState<boolean>(false);

  const [snowflakeDatabases, setSnowflakeDatabases] = useState<string[]>([]);
  const [snowflakeTables, setSnowflakeTables] = useState<string[]>([]);
  const [showSnowflakeBrowser, setShowSnowflakeBrowser] = useState<boolean>(false);
  const [selectedSnowflakeDatabase, setSelectedSnowflakeDatabase] = useState<string>("");
  const [selectedSnowflakeTable, setSelectedSnowflakeTable] = useState<string>("");
  const [isLoadingSnowflakeTables, setIsLoadingSnowflakeTables] = useState<boolean>(false);


  const { toast } = useToast();
  const navigate = useNavigate();
  const summaryRef = useRef<HTMLDivElement>(null);

  const [isTransferring, setIsTransferring] = useState<boolean>(false);
  const [transferredS3Paths, setTransferredS3Paths] = useState<Record<string, string>>({});

  const dataSources = [
    { value: "local", label: "Local", icon: HardDrive },
    { value: "s3", label: "S3", icon: Cloud },
    { value: "azure-blob", label: "Azure Blob", icon: CloudRain },
    { value: "onelake", label: "OneLake", icon: CloudCog },
    { value: "delta-tables", label: "Delta Tables", icon: Database },
    { value: "database", label: "Database", icon: Server },
    { value: "snowflake", label: "Snowflake", icon: Snowflake },
  ];

  const destinations = [
    { value: "s3", label: "S3", icon: Cloud },
    { value: "azure-blob", label: "Azure Blob", icon: CloudRain },
    { value: "onelake", label: "OneLake", icon: CloudCog },
    { value: "delta-tables", label: "Delta Tables", icon: Database },
    { value: "snowflake", label: "Snowflake", icon: Snowflake },
  ];


  useEffect(() => {
    localStorage.removeItem("selectedBucket");
    localStorage.removeItem("selectedFile");
    localStorage.removeItem("selectedDestFolder");
    localStorage.removeItem("selectedDestBucket");
    localStorage.removeItem("selectedSheet");
    localStorage.removeItem("transferredS3Path");

    // Clear database connection details
    localStorage.removeItem("db_host");
    localStorage.removeItem("db_name");
    localStorage.removeItem("db_user");
    localStorage.removeItem("db_password");
    localStorage.removeItem("db_port");
    localStorage.removeItem("db_table");
    localStorage.removeItem("input_type");

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
    setTransferredS3Paths({});
    localStorage.removeItem("selectedFile");
    localStorage.removeItem("selectedBucket");
    localStorage.removeItem("selectedSheet");
    localStorage.removeItem("transferredS3Path");

    // Clear database connection details
    localStorage.removeItem("db_host");
    localStorage.removeItem("db_name");
    localStorage.removeItem("db_user");
    localStorage.removeItem("db_password");
    localStorage.removeItem("db_port");
    localStorage.removeItem("db_table");
    localStorage.removeItem("input_type");
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

      // Get user_id from localStorage
      const userDataStr = localStorage.getItem("user");
      const userData = userDataStr ? JSON.parse(userDataStr) : null;
      const userId = userData?.user_id;

      if (!userId) {
        toast({
          title: "Authentication Error",
          description: "User ID not found. Please log in again.",
          variant: "destructive"
        });
        return;
      }

      // Upload file to S3
      setIsUploadingLocal(true);
      try {
        toast({ title: "Uploading File", description: "Uploading to storage..." });

        const uploadResponse = await uploadFile(dataFile, userId, "scripts");

        if (uploadResponse.success && uploadResponse.s3_path) {
          const s3Path = uploadResponse.s3_path;

          // Store the S3 path in transferredS3Paths
          setTransferredS3Paths(prev => ({
            ...prev,
            [dataFile.name]: s3Path
          }));

          // Extract bucket and key from s3_path
          const s3PathParts = s3Path.replace("s3://", "").split("/");
          const s3Bucket = s3PathParts[0];
          const s3Key = s3PathParts.slice(1).join("/");

          if (isExcelFile(dataFile.name)) {
            try {
              toast({ title: "Reading Excel File", description: "Extracting sheet names..." });
              const sheets = await extractExcelSheets(dataFile);
              setExcelSheets(sheets);
              setShowSheetSelector(true);

              // Store S3 details for later use
              localStorage.setItem("selectedBucket", s3Bucket);
              localStorage.setItem("selectedFile", s3Key);
            } catch (error) {
              toast({
                title: "Error",
                description: "Failed to read Excel file. Please ensure it's a valid Excel file.",
                variant: "destructive"
              });
            }
          } else {
            // Use the filename as the display path (consistent with Excel flow)
            const filePath = dataFile.name;
            setSelectedSourcePath(filePath);
            setIsSourceConnected(true);
            setShowSourceBrowser(false);
            localStorage.setItem("selectedBucket", s3Bucket);
            localStorage.setItem("selectedFile", s3Key);
            localStorage.removeItem("selectedSheet");

            // Store the s3_path for use in handleProceed
            localStorage.setItem("transferredS3Path", s3Path);

            // Determine and set input_type
            const fileExtension = dataFile.name.toLowerCase().split('.').pop();
            let inputType: "csv" | "xlsx" | "parquet" = "csv";

            if (fileExtension === 'parquet') {
              inputType = "parquet";
            } else if (fileExtension === 'csv') {
              inputType = "csv";
            }

            localStorage.setItem("input_type", inputType);

            const fileType = isCSVFile(dataFile.name) ? "CSV" : "Parquet";
            toast({
              title: "Upload Complete",
              description: `Uploaded ${fileType} file: ${dataFile.name}`
            });
          }
        } else {
          throw new Error(uploadResponse.message || "Upload failed");
        }
      } catch (error) {
        console.error("Upload failed:", error);
        toast({
          title: "Upload Failed",
          description: error instanceof Error ? error.message : "Failed to upload file",
          variant: "destructive"
        });
        setUploadedFiles([]);
        setCurrentExcelFile(null);
      } finally {
        setIsUploadingLocal(false);
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
      const effectiveSource = type === "source" ? selectedSource : selectedDestination;

      if (effectiveSource === "onelake" || effectiveSource === "delta-tables") {  // ADD delta-tables here
        data = await getOneLakeWorkspaces();
      } else if (effectiveSource === "azure-blob") {
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
          description: `Unexpected ${effectiveSource === "onelake" || effectiveSource === "delta-tables" ? "workspace" : effectiveSource === "azure-blob" ? "container" : "bucket"} data format.`,
          variant: "destructive",
        });
      }
    } catch (error) {
      const effectiveSource = type === "source" ? selectedSource : selectedDestination;
      toast({
        title: "Error",
        description: `Failed to fetch ${effectiveSource === "onelake" || effectiveSource === "delta-tables" ? "workspaces" : effectiveSource === "azure-blob" ? "containers" : "buckets"}.`,
        variant: "destructive",
      });
      setBuckets([]);
    }
  };

  const fetchObjects = async (bucketName: string, prefix?: string, type?: "source" | "destination") => {
    try {
      let data: Object[] = [];
      const effectiveType = type === "source" ? selectedSource : selectedDestination;
      const config = type === "source" ? sourceConfig : destinationConfig;
      const setConfig = type === "source" ? setSourceConfig : setDestinationConfig;
      if (effectiveType === "delta-tables") {
        if (!config.lakehouse) {
          // Fetch lakehouses (same as onelake)
          setIsLoadingLakehouses(true);
          const lakehouses = await getOneLakeLakehouses(bucketName);
          setIsLoadingLakehouses(false);

          data = lakehouses.map((lh: string) => ({
            key: lh,
            isFolder: true,
          }));
        } else {
          // ✅ FOR SOURCE: Fetch delta tables
          if (type === "source") {
            setIsLoadingDeltaTables(true);
            const tables = await getDeltaTables(bucketName, config.lakehouse);
            setIsLoadingDeltaTables(false);
            setDeltaTables(tables);
            data = tables.map((table) => ({
              key: table.name,
              isFolder: false,
            }));
          }
          // ✅ FOR DESTINATION: Fetch folders (use OneLake contents API)
          else {
            const response: OneLakeResponse = await getOneLakeContents(
              bucketName,
              config.lakehouse,
              config.currentPath || 'Files'
            );
            const folders = Array.isArray(response.folders) ? response.folders : [];
            const files = Array.isArray(response.files) ? response.files : [];

            data = [
              ...folders.map((folder: string) => ({
                key: folder,
                isFolder: true,
              })),
              ...files.map((file: { name: string; size: string }) => ({
                key: file.name,
                isFolder: false,
              })),
            ];
          }
        }
        setObjects(data || []);
        return;
      }

      if (effectiveType === "onelake") {
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
      } else if (effectiveType === "azure-blob") {
        data = await getAzureBlobs(bucketName, prefix);
      } else {
        data = await getObjects(bucketName, prefix);
      }

      setObjects(data || []);
    } catch (error) {
      const effectiveType = type === "source" ? selectedSource : selectedDestination;
      toast({
        title: "Error",
        description: `Failed to fetch ${effectiveType === "onelake" ? "contents" : effectiveType === "azure-blob" ? "blobs" : "objects"}: ${error instanceof Error ? error.message : "Unknown error"}`,
        variant: "destructive",
      });
      setObjects([]);
    }
  };

  const fetchExcelSheetsFromCloud = async (workspace: string, lakehouse: string, fileKey: string) => {
    try {
      toast({ title: "Reading Excel File", description: "Extracting sheet names..." });

      // Determine the bucket name based on source type
      let bucketName = workspace;

      if (selectedSource === "s3" || selectedSource === "azure-blob") {
        bucketName = workspace; // For S3/Azure, workspace is actually the bucket/container name
      } else if (selectedSource === "onelake") {
        // For OneLake, we need to construct the path differently
        // The API might need special handling for OneLake paths
        bucketName = workspace;
      }

      console.log("📊 Fetching sheets for:", { bucketName, fileKey, source: selectedSource });

      // Call the new API endpoint
      const response = await getExcelSheets(bucketName, fileKey);

      console.log("📊 API Response:", response);

      if (response.sheets && response.sheets.length > 0) {
        setExcelSheets(response.sheets);
        setShowSheetSelector(true);
        console.log("✅ Extracted sheets:", response.sheets);
      } else {
        throw new Error("No sheets found in the Excel file");
      }
    } catch (error) {
      console.error("❌ Error fetching sheets:", error);
      toast({
        title: "Error",
        description: `Failed to read Excel file: ${error instanceof Error ? error.message : "Unknown error"}`,
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
      if (prefix === "onelake" || prefix === "delta-tables") {
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
          await fetchObjects(config.workspace!, newPath, type);
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
              description: `Failed to load lakehouse contents: ${error instanceof Error ? error.message : "Unknown error"
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
          await fetchObjects(config.workspace!, newPath, type);
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
            localStorage.setItem("selectedDestBucket", config.workspace!); // ← ADD THIS LINE

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
          await fetchObjects(config.bucket!, newPath, type);
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
        await fetchObjects(config.bucket!, newPath, type);
        setSelectedPath("");
        setIsConnected(false);
        if (type === "source") {
          localStorage.removeItem("selectedFile");
        } else {
          localStorage.removeItem("selectedDestFolder");
        }
      } else {
        // File selection (not folder)
        const currentPath = config.currentPath || "";
        const fileKey = item.includes(currentPath) ? item : currentPath + item;

        if (type === "source") {
          // Check if it's a valid data file
          if (!isSupportedDataFile(item)) {
            toast({
              title: "Invalid File Type",
              description: "Please select Excel (.xlsx, .xls, .xlsm), CSV (.csv), or Parquet (.parquet) files",
              variant: "destructive",
            });
            setSelectedItem(null);
            return;
          }

          // Store file reference for Excel sheet selection
          setCurrentExcelFile({ name: item } as File);
          setCloudFileKey(fileKey);

          const fullPath = `${prefix}://${config.bucket}/${fileKey}`;

          // Check if it's an Excel file
          if (isExcelFile(item)) {
            // ← ADD THESE LINES HERE (before fetchExcelSheetsFromCloud)
            localStorage.setItem("selectedBucket", config.bucket!);
            localStorage.setItem("selectedFile", fileKey);

            // Fetch sheets from cloud storage
            await fetchExcelSheetsFromCloud(config.bucket!, "", fileKey);
          } else {
            // For CSV/Parquet, directly select the file
            setSelectedPath(fullPath);
            setIsConnected(true);
            localStorage.setItem("selectedBucket", config.bucket!);
            localStorage.setItem("selectedFile", fileKey);
            localStorage.removeItem("selectedSheet");
            setShowBrowser(false);
            const fileType = isCSVFile(item) ? "CSV" : isParquetFile(item) ? "Parquet" : "file";
            toast({ title: "File Selected", description: `Selected ${fileType}: ${fullPath}` });
          }
        } else {
          // Destination selection
          const fullPath = currentPath || "";
          setSelectedPath(fullPath);
          setIsConnected(true);
          const completeDestPath = `${prefix}://${config.workspace || config.bucket}/${config.lakehouse ? config.lakehouse + "/" : ""}${currentPath || ""}`;
          localStorage.setItem("selectedDestPath", completeDestPath);

          localStorage.setItem("selectedDestBucket", config.bucket!); // ← ADD THIS LINE

          localStorage.setItem("selectedDestFolder", fileKey);
          setShowBrowser(false);
          toast({ title: "Folder Selected", description: `Selected: ${fullPath}` });
        }
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

    if (selectedSource === "onelake" || selectedSource === "delta-tables" || selectedDestination === "onelake" || selectedDestination === "delta-tables") {
      setConfig((prev) => ({
        ...prev,
        workspace: bucket,
        lakehouse: undefined,
        currentPath: "",
      }));

      try {
        await fetchObjects(bucket, "", type);
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
        await fetchObjects(bucket, "", type);
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

    // Store the bucket/container name in selectedDestBucket
    const bucketOrContainer = destinationConfig.workspace || destinationConfig.bucket;
    localStorage.setItem("selectedDestBucket", bucketOrContainer!);
    let pathParts = [];
    if (destinationConfig.lakehouse) {
      pathParts.push(destinationConfig.lakehouse);
    }
    if (destinationConfig.currentPath) {
      pathParts.push(destinationConfig.currentPath.replace(/^\/+|\/+$/g, '')); // Remove leading/trailing slashes
    }
    if (destSelectedItem) {
      pathParts.push(destSelectedItem.replace(/^\/+|\/+$/g, '')); // Remove leading/trailing slashes
    }


    const fullPath = pathParts.filter(p => p).join('/'); // Filter out empty strings
    const destPathWithoutFile = `${selectedDestination}://${bucketOrContainer}/${fullPath ? fullPath + '/' : ''}`;

    localStorage.setItem("selectedDestPath", destPathWithoutFile);


    const destPath = `${selectedDestination}://${bucketOrContainer}/${destinationConfig.lakehouse ? destinationConfig.lakehouse + "/" : ""}${destinationConfig.currentPath || ""}${destSelectedItem || sourceFilename}`;
    setSelectedDestPath(destPath);
    setIsDestConnected(true);
    // const destPathWithoutFile = `${selectedDestination}://${bucketOrContainer}/${destinationConfig.lakehouse ? destinationConfig.lakehouse + "/" : ""}${destinationConfig.currentPath || ""}${destSelectedItem ? destSelectedItem + "/" : ""}`;
    // localStorage.setItem("selectedDestPath", destPathWithoutFile);

    localStorage.setItem("selectedDestBucket", bucketOrContainer!);

    localStorage.setItem("selectedDestFolder", destSelectedItem || destinationConfig.currentPath || "");
    setShowDestBrowser(false);
    const destPathforUI = `${selectedDestination}://${bucketOrContainer}/${destinationConfig.lakehouse ? destinationConfig.lakehouse + "/" : ""}${destinationConfig.currentPath || ""}`;
    toast({ title: "Destination Selected", description: `Selected: ${destPathforUI}` });
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

    const destPathWithoutFile = `${selectedDestination}://${destSelectedItem}`;
    localStorage.setItem("selectedDestPath", destPathWithoutFile);


    localStorage.setItem("selectedDestBucket", destSelectedItem!);
    localStorage.setItem("selectedDestFolder", "");
    setShowDestBrowser(false);
    const destPathforUI = `${selectedDestination}://${destSelectedItem}`;

    toast({ title: "Destination Selected", description: `Selected: ${destPathforUI}` });
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
      } else if (selectedSource === "delta-tables") {
        setIsSourceConnecting(true);
        try {
          await fetchBuckets(type);
          setShowDeltaBrowser(true);
        } catch (error) {
          toast({ title: "Error", description: "Failed to connect. Check console for details.", variant: "destructive" });
        } finally {
          setIsSourceConnecting(false);
        }
      } else if (selectedSource === "snowflake") {
        setIsSourceConnecting(true);
        try {
          const databases = await getSnowflakeDatabases();
          setSnowflakeDatabases(databases);
          setShowSnowflakeBrowser(true);
          toast({ title: "Connection Successful", description: "Connected to Snowflake successfully" });
        } catch (error) {
          toast({
            title: "Error",
            description: `Failed to connect to Snowflake: ${error instanceof Error ? error.message : "Unknown error"}`,
            variant: "destructive"
          });
        } finally {
          setIsSourceConnecting(false);
        }
      } else if (selectedSource === "database") {
  if (!sourceConfig.username || !sourceConfig.password || !sourceConfig.connectionString || !sourceConfig.port || !sourceConfig.databaseName) {
    toast({ title: "Error", description: "Username, Password, Connection String, Port No, and Database Name are required", variant: "destructive" });
    return;
  }
  setIsSourceConnecting(true);
  
  try {
    // Fetch database tables using the API
    const tables = await getDatabaseTables(
      sourceConfig.connectionString!,
      sourceConfig.databaseName!,
      sourceConfig.username!,
      sourceConfig.password!
    );
    
    setDatabaseTables(tables);
    setShowSourceDBBrowser(true);
    toast({ title: "Connection Successful", description: `Connected to database successfully. Found ${tables.length} tables.` });
  } catch (error) {
    toast({
      title: "Connection Failed",
      description: `Failed to connect to database: ${error instanceof Error ? error.message : "Unknown error"}`,
      variant: "destructive"
    });
    console.error("Database connection error:", error);
  } finally {
    setIsSourceConnecting(false);
  }
}
    } else {
      if (selectedDestination === "s3" || selectedDestination === "azure-blob" || selectedDestination === "onelake" || selectedDestination === "delta-tables" || selectedDestination === "snowflake") {
        setIsDestConnecting(true);
        try {
          if (selectedDestination === "snowflake") {
            const databases = await getSnowflakeDatabases();
            setSnowflakeDatabases(databases);
          } else {
            await fetchBuckets(type);
          }
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
      case "delta-tables":
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
      case "snowflake":
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
              Connect to Snowflake
            </Button>
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

    localStorage.setItem("selectedSheet", selectedSheet);
    setShowSheetSelector(false);

    const fileName = currentExcelFile?.name || "";

    if (selectedSource === "local") {
      const fullPath = fileName;
      setSelectedSourcePath(`${fullPath}#${selectedSheet}`);
    } else {
      // For cloud sources (S3, Azure, OneLake)
      const fileKey = cloudFileKey; // This should already be set from handleS3Navigation
      const fullPath = selectedSource === "onelake"
        ? `${selectedSource}://${sourceConfig.workspace}/${sourceConfig.lakehouse}/${fileKey}`
        : `${selectedSource}://${sourceConfig.bucket}/${fileKey}`;

      setSelectedSourcePath(`${fullPath}#${selectedSheet}`);

      // ← ADD THIS: Update localStorage with the file key
      const bucketOrWorkspace = selectedSource === "onelake" ? sourceConfig.workspace : sourceConfig.bucket;
      localStorage.setItem("selectedBucket", bucketOrWorkspace!);
      localStorage.setItem("selectedFile", fileKey);
    }

    setIsSourceConnected(true);

    // Close the source browser for cloud sources
    if (selectedSource !== "local") {
      setShowSourceBrowser(false);
    }

    toast({ title: "Sheet Selected", description: `Selected sheet: ${selectedSheet}` });
    scrollToSummary();
  };

  const handleProceed = async () => {
    console.log("🔍 PROCEED CLICKED");
    console.log("Selected Source:", selectedSource);
    console.log("Selected Source Path:", selectedSourcePath);
    console.log("Selected Dest Path:", selectedDestPath);
    localStorage.setItem("org_inp_type", selectedSource);

    if (!isSourceConnected || !selectedSourcePath) {
      toast({ title: "Error", description: "Please connect and select a source path", variant: "destructive" });
      return;
    }
    if (!isDestConnected || !selectedDestPath) {
      toast({ title: "Error", description: "Please connect and select a destination path", variant: "destructive" });
      return;
    }

    console.log("🔍 Before transfer check - selectedSource:", selectedSource);

    // Transfer file to S3 if source is NOT already S3
    // Transfer file to S3 if source is NOT already S3
    if (selectedSource !== "s3") {
      console.log("📄 Starting transfer process for non-S3 source");

      if (!transferredS3Paths[selectedSourcePath]) {
        console.log("📄 No cached transfer found, initiating new transfer");

        // Skip transfer for local files (already uploaded in onDrop)
        if (selectedSource === "local") {
          console.log("✅ Local file already uploaded, skipping transfer");

          // Just set the input type for localStorage
          const fileName = selectedSourcePath.split("#")[0];
          const fileExtension = fileName.toLowerCase().split('.').pop();

          let inputType: "csv" | "xlsx" | "parquet" = "csv";
          if (fileExtension === 'xlsx' || fileExtension === 'xls' || fileExtension === 'xlsm') {
            inputType = "xlsx";
          } else if (fileExtension === 'parquet') {
            inputType = "parquet";
          } else if (fileExtension === 'csv') {
            inputType = "csv";
          }

          localStorage.setItem("input_type", inputType);
          localStorage.setItem("org_data_source", selectedSourcePath);
        }

        else if (selectedSource === "snowflake") {
          const database = localStorage.getItem("selectedBucket");
          const table = localStorage.getItem("selectedFile");
          console.log("✅ Snowflake source, no transfer needed");
          localStorage.setItem("input_type", "snowflake");
          localStorage.setItem("org_data_source", selectedSourcePath);
          localStorage.setItem("db_name", database);
          localStorage.setItem("db_table", table);


          // Verify required data exists


          if (!database || !table) {
            toast({
              title: "Configuration Error",
              description: "Snowflake database or table information is missing",
              variant: "destructive"
            });
            return;
          }
        }

        else {
          setIsTransferring(true);
          try {
            if (selectedSource === "delta-tables") {
              // Handle Delta Tables export
              const parts = selectedSourcePath.replace("delta-tables://", "").split("/");
              const workspace = parts[0];
              const lakehouse = parts[1];
              const tableName = parts[2];

              // Get user_id from localStorage
              const userDataStr = localStorage.getItem("user");
              const userData = userDataStr ? JSON.parse(userDataStr) : null;
              const userId = userData?.user_id;

              if (!userId) {
                throw new Error("User ID not found. Please log in again.");
              }

              console.log("📤 Exporting Delta table:", { workspace, lakehouse, tableName, userId });

              const exportResponse = await exportDeltaToS3({
                workspace_name: workspace,
                lakehouse_name: lakehouse,
                table_name: tableName,
                user_id: userId,
              });

              console.log("📥 Export response:", exportResponse);

              if (exportResponse.success && exportResponse.s3_path) {
                const s3Path = exportResponse.s3_path;

                // Update state
                setTransferredS3Paths(prev => ({
                  ...prev,
                  [selectedSourcePath]: s3Path
                }));

                // Extract bucket and key from s3_path (format: s3://bucket/key)
                const s3PathParts = s3Path.replace("s3://", "").split("/");
                const s3Bucket = s3PathParts[0];
                const s3Key = s3PathParts.slice(1).join("/");

                console.log("💾 Setting localStorage...");
                console.log("   selectedBucket:", s3Bucket);
                console.log("   selectedFile:", s3Key);
                console.log("   transferredS3Path:", s3Path);
                localStorage.setItem("input_type", "parquet");

                localStorage.setItem("selectedBucket", s3Bucket);
                localStorage.setItem("selectedFile", s3Key);
                localStorage.setItem("transferredS3Path", s3Path);
                localStorage.setItem("org_data_source", selectedSourcePath);
                localStorage.setItem("selectedSheet", "")
                toast({
                  title: "Export Complete",
                  description: `Delta table exported to S3 successfully`
                });
              } else {
                throw new Error(exportResponse.message || "Export failed");
              }
            } else {
              // Existing transfer logic for azure-blob and onelake only
              const filePathParts = selectedSourcePath.split("#");
              const filePath = filePathParts[0];
              const sheetName = filePathParts[1];

              console.log("📄 File path (without sheet):", filePath);
              console.log("📄 Sheet name:", sheetName || "None");

              const fileName = filePath.split("/").pop() || "file";
              console.log("📄 Extracted fileName:", fileName);

              const storageFolder =
                selectedSource === "onelake" ? "onelake_inp" :
                  selectedSource === "azure-blob" ? "azure-blob_inp" :
                    "local_inp";

              console.log("📁 Storage folder:", storageFolder);

              const s3Path = `s3://agntic-bl/${storageFolder}/${fileName}`;
              console.log("📍 Target S3 Path:", s3Path);

              let cleanFilePath = filePath;
              if (selectedSource === "azure-blob") {
                cleanFilePath = filePath.replace(/^azure-blob:\/\//, "");
              } else if (selectedSource === "onelake") {
                cleanFilePath = filePath.replace(/^onelake:\/\//, "");
                const parts = cleanFilePath.split('/');
                if (parts.length >= 3) {
                  const workspace = parts[0];
                  const lakehouse = parts[1];
                  const restPath = parts.slice(2).join('/');
                  cleanFilePath = `workspaces/${workspace}/lakehouses/${lakehouse}/${restPath}`;
                }
              }

              console.log("🧹 Clean file path:", cleanFilePath);

              const storageType: "blob" | "onelake" =
                selectedSource === "azure-blob" ? "blob" : "onelake";

              console.log("🏷️ Storage type:", storageType);
              console.log("📤 Calling transferInputToS3 API...");

              const transferResponse = await transferInputToS3({
                storage_type: storageType,
                file_path: cleanFilePath,
                s3_path: s3Path,
              });

              console.log("📥 Transfer response:", transferResponse);

              if (transferResponse.status === 'success') {
                console.log("✅ Transfer successful!");

                const constructedS3Path = `s3://agntic-bl/${storageFolder}/${fileName}`;

                setTransferredS3Paths(prev => ({
                  ...prev,
                  [selectedSourcePath]: constructedS3Path
                }));

                const s3FileKey = `${storageFolder}/${fileName}`;
                const s3FileKeyWithSheet = sheetName ? `${s3FileKey}#${sheetName}` : s3FileKey;

                console.log("💾 Setting localStorage...");
                console.log("   selectedBucket: agntic-bl");
                console.log("   selectedFile:", s3FileKeyWithSheet);
                console.log("   transferredS3Path:", constructedS3Path);

                const fileExtension = fileName.toLowerCase().split('.').pop();
                let inputType: "csv" | "xlsx" | "parquet" = "csv";

                if (fileExtension === 'xlsx' || fileExtension === 'xls' || fileExtension === 'xlsm') {
                  inputType = "xlsx";
                } else if (fileExtension === 'parquet') {
                  inputType = "parquet";
                } else if (fileExtension === 'csv') {
                  inputType = "csv";
                }

                localStorage.setItem("input_type", inputType);

                localStorage.setItem("selectedBucket", "agntic-bl");
                localStorage.setItem("selectedFile", s3FileKeyWithSheet);
                localStorage.setItem("transferredS3Path", constructedS3Path);
                localStorage.setItem("org_data_source", selectedSourcePath);

                if (sheetName) {
                  console.log("selectedSheet:", sheetName);
                  localStorage.setItem("selectedSheet", sheetName);
                }
              }
            }
          } catch (error) {
            console.error("❌ Transfer failed:", error);
            toast({
              title: "Transfer Failed",
              description: error instanceof Error ? error.message : "Failed to stage file to S3",
              variant: "destructive"
            });
            setIsTransferring(false);
            return;
          } finally {
            setIsTransferring(false);
          }
        }
      } else {
        console.log("✅ Using cached transfer path:", transferredS3Paths[selectedSourcePath]);
      }
    } else {
      console.log("✅ Source is already S3, no transfer needed");

      localStorage.setItem("org_data_source", selectedSourcePath);

      // Determine file type for S3 sources
      const filePathParts = selectedSourcePath.split("#");
      const filePath = filePathParts[0];
      const sheetName = filePathParts[1];

      const fileName = filePath.split("/").pop() || "";
      const fileExtension = fileName.toLowerCase().split('.').pop();

      let inputType: "csv" | "xlsx" | "parquet" = "csv";

      if (fileExtension === 'xlsx' || fileExtension === 'xls' || fileExtension === 'xlsm') {
        inputType = "xlsx";
      } else if (fileExtension === 'parquet') {
        inputType = "parquet";
      } else if (fileExtension === 'csv') {
        inputType = "csv";
      }

      localStorage.setItem("input_type", inputType);

      // Verify required data exists
      const bucket = localStorage.getItem("selectedBucket");
      const file = localStorage.getItem("selectedFile");

      console.log("📍 S3 Source - localStorage verification:");
      console.log("   selectedBucket:", bucket);
      console.log("   selectedFile:", file);
      console.log("   input_type:", inputType);
      console.log("   selectedSheet:", sheetName || "none");

      if (!bucket || !file) {
        toast({
          title: "Configuration Error",
          description: "S3 bucket or file information is missing",
          variant: "destructive"
        });
        return;
      }
    }
    localStorage.setItem("selectedDestination", selectedDestination);

    localStorage.setItem("selectedDestPath", selectedDestPath);

   if (selectedDestination === "snowflake") {
  const database = selectedDestPath.replace("snowflake://", "");
  localStorage.setItem("selectedDestBucket", database);
  localStorage.setItem("selectedDestFolder", "");

}

    // Verify localStorage before navigation
    
    console.log("🔍 Final localStorage check:");
    console.log("   selectedDestination:", localStorage.getItem("selectedDestination"));
    console.log("   selectedBucket:", localStorage.getItem("selectedBucket"));
    console.log("   selectedFile:", localStorage.getItem("selectedFile"));
    console.log("   selectedSheet:", localStorage.getItem("selectedSheet"));
    console.log("   transferredS3Path:", localStorage.getItem("transferredS3Path"));

    console.log("🚀 Navigating to schema page...");
    navigate("/dashboard/schema");
  };
  const handleGoBack = () => {
    setIsSourceConnected(false);
    setIsDestConnected(false);
    setSelectedSourcePath("");
    setSelectedDestPath("");
    navigate('/dashboard/jobs');
  };

  const Breadcrumbs = ({ type }: { type: "source" | "destination" }) => {
    const config = type === "source" ? sourceConfig : destinationConfig;
    const prefix = type === "source" ? selectedSource : selectedDestination;
    const isOneLake = prefix === "onelake" || prefix === "delta-tables";
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
            await fetchObjects(config.workspace!, relativePath, type);
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
            await fetchObjects(config.workspace!, newPath, type);
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
            await fetchObjects(config.bucket!, newPath, type);
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
      <div className="container mt-14 mx-auto p-6">
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

        <Dialog open={showSheetSelector} onOpenChange={setShowSheetSelector}>
          <DialogContent style={{ userSelect: 'none' }}>
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
          <DialogContent className="max-w-2xl" style={{ userSelect: 'none' }}>
            <DialogHeader>
              <DialogTitle>Browse {selectedSource === "azure-blob" ? "Azure Containers" : selectedSource === "onelake" ? "OneLake Workspaces" : "S3 Buckets"}</DialogTitle>
              <DialogDescription>
                Select a {selectedSource === "azure-blob" ? "container" : selectedSource === "onelake" ? "workspace and lakehouse" : "bucket"} and file for the data source. Supported: Excel, CSV, Parquet files.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <Breadcrumbs type="source" />

              <div className="border rounded-lg max-h-96 overflow-y-auto" style={{ userSelect: 'none' }}>
                {!sourceConfig.workspace && !sourceConfig.bucket ? (
                  buckets.length > 0 ? (
                    buckets.map((bucket) => (
                      <div
                        key={bucket.name}
                        className={`flex items-center gap-3 p-3 hover:bg-primary/10 cursor-pointer border-b last:border-b-0 ${sourceSelectedItem === bucket.name ? "bg-primary/20 border-primary/50" : ""
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
                          className={`flex items-center gap-3 p-3 hover:bg-primary/10 cursor-pointer border-b last:border-b-0 ${sourceSelectedItem === obj.key ? "bg-primary/20 border-primary/50" : ""
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
                          className={`flex items-center gap-3 p-3 hover:bg-primary/10 cursor-pointer border-b last:border-b-0 ${sourceSelectedItem === obj.key ? "bg-primary/20 border-primary/50" : ""
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
                          className={`flex items-center gap-3 p-3 hover:bg-primary/10 cursor-pointer border-b last:border-b-0 ${sourceSelectedItem === obj.key ? "bg-primary/20 border-primary/50" : ""
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
          <DialogContent className="max-w-2xl style={{ userSelect: 'none' }}">
            <DialogHeader>
              <DialogTitle>
                Browse
                {
                  selectedDestination === "snowflake" ? " Snowflake Databases" :
                    selectedDestination === "delta-tables" ? " Delta Tables" :
                      selectedDestination === "azure-blob" ? " Azure Containers" :
                        selectedDestination === "onelake" ? " OneLake Workspaces" :
                          "S3 Buckets"
                }
              </DialogTitle>
              <DialogDescription>
                Select a {selectedDestination === "azure-blob" ? "container" : selectedDestination === "onelake" ? "workspace and lakehouse" : "bucket"} and folder for the destination.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <Breadcrumbs type="destination" />

              <div className="border rounded-lg max-h-96 overflow-y-auto" style={{ userSelect: 'none' }}>
                {!destinationConfig.workspace && !destinationConfig.bucket && selectedDestination !== "snowflake" ? (
                  buckets.length > 0 ? (
                    buckets.map((bucket) => (
                      <div
                        key={bucket.name}
                        className={`flex items-center gap-3 p-3 hover:bg-primary/10 cursor-pointer border-b last:border-b-0 ${destSelectedItem === bucket.name ? "bg-primary/20 border-primary/50" : ""
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
                ) : selectedDestination === "snowflake" ? (
                  snowflakeDatabases.length > 0 ? (
                    snowflakeDatabases.map((database) => (
                      <div
                        key={database}
                        className={`flex items-center gap-3 p-3 hover:bg-primary/10 cursor-pointer border-b last:border-b-0 ${destSelectedItem === database ? "bg-primary/20 border-primary/50" : ""
                          }`}
                        onClick={() => setDestSelectedItem(database)}
                        onDoubleClick={() => {
                          const destPath = `snowflake://${database}`;
                          setSelectedDestPath(destPath);
                          setIsDestConnected(true);
                          localStorage.setItem("selectedDestBucket", database);
                          localStorage.setItem("selectedDestination", "snowflake");
                          localStorage.setItem("selectedDestFolder", "");
                          setShowDestBrowser(false);
                          toast({ title: "Database Selected", description: `Selected: ${destPath}` });
                          scrollToSummary();
                        }}
                      >
                        <Database className="w-4 h-4 text-blue-500" />
                        <div className="flex-1 font-medium">{database}</div>
                      </div>
                    ))
                  ) : (
                    <div className="p-3 text-center text-muted-foreground">No databases available.</div>
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
                          className={`flex items-center gap-3 p-3 hover:bg-primary/10 cursor-pointer border-b last:border-b-0 ${destSelectedItem === obj.key ? "bg-primary/20 border-primary/50" : ""
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
                          className={`flex items-center gap-3 p-3 hover:bg-primary/10 cursor-pointer border-b last:border-b-0 ${destSelectedItem === obj.key ? "bg-primary/20 border-primary/50" : ""
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
                          className={`flex items-center gap-3 p-3 hover:bg-primary/10 cursor-pointer border-b last:border-b-0 ${destSelectedItem === obj.key ? "bg-primary/20 border-primary/50" : ""
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

              {!(destinationConfig.bucket || destinationConfig.workspace) && destSelectedItem && selectedDestination !== "snowflake" && (
                <Button
                  onClick={handleSelectDestBucketOrContainer}
                  className="w-fit flex items-center gap-2"
                >
                  Select This {selectedDestination === "azure-blob" ? "Container" : selectedDestination === "onelake" ? "Workspace" : "Bucket"}
                </Button>
              )}

              {/* Show button for S3/Azure when bucket is selected and item is selected */}
              {destinationConfig.bucket && destSelectedItem && destSelectedItem !== ".." && (
                <Button
                  onClick={handleSelectDestinationFolder}
                  disabled={!selectedSourcePath}
                  className="w-fit flex items-center gap-2"
                >
                  Select This Folder
                </Button>
              )}

              {selectedDestination === "snowflake" && destSelectedItem && (
  <Button
    onClick={() => {
      const destPath = `snowflake://${destSelectedItem}`;
      setSelectedDestPath(destPath);
      setIsDestConnected(true);
      localStorage.setItem("selectedDestBucket", destSelectedItem);
      localStorage.setItem("selectedDestFolder", ""); // ← ADD THIS
      localStorage.setItem("selectedDestination", "snowflake");
      setShowDestBrowser(false);
      toast({ title: "Database Selected", description: `Selected: ${destPath}` });
      scrollToSummary();
    }}
    className="w-fit flex items-center gap-2"
  >
    Select This Database
  </Button>
)}

              {/* Show button for OneLake when workspace/lakehouse is selected and item is selected */}
              {destinationConfig.workspace && destinationConfig.lakehouse && destSelectedItem && destSelectedItem !== ".." && (
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
          open={showDeltaBrowser}
          onOpenChange={(open) => {
            setShowDeltaBrowser(open);
            if (!open) {
              setSourceConfig((prev) => ({ ...prev, workspace: undefined, lakehouse: undefined }));
              setSelectedSourcePath("");
              setIsSourceConnected(false);
              setObjects([]);
              setDeltaTables([]);
              setSelectedDeltaTable("");
              localStorage.removeItem("selectedBucket");
            }
          }}
        >
          <DialogContent className="max-w-2xl " style={{ userSelect: 'none' }}>
            <DialogHeader>
              <DialogTitle>Browse Delta Tables</DialogTitle>
              <DialogDescription>Select a workspace, lakehouse, and delta table</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="border rounded-lg max-h-96 overflow-y-auto" style={{ userSelect: 'none' }}>
                {!sourceConfig.workspace ? (
                  buckets.length > 0 ? (
                    buckets.map((bucket) => (
                      <div
                        key={bucket.name}
                        className="flex items-center gap-3 p-3 hover:bg-primary/10 cursor-pointer border-b last:border-b-0"
                        onDoubleClick={() => handleSelectBucket(bucket.name, "source")}
                      >
                        <Folder className="w-4 h-4 text-blue-500" />
                        <div className="flex-1 font-medium">{bucket.name}</div>
                      </div>
                    ))
                  ) : (
                    <div className="p-3 text-center text-muted-foreground">No workspaces available.</div>
                  )
                ) : !sourceConfig.lakehouse ? (
                  <>
                    <div
                      className="flex items-center gap-3 p-3 hover:bg-primary/10 cursor-pointer border-b"
                      onDoubleClick={() => {
                        setSourceConfig((prev) => ({ ...prev, workspace: undefined }));
                        setObjects([]);
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
                          className="flex items-center gap-3 p-3 hover:bg-primary/10 cursor-pointer border-b last:border-b-0"
                          onDoubleClick={async () => {
                            const workspaceName = sourceConfig.workspace!;
                            const lakehouseName = obj.key;
                            setSourceConfig((prev) => ({ ...prev, lakehouse: lakehouseName }));
                            setObjects([]);

                            setIsLoadingDeltaTables(true);
                            try {
                              const fetchedTables = await getDeltaTables(workspaceName, lakehouseName);
                              setDeltaTables(fetchedTables);
                              const data = fetchedTables.map((table) => ({
                                key: table.name,
                                isFolder: false,
                              }));
                              setObjects(data);
                            } catch (error) {
                              toast({
                                title: "Error",
                                description: `Failed to fetch delta tables: ${error instanceof Error ? error.message : "Unknown error"}`,
                                variant: "destructive",
                              });
                            } finally {
                              setIsLoadingDeltaTables(false);
                            }
                          }}
                        >
                          <Folder className="w-4 h-4 text-blue-500" />
                          <div className="flex-1 font-medium">{obj.key}</div>
                        </div>
                      ))
                    ) : (
                      <div className="p-3 text-center text-muted-foreground">No lakehouses available.</div>
                    )}
                  </>
                ) : (
                  <>
                    <div
                      className="flex items-center gap-3 p-3 hover:bg-primary/10 cursor-pointer border-b"
                      onDoubleClick={() => {
                        setSourceConfig((prev) => ({ ...prev, lakehouse: undefined }));
                        setDeltaTables([]);
                        setSelectedDeltaTable("");
                        fetchObjects(sourceConfig.workspace!, "", "source");
                      }}
                    >
                      <Folder className="w-4 h-4 text-blue-500" />
                      <div className="flex-1 font-medium">..</div>
                    </div>
                    {isLoadingDeltaTables ? (
                      <div className="p-3 text-center text-muted-foreground">
                        <Loader2 className="w-4 h-4 inline animate-spin mr-2" />
                        Loading tables...
                      </div>
                    ) : deltaTables.length > 0 ? (
                      deltaTables.map((table) => (
                        <div
                          key={table.name}
                          className={`flex items-center gap-3 p-3 hover:bg-primary/10 cursor-pointer border-b last:border-b-0 ${selectedDeltaTable === table.name ? "bg-primary/20 border-primary/50" : ""
                            }`}
                          onClick={() => {
                            console.log("Single click on table:", table.name);
                            setSelectedDeltaTable(table.name);
                          }}
                          onDoubleClick={() => {
                            console.log("Double click on table:", table.name);
                            console.log("Workspace:", sourceConfig.workspace);
                            console.log("Lakehouse:", sourceConfig.lakehouse);

                            const fullPath = `delta-tables://${sourceConfig.workspace}/${sourceConfig.lakehouse}/${table.name}`;
                            console.log("Full path:", fullPath);

                            setSelectedSourcePath(fullPath);
                            setIsSourceConnected(true);
                            setShowDeltaBrowser(false);
                            localStorage.setItem("selectedBucket", sourceConfig.workspace!);
                            localStorage.setItem("selectedFile", table.name);
                            toast({ title: "Table Selected", description: `Selected: ${fullPath}` });
                            scrollToSummary();
                          }}
                        >
                          <Database className="w-4 h-4 text-gray-500" />
                          <div className="flex-1 font-medium">{table.name}</div>
                          {selectedDeltaTable === table.name && <CheckCircle className="w-5 h-5 text-green-500" />}
                        </div>
                      ))
                    ) : (
                      <div className="p-3 text-center text-muted-foreground">No tables available.</div>
                    )} </>
                )}
              </div>
              {selectedDeltaTable && sourceConfig.lakehouse && (
                <Button
                  onClick={() => {
                    console.log("Select button clicked for:", selectedDeltaTable);
                    const fullPath = `delta-tables://${sourceConfig.workspace}/${sourceConfig.lakehouse}/${selectedDeltaTable}`;
                    console.log("Full path:", fullPath);

                    setSelectedSourcePath(fullPath);
                    setIsSourceConnected(true);
                    setShowDeltaBrowser(false);
                    localStorage.setItem("selectedBucket", sourceConfig.workspace!);
                    localStorage.setItem("selectedFile", selectedDeltaTable);
                    toast({ title: "Table Selected", description: `Selected: ${fullPath}` });
                    scrollToSummary();
                  }}
                  className="w-fit flex items-center gap-2"
                >
                  Select Table
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

          <DialogContent className="max-w-2xl" style={{ userSelect: 'none' }}>
            <DialogHeader>
              <DialogTitle>Browse Database Tables</DialogTitle>
              <DialogDescription>Select a single table from the database for the data source.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">Connection: {sourceConfig.connectionString}</div>
              <div className="border rounded-lg max-h-96 overflow-y-auto" style={{ userSelect: 'none' }}>
                {databaseTables.length > 0 ? (
                  databaseTables.map((table) => (
                    <div
                      key={table}
                      className={`flex items-center gap-3 p-3 hover:bg-primary/10 cursor-pointer border-b last:border-b-0 ${sourceDBSelectedTable === table ? "bg-primary/20 border-primary/50" : ""
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

                    setSelectedSourcePath(fullPath);
                    setIsSourceConnected(true);

                    setShowSourceDBBrowser(false);

                    // Store database connection details in localStorage
                    localStorage.setItem("selectedBucket", sourceConfig.connectionString!);
                    localStorage.setItem("selectedFile", sourceDBSelectedTable);
                    localStorage.setItem("db_host", sourceConfig.connectionString!);
                    localStorage.setItem("db_name", sourceConfig.databaseName!);
                    localStorage.setItem("db_user", sourceConfig.username!);
                    localStorage.setItem("db_password", sourceConfig.password!);
                    localStorage.setItem("db_port", sourceConfig.port!);
                    localStorage.setItem("db_table", sourceDBSelectedTable);
                    localStorage.setItem("input_type", "database");

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
        <Dialog
          open={showSnowflakeBrowser}
          onOpenChange={(open) => {
            setShowSnowflakeBrowser(open);
            if (!open) {
              setSelectedSnowflakeDatabase("");
              setSelectedSnowflakeTable("");
              setSnowflakeTables([]);
              setSelectedSourcePath("");
              setIsSourceConnected(false);
              localStorage.removeItem("selectedFile");
              localStorage.removeItem("selectedBucket");
            }
          }}
        >
          <DialogContent className="max-w-2xl" style={{ userSelect: 'none' }}>
            <DialogHeader>
              <DialogTitle>Browse Snowflake</DialogTitle>
              <DialogDescription>
                {!selectedSnowflakeDatabase
                  ? "Select a database"
                  : "Select a table"}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="border rounded-lg max-h-96 overflow-y-auto" style={{ userSelect: 'none' }}>
                {!selectedSnowflakeDatabase ? (
                  snowflakeDatabases.length > 0 ? (
                    snowflakeDatabases.map((database) => (
                      <div
                        key={database}
                        className="flex items-center gap-3 p-3 hover:bg-primary/10 cursor-pointer border-b last:border-b-0"
                        onDoubleClick={async () => {
                          setSelectedSnowflakeDatabase(database);
                          setIsLoadingSnowflakeTables(true);
                          try {
                            const tables = await getSnowflakeTables(database);
                            setSnowflakeTables(tables);
                          } catch (error) {
                            toast({
                              title: "Error",
                              description: `Failed to fetch tables: ${error instanceof Error ? error.message : "Unknown error"}`,
                              variant: "destructive",
                            });
                          } finally {
                            setIsLoadingSnowflakeTables(false);
                          }
                        }}
                      >
                        <Database className="w-4 h-4 text-blue-500" />
                        <div className="flex-1 font-medium">{database}</div>
                      </div>
                    ))
                  ) : (
                    <div className="p-3 text-center text-muted-foreground">No databases available.</div>
                  )
                ) : (
                  <>
                    <div
                      className="flex items-center gap-3 p-3 hover:bg-primary/10 cursor-pointer border-b"
                      onDoubleClick={() => {
                        setSelectedSnowflakeDatabase("");
                        setSelectedSnowflakeTable("");
                        setSnowflakeTables([]);
                      }}
                    >
                      <Folder className="w-4 h-4 text-blue-500" />
                      <div className="flex-1 font-medium">..</div>
                    </div>
                    {isLoadingSnowflakeTables ? (
                      <div className="p-3 text-center text-muted-foreground">
                        <Loader2 className="w-4 h-4 inline animate-spin mr-2" />
                        Loading tables...
                      </div>
                    ) : snowflakeTables.length > 0 ? (
                      snowflakeTables.map((table) => (
                        <div
                          key={table}
                          className={`flex items-center gap-3 p-3 hover:bg-primary/10 cursor-pointer border-b last:border-b-0 ${selectedSnowflakeTable === table ? "bg-primary/20 border-primary/50" : ""
                            }`}
                          onClick={() => setSelectedSnowflakeTable(table)}
                          onDoubleClick={() => {
                            const fullPath = `snowflake://${selectedSnowflakeDatabase}/${table}`;
                            setSelectedSourcePath(fullPath);
                            setIsSourceConnected(true);
                            setShowSnowflakeBrowser(false);

                            // Store in localStorage
                            localStorage.setItem("selectedBucket", selectedSnowflakeDatabase);
                            localStorage.setItem("selectedFile", table);
                            localStorage.setItem("db_name", selectedSnowflakeDatabase);  // ← ADD THIS
                            localStorage.setItem("db_table", table);
                            localStorage.setItem("input_type", "snowflake");

                            toast({ title: "Table Selected", description: `Selected: ${fullPath}` });
                            scrollToSummary();
                          }}
                        >
                          <Database className="w-4 h-4 text-gray-500" />
                          <div className="flex-1 font-medium">{table}</div>
                          {selectedSnowflakeTable === table && <CheckCircle className="w-5 h-5 text-green-500" />}
                        </div>
                      ))
                    ) : (
                      <div className="p-3 text-center text-muted-foreground">No tables available.</div>
                    )}
                  </>
                )}
              </div>
              {selectedSnowflakeTable && selectedSnowflakeDatabase && (
                <Button
                  onClick={() => {
                    const fullPath = `snowflake://${selectedSnowflakeDatabase}/${selectedSnowflakeTable}`;
                    setSelectedSourcePath(fullPath);
                    setIsSourceConnected(true);
                    setShowSnowflakeBrowser(false);

                    localStorage.setItem("selectedBucket", selectedSnowflakeDatabase);
                    localStorage.setItem("selectedFile", selectedSnowflakeTable);
                    localStorage.setItem("db_name", selectedSnowflakeDatabase);
                    localStorage.setItem("db_table", selectedSnowflakeTable);
                    localStorage.setItem("input_type", "snowflake");
                    toast({ title: "Table Selected", description: `Selected: ${fullPath}` });
                    scrollToSummary();
                  }}
                  className="w-fit flex items-center gap-2"
                >
                  Select Table
                </Button>
              )}
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
                    localStorage.setItem("selectedDestination", value);
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
                    <p className="text-sm text-muted-foreground">
                      Path: {selectedDestination === "azure-blob"
                        ? selectedDestPath.split('/').slice(0, -1).join('/')
                        : selectedDestPath}
                    </p>                  </div>
                </div>
              </div>
              <div className="mt-6 flex justify-between gap-4">
                <Button onClick={handleGoBack} variant="outline" size="lg" className="px-8">
                  <ArrowLeft className="w-4 h-4 mr-2" /> Back
                </Button>
                <Button
                  onClick={handleProceed}
                  size="lg"
                  className="px-8"
                  disabled={isTransferring || isUploadingLocal}
                >
                  {isUploadingLocal ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Uploading File...
                    </>
                  ) : isTransferring ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <ArrowRight className="w-4 h-4 mr-2" /> Proceed
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}