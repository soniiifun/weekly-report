export interface Contact {
  person: string;
  progress: string;
}

export interface Task {
  id: string;
  description: string;
  hasContact: boolean;
  contact: Contact | null;
}

export interface Milestones {
  filming?: string;
  questionnaire?: string;
  salesPage?: string;
  launch?: string;
  bulkArrival?: string;
  shipping?: string;
}

export interface Project {
  id: string;
  name: string;
  tasks: Task[];
  nextWeekPlan: string;
  milestones?: Milestones;
}

export interface ReportData {
  employeeName: string;
  department: string;
  dateRange: string;
  projects: Project[];
}
