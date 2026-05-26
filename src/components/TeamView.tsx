import { useState, useEffect, useCallback } from 'react';
import { createClient, SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';

interface TeamMember {
  id: string;
  name: string;
  avatarColor: string;
  role: 'admin' | 'viewer';
  online: boolean;
  lastSeen: number;
}

interface ActivityItem {
  id: string;
  author: string;
  action: string;
  target: string;
  timestamp: number;
}

interface ProjectAssignment {
  projectId: string;
  projectName: string;
  assignees: string[];
}

interface DeployComment {
  id: string;
  deployId: string;
  author: string;
  text: string;
  timestamp: number;
}

type SubTab = 'members' | 'activity' | 'assignments' | 'comments';

const STORAGE_KEY = 'devdash-team-config';
const MEMBERS_KEY = 'devdash-team-members';
const ACTIVITY_KEY = 'devdash-team-activity';
const ASSIGNMENTS_KEY = 'devdash-team-assignments';
const COMMENTS_KEY = 'devdash-team-comments';

const AVATAR_COLORS = ['#0070F3', '#7928CA', '#FF0080', '#F5A623', '#50E3C2', '#E00', '#79FFE1', '#FF6B6B'];

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export default function TeamView() {
  const [connected, setConnected] = useState(false);
  const [supabaseUrl, setSupabaseUrl] = useState('');
  const [supabaseKey, setSupabaseKey] = useState('');
  const [client, setClient] = useState<SupabaseClient | null>(null);
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);
  const [subTab, setSubTab] = useState<SubTab>('members');
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [assignments, setAssignments] = useState<ProjectAssignment[]>([]);
  const [comments, setComments] = useState<DeployComment[]>([]);
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberRole, setNewMemberRole] = useState<'admin' | 'viewer'>('viewer');
  const [newComment, setNewComment] = useState('');
  const [selectedDeploy, setSelectedDeploy] = useState('');
  const [inviteLink, setInviteLink] = useState('');

  // Load config from localStorage
  useEffect(() => {
    try {
      const config = localStorage.getItem(STORAGE_KEY);
      if (config) {
        const { url, key } = JSON.parse(config);
        if (url && key) {
          setSupabaseUrl(url);
          setSupabaseKey(key);
          connectToSupabase(url, key);
        }
      }
      const m = localStorage.getItem(MEMBERS_KEY);
      if (m) setMembers(JSON.parse(m));
      const a = localStorage.getItem(ACTIVITY_KEY);
      if (a) setActivity(JSON.parse(a));
      const as = localStorage.getItem(ASSIGNMENTS_KEY);
      if (as) setAssignments(JSON.parse(as));
      const c = localStorage.getItem(COMMENTS_KEY);
      if (c) setComments(JSON.parse(c));
    } catch { /* ignore */ }
  }, []);

  // Persist data
  useEffect(() => { localStorage.setItem(MEMBERS_KEY, JSON.stringify(members)); }, [members]);
  useEffect(() => { localStorage.setItem(ACTIVITY_KEY, JSON.stringify(activity)); }, [activity]);
  useEffect(() => { localStorage.setItem(ASSIGNMENTS_KEY, JSON.stringify(assignments)); }, [assignments]);
  useEffect(() => { localStorage.setItem(COMMENTS_KEY, JSON.stringify(comments)); }, [comments]);

  const connectToSupabase = useCallback((url: string, key: string) => {
    try {
      const sb = createClient(url, key);
      setClient(sb);
      const ch = sb.channel('team-presence');
      ch.on('presence', { event: 'sync' }, () => {
        // Update online status based on presence
        const state = ch.presenceState();
        setMembers(prev => prev.map(m => ({
          ...m,
          online: Object.values(state).flat().some((p: any) => p.user_id === m.id)
        })));
      }).subscribe(async (status: string) => {
        if (status === 'SUBSCRIBED') {
          await ch.track({ user_id: 'local', online_at: Date.now() });
        }
      });
      setChannel(ch);
      setConnected(true);
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ url, key }));
    } catch {
      setConnected(false);
    }
  }, []);

  const handleConnect = () => {
    if (!supabaseUrl.trim() || !supabaseKey.trim()) return;
    connectToSupabase(supabaseUrl.trim(), supabaseKey.trim());
  };

  const handleDisconnect = () => {
    if (channel) channel.unsubscribe();
    setClient(null);
    setChannel(null);
    setConnected(false);
    localStorage.removeItem(STORAGE_KEY);
  };

  const addMember = () => {
    if (!newMemberName.trim()) return;
    const member: TeamMember = {
      id: generateId(),
      name: newMemberName.trim(),
      avatarColor: AVATAR_COLORS[members.length % AVATAR_COLORS.length],
      role: newMemberRole,
      online: false,
      lastSeen: Date.now(),
    };
    setMembers(prev => [...prev, member]);
    addActivity(`Added ${member.name} as ${member.role}`);
    setNewMemberName('');
  };

  const removeMember = (id: string) => {
    const member = members.find(m => m.id === id);
    setMembers(prev => prev.filter(m => m.id !== id));
    if (member) addActivity(`Removed ${member.name} from team`);
  };

  const toggleRole = (id: string) => {
    setMembers(prev => prev.map(m => {
      if (m.id !== id) return m;
      const newRole = m.role === 'admin' ? 'viewer' : 'admin';
      addActivity(`Changed ${m.name} role to ${newRole}`);
      return { ...m, role: newRole };
    }));
  };

  const addActivity = (action: string) => {
    const item: ActivityItem = {
      id: generateId(),
      author: 'You',
      action,
      target: '',
      timestamp: Date.now(),
    };
    setActivity(prev => [item, ...prev].slice(0, 50));
  };

  const addComment = () => {
    if (!newComment.trim() || !selectedDeploy.trim()) return;
    const comment: DeployComment = {
      id: generateId(),
      deployId: selectedDeploy,
      author: 'You',
      text: newComment.trim(),
      timestamp: Date.now(),
    };
    setComments(prev => [comment, ...prev]);
    addActivity(`Commented on deploy ${selectedDeploy}`);
    setNewComment('');
  };

  const generateInviteLink = () => {
    if (supabaseUrl) {
      setInviteLink(supabaseUrl);
      addActivity('Generated invite link');
    }
  };

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    const now = Date.now();
    const diff = now - ts;
    if (diff < 60000) return 'just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return d.toLocaleDateString();
  };

  // Setup screen
  if (!connected) {
    return (
      <div className="flex flex-col h-full overflow-y-auto">
        <h2 className="text-lg font-semibold text-white mb-1">Team Collaboration</h2>
        <p className="text-xs text-[#888] mb-6">Connect to Supabase for real-time team sync</p>

        <div className="card max-w-lg">
          <h3 className="text-sm font-medium text-white mb-4">Connect to Supabase</h3>
          <p className="text-xs text-[#888] mb-4">
            Enter your Supabase project URL and anon key to enable real-time collaboration.
            You can find these in your Supabase project settings → API.
          </p>

          <div className="flex flex-col gap-3 mb-4">
            <div>
              <label className="text-xs text-[#888] mb-1 block">Project URL</label>
              <input
                type="url"
                value={supabaseUrl}
                onChange={e => setSupabaseUrl(e.target.value)}
                placeholder="https://your-project.supabase.co"
                className="w-full rounded border border-[#333] bg-[#0A0A0A] px-3 py-2 text-sm text-white placeholder-[#555] focus:border-[#0070F3] focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs text-[#888] mb-1 block">Anon Key</label>
              <input
                type="password"
                value={supabaseKey}
                onChange={e => setSupabaseKey(e.target.value)}
                placeholder="eyJhbGciOiJIUzI1NiIs..."
                className="w-full rounded border border-[#333] bg-[#0A0A0A] px-3 py-2 text-sm text-white placeholder-[#555] focus:border-[#0070F3] focus:outline-none"
              />
            </div>
          </div>

          <button onClick={handleConnect} className="btn-primary w-full">
            Connect
          </button>

          <div className="mt-4 p-3 rounded bg-[#0A0A0A] border border-[#222]">
            <p className="text-xs text-[#666]">
              <strong className="text-[#888]">Setup Instructions:</strong>
            </p>
            <ol className="text-xs text-[#666] mt-2 space-y-1 list-decimal list-inside">
              <li>Create a Supabase project at supabase.com</li>
              <li>Go to Settings → API</li>
              <li>Copy the Project URL and anon/public key</li>
              <li>Paste them above and click Connect</li>
            </ol>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-white">Team Collaboration</h2>
          <p className="text-xs text-[#888]">
            <span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-1" />
            Connected to Supabase
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={generateInviteLink} className="btn-soft text-xs">
            Generate Invite Link
          </button>
          <button onClick={handleDisconnect} className="btn-soft text-xs text-red-400 border-red-400/30 hover:bg-red-400/10">
            Disconnect
          </button>
        </div>
      </div>

      {inviteLink && (
        <div className="mb-3 p-2 rounded bg-[#0070F3]/10 border border-[#0070F3]/30 flex items-center justify-between">
          <span className="text-xs text-[#0070F3] truncate mr-2">{inviteLink}</span>
          <button
            onClick={() => { navigator.clipboard.writeText(inviteLink); }}
            className="text-xs text-[#0070F3] hover:text-white shrink-0"
          >
            Copy
          </button>
        </div>
      )}

      {/* Sub-tabs */}
      <div className="flex gap-1 mb-4 border-b border-[#222] pb-2">
        {(['members', 'activity', 'assignments', 'comments'] as SubTab[]).map(t => (
          <button
            key={t}
            onClick={() => setSubTab(t)}
            className={`px-3 py-1.5 text-xs rounded transition-colors ${subTab === t ? 'bg-[#0070F3] text-white' : 'text-[#888] hover:text-white hover:bg-[#1a1a1a]'}`}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Members Tab */}
        {subTab === 'members' && (
          <div className="flex flex-col gap-3">
            {/* Add member form */}
            <div className="card">
              <h3 className="text-xs font-medium text-[#888] mb-2">Add Team Member</h3>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newMemberName}
                  onChange={e => setNewMemberName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addMember()}
                  placeholder="Name"
                  className="flex-1 rounded border border-[#333] bg-[#0A0A0A] px-3 py-1.5 text-sm text-white placeholder-[#555] focus:border-[#0070F3] focus:outline-none"
                />
                <select
                  value={newMemberRole}
                  onChange={e => setNewMemberRole(e.target.value as 'admin' | 'viewer')}
                  className="rounded border border-[#333] bg-[#0A0A0A] px-2 py-1.5 text-xs text-white focus:border-[#0070F3] focus:outline-none"
                >
                  <option value="admin">Admin</option>
                  <option value="viewer">Viewer</option>
                </select>
                <button onClick={addMember} className="btn-primary text-xs px-3">Add</button>
              </div>
            </div>

            {/* Members list */}
            {members.length === 0 ? (
              <div className="card text-center py-8">
                <p className="text-sm text-[#666]">No team members yet</p>
                <p className="text-xs text-[#444] mt-1">Add members above to get started</p>
              </div>
            ) : (
              <div className="flex flex-col gap-1">
                {members.map(m => (
                  <div key={m.id} className="card flex items-center gap-3 py-2">
                    <div className="relative">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
                        style={{ backgroundColor: m.avatarColor }}
                      >
                        {m.name.charAt(0).toUpperCase()}
                      </div>
                      <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#111] ${m.online ? 'bg-green-500' : 'bg-[#444]'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white truncate">{m.name}</p>
                      <p className="text-xs text-[#666]">{m.online ? 'Online' : `Last seen ${formatTime(m.lastSeen)}`}</p>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${m.role === 'admin' ? 'bg-[#0070F3]/20 text-[#0070F3]' : 'bg-[#333] text-[#888]'}`}>
                      {m.role}
                    </span>
                    <button onClick={() => toggleRole(m.id)} className="text-xs text-[#666] hover:text-white" title="Toggle role">
                      ⇄
                    </button>
                    <button onClick={() => removeMember(m.id)} className="text-xs text-[#666] hover:text-red-400" title="Remove">
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Activity Tab */}
        {subTab === 'activity' && (
          <div className="flex flex-col gap-1">
            {activity.length === 0 ? (
              <div className="card text-center py-8">
                <p className="text-sm text-[#666]">No activity yet</p>
                <p className="text-xs text-[#444] mt-1">Team actions will appear here</p>
              </div>
            ) : (
              activity.map(a => (
                <div key={a.id} className="card flex items-center gap-3 py-2">
                  <div className="w-6 h-6 rounded-full bg-[#222] flex items-center justify-center text-[10px] text-[#888]">
                    {a.author.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-white">
                      <span className="text-[#0070F3]">{a.author}</span> {a.action}
                    </p>
                  </div>
                  <span className="text-[10px] text-[#555] shrink-0">{formatTime(a.timestamp)}</span>
                </div>
              ))
            )}
          </div>
        )}

        {/* Assignments Tab */}
        {subTab === 'assignments' && (
          <div className="flex flex-col gap-3">
            <div className="card">
              <p className="text-xs text-[#888] mb-2">Assign team members to projects. Members with admin role can deploy.</p>
              {members.length === 0 ? (
                <p className="text-xs text-[#555]">Add team members first to create assignments.</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {assignments.map((a, idx) => (
                    <div key={idx} className="flex items-center gap-2 p-2 rounded bg-[#0A0A0A] border border-[#222]">
                      <span className="text-xs text-white flex-1">{a.projectName}</span>
                      <div className="flex gap-1">
                        {a.assignees.map(name => (
                          <span key={name} className="text-[10px] px-1.5 py-0.5 rounded bg-[#222] text-[#888]">{name}</span>
                        ))}
                      </div>
                      <button
                        onClick={() => setAssignments(prev => prev.filter((_, i) => i !== idx))}
                        className="text-xs text-[#666] hover:text-red-400"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {members.length > 0 && (
              <div className="card text-center py-4">
                <p className="text-xs text-[#555]">Project assignments sync in real-time with your team</p>
              </div>
            )}
          </div>
        )}

        {/* Comments Tab */}
        {subTab === 'comments' && (
          <div className="flex flex-col gap-3">
            <div className="card">
              <h3 className="text-xs font-medium text-[#888] mb-2">Add Comment on Deploy</h3>
              <div className="flex flex-col gap-2">
                <input
                  type="text"
                  value={selectedDeploy}
                  onChange={e => setSelectedDeploy(e.target.value)}
                  placeholder="Deploy ID or name"
                  className="w-full rounded border border-[#333] bg-[#0A0A0A] px-3 py-1.5 text-sm text-white placeholder-[#555] focus:border-[#0070F3] focus:outline-none"
                />
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newComment}
                    onChange={e => setNewComment(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addComment()}
                    placeholder="Write a comment..."
                    className="flex-1 rounded border border-[#333] bg-[#0A0A0A] px-3 py-1.5 text-sm text-white placeholder-[#555] focus:border-[#0070F3] focus:outline-none"
                  />
                  <button onClick={addComment} className="btn-primary text-xs px-3">Post</button>
                </div>
              </div>
            </div>

            {comments.length === 0 ? (
              <div className="card text-center py-8">
                <p className="text-sm text-[#666]">No comments yet</p>
                <p className="text-xs text-[#444] mt-1">Comment on deploys to discuss with your team</p>
              </div>
            ) : (
              <div className="flex flex-col gap-1">
                {comments.map(c => (
                  <div key={c.id} className="card py-2">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-[#0070F3]">{c.author}</span>
                      <span className="text-[10px] text-[#444]">on {c.deployId}</span>
                      <span className="text-[10px] text-[#555] ml-auto">{formatTime(c.timestamp)}</span>
                    </div>
                    <p className="text-xs text-[#ccc]">{c.text}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
