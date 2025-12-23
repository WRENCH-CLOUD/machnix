import { type DVIItem, type JobStatus } from "@/lib/mock-data"; // this is a mock data
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
  activeTab: "status" | "dvi" | "info";
  onTabChange: (tab: "status" | "dvi" | "info") => void;
  onClose: () => void;
  currentStatus: JobStatus;
  onStatusUpdate: (newStatus: JobStatus) => void;

  dviItems: DVIItem[];
  onDviItemStatusChange: (itemId: string, status: DVIItem["status"]) => void;
  onDviItemNoteAdd: (itemId: string, note: string) => void;
}
