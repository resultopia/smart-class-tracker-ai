
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Filter, FileDown } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface Props {
  selectedDate: Date | undefined;
  setSelectedDate: (date?: Date) => void;
  exportFilteredCSV: () => void;
  clearDateFilter: () => void;
  filteredRecordsLength: number;
}

const AttendanceHistoryHeader = ({
  selectedDate,
  setSelectedDate,
  exportFilteredCSV,
  clearDateFilter,
  filteredRecordsLength
}: Props) => (
  <div className="flex items-center space-x-2">
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm">
          <CalendarIcon className="h-4 w-4 mr-2" />
          {selectedDate ? format(selectedDate, 'MMM dd, yyyy') : 'All dates'}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={setSelectedDate}
          initialFocus
          className={cn("p-3 pointer-events-auto")}
        />
      </PopoverContent>
    </Popover>
    {selectedDate && (
      <Button variant="ghost" size="sm" onClick={clearDateFilter}>
        <Filter className="h-4 w-4 mr-2" />
        Clear filter
      </Button>
    )}
    {filteredRecordsLength > 0 && (
      <Button variant="outline" size="sm" onClick={exportFilteredCSV}>
        <FileDown className="h-4 w-4 mr-2" />
        Export CSV
      </Button>
    )}
  </div>
);

export default AttendanceHistoryHeader;
