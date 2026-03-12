export type ListRole = 'owner' | 'editor' | 'viewer';

export interface ListPermission {
    email: string;
    role: ListRole;
}

export interface SharedListItem {
    item_id: string;
    text: string;
    checked: boolean;
    created_by: string;
    created_at: string;
    updated_at: string;
}

export interface SharedList {
    list_id: string;
    name: string;
    owner: string;
    created_by: string;
    created_at: string;
    updated_at: string;
    permissions: ListPermission[];
    items: SharedListItem[];
    active_shopper?: string; // For Store Presence
    mode?: 'standard' | 'shopping';
}
