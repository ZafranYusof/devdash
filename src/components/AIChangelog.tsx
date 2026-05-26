import { useState } from 'react';

interface Props {
  projectName: string;
  deploys: Array<{ commitMessage?: string; createdAt: number; status: string }>;
}

export default function AIChangelog({ projectName, deploys }: Props) {
  const [changelog, setChangelog] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const generateChangelog = async () => {
    setLoading(true);
    try {
      const commits = deploys
        .filter((d) => d.commitMessage)
        .slice(0, 20)
        .map((d) => ({
          message: d.commitMessage!,
          date: new Date(d.createdAt).toISOString().split('T')[0],
          status: d.status,
        }));

      if (commits.length === 0) {
        setChangelog('No commit messages available to generate changelog.');
        setLoading(false);
        return;
      }

      // Try AI generation first
      try {
        const result = await window.devdash.ai.chat([
          { role: 'system', content: 'Generate a clean changelog from these commit messages. Group by date, categorize as feat/fix/chore/docs. Use markdown format.' },
          { role: 'user', content: `Project: ${projectName}\n\nCommits:\n${commits.map((c) => `- [${c.date}] ${c.message}`).join('\n')}` },
        ]);
        if (result.ok && result.content) {
          setChangelog(result.content);
          setLoading(false);
          return;
        }
      } catch { /* fallback to simple formatting */ }

      // Fallback: simple formatting
      const grouped: Record<string, string[]> = {};
      for (const c of commits) {
        if (!grouped[c.date]) grouped[c.date] = [];
        grouped[c.date].push(c.message);
      }

      let md = `# Changelog - ${projectName}\n\n`;
      for (const [date, messages] of Object.entries(grouped).sort((a, b) => b[0].localeCompare(a[0]))) {
        md += `## ${date}\n\n`;
        for (const msg of messages) {
          const type = msg.match(/^(feat|fix|chore|docs|refactor|style|test|perf)(\(.+?\))?:/i);
          const prefix = type ? type[1].toLowerCase() : 'other';
          md += `- **${prefix}**: ${msg}\n`;
        }
        md += '\n';
      }
      setChangelog(md);
    } catch {
      setChangelog('Failed to generate changelog.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (changelog) {
      navigator.clipboard.writeText(changelog);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-medium text-white">AI Changelog</h3>
        <div className="flex items-center gap-2">
          {changelog && (
            <button onClick={copyToClipboard} className="btn-soft">
              {copied ? '✓ Copied' : 'Copy'}
            </button>
          )}
          <button onClick={generateChangelog} className="btn-primary" disabled={loading}>
            {loading ? 'Generating...' : changelog ? 'Regenerate' : 'Generate Changelog'}
          </button>
        </div>
      </div>

      {changelog && (
        <div className="card p-4 max-h-[300px] overflow-y-auto">
          <pre className="text-[11px] text-[#ccc] whitespace-pre-wrap font-mono">{changelog}</pre>
        </div>
      )}
    </div>
  );
}
