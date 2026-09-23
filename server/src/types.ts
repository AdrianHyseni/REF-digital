export type Role = 'ALUMNUS' | 'STAFF';
export type Visibility = 'PRIVATE' | 'NETWORK_ONLY' | 'PUBLIC';
export type OpportunityType = 'SCHOLARSHIP' | 'JOB' | 'INTERNSHIP' | 'TRAINING' | 'GRANT' | 'EVENT' | 'OTHER';
export type MentorshipStatus = 'REQUESTED' | 'ACCEPTED' | 'DECLINED';

export interface AuthedUser {
  id: string;
  email: string;
  role: Role;
  profileId: string | null;
}
