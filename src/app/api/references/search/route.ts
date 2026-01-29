import { NextRequest, NextResponse } from 'next/server';

/**
 * Search PubMed for references
 * Uses NCBI E-utilities API
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query) {
      return NextResponse.json({ error: 'Query required' }, { status: 400 });
    }

    // Search PubMed
    const searchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=${encodeURIComponent(query)}&retmax=20&retmode=json`;
    const searchRes = await fetch(searchUrl);
    const searchData = await searchRes.json();

    const pmids = searchData.esearchresult?.idlist || [];
    
    if (pmids.length === 0) {
      return NextResponse.json({ references: [] });
    }

    // Fetch details for PMIDs
    const summaryUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&id=${pmids.join(',')}&retmode=json`;
    const summaryRes = await fetch(summaryUrl);
    const summaryData = await summaryRes.json();

    const references = pmids.map((pmid: string) => {
      const article = summaryData.result?.[pmid];
      if (!article) return null;

      return {
        pmid,
        title: article.title || '',
        authors: article.authors?.map((a: { name: string }) => a.name).join(', ') || '',
        journal: article.source || '',
        year: article.pubdate ? parseInt(article.pubdate.split(' ')[0]) : null,
        doi: article.elocationid?.replace('doi: ', '') || null
      };
    }).filter(Boolean);

    return NextResponse.json({ references });
  } catch (error) {
    console.error('Error searching references:', error);
    return NextResponse.json({ error: 'Failed to search references' }, { status: 500 });
  }
}
