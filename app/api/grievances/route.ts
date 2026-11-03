import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { Grievance, GrievanceStatus } from '@/lib/types';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const liveFile = path.join(process.cwd(), 'data', 'grievances-live.json');

async function readLiveGrievances(): Promise<Grievance[]> {
  try {
    const raw = await fs.readFile(liveFile, 'utf8');
    const parsed: unknown = JSON.parse(raw.replace(/^\uFEFF/, ''));
    return Array.isArray(parsed) ? (parsed as Grievance[]) : [];
  } catch (error) {
    console.error('Failed to read live grievance store', error);
    throw new Error('The live grievance store could not be read.');
  }
}

async function writeLiveGrievances(grievances: Grievance[]): Promise<void> {
  try {
    await fs.writeFile(liveFile, `${JSON.stringify(grievances, null, 2)}\n`, 'utf8');
  } catch (error) {
    console.error('Failed to write live grievance store', error);
    throw new Error('The live grievance store could not be updated.');
  }
}

export async function GET(request: NextRequest) {
  try {
    const live = await readLiveGrievances();
    const reporterPhone = request.nextUrl.searchParams.get('reporter_phone')?.trim();
    const filtered = reporterPhone
      ? live.filter((grievance) => grievance.reporter_phone === reporterPhone)
      : live;
    return NextResponse.json(filtered, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        Pragma: 'no-cache',
        Expires: '0',
      },
    });
  } catch {
    return NextResponse.json({ error: 'Unable to load grievances.' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Grievance;
    if (
      !body.id ||
      !body.reporter_name?.trim() ||
      !body.reporter_phone?.trim() ||
      !body.reporter_block?.trim() ||
      !body.description_en?.trim() ||
      !body.ward_id ||
      !body.category
    ) {
      return NextResponse.json(
        { error: 'Reporter name, mobile number, ward, category, and description are required.' },
        { status: 400 }
      );
    }

    const live = await readLiveGrievances();
    if (live.some((grievance) => grievance.id === body.id)) {
      return NextResponse.json({ error: 'A grievance with this ticket number already exists.' }, { status: 409 });
    }

    const grievance: Grievance = {
      ...body,
      reporter_name: body.reporter_name.trim(),
      reporter_phone: body.reporter_phone.trim(),
      description_en: body.description_en.trim(),
      description_ml: body.description_ml?.trim() || body.description_en.trim(),
      status: 'open',
      updated_at: new Date().toISOString(),
    };
    await writeLiveGrievances([grievance, ...live]);
    return NextResponse.json(grievance, { status: 201 });
  } catch (error) {
    console.error('Failed to create grievance', error);
    return NextResponse.json({ error: 'Unable to register grievance.' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      id?: string;
      status?: GrievanceStatus;
      resolution_note?: string;
    };
    if (!body.id || !body.status) {
      return NextResponse.json({ error: 'Ticket number and status are required.' }, { status: 400 });
    }

    const live = await readLiveGrievances();
    const index = live.findIndex((grievance) => grievance.id === body.id);
    if (index < 0) {
      return NextResponse.json(
        { error: 'Only grievances submitted during this demo can be updated.' },
        { status: 404 }
      );
    }

    live[index] = {
      ...live[index],
      status: body.status,
      resolution_note: body.resolution_note?.trim() || live[index].resolution_note,
      updated_at: new Date().toISOString(),
    };
    await writeLiveGrievances(live);
    return NextResponse.json(live[index]);
  } catch (error) {
    console.error('Failed to update grievance', error);
    return NextResponse.json({ error: 'Unable to update grievance.' }, { status: 500 });
  }
}
