import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Shield, AlertTriangle } from "lucide-react";

interface Job {
  id: string;
  name: string;
}

interface DQRulesStepProps {
  job: Job | null;
}

interface DQRule {
  id: string;
  name: string;
  type: string;
  column: string;
  condition: string;
  severity: 'error' | 'warning';
  description: string;
}

export default function DQRulesStep({ job }: DQRulesStepProps) {
  const [rules, setRules] = useState<DQRule[]>([
    {
      id: '1',
      name: 'Email Format Validation',
      type: 'format',
      column: 'email',
      condition: 'REGEX_MATCH(email, \'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$\')',
      severity: 'error',
      description: 'Validates email address format'
    },
    {
      id: '2',
      name: 'Age Range Check',
      type: 'range',
      column: 'age',
      condition: 'age BETWEEN 18 AND 120',
      severity: 'warning',
      description: 'Age should be between 18 and 120'
    }
  ]);

  const [newRule, setNewRule] = useState<Partial<DQRule>>({
    type: 'format',
    severity: 'error'
  });

  const ruleTypes = [
    { value: 'format', label: 'Format Validation' },
    { value: 'range', label: 'Range Check' },
    { value: 'null', label: 'Null Check' },
    { value: 'unique', label: 'Uniqueness Check' },
    { value: 'custom', label: 'Custom Rule' },
  ];

  const addRule = () => {
    if (newRule.name && newRule.column && newRule.condition) {
      const rule: DQRule = {
        id: Math.random().toString(36).substr(2, 9),
        name: newRule.name!,
        type: newRule.type!,
        column: newRule.column!,
        condition: newRule.condition!,
        severity: newRule.severity as 'error' | 'warning',
        description: newRule.description || ''
      };
      setRules([...rules, rule]);
      setNewRule({ type: 'format', severity: 'error' });
    }
  };

  const removeRule = (id: string) => {
    setRules(rules.filter(rule => rule.id !== id));
  };

  const getSeverityColor = (severity: string) => {
    return severity === 'error' ? 'bg-red-500' : 'bg-yellow-500';
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Data Quality Rules
          </CardTitle>
          <CardDescription>
            Configure validation rules to ensure data quality and integrity.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Existing Rules */}
          <div className="space-y-4">
            <h4 className="font-medium">Active Rules ({rules.length})</h4>
            {rules.map((rule) => (
              <div key={rule.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{rule.name}</span>
                      <Badge className={`text-white ${getSeverityColor(rule.severity)}`}>
                        {rule.severity === 'error' ? (
                          <AlertTriangle className="w-3 h-3 mr-1" />
                        ) : (
                          <Shield className="w-3 h-3 mr-1" />
                        )}
                        {rule.severity.toUpperCase()}
                      </Badge>
                      <Badge variant="outline">{rule.type}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">Column: {rule.column}</p>
                    <p className="text-sm text-muted-foreground">Condition: {rule.condition}</p>
                    {rule.description && (
                      <p className="text-sm text-muted-foreground">{rule.description}</p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeRule(rule.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Add New Rule */}
          <div className="border-t pt-6">
            <h4 className="font-medium mb-4">Add New Rule</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ruleName">Rule Name</Label>
                <Input
                  id="ruleName"
                  placeholder="Enter rule name"
                  value={newRule.name || ''}
                  onChange={(e) => setNewRule({ ...newRule, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ruleType">Rule Type</Label>
                <Select value={newRule.type} onValueChange={(value) => setNewRule({ ...newRule, type: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ruleTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="ruleColumn">Column</Label>
                <Input
                  id="ruleColumn"
                  placeholder="Column name"
                  value={newRule.column || ''}
                  onChange={(e) => setNewRule({ ...newRule, column: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ruleSeverity">Severity</Label>
                <Select value={newRule.severity} onValueChange={(value: 'error' | 'warning') => setNewRule({ ...newRule, severity: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="error">Error</SelectItem>
                    <SelectItem value="warning">Warning</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2 space-y-2">
                <Label htmlFor="ruleCondition">Condition</Label>
                <Textarea
                  id="ruleCondition"
                  placeholder="Enter validation condition (e.g., column_name IS NOT NULL)"
                  value={newRule.condition || ''}
                  onChange={(e) => setNewRule({ ...newRule, condition: e.target.value })}
                  rows={2}
                />
              </div>
              <div className="col-span-2 space-y-2">
                <Label htmlFor="ruleDescription">Description (Optional)</Label>
                <Input
                  id="ruleDescription"
                  placeholder="Brief description of the rule"
                  value={newRule.description || ''}
                  onChange={(e) => setNewRule({ ...newRule, description: e.target.value })}
                />
              </div>
            </div>
            <Button onClick={addRule} className="mt-4 flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Add Rule
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
