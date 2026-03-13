export type ListRole = 'owner' | 'editor' | 'viewer';

export interface ListPermission {
    email: string;
    phone?: string;
    role: ListRole;
}

export interface SharedListItem {
    item_id: string;
    text: string;
    checked: boolean;
    category?: string;
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
    shopping_started_at?: string;
    shopping_alert_sent?: boolean;
    categories?: string[]; // Custom categories for this list
}

export const DEFAULT_GROCERY_CATEGORIES = [
    "Produce",
    "Meat",
    "Dairy",
    "Bakery",
    "Frozen",
    "Snacks",
    "Drinks",
    "Pantry",
    "Pharmacy",
    "Other"
];
