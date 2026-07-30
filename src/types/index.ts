import { User as FirebaseUser } from 'firebase/auth';

export type Gender = 'male' | 'female' | 'other' | 'unknown';

export interface Person {
  id: string;
  familyId: string;
  firstName: string;
  lastName: string;
  gender?: Gender;
  birthDate?: string;
  birthPlace?: string;
  deathDate?: string;
  deathPlace?: string;
  isLiving?: boolean;
  notes?: string;
  photoUrl?: string;
  createdAt?: string | { toDate: () => Date };
  updatedAt?: string | { toDate: () => Date };
}

export interface Family {
  id: string;
  name: string;
  ownerId: string;
  members: string[];
  createdAt: string;
}

export interface AuthContextType {
  currentUser: FirebaseUser | null;
  loginWithGoogle: () => Promise<any>;
  logout: () => Promise<void>;
}

export interface FamilyContextType {
  activeFamilyId: string | null;
  setActiveFamilyId: (id: string | null) => void;
}
