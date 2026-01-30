import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { referenceId } = await request.json();
    const supabase = createServerClient();

    // Get the reference
    const { data: ref, error: fetchError } = await supabase
      .from('reference_verifications')
      .select('*')
      .eq('id', referenceId)
      .single();

    if (fetchError || !ref) {
      return NextResponse.json({ error: 'Reference not found' }, { status: 404 });
    }

    let verificationResult: any = null;
    let verified = false;

    // Try PubMed first if we have a PMID
    if (ref.pmid) {
      try {
        const pubmedRes = await fetch(
          `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&id=${ref.pmid}&retmode=json`
        );
        const pubmedData = await pubmedRes.json();
        
        if (pubmedData.result && pubmedData.result[ref.pmid]) {
          const article = pubmedData.result[ref.pmid];
          verificationResult = {
            title: article.title,
            authors: article.authors?.map((a: any) => a.name) || [],
            journal: article.source,
            year: parseInt(article.pubdate?.split(' ')[0]) || null,
            source: 'pubmed'
          };
          verified = true;
        }
      } catch (e) {
        console.error('PubMed lookup failed:', e);
      }
    }

    // Try DOI lookup if PMID didn't work
    if (!verified && ref.doi) {
      try {
        const doiRes = await fetch(`https://api.crossref.org/works/${encodeURIComponent(ref.doi)}`);
        const doiData = await doiRes.json();
        
        if (doiData.status === 'ok' && doiData.message) {
          const work = doiData.message;
          verificationResult = {
            title: work.title?.[0] || '',
            authors: work.author?.map((a: any) => `${a.given || ''} ${a.family || ''}`.trim()) || [],
            journal: work['container-title']?.[0] || '',
            year: work.published?.['date-parts']?.[0]?.[0] || null,
            citationCount: work['is-referenced-by-count'] || 0,
            source: 'crossref'
          };
          verified = true;
        }
      } catch (e) {
        console.error('DOI lookup failed:', e);
      }
    }

    // Try text search as last resort (simplified - would use actual API in production)
    if (!verified && ref.reference_text) {
      // Extract potential title (first sentence or text before first period)
      const potentialTitle = ref.reference_text.split('.')[0]?.trim();
      
      if (potentialTitle && potentialTitle.length > 20) {
        try {
          const searchRes = await fetch(
            `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=${encodeURIComponent(potentialTitle)}&retmode=json&retmax=1`
          );
          const searchData = await searchRes.json();
          
          if (searchData.esearchresult?.idlist?.length > 0) {
            const foundPmid = searchData.esearchresult.idlist[0];
            
            // Fetch details
            const detailRes = await fetch(
              `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&id=${foundPmid}&retmode=json`
            );
            const detailData = await detailRes.json();
            
            if (detailData.result && detailData.result[foundPmid]) {
              const article = detailData.result[foundPmid];
              verificationResult = {
                title: article.title,
                authors: article.authors?.map((a: any) => a.name) || [],
                journal: article.source,
                year: parseInt(article.pubdate?.split(' ')[0]) || null,
                source: 'pubmed'
              };
              verified = true;
              
              // Update PMID
              await supabase
                .from('reference_verifications')
                .update({ pmid: foundPmid })
                .eq('id', referenceId);
            }
          }
        } catch (e) {
          console.error('PubMed search failed:', e);
        }
      }
    }

    // Update the reference
    const { error: updateError } = await supabase
      .from('reference_verifications')
      .update({
        verification_status: verified ? 'verified' : 'not_found',
        verification_result: verificationResult || {},
        verified_at: new Date().toISOString()
      })
      .eq('id', referenceId);

    if (updateError) throw updateError;

    return NextResponse.json({
      id: referenceId,
      verificationStatus: verified ? 'verified' : 'not_found',
      verificationResult: verificationResult || {},
      pmid: ref.pmid,
      doi: ref.doi
    });
  } catch (error) {
    console.error('Error verifying reference:', error);
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 });
  }
}
