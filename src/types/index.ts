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
  media?: string;
  questionnaire?: string;
  pageStructure?: string;
  salesPageDesign?: string;
  createSocials?: string;
  postContent?: string;
  launch?: string;
  factoryShipping?: string;
  shippingToCustomer?: string;
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
