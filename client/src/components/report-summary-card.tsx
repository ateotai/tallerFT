import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface ReportSummaryCardProps {
  title: string;
  value: string | number;
  change?: {
    value: number;
    trend: "up" | "down" | "neutral";
  };
  icon: React.ReactNode;
  description?: string;
}

export function ReportSummaryCard({
  title,
  value,
  change,
  icon,
  description,
}: ReportSummaryCardProps) {
  const getTrendIcon = () => {
    if (!change) return null;
    
    if (change.trend === "up") {
      return <TrendingUp className="h-4 w-4 text-green-600" />;
    }
    if (change.trend === "down") {
      return <TrendingDown className="h-4 w-4 text-red-600" />;
    }
    return <Minus className="h-4 w-4 text-gray-600" />;
  };

  const getTrendColor = () => {
    if (!change) return "";
    
    if (change.trend === "up") return "text-green-600";
    if (change.trend === "down") return "text-red-600";
    return "text-gray-600";
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className="text-muted-foreground">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold mb-2">{value}</div>
        {change && (
          <div className={`flex items-center gap-1 text-sm ${getTrendColor()}`}>
            {getTrendIcon()}
            <span className="font-medium">
              {change.value > 0 ? "+" : ""}
              {change.value}%
            </span>
            <span className="text-muted-foreground ml-1">vs período anterior</span>
          </div>
        )}
        {description && (
          <p className="text-xs text-muted-foreground mt-2">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}
