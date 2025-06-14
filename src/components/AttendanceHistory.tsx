
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import AttendanceSessionList from "./AttendanceSessionList";
import AttendanceTable from "./AttendanceTable";
import AttendanceHistoryHeader from "./AttendanceHistoryHeader";
import AttendanceSessions from "./AttendanceSessions";
import AttendanceRecordsTable from "./AttendanceRecordsTable";
import { useAttendanceHistory } from "@/hooks/useAttendanceHistory";
import { Class } from "@/lib/types";

interface AttendanceHistoryProps {
  classData: Class;
}

const AttendanceHistory = ({ classData }: AttendanceHistoryProps) => {
  const {
    selectedDate,
    setSelectedDate,
    filteredRecords,
    allRecords,
    dateSessions,
    selectedSession,
    setSelectedSession,
    userLookup,
    exportFilteredCSV,
    clearDateFilter,
    handleSessionSelect,
    deleteSession,
    toggleAttendanceStatus,
  } = useAttendanceHistory(classData);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Attendance History</span>
            <AttendanceHistoryHeader
              selectedDate={selectedDate}
              setSelectedDate={setSelectedDate}
              exportFilteredCSV={exportFilteredCSV}
              clearDateFilter={clearDateFilter}
              filteredRecordsLength={filteredRecords.length}
            />
          </CardTitle>
        </CardHeader>
        <CardContent>
          {selectedDate && dateSessions.length > 0 && (
            <AttendanceSessions
              dateSessions={dateSessions}
              selectedSession={selectedSession}
              onSessionSelect={handleSessionSelect}
              onDeleteSession={deleteSession}
              selectedDate={selectedDate}
            />
          )}

          {!selectedSession ? (
            <div className="text-center py-8 text-muted-foreground">
              {selectedDate && dateSessions.length > 0
                ? "Select a class session above to view attendance records."
                : selectedDate
                  ? `No attendance records found for ${format(selectedDate, 'MMM dd, yyyy')}.`
                  : "No attendance records found for the selected criteria."
              }
            </div>
          ) : (
            <AttendanceRecordsTable
              filteredRecords={filteredRecords}
              selectedSession={selectedSession}
              toggleAttendanceStatus={toggleAttendanceStatus}
              userLookup={userLookup}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AttendanceHistory;
