import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { Grievance, GrievanceStatus, GrievanceTimelineEntry } from '@/lib/types';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const knowledgeBaseFile = path.join(process.cwd(), 'data', 'mla-knowledge-base.json');

async function readKnowledgeBase(): Promise<Record<string, unknown>> {
  try {
    const raw = await fs.readFile(knowledgeBaseFile, 'utf8');
    const parsed: unknown = JSON.parse(raw.replace(/^\uFEFF/, ''));
    return parsed && typeof parsed === 'object' ? parsed as Record<string, unknown> : {};
  } catch (error) {
    console.error('Failed to read MLA knowledge base', error);
    throw new Error('The MLA knowledge base could not be read.');
  }
}

async function readLiveGrievances(): Promise<Grievance[]> {
  const knowledgeBase = await readKnowledgeBase();
  return Array.isArray(knowledgeBase.grievances) ? knowledgeBase.grievances as Grievance[] : [];
}

async function writeLiveGrievances(grievances: Grievance[]): Promise<void> {
  try {
    const knowledgeBase = await readKnowledgeBase();
    knowledgeBase.grievances = grievances;
    await fs.writeFile(knowledgeBaseFile, `${JSON.stringify(knowledgeBase, null, 2)}\n`, 'utf8');
  } catch (error) {
    console.error('Failed to write MLA knowledge base', error);
    throw new Error('The MLA knowledge base could not be updated.');
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

    const nowIso = new Date().toISOString();
    const initialTimeline: GrievanceTimelineEntry[] = [
      {
        status: 'submitted',
        timestamp: nowIso,
        actor: 'Citizen Portal',
        public_message_en: 'Complaint filed successfully and assigned to departmental review queue.',
        public_message_ml: 'പരാതി വിജയകരമായി സമർപ്പിച്ചു, വകുപ്പുതല പരിശോധനക്കായി കൈമാറി.',
      },
    ];

    const grievance: Grievance = {
      ...body,
      reporter_name: body.reporter_name.trim(),
      reporter_phone: body.reporter_phone.trim(),
      description_en: body.description_en.trim(),
      description_ml: body.description_ml?.trim() || body.description_en.trim(),
      status: body.status || 'submitted',
      timeline: body.timeline && body.timeline.length > 0 ? body.timeline : initialTimeline,
      filed_date: body.filed_date || nowIso.split('T')[0],
      updated_at: nowIso,
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
      rejection_reason?: string;
      delay_reason?: string;
      expected_completion_date?: string;
      actor?: string;
      public_message_en?: string;
      public_message_ml?: string;
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

    const nowIso = new Date().toISOString();
    const currentTimeline = live[index].timeline || [];
    const newEntry: GrievanceTimelineEntry = {
      status: body.status,
      timestamp: nowIso,
      actor: body.actor || 'Authority Reviewer',
      public_message_en:
        body.public_message_en ||
        (body.status === 'in_progress'
          ? 'Work order generated and assigned to field inspection team.'
          : body.status === 'delayed'
          ? `Work delayed: ${body.delay_reason || 'Material procurement pending'}`
          : body.status === 'resolved'
          ? `Issue rectified: ${body.resolution_note || 'Completed on site.'}`
          : body.status === 'rejected'
          ? `Complaint rejected: ${body.rejection_reason || 'Out of jurisdiction'}`
          : `Status changed to ${body.status}`),
      public_message_ml:
        body.public_message_ml ||
        (body.status === 'in_progress'
          ? 'വർക്ക് ഓർഡർ നൽകി, ഫീൽഡ് ഇൻസ്പെക്ഷൻ ടീമിനെ ചുമതലപ്പെടുത്തി.'
          : body.status === 'delayed'
          ? `പണി വൈകുന്നു: ${body.delay_reason || 'സാമഗ്രികൾ ലഭ്യമാക്കാൻ വൈകുന്നു'}`
          : body.status === 'resolved'
          ? `പരിഹരിച്ചു: ${body.resolution_note || 'സ്ഥലത്ത് പണി പൂർത്തിയായി.'}`
          : body.status === 'rejected'
          ? `നിരസിച്ചു: ${body.rejection_reason || 'അധികാരപരിധിക്ക് പുറത്താണ്'}`
          : `സ്റ്റാറ്റസ് ${body.status} ആയി മാറ്റി`),
      reason: body.rejection_reason || body.delay_reason || body.resolution_note,
    };

    live[index] = {
      ...live[index],
      status: body.status,
      resolution_note: body.resolution_note?.trim() || live[index].resolution_note,
      rejection_reason: body.rejection_reason?.trim() || live[index].rejection_reason,
      delay_reason: body.delay_reason?.trim() || live[index].delay_reason,
      expected_completion_date: body.expected_completion_date || live[index].expected_completion_date,
      timeline: [newEntry, ...currentTimeline],
      updated_at: nowIso,
    };
    await writeLiveGrievances(live);
    return NextResponse.json(live[index]);
  } catch (error) {
    console.error('Failed to update grievance', error);
    return NextResponse.json({ error: 'Unable to update grievance.' }, { status: 500 });
  }
}
