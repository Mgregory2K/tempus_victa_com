import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import fs from "node:fs/promises";
import path from "node:path";
import { SharedList } from "@/types/shared-lists";

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

export async function GET(req: NextRequest) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    const userEmail = token?.email?.toLowerCase();

    if (!userEmail) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const allLists = await readRegistry();

    // Discovery: owned lists OR lists where permissions contains user email
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
            // Permission check: only owner or editors can update
            const existing = allLists[existingIndex];
            const hasAccess =
                existing.owner?.toLowerCase() === userEmail ||
                existing.permissions?.some(p => p.email.toLowerCase() === userEmail && (p.role === 'owner' || p.role === 'editor'));

            if (!hasAccess) {
                return NextResponse.json({ error: "Forbidden" }, { status: 403 });
            }

            allLists[existingIndex] = { ...listData, updated_at: new Date().toISOString() };
        } else {
            // New list: ensure current user is owner
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
