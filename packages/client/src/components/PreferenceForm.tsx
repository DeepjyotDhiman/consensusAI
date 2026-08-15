import { useEffect, useState } from 'react';
import type { Preference } from '@consensus/shared';

interface PreferenceFormProps {
  groupMemberId: string;
  initialValues?: Preference | null;
  members?: Array<{ id: string; userId: string; displayName: string; avatarColor: string }>;
  onSelectMember?: (memberId: string) => void;
  onBlurSave?: (groupMemberId: string, prefs: Preference) => void;
  onDone?: (prefs: Preference) => void;
}

const PRESET_SKILLS = ['React', 'TypeScript', 'Python', 'Machine Learning', 'UI Design', 'PostgreSQL', 'Docker', 'Go'];
const PRESET_INTERESTS = ['AI', 'Social Impact', 'Frontend', 'Backend', 'DevOps', 'Mobile', 'Data Viz', 'Security'];

function safeCsvToArray(input: any): string[] {
  if (Array.isArray(input)) return input.filter(Boolean).map(String);
  if (typeof input === 'string') {
    return input
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [];
}

function safeArrayToCsv(input: any): string {
  if (Array.isArray(input)) return input.filter(Boolean).join(', ');
  if (typeof input === 'string') return input;
  return '';
}

export default function PreferenceForm({
  groupMemberId,
  initialValues,
  members,
  onSelectMember,
  onBlurSave,
  onDone,
}: PreferenceFormProps) {
  const [values, setValues] = useState<Preference>({
    skills: safeArrayToCsv(initialValues?.skills),
    interests: safeArrayToCsv(initialValues?.interests),
    availabilityHours: Number(initialValues?.availabilityHours) || 15,
    budget: Number(initialValues?.budget) || 200,
    learningGoals: safeArrayToCsv(initialValues?.learningGoals),
  });

  const [savedStatus, setSavedStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  // Re-sync when initialValues or active groupMemberId changes
  useEffect(() => {
    setValues({
      skills: safeArrayToCsv(initialValues?.skills),
      interests: safeArrayToCsv(initialValues?.interests),
      availabilityHours: Number(initialValues?.availabilityHours) || 15,
      budget: Number(initialValues?.budget) || 200,
      learningGoals: safeArrayToCsv(initialValues?.learningGoals),
    });
    setSavedStatus('idle');
  }, [groupMemberId, initialValues]);

  function togglePreset(field: 'skills' | 'interests', tag: string) {
    console.log('[UI Click] Toggle preset tag:', field, tag);
    const currentList = safeCsvToArray(values?.[field]);
    const exists = currentList.includes(tag);
    const updated = exists
      ? currentList.filter((t) => t !== tag)
      : [...currentList, tag];

    const nextValues = { ...values, [field]: safeArrayToCsv(updated) };
    setValues(nextValues);
    triggerAutoSave(nextValues);
  }

  function handleTriggerSave() {
    console.log('[UI Event] Manual save triggered on blur/slider release');
    triggerAutoSave(values);
  }

  function triggerAutoSave(nextValues: Preference) {
    setSavedStatus('saving');
    onBlurSave?.(groupMemberId, nextValues);
    setTimeout(() => setSavedStatus('saved'), 600);
    setTimeout(() => setSavedStatus('idle'), 2000);
  }

  function handleDoneClick() {
    console.log('[UI Click] PreferenceForm DONE button clicked');
    triggerAutoSave(values);
    onDone?.(values);
  }

  const inputClass =
    'w-full rounded-xl bg-white border border-slate-300 text-slate-900 text-xs px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 placeholder-slate-400 transition-all shadow-sm';

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        <div>
          <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
            Step 1: Member Preferences & Profile
          </h3>
          <p className="text-[11px] text-slate-500">Customize member preferences below</p>
        </div>
        <div className="flex items-center gap-3">
          {savedStatus === 'saving' && (
            <span className="text-xs text-teal-600 font-medium animate-pulse flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-teal-600 animate-ping" /> Saving...
            </span>
          )}
          {savedStatus === 'saved' && (
            <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
              ✓ Synced live
            </span>
          )}
        </div>
      </div>

      {/* Select Member to Edit & Save Options Bar */}
      {members && members.length > 0 && (
        <div className="bg-teal-50/80 p-3.5 rounded-xl border border-teal-200 space-y-2 text-left">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-extrabold text-teal-900 uppercase tracking-wider">
              ⚡ Select Member to Edit Details & Save:
            </label>
            <span className="text-[10px] text-teal-700 font-mono font-medium">
              {members.length} members in session
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {members.map((m) => {
              const isSelected = m.id === groupMemberId;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => onSelectMember && onSelectMember(m.id)}
                  className={`flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-xl border transition-all text-xs font-bold cursor-pointer ${
                    isSelected
                      ? 'border-teal-600 bg-teal-600 text-white ring-2 ring-teal-500/30 shadow-sm'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <span
                    className="h-4 w-4 rounded-full flex items-center justify-center text-[9px] font-bold text-white flex-shrink-0"
                    style={{ backgroundColor: m.avatarColor }}
                  >
                    {m.displayName[0]}
                  </span>
                  <span className="truncate">{m.displayName}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="space-y-4 text-left">
        {/* Skills */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Skills <span className="text-slate-500 font-normal">(comma-separated)</span>
          </label>
          <input
            type="text"
            className={inputClass}
            placeholder="e.g. React, TypeScript, Python"
            value={values.skills}
            onChange={(e) => setValues((v) => ({ ...v, skills: e.target.value }))}
            onBlur={handleTriggerSave}
          />
          {/* Quick preset chips */}
          <div className="flex flex-wrap gap-1 mt-2">
            {PRESET_SKILLS.map((skill) => {
              const active = safeCsvToArray(values.skills).includes(skill);
              return (
                <button
                  key={skill}
                  type="button"
                  onClick={() => togglePreset('skills', skill)}
                  className={`text-[10px] px-2 py-0.5 rounded-md border font-mono transition-all cursor-pointer ${
                    active
                      ? 'bg-teal-600 border-teal-600 text-white font-bold'
                      : 'bg-slate-100 border-slate-200 text-slate-600 hover:text-slate-900 hover:border-slate-300'
                  }`}
                >
                  {active ? `✓ ${skill}` : `+ ${skill}`}
                </button>
              );
            })}
          </div>
        </div>

        {/* Interests */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Interests & Domains <span className="text-slate-500 font-normal">(comma-separated)</span>
          </label>
          <input
            type="text"
            className={inputClass}
            placeholder="e.g. AI, Social Impact, Dev Ops"
            value={values.interests}
            onChange={(e) => setValues((v) => ({ ...v, interests: e.target.value }))}
            onBlur={handleTriggerSave}
          />
          {/* Quick preset chips */}
          <div className="flex flex-wrap gap-1 mt-2">
            {PRESET_INTERESTS.map((interest) => {
              const active = safeCsvToArray(values.interests).includes(interest);
              return (
                <button
                  key={interest}
                  type="button"
                  onClick={() => togglePreset('interests', interest)}
                  className={`text-[10px] px-2 py-0.5 rounded-md border font-mono transition-all cursor-pointer ${
                    active
                      ? 'bg-teal-600 border-teal-600 text-white font-bold'
                      : 'bg-slate-100 border-slate-200 text-slate-600 hover:text-slate-900 hover:border-slate-300'
                  }`}
                >
                  {active ? `✓ ${interest}` : `+ ${interest}`}
                </button>
              );
            })}
          </div>
        </div>

        {/* Numeric Sliders: Availability & Budget */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-bold text-slate-700">Weekly Availability</label>
              <span className="text-xs font-mono font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                {values.availabilityHours} hrs/wk
              </span>
            </div>
            <input
              type="range"
              min={1}
              max={40}
              value={values.availabilityHours}
              onChange={(e) => setValues((v) => ({ ...v, availabilityHours: Number(e.target.value) }))}
              onMouseUp={handleTriggerSave}
              onTouchEnd={handleTriggerSave}
              className="w-full accent-teal-600 cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-bold text-slate-700">Budget Limit</label>
              <span className="text-xs font-mono font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                ${values.budget} USD
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={1000}
              step={25}
              value={values.budget}
              onChange={(e) => setValues((v) => ({ ...v, budget: Number(e.target.value) }))}
              onMouseUp={handleTriggerSave}
              onTouchEnd={handleTriggerSave}
              className="w-full accent-teal-600 cursor-pointer"
            />
          </div>
        </div>

        {/* Priorities & Notes */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Learning Goals
          </label>
          <input
            type="text"
            className={inputClass}
            placeholder="e.g. system design, LLMs"
            value={values.learningGoals}
            onChange={(e) => setValues((v) => ({ ...v, learningGoals: e.target.value }))}
            onBlur={handleTriggerSave}
          />
        </div>

        {/* DONE Button */}
        <div className="pt-2">
          <button
            type="button"
            onClick={handleDoneClick}
            className="w-full py-3.5 rounded-xl bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white font-extrabold text-xs uppercase tracking-wider transition-all duration-200 shadow-lg shadow-teal-500/30 hover:-translate-y-0.5 flex items-center justify-center gap-2 cursor-pointer focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
          >
            <span>DONE — View Group Consensus Results</span>
            <span className="text-sm">→</span>
          </button>
        </div>
      </div>
    </div>
  );
}
