import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Code, Calculator } from "lucide-react";

interface Job {
  id: string;
  name: string;
}

interface BusinessLogicStepProps {
  job: Job | null;
}

interface BusinessRule {
  id: string;
  name: string;
  type: 'transformation' | 'calculation' | 'filter';
  logic: string;
  description: string;
}

export default function BusinessLogicStep({ job }: BusinessLogicStepProps) {
  const [rules, setRules] = useState<BusinessRule[]>([
    {
      id: '1',
      name: 'Calculate Customer Age',
      type: 'calculation',
      logic: 'DATEDIFF(YEAR, birth_date, CURRENT_DATE()) AS age',
      description: 'Calculate customer age from birth date'
    },
    {
      id: '2',
      name: 'Filter Active Customers',
      type: 'filter',
      logic: 'status = \'active\' AND last_login_date > DATE_SUB(CURRENT_DATE(), INTERVAL 90 DAY)',
      description: 'Only include customers who are active and logged in within last 90 days'
    },
    {
      id: '3',
      name: 'Normalize Phone Numbers',
      type: 'transformation',
      logic: 'REGEXP_REPLACE(phone, \'[^0-9]\', \'\') AS normalized_phone',
      description: 'Remove all non-numeric characters from phone numbers'
    }
  ]);

  const [newRule, setNewRule] = useState<Partial<BusinessRule>>({
    type: 'transformation'
  });

  const ruleTypes = [
    { value: 'transformation', label: 'Data Transformation' },
    { value: 'calculation', label: 'Calculation' },
    { value: 'filter', label: 'Filter Condition' },
  ];

  const addRule = () => {
    if (newRule.name && newRule.logic) {
      const rule: BusinessRule = {
        id: Math.random().toString(36).substr(2, 9),
        name: newRule.name!,
        type: newRule.type as 'transformation' | 'calculation' | 'filter',
        logic: newRule.logic!,
        description: newRule.description || ''
      };
      setRules([...rules, rule]);
      setNewRule({ type: 'transformation' });
    }
  };

  const removeRule = (id: string) => {
    setRules(rules.filter(rule => rule.id !== id));
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'calculation':
        return <Calculator className="w-4 h-4" />;
      default:
        return <Code className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'transformation':
        return 'bg-blue-500';
      case 'calculation':
        return 'bg-green-500';
      case 'filter':
        return 'bg-purple-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code className="w-5 h-5" />
            Business Logic Rules
          </CardTitle>
          <CardDescription>
            Define transformations, calculations, and filtering logic for your data.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Existing Rules */}
          <div className="space-y-4">
            <h4 className="font-medium">Active Logic Rules ({rules.length})</h4>
            {rules.map((rule, index) => (
              <div key={rule.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{rule.name}</span>
                      <Badge className={`text-white ${getTypeColor(rule.type)}`}>
                        {getTypeIcon(rule.type)}
                        <span className="ml-1">{rule.type.toUpperCase()}</span>
                      </Badge>
                      <Badge variant="outline">Step {index + 1}</Badge>
                    </div>
                    <div className="bg-muted p-3 rounded text-sm font-mono">
                      {rule.logic}
                    </div>
                    {rule.description && (
                      <p className="text-sm text-muted-foreground">{rule.description}</p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeRule(rule.id)}
                    className="text-red-500 hover:text-red-700 ml-2"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Add New Rule */}
          <div className="border-t pt-6">
            <h4 className="font-medium mb-4">Add New Logic Rule</h4>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="logicName">Rule Name</Label>
                  <Input
                    id="logicName"
                    placeholder="Enter rule name"
                    value={newRule.name || ''}
                    onChange={(e) => setNewRule({ ...newRule, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="logicType">Rule Type</Label>
                  <select
                    id="logicType"
                    value={newRule.type}
                    onChange={(e) => setNewRule({ ...newRule, type: e.target.value as any })}
                    className="w-full p-2 border border-input rounded-md bg-background"
                  >
                    {ruleTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="logicSql">SQL Logic</Label>
                <Textarea
                  id="logicSql"
                  placeholder="Enter SQL logic (e.g., UPPER(first_name) AS first_name_upper)"
                  value={newRule.logic || ''}
                  onChange={(e) => setNewRule({ ...newRule, logic: e.target.value })}
                  rows={4}
                  className="font-mono"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="logicDescription">Description (Optional)</Label>
                <Input
                  id="logicDescription"
                  placeholder="Brief description of what this rule does"
                  value={newRule.description || ''}
                  onChange={(e) => setNewRule({ ...newRule, description: e.target.value })}
                />
              </div>
            </div>
            <Button onClick={addRule} className="mt-4 flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Add Logic Rule
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
