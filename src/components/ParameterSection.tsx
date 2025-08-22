import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ReactNode } from "react";

interface ParameterSectionProps {
  title: string;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function ParameterSection({ title, icon, children, className = "" }: ParameterSectionProps) {
  return (
    <Card className={`${className} shadow-card hover:shadow-elevation transition-shadow duration-300`}>
      <CardHeader className="bg-gradient-to-r from-engineering-primary to-engineering-primary-light text-white rounded-t-lg">
        <CardTitle className="flex items-center gap-2 text-lg">
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-4">
        {children}
      </CardContent>
    </Card>
  );
}

interface ParameterInputProps {
  label: string;
  value: string | number;
  onChange: (value: string) => void;
  type?: string;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  placeholder?: string;
}

export function ParameterInput({ 
  label, 
  value, 
  onChange, 
  type = "number", 
  min, 
  max, 
  step, 
  unit, 
  placeholder 
}: ParameterInputProps) {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium text-foreground">
        {label} {unit && <span className="text-muted-foreground">({unit})</span>}
      </Label>
      <Input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        min={min}
        max={max}
        step={step}
        placeholder={placeholder}
        className="border-blue-300 focus:border-blue-400 focus:ring-blue-400 shadow-sm shadow-blue-200/50 focus:shadow-blue-300/60 transition-all duration-200"
      />
    </div>
  );
}

interface ParameterSelectProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  placeholder?: string;
}

export function ParameterSelect({ label, value, onChange, options, placeholder }: ParameterSelectProps) {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium text-foreground">{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="focus:ring-engineering-primary focus:border-engineering-primary">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map(option => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}