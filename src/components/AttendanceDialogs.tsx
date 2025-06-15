
import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import AttendanceDashboard from "./AttendanceDashboard";
import AttendanceHistory from "./AttendanceHistory";
import CSVAttendanceUpload from "./CSVAttendanceUpload";
import { Class } from "@/lib/types";

interface AttendanceDialogsProps {
  classData: Class;
  dashboardOpen: boolean;
  setDashboardOpen: (open: boolean) => void;
  historyOpen: boolean;
  setHistoryOpen: (open: boolean) => void;
  csvDialogOpen: boolean;
  setCSVDialogOpen: (open: boolean) => void;
  dashboardResetFlag: boolean;
  onDashboardResetDone: () => void;
  onCSVUploadComplete: () => void;
}

const AttendanceDialogs: React.FC<AttendanceDialogsProps> = ({
  classData,
  dashboardOpen,
  setDashboardOpen,
  historyOpen,
  setHistoryOpen,
  csvDialogOpen,
  setCSVDialogOpen,
  dashboardResetFlag,
  onDashboardResetDone,
  onCSVUploadComplete,
}) => (
  <>
    <Dialog open={csvDialogOpen} onOpenChange={setCSVDialogOpen}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Upload Attendance CSV - {classData.name}</DialogTitle>
        </DialogHeader>
        <CSVAttendanceUpload 
          classId={classData.id}
          onAttendanceMarked={onCSVUploadComplete}
        />
      </DialogContent>
    </Dialog>
    <Dialog open={dashboardOpen} onOpenChange={setDashboardOpen}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Attendance Dashboard - {classData.name}</DialogTitle>
        </DialogHeader>
        <AttendanceDashboard 
          classData={classData}
          resetFlag={dashboardResetFlag}
          onResetDone={onDashboardResetDone}
        />
      </DialogContent>
    </Dialog>
    <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Attendance History - {classData.name}</DialogTitle>
        </DialogHeader>
        <AttendanceHistory classData={classData} />
      </DialogContent>
    </Dialog>
  </>
);

export default AttendanceDialogs;
