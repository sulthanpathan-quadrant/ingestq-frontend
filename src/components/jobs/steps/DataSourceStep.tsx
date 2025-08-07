import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Database, Cloud, Folder, FileText, CheckCircle, X } from "lucide-react";

interface Job {
  id: string;
  name: string;
}

interface DataSourceStepProps {
  job: Job | null;
}

export default function DataSourceStep({ job }: DataSourceStepProps) {
  const [sourceType, setSourceType] = useState("s3");
  const [credentials, setCredentials] = useState({
    accessKey: "",
    secretKey: ""
  });
  const [selectedPath, setSelectedPath] = useState("");
  const [showBrowser, setShowBrowser] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  const sourceTypes = [
    { value: "s3", label: "Amazon S3", icon: Cloud },
    { value: "azure", label: "Azure Blob", icon: Cloud },
    { value: "database", label: "Database", icon: Database },
  ];

  const mockFolders = [
    { name: "raw-data", type: "folder" },
    { name: "processed", type: "folder" },
    { name: "customer-data.csv", type: "file" },
    { name: "sales-2024.json", type: "file" }
  ];

  const handleConnect = async () => {
    if (!credentials.accessKey || !credentials.secretKey) {
      alert("Please enter credentials first");
      return;
    }
    
    setIsConnecting(true);
    // Simulate connection delay
    setTimeout(() => {
      setIsConnected(true);
      setIsConnecting(false);
    }, 2000);
  };

  const handleBrowse = () => {
    if (!isConnected) {
      alert("Please connect first");
      return;
    }
    setShowBrowser(true);
  };

  const handleRemoveFile = () => {
    setSelectedPath("");
  };

  const renderSourceConfig = () => {
    switch (sourceType) {
      case "s3":
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="accessKey">AWS Access Key ID</Label>
                <Input
                  id="accessKey"
                  placeholder="AKIA..."
                  value={credentials.accessKey}
                  onChange={(e) => setCredentials({ ...credentials, accessKey: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="secretKey">AWS Secret Access Key</Label>
                <Input
                  id="secretKey"
                  type="password"
                  placeholder="Enter secret key"
                  value={credentials.secretKey}
                  onChange={(e) => setCredentials({ ...credentials, secretKey: e.target.value })}
                />
              </div>
            </div>
            
            {selectedPath && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium text-green-800">File selected:</span>
                    <span className="text-sm text-green-700">{selectedPath}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleRemoveFile}
                    className="h-6 w-6 p-0 text-green-600 hover:text-green-800 hover:bg-green-100"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
            
            <div className="flex justify-start">
              <Button 
                onClick={handleConnect}
                disabled={isConnecting || isConnected || !credentials.accessKey || !credentials.secretKey || !!selectedPath}
                className="flex items-center gap-2"
              >
                {isConnecting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                    Connecting...
                  </>
                ) : isConnected ? (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Connected
                  </>
                ) : (
                  "Connect"
                )}
              </Button>
            </div>

            {isConnected && (
              <div className="space-y-2">
                <Label htmlFor="selectedPath">Selected File/Path</Label>
                <div className="flex gap-2">
                  <Input
                    id="selectedPath"
                    placeholder="Browse and select a file..."
                    value={selectedPath}
                    readOnly
                  />
                  <Button variant="outline" onClick={handleBrowse}>
                    <Folder className="w-4 h-4 mr-2" />
                    Browse
                  </Button>
                </div>
              </div>
            )}

            {showBrowser && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Browse S3 Bucket</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {mockFolders.map((item) => (
                      <div
                        key={item.name}
                        className="flex items-center gap-2 p-2 hover:bg-muted rounded cursor-pointer"
                        onClick={() => {
                          if (item.type === "file") {
                            setSelectedPath(`s3://prod-customer-data/${item.name}`);
                            setShowBrowser(false);
                          }
                        }}
                      >
                        {item.type === "folder" ? (
                          <Folder className="w-4 h-4 text-blue-500" />
                        ) : (
                          <FileText className="w-4 h-4 text-gray-500" />
                        )}
                        <span className="text-sm">{item.name}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-end gap-2 mt-4">
                    <Button variant="outline" size="sm" onClick={() => setShowBrowser(false)}>
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        );
      case "azure":
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="connectionString">Connection String</Label>
                <Input
                  id="connectionString"
                  placeholder="DefaultEndpointsProtocol=https;AccountName=..."
                  value={credentials.accessKey}
                  onChange={(e) => setCredentials({ ...credentials, accessKey: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="containerName">Container Name</Label>
                <Input
                  id="containerName"
                  placeholder="data-container"
                  value={credentials.secretKey}
                  onChange={(e) => setCredentials({ ...credentials, secretKey: e.target.value })}
                />
              </div>
            </div>
            
            {selectedPath && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium text-green-800">File selected:</span>
                    <span className="text-sm text-green-700">{selectedPath}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleRemoveFile}
                    className="h-6 w-6 p-0 text-green-600 hover:text-green-800 hover:bg-green-100"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
            
            <div className="flex justify-start">
              <Button 
                onClick={handleConnect}
                disabled={isConnecting || isConnected || !credentials.accessKey || !credentials.secretKey || !!selectedPath}
                className="flex items-center gap-2"
              >
                {isConnecting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                    Connecting...
                  </>
                ) : isConnected ? (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Connected
                  </>
                ) : (
                  "Connect"
                )}
              </Button>
            </div>

            {isConnected && (
              <div className="space-y-2">
                <Label htmlFor="selectedPath">Selected File/Path</Label>
                <div className="flex gap-2">
                  <Input
                    id="selectedPath"
                    placeholder="Browse and select a file..."
                    value={selectedPath}
                    readOnly
                  />
                  <Button variant="outline" onClick={handleBrowse}>
                    <Folder className="w-4 h-4 mr-2" />
                    Browse
                  </Button>
                </div>
              </div>
            )}
          </div>
        );
      case "database":
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="host">Host</Label>
                <Input 
                  id="host" 
                  placeholder="localhost"
                  value={credentials.accessKey}
                  onChange={(e) => setCredentials({ ...credentials, accessKey: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="port">Port</Label>
                <Input 
                  id="port" 
                  placeholder="5432"
                  value={credentials.secretKey}
                  onChange={(e) => setCredentials({ ...credentials, secretKey: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="database">Database</Label>
                <Input id="database" placeholder="production_db" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input id="username" placeholder="admin" />
              </div>
            </div>
            
            {selectedPath && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium text-green-800">File selected:</span>
                    <span className="text-sm text-green-700">{selectedPath}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleRemoveFile}
                    className="h-6 w-6 p-0 text-green-600 hover:text-green-800 hover:bg-green-100"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
            
            <div className="flex justify-start">
              <Button 
                onClick={handleConnect}
                disabled={isConnecting || isConnected || !credentials.accessKey || !credentials.secretKey || !!selectedPath}
                className="flex items-center gap-2"
              >
                {isConnecting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                    Connecting...
                  </>
                ) : isConnected ? (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Connected
                  </>
                ) : (
                  "Connect"
                )}
              </Button>
            </div>
          </div>
        );
      default:
        return (
          <div className="text-center py-8 text-muted-foreground">
            Configuration options will appear here based on the selected source type.
          </div>
        );
    }
  };

  // Reset connection state when source type changes
  const handleSourceTypeChange = (value: string) => {
    setSourceType(value);
    setIsConnected(false);
    setCredentials({ accessKey: "", secretKey: "" });
    setSelectedPath("");
    setShowBrowser(false);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            Data Source Configuration
          </CardTitle>
          <CardDescription>
            Configure the input data source for this job.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <Badge variant="secondary">Currently Active</Badge>
            <span className="text-sm text-muted-foreground">Amazon S3 - prod-customer-data</span>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="sourceType">Source Type</Label>
              <Select value={sourceType} onValueChange={handleSourceTypeChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {sourceTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex items-center gap-2">
                        <type.icon className="w-4 h-4" />
                        {type.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {renderSourceConfig()}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}