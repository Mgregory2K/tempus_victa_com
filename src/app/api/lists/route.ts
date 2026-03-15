import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import fs from "node:fs/promises";
import path from "node:path";
import { SharedList, SharedListItem } from "@/types/shared-lists";

// API remains dynamic for the server build
export const dynamic = 'force-dynamic';

const REGISTRY_PATH = path.join(process.cwd(), "twin_plus", "shared_lists_registry.json");

async function readRegistry(): Promise<SharedList[]> {
    try {
        const data = await fs.readFile(REGISTRY_PATH, "utf-8");
        return JSON.parse(data);
    } catch (e) {
        return [];
    }
}

async function writeRegistry(lists: SharedList[]) {
    await fs.mkdir(path.dirname(REGISTRY_PATH), { recursive: true });
    await fs.writeFile(REGISTRY_PATH, JSON.stringify(lists, null, 2));
}

function mergeItems(existing: SharedListItem[], incoming: SharedListItem[]): SharedListItem[] {
    const itemMap = new Map<string, SharedListItem>();
    existing.forEach(item => itemMap.set(item.item_id, item));
    incoming.forEach(item => {
        const existingItem = itemMap.get(item.item_id);
        if (!existingItem || new Date(item.updated_at) >= new Date(existingItem.updated_at)) {
            itemMap.set(item.item_id, item);
        }
    });
    return Array.from(itemMap.values()).sort((a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
}

export async function GET(req: NextRequest) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    const userEmail = token?.email?.toLowerCase();

    if (!userEmail) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const allLists = await readRegistry();
    const userLists = allLists.filter(list =>
        list.owner?.toLowerCase() === userEmail ||
        list.permissions?.some(p => p.email.toLowerCase() === userEmail)
    );

    return NextResponse.json(userLists);
}

export async function POST(req: NextRequest) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    const userEmail = token?.email?.toLowerCase();

    if (!userEmail) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const listData: SharedList = await req.json();
        if (!listData.list_id) {
            return NextResponse.json({ error: "Missing list_id" }, { status: 400 });
        }

        const allLists = await readRegistry();
        const existingIndex = allLists.findIndex(l => l.list_id === listData.list_id);

        if (existingIndex > -1) {
            const existing = allLists[existingIndex];
            const hasAccess =
                existing.owner?.toLowerCase() === userEmail ||
                existing.permissions?.some(p => p.email.toLowerCase() === userEmail && (p.role === 'owner' || p.role === 'editor'));

            if (!hasAccess) {
                return NextResponse.json({ error: "Forbidden" }, { status: 403 });
            }

            const mergedItems = mergeItems(existing.items, listData.items);

            allLists[existingIndex] = {
                ...existing,
                ...listData,
                owner: existing.owner,
                items: mergedItems,
                updated_at: new Date().toISOString()
            };
        } else {
            const newList = {
                ...listData,
                owner: userEmail,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };
            allLists.push(newList);
        }

        await writeRegistry(allLists);
        return NextResponse.json({ success: true });
    } catch (e) {
        return NextResponse.json({ error: "Invalid Request" }, { status: 400 });
    }
}
