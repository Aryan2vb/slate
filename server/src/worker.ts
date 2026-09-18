/** Run as a separate process: npm run worker. It is intentionally not served by Express. */
import { supabaseAdmin } from './services/supabase';

async function processQueuedJobs() {
  const { data: jobs } = await supabaseAdmin.from('processing_jobs').select('*, artifacts(*)').eq('status', 'queued').limit(5);
  for (const job of jobs || []) {
    await supabaseAdmin.from('processing_jobs').update({ status: 'processing', attempts: job.attempts + 1 }).eq('id', job.id);
    try {
      if (!process.env.DEEPGRAM_API_KEY) throw new Error('DEEPGRAM_API_KEY is not configured');
      const artifact = (job as any).artifacts;
      const { data: bytes, error: downloadError } = await supabaseAdmin.storage.from(artifact.bucket).download(artifact.storage_path);
      if (downloadError || !bytes) throw new Error(downloadError?.message || 'Audio download failed');
      const response = await fetch('https://api.deepgram.com/v1/listen?model=nova-3&smart_format=true&diarize=true&punctuate=true', {
        method: 'POST', headers: { Authorization: `Token ${process.env.DEEPGRAM_API_KEY}`, 'Content-Type': artifact.mime_type }, body: bytes,
      });
      if (!response.ok) throw new Error(`Deepgram failed: ${await response.text()}`);
      const result: any = await response.json();
      const words = result.results?.channels?.[0]?.alternatives?.[0]?.words || [];
      const segments = words.reduce((all: any[], word: any) => {
        const current = all[all.length - 1];
        if (!current || current.speaker_label !== `Speaker ${word.speaker}`) all.push({ note_id: job.note_id, speaker_label: `Speaker ${word.speaker}`, start_ms: Math.round(word.start * 1000), end_ms: Math.round(word.end * 1000), text: word.punctuated_word || word.word });
        else { current.end_ms = Math.round(word.end * 1000); current.text += ` ${word.punctuated_word || word.word}`; }
        return all;
      }, []);
      if (segments.length) await supabaseAdmin.from('transcript_segments').insert(segments);
      const transcript = segments.map((s: any) => `${s.speaker_label}: ${s.text}`).join('\n');
      await supabaseAdmin.from('note_blocks').insert({ note_id: job.note_id, kind: 'summary', content: { summary: transcript.slice(0, 2000), generated: false, notice: 'Transcript complete. Configure an LLM worker secret to generate an executive summary.' } });
      await supabaseAdmin.from('artifacts').update({ status: 'deleted', deleted_at: new Date().toISOString() }).eq('id', artifact.id);
      await supabaseAdmin.storage.from(artifact.bucket).remove([artifact.storage_path]);
      await supabaseAdmin.from('processing_jobs').update({ status: 'completed', completed_at: new Date().toISOString() }).eq('id', job.id);
    } catch (error) {
      await supabaseAdmin.from('processing_jobs').update({ status: 'failed', error: error instanceof Error ? error.message : 'Unknown worker error' }).eq('id', job.id);
    }
  }
}
setInterval(() => void processQueuedJobs(), 5000);
void processQueuedJobs();
