// src/types/shared_mind.ts

export interface Collaborator {
    email: string;
    role: 'EDITOR' | 'VIEWER';
    addedAt: string;
}

export interface SharedNode {
    id: string;
    type: 'GROCERY_LIST' | 'PROJECT' | 'TODO' | 'NOTE';
    owner: string; // Email
    collaborators: Collaborator[];
    lastSync: string;
}

export interface SovereignCouncil {
    admins: string[]; // List of emails
    lastUpdated: string;
}

export interface SharedRegistry {
    council: SovereignCouncil;
    sharedNodes: SharedNode[];
}
