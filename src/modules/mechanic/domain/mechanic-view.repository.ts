import { JobStatus } from "@/modules/job/domain/job.entity"

export const statusFlow: JobStatus[] = [
  "received",
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
