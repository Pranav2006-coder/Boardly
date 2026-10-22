import { useState } from 'react';
import { Modal, Input, Button } from '../common';

/**
 * NewBoardModal Component
 * Reuses shared Modal, Input, Button components.
 * Adheres strictly to Burgundy & Cream design system.
 */
export default function NewBoardModal({ isOpen, onClose, onCreateBoard }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [template, setTemplate] = useState('architecture');
  const [gridStyle, setGridStyle] = useState('dots');
  const [isPublic, setIsPublic] = useState(true);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    await onCreateBoard({
      title: title.trim() || 'Untitled Whiteboard',
      description,
      template,
      gridStyle,
      isPublic,
    });
    setLoading(false);
    onClose();
  };

  const templates = [
    { id: 'architecture', icon: 'schema', label: 'System Architecture', desc: 'Ingress, microservices, event stream & notes' },
    { id: 'blank', icon: 'crop_free', label: 'Blank Canvas', desc: 'Start with an empty infinite board' },
    { id: 'retro', icon: 'sticky_note_2', label: 'Retrospective', desc: 'What went well, what to improve' },
    { id: 'flowchart', icon: 'account_tree', label: 'Flowchart', desc: 'Decision trees and process flows' },
  ];

  const gridStyles = [
    { id: 'dots', label: 'Dot Matrix', icon: 'grid_view' },
    { id: 'major', label: 'Major Grid', icon: 'grid_4x4' },
    { id: 'blank', label: 'Plain White', icon: 'check_box_outline_blank' },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create New Whiteboard"
      subtitle="Start a new space for your ideas, architecture, and team collaboration."
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Title */}
        <Input
          label="BOARD TITLE"
          autoFocus
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Distributed Core Service Mesh & Ingress"
          icon={<span className="material-symbols-outlined text-[18px]">edit</span>}
        />

        {/* Description */}
        <Input
          label="DESCRIPTION (OPTIONAL)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Brief summary or focus for this canvas..."
          icon={<span className="material-symbols-outlined text-[18px]">description</span>}
        />

        {/* Templates */}
        <div>
          <label className="text-xs font-semibold text-[#292323] tracking-wide block mb-2">
            SELECT PRESET TEMPLATE
          </label>
          <div className="grid grid-cols-2 gap-2.5">
            {templates.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTemplate(t.id)}
                className={`p-3 rounded-xl border text-left transition-all flex flex-col gap-1 ${
                  template === t.id
                    ? 'border-[#7F1D3F] bg-[#FFF8F0] ring-2 ring-[#7F1D3F]/20'
                    : 'border-[#E8DDD8] hover:border-[#E8B7C2] hover:bg-[#FAF6F2]'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`material-symbols-outlined text-lg ${
                      template === t.id ? 'text-[#7F1D3F]' : 'text-[#786C6C]'
                    }`}
                  >
                    {t.icon}
                  </span>
                  <span className="text-xs font-bold text-[#292323]">{t.label}</span>
                </div>
                <span className="text-[11px] text-[#786C6C]">{t.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Grid Style */}
        <div>
          <label className="text-xs font-semibold text-[#292323] tracking-wide block mb-2">
            BACKGROUND GRID STYLE
          </label>
          <div className="grid grid-cols-3 gap-2 bg-[#FFF8F0] p-1 rounded-xl border border-[#E8DDD8]">
            {gridStyles.map((style) => (
              <button
                key={style.id}
                type="button"
                onClick={() => setGridStyle(style.id)}
                className={`py-2 px-3 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-all ${
                  gridStyle === style.id
                    ? 'bg-white text-[#7F1D3F] font-semibold shadow-xs'
                    : 'text-[#786C6C] hover:text-[#292323]'
                }`}
              >
                <span className="material-symbols-outlined text-sm">{style.icon}</span>
                {style.label}
              </button>
            ))}
          </div>
        </div>

        {/* Privacy Toggle */}
        <div className="bg-[#FAF6F2] border border-[#E8DDD8] rounded-xl p-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className={`material-symbols-outlined text-xl ${isPublic ? 'text-[#7F1D3F]' : 'text-[#786C6C]'}`}>
              {isPublic ? 'public' : 'lock'}
            </span>
            <div>
              <span className="text-xs font-semibold text-[#292323] block">
                {isPublic ? 'Public Workspace (Link Sharing)' : 'Private Workspace'}
              </span>
              <span className="text-[11px] text-[#786C6C]">
                {isPublic ? 'Anyone with the room code can join' : 'Only invited collaborators can access'}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsPublic(!isPublic)}
            className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
              isPublic ? 'bg-[#7F1D3F]' : 'bg-[#D6CECA]'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white shadow-xs transition-transform ${
                isPublic ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E8DDD8]">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            loading={loading}
            icon={<span className="material-symbols-outlined text-sm">add</span>}
          >
            Create Whiteboard
          </Button>
        </div>
      </form>
    </Modal>
  );
}
