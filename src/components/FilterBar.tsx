import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

export type ResultTab = "web" | "images";
export type TimeRange = "any" | "day" | "week" | "month" | "year";

const TIME_RANGES: Array<{ value: TimeRange; label: string }> = [
  { value: "any", label: "Any time" },
  { value: "day", label: "Past day" },
  { value: "week", label: "Past week" },
  { value: "month", label: "Past month" },
  { value: "year", label: "Past year" },
];

const REGIONS = [
  { value: "any", label: "Any region" },
  { value: "us", label: "United States" },
  { value: "gb", label: "United Kingdom" },
  { value: "in", label: "India" },
  { value: "de", label: "Germany" },
  { value: "fr", label: "France" },
  { value: "ca", label: "Canada" },
  { value: "au", label: "Australia" },
  { value: "jp", label: "Japan" },
  { value: "br", label: "Brazil" },
];

type Props = {
  tab: ResultTab;
  time: TimeRange;
  region: string;
  safeSearch: boolean;
  onTabChange: (tab: ResultTab) => void;
  onTimeChange: (time: TimeRange) => void;
  onRegionChange: (region: string) => void;
  onSafeSearchChange: (safe: boolean) => void;
};

export function FilterBar({
  tab,
  time,
  region,
  safeSearch,
  onTabChange,
  onTimeChange,
  onRegionChange,
  onSafeSearchChange,
}: Props) {
  return (
    <div className="flex flex-wrap items-center gap-2.5 border-b border-border py-3">
      <Tabs value={tab} onValueChange={(v) => onTabChange(v as ResultTab)}>
        <TabsList>
          <TabsTrigger value="web">Web</TabsTrigger>
          <TabsTrigger value="images">Images</TabsTrigger>
        </TabsList>
      </Tabs>

      <Select value={time} onValueChange={(v) => onTimeChange(v as TimeRange)}>
        <SelectTrigger className="h-8 w-[130px] rounded-full text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {TIME_RANGES.map((r) => (
            <SelectItem key={r.value} value={r.value}>
              {r.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={region} onValueChange={onRegionChange}>
        <SelectTrigger className="h-8 w-[150px] rounded-full text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {REGIONS.map((r) => (
            <SelectItem key={r.value} value={r.value}>
              {r.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <label className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
        Safe search
        <Switch checked={safeSearch} onCheckedChange={onSafeSearchChange} />
      </label>
    </div>
  );
}
