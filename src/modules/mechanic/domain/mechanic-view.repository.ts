import { JobStatus } from "@/modules/job/domain/job.entity"
// TODO: chagne this to real data
// TODO: needed more revision and fixs and updates
export const statusFlow: JobStatus[] = [
  "received",
  "assigned",
  "working",
  "ready",
  "completed",
];

export interface MechanicJobDetailProps {
  job: any;
  activeTab: "status" | "info";
  onTabChange: (tab: "status" | "info") => void;
  onClose: () => void;
  currentStatus: JobStatus;
  onStatusUpdate: (newStatus: JobStatus) => void;

  // dviItems: DVIItem[];
  // onDviItemStatusChange: (itemId: string, status: DVIItem["status"]) => void;
  // onDviItemNoteAdd: (itemId: string, note: string) => void;
}
