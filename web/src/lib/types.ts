export type Role = 'ALUMNUS' | 'STAFF';
export type Visibility = 'PRIVATE' | 'NETWORK_ONLY' | 'PUBLIC';
export type OpportunityType = 'SCHOLARSHIP' | 'JOB' | 'INTERNSHIP' | 'TRAINING' | 'GRANT' | 'EVENT' | 'OTHER';
export type MentorshipStatus = 'REQUESTED' | 'ACCEPTED' | 'DECLINED';

export interface Profile {
  id: string;
  firstName: string;
  lastName: string;
  country: string;
  refProgram: string;
  cohortYear: number;
  verifiedAt: string | null;
  isOwner: boolean;
  contactVisible: boolean;
  profession?: string | null;
  skills?: string[];
  bio?: string | null;
  currentLocation?: string | null;
  languages?: string[];
  contactEmail?: string | null;
  mentorAvailable?: boolean;
  mentorCategories?: string[];
  seekingMentor?: boolean;
  seekingCategories?: string[];
  visibility?: Visibility;
  fieldVisibility?: Record<string, Visibility>;
}

export interface DirectoryCard {
  id: string;
  firstName: string;
  lastName: string;
  country: string;
  profession: string | null;
  currentLocation: string | null;
  mentorAvailable: boolean;
  seekingMentor: boolean;
}

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

export interface MentorshipConnection {
  id: string;
  category: string;
  status: MentorshipStatus;
  createdAt: string;
  mentor: { id: string; firstName: string; lastName: string; profession: string | null };
  mentee: { id: string; firstName: string; lastName: string; profession: string | null };
}

export interface MessageThread {
  profile: { id: string; firstName: string; lastName: string; profession: string | null } | null;
  lastMessage: { body: string; sentAt: string; fromMe: boolean };
  unread: number;
}

export interface Message {
  id: string;
  body: string;
  sentAt: string;
  readAt: string | null;
  fromMe: boolean;
}
