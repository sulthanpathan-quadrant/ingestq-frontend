import React, { useState, useCallback, useRef, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { ArrowRight } from "lucide-react";
import { CloudCog } from "lucide-react"; // Add CloudCog
import type { OneLakeResponse } from "@/lib/api";
import {
  getOneLakeWorkspaces,
  getOneLakeLakehouses,
  getOneLakeContents,
  getDeltaTables,   // ← Make sure this exists
  exportDeltaToS3,  // ← Add this too (for future use)
  transferInputToS3,
  getExcelSheets

} from "@/lib/api";
import * as XLSX from "xlsx";

import {
  Database,
  Cloud,
  HardDrive,
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
  Snowflake,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { getBuckets, getObjects, getFile, getAzureContainers, getAzureBlobs, getAzureBlobFile, getSnowflakeDatabases, getSnowflakeTables } from "@/lib/api";

interface SourceConfig {
  connectionString?: string;
  databaseName?: string;
  username?: string;
  password?: string;
  port?: string;
  bucket?: string;
  currentPath?: string;
  workspace?: string;      // ADD
  lakehouse?: string;
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
  workspace?: string;      // ADD
  lakehouse?: string;
}

interface Bucket {
  name: string;
}

interface Object {
  key: string;
  isFolder?: boolean;
}

// interface OneLakeResponse {
//   folders?: string[];
//   files?: { name: string; size: string }[];
//   current_path: string;
// }

const storedSheet = localStorage.getItem('selectedSheet');


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
  const summaryRef = useRef<HTMLDivElement>(null);
  const [buckets, setBuckets] = useState<Bucket[]>([]);
  const [objects, setObjects] = useState<Object[]>([]);

  const [sourceDBSelectedTable, setSourceDBSelectedTable] = useState<string>(""); // Change from array to single string
  const [excelSheets, setExcelSheets] = useState<string[]>([]);
  const [selectedSheet, setSelectedSheet] = useState<string>("");
  const [showSheetSelector, setShowSheetSelector] = useState<boolean>(false);
  const [currentExcelFile, setCurrentExcelFile] = useState<File | null>(null);
  const [databaseTables, setDatabaseTables] = useState<string[]>([]);
  // ADD these missing state variables after your existing useState declarations:
  const [deltaTables, setDeltaTables] = useState<Array<{ name: string, id: string }>>([]);
  const [showDeltaBrowser, setShowDeltaBrowser] = useState<boolean>(false);
  const [selectedDeltaTable, setSelectedDeltaTable] = useState<string>("");
  const [cloudFileKey, setCloudFileKey] = useState<string>("");
  const [isLoadingLakehouses, setIsLoadingLakehouses] = useState<boolean>(false);
  const [isLoadingDeltaTables, setIsLoadingDeltaTables] = useState<boolean>(false);
  const [isTransferring, setIsTransferring] = useState<boolean>(false);
  const [transferredS3Paths, setTransferredS3Paths] = useState<Record<string, string>>({});


  const [snowflakeDatabases, setSnowflakeDatabases] = useState<string[]>([]);
  const [snowflakeTables, setSnowflakeTables] = useState<string[]>([]);
  const [showSnowflakeBrowser, setShowSnowflakeBrowser] = useState<boolean>(false);
  const [selectedSnowflakeDatabase, setSelectedSnowflakeDatabase] = useState<string>("");
  const [selectedSnowflakeTable, setSelectedSnowflakeTable] = useState<string>("");
  const [isLoadingSnowflakeTables, setIsLoadingSnowflakeTables] = useState<boolean>(false);


  const dataSources = [
    { value: "local", label: "Local", icon: HardDrive },
    { value: "s3", label: "S3", icon: Cloud },
    { value: "azure-blob", label: "Azure Blob", icon: CloudRain },
    { value: "onelake", label: "OneLake", icon: CloudCog },        // ADD
    { value: "delta-tables", label: "Delta Tables", icon: Database }, // ADD
    { value: "database", label: "Database", icon: Server },
    { value: "snowflake", label: "Snowflake", icon: Snowflake },
  ];

  const destinations = [
    { value: "s3", label: "S3", icon: Cloud },
    { value: "azure-blob", label: "Azure Blob", icon: Database },
    { value: "onelake", label: "OneLake", icon: CloudCog },        // ADD
    { value: "delta-tables", label: "Delta Tables", icon: Database },
    { value: "snowflake", label: "Snowflake", icon: Snowflake },

  ];

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

  const fetchExcelSheetsFromCloud = async (workspace: string, lakehouse: string, fileKey: string) => {
    try {
      toast({ title: "Reading Excel File", description: "Extracting sheet names..." });
      let bucketName = workspace;

      const response = await getExcelSheets(bucketName, fileKey);

      if (response.sheets && response.sheets.length > 0) {
        setExcelSheets(response.sheets);
        setShowSheetSelector(true);
      } else {
        throw new Error("No sheets found in the Excel file");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to read Excel file: ${error instanceof Error ? error.message : "Unknown error"}`,
        variant: "destructive"
      });
    }
  };
  useEffect(() => {
    // Load persisted data from localStorage on mount
    const storedSource = localStorage.getItem('selectedSource');
    if (storedSource) {
      setSelectedSource(storedSource);
    }

    const storedDestination = localStorage.getItem('selectedDestination');
    if (storedDestination) {
      setSelectedDestination(storedDestination);
    }

    const storedSourceConfig = localStorage.getItem('sourceConfig');
    if (storedSourceConfig) {
      setSourceConfig(JSON.parse(storedSourceConfig));
    }

    const storedDestinationConfig = localStorage.getItem('destinationConfig');
    if (storedDestinationConfig) {
      setDestinationConfig(JSON.parse(storedDestinationConfig));
    }

    const storedSourcePath = localStorage.getItem('datasource');
    if (storedSourcePath) {
      setSelectedSourcePath(storedSourcePath);
    }

    const storedDestPath = localStorage.getItem('datadestination');
    if (storedDestPath) {
      setSelectedDestPath(storedDestPath);
    }

    const storedSheet = localStorage.getItem('selectedSheet');
    if (storedSheet) {
      setSelectedSheet(storedSheet);
    }
  }, []);

  useEffect(() => {
    if (selectedSource) {
      localStorage.setItem('selectedSource', selectedSource);
    } else {
      localStorage.removeItem('selectedSource');
    }
  }, [selectedSource]);

  useEffect(() => {
    if (selectedDestination) {
      localStorage.setItem('selectedDestination', selectedDestination);
    } else {
      localStorage.removeItem('selectedDestination');
    }
  }, [selectedDestination]);

  useEffect(() => {
    localStorage.setItem('sourceConfig', JSON.stringify(sourceConfig));
  }, [sourceConfig]);

  useEffect(() => {
    localStorage.setItem('destinationConfig', JSON.stringify(destinationConfig));
  }, [destinationConfig]);

  useEffect(() => {
    if (selectedSourcePath) {
      setIsSourceConnected(true);
      localStorage.setItem('datasource', selectedSourcePath);
    } else {
      localStorage.removeItem('datasource');
    }
  }, [selectedSourcePath]);

  useEffect(() => {
    if (selectedDestPath) {
      setIsDestConnected(true);
      localStorage.setItem('datadestination', selectedDestPath);
    } else {
      localStorage.removeItem('datadestination');
    }
  }, [selectedDestPath]);



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

      if (effectiveType === "delta-tables" || effectiveType === "onelake") {
        if (!config.lakehouse) {
          // Fetch lakehouses
          setIsLoadingLakehouses(true);
          try {
            const lakehouses = await getOneLakeLakehouses(bucketName);
            setIsLoadingLakehouses(false);

            // ✅ FIX: Handle both string[] and object[] responses
            data = lakehouses.map((lh: any) => ({
              key: typeof lh === 'string' ? lh : (lh.name || lh.id || lh.displayName),
              isFolder: true,
            }));
          } catch (error) {
            setIsLoadingLakehouses(false);
            throw error;
          }
        } else {
          // After lakehouse is selected...
          if (type === "source") {
            if (effectiveType === "delta-tables") {
              // Fetch delta tables for source
              setIsLoadingDeltaTables(true);
              try {
                const tables = await getDeltaTables(bucketName, config.lakehouse);
                setIsLoadingDeltaTables(false);
                setDeltaTables(tables);
                data = tables.map((table) => ({
                  key: table.name,
                  isFolder: false,
                }));
              } catch (error) {
                setIsLoadingDeltaTables(false);
                throw error;
              }
            } else {
              // OneLake source: fetch files/folders
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
          } else {
            // ✅ DESTINATION: Show folders (for both delta-tables and onelake)
            const response: OneLakeResponse = await getOneLakeContents(
              bucketName,
              config.lakehouse,
              prefix || 'Files'
            );
            const folders = Array.isArray(response.folders) ? response.folders : [];

            // For destination, only show folders
            data = folders.map((folder: string) => ({
              key: folder,
              isFolder: true,
            }));
          }
        }
        setObjects(data || []);
        return;
      }

      // if (effectiveType === "onelake") {
      //   if (!config.lakehouse) {
      //     setIsLoadingLakehouses(true);
      //     const lakehouses = await getOneLakeLakehouses(bucketName);
      //     setIsLoadingLakehouses(false);

      //     data = lakehouses.map((lh: string) => ({
      //       key: lh,
      //       isFolder: true,
      //     }));
      //   } else {
      //     let effectivePrefix = prefix ?? '';
      //     if (effectivePrefix.startsWith(`${config.lakehouse}.Lakehouse/`)) {
      //       effectivePrefix = effectivePrefix.slice(`${config.lakehouse}.Lakehouse/`.length);
      //     }

      //     const response: OneLakeResponse = await getOneLakeContents(
      //       bucketName,
      //       config.lakehouse,
      //       effectivePrefix
      //     );
      //     const folders = Array.isArray(response.folders) ? response.folders : [];
      //     const files = Array.isArray(response.files) ? response.files : [];

      //     const validFiles = files.filter(file => typeof file.name === 'string');

      //     data = [
      //       ...folders.map((folder: string) => {
      //         let cleanFolder = folder;
      //         if (cleanFolder.startsWith(`${config.lakehouse}.Lakehouse/`)) {
      //           cleanFolder = cleanFolder.slice(`${config.lakehouse}.Lakehouse/`.length);
      //         }
      //         return {
      //           key: cleanFolder,
      //           isFolder: true,
      //         };
      //       }),
      //       ...validFiles.map((file: { name: string; size: string }) => {
      //         let cleanFile = file.name;
      //         if (cleanFile.startsWith(`${config.lakehouse}.Lakehouse/`)) {
      //           cleanFile = cleanFile.slice(`${config.lakehouse}.Lakehouse/`.length);
      //         }
      //         return {
      //           key: cleanFile,
      //           isFolder: false,
      //         };
      //       }),
      //     ];

      //     const lakehousePrefix = `${config.lakehouse}.Lakehouse/`;
      //     let normalizedPath = response.current_path;
      //     if (normalizedPath.startsWith(lakehousePrefix)) {
      //       normalizedPath = normalizedPath.slice(lakehousePrefix.length);
      //     }
      //     normalizedPath = normalizedPath.replace(/\/+$/, '');
      //     setConfig((prev) => ({
      //       ...prev,
      //       currentPath: normalizedPath,
      //     }));
      //   }
      // } 
      else if (effectiveType === "azure-blob") {
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
    const bucketOrContainer = destinationConfig.workspace || destinationConfig.bucket;
    const destPath = `${selectedDestination}://${bucketOrContainer}/${destinationConfig.lakehouse ? destinationConfig.lakehouse + "/" : ""
      }${destinationConfig.currentPath || ""}${destSelectedItem || sourceFilename}`;
    setSelectedDestPath(destPath);
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
      } else if (selectedSource === "onelake") {
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
        } catch (error) {
          toast({ title: "Error", description: "Failed to connect. Check console for details.", variant: "destructive" });
        } finally {
          setIsDestConnecting(false);
        }
      }
      else if (selectedDestination === "onelake") {
        if (!selectedSourcePath) {
          toast({ title: "Error", description: "Please select a source file first", variant: "destructive" });
          return;
        }
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
      else if (selectedDestination === "delta-tables") {
        if (!selectedSourcePath) {
          toast({ title: "Error", description: "Please select a source file first", variant: "destructive" });
          return;
        }
        setIsDestConnecting(true);
        try {
          await fetchBuckets(type);
          setShowDestBrowser(true);  // Reuse the same browser for folder selection
        } catch (error) {
          toast({ title: "Error", description: "Failed to connect. Check console for details.", variant: "destructive" });
        } finally {
          setIsDestConnecting(false);
        }
      }
      else if (selectedDestination === "database") {
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

      else if (selectedDestination === "snowflake") {
        if (!selectedSourcePath) {
          toast({ title: "Error", description: "Please select a source file first", variant: "destructive" });
          return;
        }
        setIsDestConnecting(true);
        try {
          const databases = await getSnowflakeDatabases();
          setSnowflakeDatabases(databases);
          setShowDestBrowser(true);
        } catch (error) {
          toast({ title: "Error", description: "Failed to connect. Check console for details.", variant: "destructive" });
        } finally {
          setIsDestConnecting(false);
        }
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
    if (selectedDestination === "s3" || selectedDestination === "azure-blob" || selectedDestination === "onelake" || selectedDestination === "delta-tables" || selectedDestination === "snowflake") {
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
                Connect to {destinations.find((d) => d.value === selectedDestination)?.label}
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
  const mockTables = ["customers", "orders", "products", "employees", "departments"];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 p-6">
      <div className="max-w-7xl mx-auto">
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
                className={`border-2 border-dashed rounded-lg p-8 text-center ${isDragActive ? "border-primary bg-primary/10" : "border-muted-foreground/50"
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
          <DialogContent className="max-w-2xl" style={{ userSelect: 'none' }}>
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
                            setSelectedDeltaTable(table.name);
                          }}
                          onDoubleClick={() => {
                            const fullPath = `delta-tables://${destinationConfig.workspace}/${destinationConfig.lakehouse}/${table.name}`;
                            setSelectedDestPath(fullPath);
                            setIsDestConnected(true);
                            localStorage.setItem("selectedDestBucket", destinationConfig.workspace!); // ← ADD THIS
                            localStorage.setItem("selectedDestFolder", table.name); // ← ADD THIS
                            setShowDestBrowser(false);
                            toast({ title: "Table Selected", description: `Selected: ${fullPath}` });
                          }}
                        >
                          <Database className="w-4 h-4 text-gray-500" />
                          <div className="flex-1 font-medium">{table.name}</div>
                          {selectedDeltaTable === table.name && <CheckCircle className="w-5 h-5 text-green-500" />}
                        </div>
                      ))
                    ) : (
                      <div className="p-3 text-center text-muted-foreground">No tables available.</div>
                    )}
                  </>
                )}
              </div>
              {selectedDeltaTable && sourceConfig.lakehouse && (
                <Button
                  onClick={() => {
                    const fullPath = `delta-tables://${sourceConfig.workspace}/${sourceConfig.lakehouse}/${selectedDeltaTable}`;
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

                            // Store in localStorage immediately
                            localStorage.setItem("selectedBucket", selectedSnowflakeDatabase);
                            localStorage.setItem("selectedFile", table);
                            localStorage.setItem("db_name", selectedSnowflakeDatabase);
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

                    // Store in localStorage immediately
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

        <Dialog
          open={showSourceBrowser && (selectedSource === "s3" || selectedSource === "azure-blob" || selectedSource === "onelake")}
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
          <DialogContent className="max-w-2xl" style={{ userSelect: 'none' }}>
            <DialogHeader>
              <DialogTitle>
                Browse {selectedSource === "azure-blob" ? "Azure Containers" : selectedSource === "onelake" ? "OneLake Workspaces" : "S3 Buckets"}
              </DialogTitle>
              <DialogDescription>
                Select a {selectedSource === "azure-blob" ? "container" : selectedSource === "onelake" ? "workspace and lakehouse" : "bucket"} and file for the data source. Supported: Excel, CSV, Parquet files.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <Breadcrumbs type="source" />

              <div className="border rounded-lg max-h-96 overflow-y-auto" style={{ userSelect: 'none' }}>
                {/* Show workspaces/buckets/containers */}
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

                {/* Show lakehouses (OneLake only) */}
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

                {/* Show files/folders (OneLake with lakehouse selected OR S3/Azure) */}
                {(sourceConfig.workspace && sourceConfig.lakehouse) || sourceConfig.bucket ? (
                  <>
                    <div
                      className="flex items-center gap-3 p-3 hover:bg-primary/10 cursor-pointer border-b"
                      onDoubleClick={() => handleS3Navigation("..", true, "source")}
                    >
                      <Folder className="w-4 h-4 text-blue-500" />
                      <div className="flex-1 font-medium">..</div>
                    </div>

                    {objects && objects.length > 0 ? (
                      objects.map((obj) => {
                        const isFolder = obj.isFolder || obj.key.endsWith("/");
                        return (
                          <div
                            key={`${sourceConfig.lakehouse || sourceConfig.bucket}-${obj.key}`}
                            className={`flex items-center gap-3 p-3 hover:bg-primary/10 cursor-pointer border-b last:border-b-0 ${sourceSelectedItem === obj.key ? "bg-primary/20 border-primary/50" : ""
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
                        No {selectedSource === "azure-blob" ? "blobs" : selectedSource === "onelake" ? "contents" : "objects"} available.
                      </div>
                    )}
                  </>
                ) : null}
              </div>

              {(sourceConfig.bucket || (sourceConfig.workspace && sourceConfig.lakehouse)) && sourceSelectedItem && !sourceSelectedItem.endsWith("/") && (
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
              setDestinationConfig((prev) => ({
                ...prev,
                bucket: undefined,
                workspace: undefined,
                lakehouse: undefined,
                currentPath: ""
              }));
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
              <DialogTitle>
                Browse {selectedDestination === "azure-blob" ? "Azure Containers" :
                  selectedDestination === "onelake" || selectedDestination === "delta-tables" ? "OneLake Workspaces" :
                    selectedDestination === "snowflake" ? "Snowflake Databases" :
                      "S3 Buckets"}
              </DialogTitle>
              <DialogDescription>
                {selectedDestination === "snowflake"
                  ? "Select a database"
                  : `Select a ${selectedDestination === "azure-blob" ? "container" : "bucket"} and folder for the destination.`}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <Breadcrumbs type="destination" />

              <div className="border rounded-lg max-h-96 overflow-y-auto">

                {/* ⭐ SNOWFLAKE SECTION ADDED HERE */}
                {selectedDestination === "snowflake" ? (
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
                    <div className="p-3 text-center text-muted-foreground">
                      No databases available.
                    </div>
                  )
                ) : !destinationConfig.workspace && !destinationConfig.bucket ? (
                  /* ⬇️ EXISTING bucket/workspace rendering remains unchanged */
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
                      No {selectedDestination === "azure-blob" ? "containers" : "buckets"} available.
                    </div>
                  )
                ) : null}


                {/* Show lakehouses (OneLake/Delta Tables only) */}
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

                {/* Show files/folders (After lakehouse selected OR for S3/Azure) */}
                {(destinationConfig.workspace && destinationConfig.lakehouse) || destinationConfig.bucket ? (
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
                            className={`flex items-center gap-3 p-3 hover:bg-primary/10 cursor-pointer border-b last:border-b-0 ${destSelectedItem === obj.key ? "bg-primary/20 border-primary/50" : ""
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
                ) : null}
              </div>
              {destinationConfig.bucket && destSelectedItem && destSelectedItem !== ".." && (
                <div className="text-sm text-muted-foreground">
                  Selected Path: {`${selectedDestination}://${destinationConfig.bucket}/${destinationConfig.currentPath || ""}${destSelectedItem}`}
                </div>
              )}
              {!(destinationConfig.bucket || destinationConfig.workspace) && destSelectedItem && (
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

              {/* NEW BUTTON FOR ONELAKE/DELTA TABLES */}
              {destinationConfig.workspace && destinationConfig.lakehouse &&
                destSelectedItem && destSelectedItem !== ".." && (
                  <Button
                    onClick={handleSelectDestinationFolder}
                    disabled={!selectedSourcePath}
                    className="w-fit flex items-center gap-2"
                  >
                    Select This Folder
                  </Button>
                )}

              {/* {selectedDestination === "snowflake" && destSelectedItem && (
                <Button
                  onClick={() => {
                    const destPath = `snowflake://${destSelectedItem}`;
                    setSelectedDestPath(destPath);
                    setIsDestConnected(true);
                    localStorage.setItem("selectedDestBucket", destSelectedItem);
                    localStorage.setItem("selectedDestFolder", "");
                    setShowDestBrowser(false);
                    toast({ title: "Database Selected", description: `Selected: ${destPath}` });
                    scrollToSummary();
                  }}
                  className="w-fit flex items-center gap-2"
                >
                  Select This Database
                </Button>
              )} */}


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
          <DialogContent className="max-w-2xl" style={{ userSelect: 'none' }}>
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
                          onClick={() => setSelectedDeltaTable(table.name)}
                          onDoubleClick={() => {
                            const fullPath = `delta-tables://${sourceConfig.workspace}/${sourceConfig.lakehouse}/${table.name}`;
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
                    )}
                  </>
                )}
              </div>
              {selectedDeltaTable && sourceConfig.lakehouse && (
                <Button
                  onClick={() => {
                    const fullPath = `delta-tables://${sourceConfig.workspace}/${sourceConfig.lakehouse}/${selectedDeltaTable}`;
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

            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}