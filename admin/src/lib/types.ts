export type Role = 'ALUMNUS' | 'STAFF';
export type OpportunityType = 'SCHOLARSHIP' | 'JOB' | 'INTERNSHIP' | 'TRAINING' | 'GRANT' | 'EVENT' | 'OTHER';

export interface Opportunity {
  id: string;
  title: string;
  description: string;
  type: OpportunityType;
  country: string;
  deadline: string;
  url: string | null;
  createdAt: string;
}
