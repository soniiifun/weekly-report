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
  scriptPhotoList?: string;
  filming?: string;
  questionnaire?: string;
  platformProposal?: string;
  pageStructure?: string;
  salesPage?: string;
  createSocials?: string;
  postContent?: string;
  launch?: string;
  bulkArrival?: string;
  officialSiteLaunch?: string;
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
