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

export interface Project {
  id: string;
  name: string;
  tasks: Task[];
  nextWeekPlan: string;
}

export interface ReportData {
  employeeName: string;
  department: string;
  dateRange: string;
  projects: Project[];
}
