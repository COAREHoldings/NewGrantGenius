import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { eq, desc } from 'drizzle-orm';
import { publications, manuscripts, researchProfiles } from '@/lib/schema';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import OpenAI from 'openai';

function getOpenAI() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

function getDb() {
  const sql = neon(process.env.DATABASE_URL!);
  return drizzle(sql);
}

async function getUserId(request: NextRequest): Promise<number | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as { userId: number };
    return decoded.userId;
  } catch {
    return null;
  }
}

// GET - Fetch user's publications, manuscripts, and profile
export async function GET(request: NextRequest) {
  try {
    const userId = await getUserId(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = getDb();
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'all';

    if (type === 'publications' || type === 'all') {
      const pubs = await db.select().from(publications).where(eq(publications.userId, userId)).orderBy(desc(publications.createdAt));
      if (type === 'publications') return NextResponse.json({ publications: pubs });
    }

    if (type === 'manuscripts' || type === 'all') {
      const mss = await db.select().from(manuscripts).where(eq(manuscripts.userId, userId)).orderBy(desc(manuscripts.createdAt));
      if (type === 'manuscripts') return NextResponse.json({ manuscripts: mss });
    }

    if (type === 'profile' || type === 'all') {
      const profiles = await db.select().from(researchProfiles).where(eq(researchProfiles.userId, userId));
      const profile = profiles[0] || null;
      if (type === 'profile') return NextResponse.json({ profile });
    }

    // Return all
    const [pubs, mss, profiles] = await Promise.all([
      db.select().from(publications).where(eq(publications.userId, userId)).orderBy(desc(publications.createdAt)),
      db.select().from(manuscripts).where(eq(manuscripts.userId, userId)).orderBy(desc(manuscripts.createdAt)),
      db.select().from(researchProfiles).where(eq(researchProfiles.userId, userId)),
    ]);

    return NextResponse.json({
      publications: pubs,
      manuscripts: mss,
      profile: profiles[0] || null,
    });
  } catch (error) {
    console.error('GET publications error:', error);
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, ...data } = body;
    const db = getDb();

    switch (action) {
      case 'import-doi':
        return handleImportDOI(db, userId, data.doi);
      case 'add-publication':
        return handleAddPublication(db, userId, data.publication);
      case 'remove-publication':
        return handleRemovePublication(db, userId, data.id);
      case 'search-pubmed':
        return handleSearchPubMed(data.query, data.maxResults);
      case 'save-manuscript':
        return handleSaveManuscript(db, userId, data.manuscript);
      case 'literature-gaps':
        return handleLiteratureGaps(data.abstract, data.researchArea);
      case 'journal-check':
        return handleJournalCheck(data.manuscript, data.targetJournal);
      case 'cover-letter':
        return handleCoverLetter(data.manuscript, data.journal, data.highlights);
      case 'revision-response':
        return handleRevisionResponse(data.comments, data.manuscriptChanges);
      case 'build-profile':
        return handleBuildProfile(db, userId);
      case 'journal-fit':
        return handleJournalFit(data.manuscript);
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Publications API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

async function handleImportDOI(db: ReturnType<typeof getDb>, userId: number, doi: string) {
  const response = await fetch(`https://api.crossref.org/works/${encodeURIComponent(doi)}`, {
    headers: { 'User-Agent': 'GrantMaster/1.0 (mailto:support@grantmaster.com)' },
  });

  if (!response.ok) {
    return NextResponse.json({ error: 'DOI not found' }, { status: 404 });
  }

  const data = await response.json();
  const work = data.message;

  const publication = {
    userId,
    doi: doi,
    title: work.title?.[0] || 'Unknown Title',
    authors: work.author?.map((a: { given?: string; family?: string; affiliation?: { name: string }[] }) => ({
      name: `${a.given || ''} ${a.family || ''}`.trim(),
      affiliation: a.affiliation?.[0]?.name,
    })) || [],
    journal: work['container-title']?.[0] || work.publisher || 'Unknown Journal',
    year: work.published?.['date-parts']?.[0]?.[0] || work.created?.['date-parts']?.[0]?.[0] || new Date().getFullYear(),
    volume: work.volume || null,
    issue: work.issue || null,
    pages: work.page || null,
    abstract: work.abstract?.replace(/<[^>]*>/g, '') || null,
    citationCount: work['is-referenced-by-count'] || 0,
  };

  const result = await db.insert(publications).values(publication).returning();
  return NextResponse.json(result[0]);
}

async function handleAddPublication(db: ReturnType<typeof getDb>, userId: number, pub: Record<string, unknown>) {
  const result = await db.insert(publications).values({
    userId,
    title: pub.title as string,
    authors: pub.authors as { name: string }[] || [],
    journal: pub.journal as string || null,
    year: pub.year as number || null,
    pmid: pub.pmid as string || null,
    doi: pub.doi as string || null,
    citationCount: pub.citationCount as number || 0,
    abstract: pub.abstract as string || null,
  }).returning();
  return NextResponse.json(result[0]);
}

async function handleRemovePublication(db: ReturnType<typeof getDb>, userId: number, id: string) {
  await db.delete(publications).where(eq(publications.id, id));
  return NextResponse.json({ success: true });
}

async function handleSearchPubMed(query: string, maxResults = 10) {
  const searchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=${encodeURIComponent(query)}&retmax=${maxResults}&retmode=json`;
  const searchRes = await fetch(searchUrl);
  const searchData = await searchRes.json();
  const ids = searchData.esearchresult?.idlist || [];

  if (ids.length === 0) {
    return NextResponse.json({ results: [] });
  }

  const detailUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&id=${ids.join(',')}&retmode=json`;
  const detailRes = await fetch(detailUrl);
  const detailData = await detailRes.json();

  const results = ids.map((id: string) => {
    const doc = detailData.result?.[id];
    if (!doc) return null;
    return {
      pmid: id,
      title: doc.title || 'Unknown',
      authors: doc.authors?.map((a: { name: string }) => ({ name: a.name })) || [],
      journal: doc.fulljournalname || doc.source || 'Unknown',
      year: parseInt(doc.pubdate?.split(' ')?.[0]) || new Date().getFullYear(),
      volume: doc.volume,
      issue: doc.issue,
      pages: doc.pages,
    };
  }).filter(Boolean);

  return NextResponse.json({ results });
}

async function handleSaveManuscript(db: ReturnType<typeof getDb>, userId: number, manuscript: Record<string, unknown>) {
  const id = manuscript.id as string | undefined;

  if (id) {
    const result = await db.update(manuscripts)
      .set({
        title: manuscript.title as string,
        targetJournal: manuscript.targetJournal as string || null,
        coAuthors: manuscript.coAuthors as { name: string }[] || [],
        content: manuscript.content as Record<string, string> || {},
        status: manuscript.status as string || 'draft',
        updatedAt: new Date(),
      })
      .where(eq(manuscripts.id, id))
      .returning();
    return NextResponse.json(result[0]);
  } else {
    const result = await db.insert(manuscripts).values({
      userId,
      title: manuscript.title as string,
      targetJournal: manuscript.targetJournal as string || null,
      coAuthors: manuscript.coAuthors as { name: string }[] || [],
      content: manuscript.content as Record<string, string> || {},
      status: 'draft',
    }).returning();
    return NextResponse.json(result[0]);
  }
}

async function handleLiteratureGaps(abstract: string, researchArea: string) {
  const completion = await getOpenAI().chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: `You are a scientific literature expert. Analyze the research abstract and identify gaps in the literature. Return JSON with "gaps" array containing objects with "gap", "relevance" (high/medium/low), and "suggestedApproach" fields.`,
      },
      {
        role: 'user',
        content: `Research Area: ${researchArea}\n\nAbstract: ${abstract}\n\nIdentify 3-5 literature gaps.`,
      },
    ],
    response_format: { type: 'json_object' },
  });

  const result = JSON.parse(completion.choices[0].message.content || '{"gaps":[]}');
  return NextResponse.json(result);
}

async function handleJournalCheck(manuscript: { title: string; abstract: string; wordCount?: number }, targetJournal: string) {
  const completion = await getOpenAI().chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: `You are a journal submission expert. Return JSON with "compliance" array (objects with requirement, status pass/fail/warning, details), "overallScore" (0-100), and "recommendation" string.`,
      },
      {
        role: 'user',
        content: `Target Journal: ${targetJournal}\nTitle: ${manuscript.title}\nAbstract: ${manuscript.abstract}\nWord Count: ${manuscript.wordCount || 'Unknown'}`,
      },
    ],
    response_format: { type: 'json_object' },
  });

  const result = JSON.parse(completion.choices[0].message.content || '{}');
  return NextResponse.json({ journal: targetJournal, ...result });
}

async function handleCoverLetter(manuscript: { title: string; abstract: string; highlights?: string[] }, journal: string, highlights?: string[]) {
  const completion = await getOpenAI().chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: `Write a professional journal submission cover letter. Be concise and highlight significance.`,
      },
      {
        role: 'user',
        content: `Journal: ${journal}\nTitle: ${manuscript.title}\nAbstract: ${manuscript.abstract}\nHighlights: ${highlights?.join('; ') || manuscript.highlights?.join('; ') || 'See abstract'}`,
      },
    ],
  });

  return NextResponse.json({
    coverLetter: completion.choices[0].message.content,
    wordCount: completion.choices[0].message.content?.split(/\s+/).length || 0,
  });
}

async function handleRevisionResponse(comments: { reviewer: string; comment: string; category: string }[], manuscriptChanges?: string) {
  const completion = await getOpenAI().chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: `Generate point-by-point responses to peer reviewers. Return JSON with "responses" array containing objects with "commentId" (index as string) and "response" fields.`,
      },
      {
        role: 'user',
        content: `Comments:\n${comments.map((c, i) => `${i}. [${c.reviewer}] (${c.category}): ${c.comment}`).join('\n\n')}\n\n${manuscriptChanges ? `Changes: ${manuscriptChanges}` : ''}`,
      },
    ],
    response_format: { type: 'json_object' },
  });

  const result = JSON.parse(completion.choices[0].message.content || '{"responses":[]}');
  return NextResponse.json(result);
}

async function handleBuildProfile(db: ReturnType<typeof getDb>, userId: number) {
  // Fetch user's publications
  const pubs = await db.select().from(publications).where(eq(publications.userId, userId));

  if (pubs.length === 0) {
    return NextResponse.json({ error: 'No publications to analyze' }, { status: 400 });
  }

  // Calculate h-index
  const sortedCitations = pubs.map(p => p.citationCount || 0).sort((a, b) => b - a);
  let hIndex = 0;
  for (let i = 0; i < sortedCitations.length; i++) {
    if (sortedCitations[i] >= i + 1) hIndex = i + 1;
    else break;
  }

  const totalCitations = sortedCitations.reduce((sum, c) => sum + c, 0);
  const topCited = [...pubs].sort((a, b) => (b.citationCount || 0) - (a.citationCount || 0)).slice(0, 5);

  // Collaborators
  const collaboratorCounts: Record<string, number> = {};
  pubs.forEach(p => {
    (p.authors as { name: string }[] || []).forEach(a => {
      collaboratorCounts[a.name] = (collaboratorCounts[a.name] || 0) + 1;
    });
  });
  const collaborators = Object.entries(collaboratorCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Yearly output
  const yearlyCounts: Record<number, number> = {};
  pubs.forEach(p => {
    if (p.year) yearlyCounts[p.year] = (yearlyCounts[p.year] || 0) + 1;
  });
  const yearlyOutput = Object.entries(yearlyCounts)
    .map(([year, count]) => ({ year: parseInt(year), count }))
    .sort((a, b) => a.year - b.year);

  // AI analysis for themes and biosketch
  const completion = await getOpenAI().chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: `Analyze publications and extract research themes. Generate NIH Biosketch Section C (contribution to science) and Section D (research support). Return JSON with "themes" array (objects with theme, count), "sectionC" string, "sectionD" string.`,
      },
      {
        role: 'user',
        content: `Publications:\n${pubs.map(p => `- ${p.title} (${p.year}): ${p.abstract?.slice(0, 200) || 'No abstract'}`).join('\n')}`,
      },
    ],
    response_format: { type: 'json_object' },
  });

  const aiResult = JSON.parse(completion.choices[0].message.content || '{}');

  const profileData = {
    userId,
    totalPublications: pubs.length,
    hIndex,
    totalCitations,
    topCitedWorks: topCited,
    researchThemes: aiResult.themes || [],
    collaborators,
    yearlyOutput,
    biosketchSectionC: aiResult.sectionC || '',
    biosketchSectionD: aiResult.sectionD || '',
    updatedAt: new Date(),
  };

  // Upsert profile
  const existing = await db.select().from(researchProfiles).where(eq(researchProfiles.userId, userId));
  
  if (existing.length > 0) {
    const result = await db.update(researchProfiles).set(profileData).where(eq(researchProfiles.userId, userId)).returning();
    return NextResponse.json(result[0]);
  } else {
    const result = await db.insert(researchProfiles).values(profileData).returning();
    return NextResponse.json(result[0]);
  }
}


async function handleJournalFit(manuscript: { title: string; abstract: string; keywords: string[] }) {
  const { JOURNALS } = await import('@/features/publications/data/journals');
  
  const completion = await getOpenAI().chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: `You are a journal selection expert. Given a manuscript and a list of journals, score each journal's fit.
Return JSON with "rankings" array of objects with:
- journalName: string
- overallScore: number (0-100)
- scopeMatch: number (0-100)
- impactScore: number (0-100)
- acceptanceChance: number (0-100)
- reasoning: string (1-2 sentences)

Consider: research topic alignment, manuscript quality indicators from abstract, journal scope, and realistic acceptance odds.
Return top 5 journals sorted by overallScore descending.`,
      },
      {
        role: 'user',
        content: `Manuscript Title: ${manuscript.title}
Abstract: ${manuscript.abstract}
Keywords: ${manuscript.keywords.join(', ')}

Available Journals:
${JOURNALS.map(j => `- ${j.name}: IF=${j.impactFactor}, Acceptance=${j.acceptanceRate}%, Categories=[${j.categories.join(', ')}], OpenAccess=${j.openAccess}`).join('\n')}`,
      },
    ],
    response_format: { type: 'json_object' },
  });

  const result = JSON.parse(completion.choices[0].message.content || '{"rankings":[]}');
  
  // Enrich with journal data
  const rankings = result.rankings.map((r: { journalName: string; overallScore: number; scopeMatch: number; impactScore: number; acceptanceChance: number; reasoning: string }) => {
    const journal = JOURNALS.find(j => j.name.toLowerCase() === r.journalName.toLowerCase());
    return {
      ...r,
      impactFactor: journal?.impactFactor || 0,
      openAccess: journal?.openAccess || false,
      timeToDecision: journal?.reviewTime || 90,
    };
  });

  return NextResponse.json({ rankings });
}
