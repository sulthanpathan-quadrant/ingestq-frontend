import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Folder, File, ChevronRight, Cloud, Database as DatabaseIcon } from "lucide-react";
import { getBuckets, getObjects, getAzureContainers, getAzureBlobs } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import React from "react";

interface CompactDataUploadStepProps {
  config?: Record<string, any>;
  onConfigChange?: (config: Record<string, any>) => void;
  jobDatasource?: string;
  jobDatadestination?: string;
  hideExistingPaths?: boolean;
}

interface Bucket {
  name: string;
}

interface S3Object {
  key: string;
  isFolder?: boolean;
}

export default function CompactDataUploadStep({ 
  config = {}, 
  onConfigChange,
  jobDatasource,
  jobDatadestination,
  hideExistingPaths = false
}: CompactDataUploadStepProps) {
  const { toast } = useToast();

  // Derive paths from config or job props
  const sourcePath = config.sourcePath || (hideExistingPaths ? "" : jobDatasource || "");
  const destinationPath = config.destinationPath || (hideExistingPaths ? "" : jobDatadestination || "");
  const sourceType = config.sourceType || (sourcePath?.startsWith('s3://') ? 's3' : sourcePath?.startsWith('azure-blob://') ? 'azure-blob' : 's3');
  const destinationType = config.destinationType || (destinationPath?.startsWith('s3://') ? 's3' : destinationPath?.startsWith('azure-blob://') ? 'azure-blob' : 's3');

  useEffect(() => {
    if ((jobDatasource || jobDatadestination) && !config.sourcePath && !config.destinationPath && !hideExistingPaths) {
      updateConfig({
        sourcePath: jobDatasource || "",
        destinationPath: jobDatadestination || "",
        sourceType,
        destinationType
      });
    }
  }, [jobDatasource, jobDatadestination]);

  const [showSourceBrowser, setShowSourceBrowser] = useState(false);
  const [showDestBrowser, setShowDestBrowser] = useState(false);
  const [buckets, setBuckets] = useState<Bucket[]>([]);
  const [objects, setObjects] = useState<S3Object[]>([]);
  const [currentBucket, setCurrentBucket] = useState<string>("");
  const [currentPath, setCurrentPath] = useState<string>("");
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [browserMode, setBrowserMode] = useState<"source" | "dest">("source");

  const updateConfig = (changes: Partial<typeof config>) => {
    if (onConfigChange) {
      const newConfig = { ...config, ...changes };
      console.log('📝 Updating config in CompactDataUploadStep:', newConfig);
      onConfigChange(newConfig);
    }
  };

  const fetchBuckets = async (type: "s3" | "azure-blob") => {
    try {
      const data = type === "azure-blob" ? await getAzureContainers() : await getBuckets();
      const formattedBuckets = Array.isArray(data) ? data.map((name: string) => ({ name })) : [];
      setBuckets(formattedBuckets);
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to fetch ${type === "azure-blob" ? "containers" : "buckets"}.`,
        variant: "destructive",
      });
      setBuckets([]);
    }
  };

  const fetchObjects = async (bucketName: string, prefix: string, type: "s3" | "azure-blob") => {
    try {
      const data = type === "azure-blob" 
        ? await getAzureBlobs(bucketName, prefix)
        : await getObjects(bucketName, prefix);
      setObjects(data || []);
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to fetch ${type === "azure-blob" ? "blobs" : "objects"}.`,
        variant: "destructive",
      });
      setObjects([]);
    }
  };

  const handleBrowseClick = async (mode: "source" | "dest") => {
    setBrowserMode(mode);
    const type = mode === "source" ? sourceType : destinationType;
    setCurrentBucket("");
    setCurrentPath("");
    setObjects([]);
    setSelectedItem(null);
    await fetchBuckets(type as "s3" | "azure-blob");
    if (mode === "source") {
      setShowSourceBrowser(true);
    } else {
      setShowDestBrowser(true);
    }
  };

  const handleSelectBucket = async (bucketName: string) => {
    setCurrentBucket(bucketName);
    setCurrentPath("");
    const type = browserMode === "source" ? sourceType : destinationType;
    await fetchObjects(bucketName, "", type as "s3" | "azure-blob");
    setSelectedItem(null);
  };

  const handleNavigation = async (item: string, isFolder: boolean) => {
    const type = browserMode === "source" ? sourceType : destinationType;
    
    if (item === "..") {
      const parts = currentPath.split("/").filter(p => p);
      if (parts.length === 0) {
        setCurrentBucket("");
        setCurrentPath("");
        setObjects([]);
        await fetchBuckets(type as "s3" | "azure-blob");
      } else {
        parts.pop();
        const newPath = parts.join("/") + (parts.length > 0 ? "/" : "");
        setCurrentPath(newPath);
        await fetchObjects(currentBucket, newPath, type as "s3" | "azure-blob");
      }
    } else if (isFolder) {
      const newPath = currentPath + item;
      setCurrentPath(newPath);
      await fetchObjects(currentBucket, newPath, type as "s3" | "azure-blob");
    } else {
      const fileKey = currentPath + item;
      const fullPath = `${type}://${currentBucket}/${fileKey}`;
      
      if (browserMode === "source") {
        updateConfig({ sourcePath: fullPath });
        setShowSourceBrowser(false);
        toast({ title: "File Selected", description: fullPath });
      } else {
        updateConfig({ destinationPath: fullPath });
        setShowDestBrowser(false);
        toast({ title: "Destination Selected", description: fullPath });
      }
    }
    setSelectedItem(null);
  };

  const handleSelectCurrentLocation = () => {
    const type = browserMode === "source" ? sourceType : destinationType;
    const fullPath = currentPath 
      ? `${type}://${currentBucket}/${currentPath}`
      : `${type}://${currentBucket}/`;
    
    if (browserMode === "source") {
      updateConfig({ sourcePath: fullPath });
      setShowSourceBrowser(false);
      toast({ title: "Source Selected", description: fullPath });
    } else {
      updateConfig({ destinationPath: fullPath });
      setShowDestBrowser(false);
      toast({ title: "Destination Selected", description: fullPath });
    }
  };

  const Breadcrumbs = () => (
    <div className="flex flex-wrap items-center gap-1 text-sm text-muted-foreground mb-2">
      <span
        onClick={async () => {
          setCurrentBucket("");
          setCurrentPath("");
          setObjects([]);
          const type = browserMode === "source" ? sourceType : destinationType;
          await fetchBuckets(type as "s3" | "azure-blob");
        }}
        className="cursor-pointer hover:underline flex items-center"
      >
        <Folder className="w-4 h-4 mr-1" /> Root
      </span>
      {currentBucket && (
        <>
          <ChevronRight className="w-4 h-4" />
          <span
            onClick={async () => {
              setCurrentPath("");
              const type = browserMode === "source" ? sourceType : destinationType;
              await fetchObjects(currentBucket, "", type as "s3" | "azure-blob");
            }}
            className="cursor-pointer hover:underline"
          >
            {currentBucket}
          </span>
        </>
      )}
      {currentPath &&
        currentPath.split("/").filter(p => p).map((part, idx, arr) => (
          <React.Fragment key={idx}>
            <ChevronRight className="w-4 h-4" />
            <span
              onClick={async () => {
                const newPath = arr.slice(0, idx + 1).join("/") + "/";
                setCurrentPath(newPath);
                const type = browserMode === "source" ? sourceType : destinationType;
                await fetchObjects(currentBucket, newPath, type as "s3" | "azure-blob");
              }}
              className="cursor-pointer hover:underline"
            >
              {part}
            </span>
          </React.Fragment>
        ))}
    </div>
  );


  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Source Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Cloud className="w-4 h-4" />
            Data Source Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Current Source Path</Label>
            <div className="p-3 bg-muted/50 rounded-md text-sm border min-h-[44px] flex items-center">
              {sourcePath || <span className="text-muted-foreground">No source configured</span>}
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => handleBrowseClick("source")}
              className="w-full flex items-center gap-2"
            >
              <Folder className="w-4 h-4 mr-2" />
              {sourcePath ? "Change Source" : "Browse Source"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Destination Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <DatabaseIcon className="w-4 h-4" />
            Destination Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Current Destination Path</Label>
            <div className="p-3 bg-muted/50 rounded-md text-sm border min-h-[44px] flex items-center">
              {destinationPath || <span className="text-muted-foreground">No destination configured</span>}
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => handleBrowseClick("dest")}
              className="w-fit flex items-center gap-2"
            >
              <Folder className="w-4 h-4 mr-2" />
              {destinationPath ? "Change Destination" : "Browse Destination"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Source Browser Dialog */}
      <Dialog open={showSourceBrowser} onOpenChange={setShowSourceBrowser}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Browse {sourceType === "azure-blob" ? "Azure Containers" : "S3 Buckets"}</DialogTitle>
            <DialogDescription>
              Select a {sourceType === "azure-blob" ? "container" : "bucket"} and file for the source.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Breadcrumbs />
            <div className="border rounded-lg max-h-96 overflow-y-auto">
              {!currentBucket ? (
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
                    No {sourceType === "azure-blob" ? "containers" : "buckets"} available.
                  </div>
                )
              ) : (
                <>
                  <div
                    className="flex items-center gap-3 p-3 hover:bg-primary/10 cursor-pointer border-b last:border-b-0"
                    onDoubleClick={() => handleNavigation("..", true)}
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
                          onDoubleClick={() => handleNavigation(obj.key, isFolder)}
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
                      No {sourceType === "azure-blob" ? "blobs" : "objects"} available.
                    </div>
                  )}
                </>
              )}
            </div>
            {currentBucket && selectedItem && !selectedItem.endsWith("/") && (
              <Button
                onClick={() => handleNavigation(selectedItem, false)}
                className="w-fit flex items-center gap-2 mt-2"
              >
                Select {selectedItem}
              </Button>
            )}
            {currentBucket && (!selectedItem || selectedItem.endsWith("/")) && (
              <Button
                onClick={handleSelectCurrentLocation}
                className="w-fit flex items-center gap-2 mt-2"
              >
                Select This {currentPath ? "Folder" : sourceType === "azure-blob" ? "Container" : "Bucket"}
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Destination Browser Dialog */}
      <Dialog open={showDestBrowser} onOpenChange={setShowDestBrowser}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Browse {destinationType === "azure-blob" ? "Azure Containers" : "S3 Buckets"}</DialogTitle>
            <DialogDescription>
              Select a {destinationType === "azure-blob" ? "container" : "bucket"} and folder for the destination.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Breadcrumbs />
            <div className="border rounded-lg max-h-96 overflow-y-auto">
              {!currentBucket ? (
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
                    No {destinationType === "azure-blob" ? "containers" : "buckets"} available.
                  </div>
                )
              ) : (
                <>
                  <div
                    className="flex items-center gap-3 p-3 hover:bg-primary/10 cursor-pointer border-b last:border-b-0"
                    onDoubleClick={() => handleNavigation("..", true)}
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
                          onDoubleClick={() => handleNavigation(obj.key, isFolder)}
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
                      No {destinationType === "azure-blob" ? "blobs" : "objects"} available.
                    </div>
                  )}
                </>
              )}
            </div>
            {currentBucket && selectedItem && selectedItem !== ".." && (
              <div className="text-sm text-muted-foreground mt-2">
                Selected Path: {`${destinationType}://${currentBucket}/${currentPath || ""}${selectedItem}`}
              </div>
            )}
            {!currentBucket && selectedItem && (
              <Button
                onClick={handleSelectCurrentLocation}
                className="w-fit flex items-center gap-2 mt-2"
              >
                Select This {destinationType === "azure-blob" ? "Container" : "Bucket"}
              </Button>
            )}
            {currentBucket && selectedItem && selectedItem.endsWith("/") && (
              <Button
                onClick={() => {
                  const fullPath = `${destinationType}://${currentBucket}/${currentPath}${selectedItem}`;
                  updateConfig({ destinationPath: fullPath });
                  setShowDestBrowser(false);
                  toast({ title: "Destination Selected", description: fullPath });
                }}
                className="w-fit flex items-center gap-2 mt-2"
              >
                Select This Folder
              </Button>
            )}
            {currentBucket && (!selectedItem || (currentPath && !selectedItem)) && (
              <Button
                onClick={handleSelectCurrentLocation}
                className="w-fit flex items-center gap-2 mt-2"
              >
                Select This {currentPath ? "Folder" : destinationType === "azure-blob" ? "Container" : "Bucket"}
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}