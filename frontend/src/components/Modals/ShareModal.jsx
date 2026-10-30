import { useState } from 'react';
import { Modal, Input, Button, Avatar, Badge } from '../common';

/**
 * ShareModal Component
 * Reuses shared Modal, Input, Button, Avatar, Badge components.
 * Adheres strictly to Burgundy & Cream design system.
 */
export default function ShareModal({ isOpen, onClose, board, onAddCollaborator }) {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('editor');
  const [loading, setLoading] = useState(false);

  if (!isOpen || !board) return null;

  const boardId = board.id || board._id;
  const roomCode = board.roomCode || 'X9K-72M';
  const inviteLink = `${window.location.origin}/w/${boardId}?code=${roomCode}`;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(roomCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    setLoading(true);
    if (onAddCollaborator) {
      await onAddCollaborator(boardId, inviteEmail.trim(), inviteRole);
    }
    setInviteEmail('');
    setLoading(false);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Share & Collaborate"
      subtitle="Invite teammates to brainstorm, sketch, and build together in real time."
      maxWidth="lg"
    >
      <div className="space-y-5">
        {/* Room Code Card (Burgundy gradient) */}
        <div className="bg-gradient-to-r from-[#7F1D3F] via-[#651630] to-[#4A0E23] rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-white relative overflow-hidden shadow-burgundy-btn">
          <div
            className="absolute inset-0 opacity-15 pointer-events-none"
            style={{
              backgroundImage: 'radial-gradient(rgba(255,255,255,0.8) 1px, transparent 1px)',
              backgroundSize: '16px 16px',
            }}
          />
          <div className="relative z-10">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#E8B7C2] block">
              Workspace Room Code
            </span>
            <div className="font-headline text-3xl sm:text-4xl font-bold font-mono tracking-[0.2em] text-white mt-1">
              {roomCode}
            </div>
            <span className="text-xs text-[#E8B7C2] block mt-1">
              Teammates can enter this code in the Dashboard to join immediately.
            </span>
          </div>

          <Button
            variant="white"
            onClick={handleCopyCode}
            icon={
              <span className="material-symbols-outlined text-[18px]">
                {copiedCode ? 'check' : 'content_copy'}
              </span>
            }
          >
            {copiedCode ? 'Copied Code!' : 'Copy Code'}
          </Button>
        </div>

        {/* Invite Link */}
        <div>
          <label className="text-xs font-semibold text-[#292323] tracking-wide block mb-1.5">
            DIRECT INVITATION LINK
          </label>
          <div className="flex items-center gap-2">
            <Input
              readOnly
              value={inviteLink}
              size="md"
              icon={<span className="material-symbols-outlined text-[18px]">link</span>}
              className="font-mono text-xs select-all text-[#786C6C]"
            />
            <Button
              variant="outline"
              onClick={handleCopyLink}
              icon={
                <span className="material-symbols-outlined text-[16px]">
                  {copiedLink ? 'check' : 'content_copy'}
                </span>
              }
            >
              {copiedLink ? 'Copied' : 'Copy'}
            </Button>
          </div>
        </div>

        {/* Invite by Email */}
        <div>
          <label className="text-xs font-semibold text-[#292323] tracking-wide block mb-1.5">
            INVITE BY EMAIL
          </label>
          <form onSubmit={handleInvite} className="flex flex-col sm:flex-row gap-2">
            <div className="flex-1">
              <Input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="teammate@company.com"
                icon={<span className="material-symbols-outlined text-[18px]">mail</span>}
              />
            </div>
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value)}
              className="bg-[#FFF8F0] border border-[#E8DDD8] rounded-xl px-3 py-2 text-xs font-medium text-[#292323] outline-none focus:border-[#7F1D3F] cursor-pointer h-10"
            >
              <option value="editor">Can edit</option>
              <option value="viewer">Can view</option>
            </select>
            <Button
              type="submit"
              variant="primary"
              loading={loading}
              icon={<span className="material-symbols-outlined text-[18px]">send</span>}
            >
              Send Invite
            </Button>
          </form>
        </div>

        {/* Collaborators List */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-[#292323] tracking-wide uppercase">
              Active Team Members ({board.collaborators?.length || 1})
            </span>
            <Badge variant="burgundy" size="sm">
              Live Presence
            </Badge>
          </div>

          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {board.collaborators?.map((c, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-2.5 rounded-xl bg-[#FAF6F2] border border-[#E8DDD8] hover:border-[#E8B7C2]/60 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <Avatar name={c.name} email={c.email} color={c.avatarColor} size="sm" isOnline showStatus />
                  <div>
                    <span className="text-xs font-bold text-[#292323] block leading-tight">{c.name}</span>
                    <span className="text-[10px] text-[#786C6C]">{c.email}</span>
                  </div>
                </div>

                <Badge
                  variant={c.role === 'owner' ? 'burgundy' : c.role === 'editor' ? 'neutral' : 'rose'}
                  size="sm"
                >
                  {c.role || 'Member'}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
}
