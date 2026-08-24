import { useEffect, useState } from 'react';
import type { Preference } from '@consensus/shared';

interface PreferenceFormProps {
  groupMemberId: string;
  initialValues?: Preference | null;
  /** Called on every auto-save (blur / slider release) — does NOT submit */
  onBlurSave?: (groupMemberId: string, prefs: Preference) => void;
  /** Called when the member clicks "Submit My Preferences" (formal submission) */
  onSubmitPrefs?: (prefs: Preference) => void;
}

const PRESET_SKILLS = ['React', 'TypeScript', 'Python', 'Machine Learning', 'UI Design', 'PostgreSQL', 'Docker', 'Go'];
const PRESET_INTERESTS = ['AI', 'Social Impact', 'Frontend', 'Backend', 'DevOps', 'Mobile', 'Data Viz', 'Cybersecurity'];
const PRESET_PRIORITIES = ['learning', 'impact', 'creativity', 'security', 'collaboration', 'speed', 'quality'];

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
  onBlurSave,
  onSubmitPrefs,
}: PreferenceFormProps) {
  const [values, setValues] = useState<Preference>({
    groupMemberId,
    skills: safeArrayToCsv(initialValues?.skills),
    interests: safeArrayToCsv(initialValues?.interests),
    availabilityHours: Number(initialValues?.availabilityHours) || 15,
    budget: Number(initialValues?.budget) || 200,
    learningGoals: safeArrayToCsv(initialValues?.learningGoals),
    priorities: safeArrayToCsv(initialValues?.priorities),
  });

  const [savedStatus, setSavedStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  // Re-sync when initialValues or active groupMemberId changes
  useEffect(() => {
    setValues({
      groupMemberId,
      skills: safeArrayToCsv(initialValues?.skills),
      interests: safeArrayToCsv(initialValues?.interests),
      availabilityHours: Number(initialValues?.availabilityHours) || 15,
      budget: Number(initialValues?.budget) || 200,
      learningGoals: safeArrayToCsv(initialValues?.learningGoals),
      priorities: safeArrayToCsv(initialValues?.priorities),
    });
    setSavedStatus('idle');
  }, [groupMemberId, initialValues]);

  function togglePreset(field: 'skills' | 'interests' | 'priorities', tag: string) {
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

  function handleSubmitClick() {
    console.log('[UI Click] PreferenceForm SUBMIT button clicked');
    triggerAutoSave(values);
    onSubmitPrefs?.(values);
  }

  function handleNumberChange(field: 'availabilityHours' | 'budget', val: number) {
    const nextValues = { ...values, [field]: val };
    setValues(nextValues);
  }

  function handleAddTag(field: 'skills' | 'interests' | 'priorities', newTag: string) {
    const trimmed = newTag.trim();
    if (!trimmed) return;
    const currentList = safeCsvToArray(values?.[field]);
    if (!currentList.some((t) => t.toLowerCase() === trimmed.toLowerCase())) {
      const updated = [...currentList, trimmed];
      const nextValues = { ...values, [field]: safeArrayToCsv(updated) };
      setValues(nextValues);
      triggerAutoSave(nextValues);
    }
  }

  function handleRemoveTag(field: 'skills' | 'interests' | 'priorities', tagToRemove: string) {
    const currentList = safeCsvToArray(values?.[field]);
    const updated = currentList.filter((t) => t.toLowerCase() !== tagToRemove.toLowerCase());
    const nextValues = { ...values, [field]: safeArrayToCsv(updated) };
    setValues(nextValues);
    triggerAutoSave(nextValues);
  }

  const inputClass =
    'w-full rounded-xl bg-white border border-slate-300 text-slate-900 text-xs px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 placeholder-slate-400 transition-all shadow-sm';

  const currentSkills = safeCsvToArray(values.skills);
  const currentInterests = safeCsvToArray(values.interests);
  const currentPriorities = safeCsvToArray(values.priorities);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        <div>
          <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
            Your Preferences & Profile
          </h3>
          <p className="text-[11px] text-slate-500">Auto-saved as you type. Type any custom skills or values freely.</p>
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

      <div className="space-y-4 text-left">
        {/* Skills: Custom input + active tag badges + quick helper suggestions */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Technical Skills <span className="text-slate-500 font-normal">(Type any skill: Angular, Vue, Flutter, Python, Go, C++, etc.)</span>
          </label>
          <input
            type="text"
            className={inputClass}
            placeholder="Type your skills (e.g. Angular, C++, Vue, Python, Docker) separated by commas"
            value={values.skills}
            onChange={(e) => setValues((v) => ({ ...v, skills: e.target.value }))}
            onBlur={handleTriggerSave}
          />

          {/* Active Skills Badges */}
          {currentSkills.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {currentSkills.map((skill) => (
                <span
                  key={skill}
                  className="inline-flex items-center gap-1 text-[11px] bg-teal-50 border border-teal-200 text-teal-900 font-bold px-2.5 py-1 rounded-lg shadow-2xs"
                >
                  <span>{skill}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveTag('skills', skill)}
                    className="text-teal-600 hover:text-rose-600 ml-1 font-extrabold cursor-pointer"
                    title={`Remove ${skill}`}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Quick preset suggestions */}
          <div className="flex flex-wrap items-center gap-1 mt-2">
            <span className="text-[10px] text-slate-400 font-medium mr-1">Quick suggestions:</span>
            {PRESET_SKILLS.map((skill) => {
              const active = currentSkills.some((s) => s.toLowerCase() === skill.toLowerCase());
              return (
                <button
                  key={skill}
                  type="button"
                  onClick={() => togglePreset('skills', skill)}
                  className={`text-[10px] px-2 py-0.5 rounded-md border font-mono transition-all duration-150 cursor-pointer active:scale-90 ${
                    active
                      ? 'bg-teal-600 border-teal-600 text-white font-bold shadow-xs'
                      : 'bg-slate-100 border-slate-200 text-slate-600 hover:text-slate-900 hover:border-slate-300'
                  }`}
                >
                  {active ? `✓ ${skill}` : `+ ${skill}`}
                </button>
              );
            })}
          </div>
        </div>

        {/* Interests & Domains: Custom input + active tag badges */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Interests & Project Domains <span className="text-slate-500 font-normal">(Type any domain: Web3, Fintech, AI, Robotics, etc.)</span>
          </label>
          <input
            type="text"
            className={inputClass}
            placeholder="Type domain interests (e.g. AI, Healthcare, Social Impact, Fintech) separated by commas"
            value={values.interests}
            onChange={(e) => setValues((v) => ({ ...v, interests: e.target.value }))}
            onBlur={handleTriggerSave}
          />

          {/* Active Interests Badges */}
          {currentInterests.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {currentInterests.map((interest) => (
                <span
                  key={interest}
                  className="inline-flex items-center gap-1 text-[11px] bg-slate-100 border border-slate-200 text-slate-800 font-bold px-2.5 py-1 rounded-lg shadow-2xs"
                >
                  <span>{interest}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveTag('interests', interest)}
                    className="text-slate-500 hover:text-rose-600 ml-1 font-extrabold cursor-pointer"
                    title={`Remove ${interest}`}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Quick preset suggestions */}
          <div className="flex flex-wrap items-center gap-1 mt-2">
            <span className="text-[10px] text-slate-400 font-medium mr-1">Quick suggestions:</span>
            {PRESET_INTERESTS.map((interest) => {
              const active = currentInterests.some((i) => i.toLowerCase() === interest.toLowerCase());
              return (
                <button
                  key={interest}
                  type="button"
                  onClick={() => togglePreset('interests', interest)}
                  className={`text-[10px] px-2 py-0.5 rounded-md border font-mono transition-all duration-150 cursor-pointer active:scale-90 ${
                    active
                      ? 'bg-teal-600 border-teal-600 text-white font-bold shadow-xs'
                      : 'bg-slate-100 border-slate-200 text-slate-600 hover:text-slate-900 hover:border-slate-300'
                  }`}
                >
                  {active ? `✓ ${interest}` : `+ ${interest}`}
                </button>
              );
            })}
          </div>
        </div>

        {/* Direct Numeric Input Boxes + Sliders: Availability & Budget */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
          {/* Availability Hours */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-slate-700">Weekly Availability</label>
              <span className="text-xs text-slate-500 font-mono font-medium">hrs / week</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={1}
                max={168}
                value={values.availabilityHours}
                onChange={(e) => handleNumberChange('availabilityHours', Math.max(1, Number(e.target.value) || 1))}
                onBlur={handleTriggerSave}
                className="w-24 bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-mono font-bold text-teal-800 focus:outline-none focus:ring-2 focus:ring-teal-500 shadow-2xs"
                placeholder="15"
              />
              <span className="text-xs text-slate-600 font-semibold">Hours</span>
            </div>
            <input
              type="range"
              min={1}
              max={60}
              value={Math.min(values.availabilityHours, 60)}
              onChange={(e) => handleNumberChange('availabilityHours', Number(e.target.value))}
              onMouseUp={handleTriggerSave}
              onTouchEnd={handleTriggerSave}
              className="w-full accent-teal-600 cursor-pointer"
            />
          </div>

          {/* Budget Limit */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-slate-700">Budget Limit</label>
              <span className="text-xs text-slate-500 font-mono font-medium">USD ($)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500">$</span>
              <input
                type="number"
                min={0}
                max={10000}
                step={25}
                value={values.budget ?? 0}
                onChange={(e) => handleNumberChange('budget', Math.max(0, Number(e.target.value) || 0))}
                onBlur={handleTriggerSave}
                className="w-28 bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-mono font-bold text-teal-800 focus:outline-none focus:ring-2 focus:ring-teal-500 shadow-2xs"
                placeholder="200"
              />
              <span className="text-xs text-slate-600 font-semibold">USD</span>
            </div>
            <input
              type="range"
              min={0}
              max={1000}
              step={25}
              value={Math.min(values.budget ?? 0, 1000)}
              onChange={(e) => handleNumberChange('budget', Number(e.target.value))}
              onMouseUp={handleTriggerSave}
              onTouchEnd={handleTriggerSave}
              className="w-full accent-teal-600 cursor-pointer"
            />
          </div>
        </div>

        {/* Learning Goals */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Personal Learning Goals <span className="text-slate-500 font-normal">(What do you want to learn or achieve?)</span>
          </label>
          <input
            type="text"
            className={inputClass}
            placeholder="e.g. Master system design, LLM fine-tuning, Cloud deployment, Leadership"
            value={values.learningGoals}
            onChange={(e) => setValues((v) => ({ ...v, learningGoals: e.target.value }))}
            onBlur={handleTriggerSave}
          />
        </div>

        {/* Custom Priorities: Free-form input + optional suggestions */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Personal Team Priorities <span className="text-slate-500 font-normal">(Type custom priorities or click suggestions)</span>
          </label>
          <input
            type="text"
            className={inputClass}
            placeholder="Type priorities (e.g. learning, high grade, speed, portfolio piece, user impact) separated by commas"
            value={values.priorities}
            onChange={(e) => setValues((v) => ({ ...v, priorities: e.target.value }))}
            onBlur={handleTriggerSave}
          />

          {/* Active Priorities Badges */}
          {currentPriorities.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {currentPriorities.map((priority) => (
                <span
                  key={priority}
                  className="inline-flex items-center gap-1 text-[11px] bg-violet-50 border border-violet-200 text-violet-900 font-bold px-2.5 py-1 rounded-lg shadow-2xs capitalize"
                >
                  <span>{priority}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveTag('priorities', priority)}
                    className="text-violet-600 hover:text-rose-600 ml-1 font-extrabold cursor-pointer"
                    title={`Remove ${priority}`}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Quick preset suggestions */}
          <div className="flex flex-wrap items-center gap-1 mt-2">
            <span className="text-[10px] text-slate-400 font-medium mr-1">Quick suggestions:</span>
            {PRESET_PRIORITIES.map((priority) => {
              const active = currentPriorities.some((p) => p.toLowerCase() === priority.toLowerCase());
              return (
                <button
                  key={priority}
                  type="button"
                  onClick={() => togglePreset('priorities', priority)}
                  className={`text-[10px] px-2 py-0.5 rounded-md border font-mono transition-all duration-150 cursor-pointer active:scale-90 capitalize ${
                    active
                      ? 'bg-violet-600 border-violet-600 text-white font-bold shadow-xs'
                      : 'bg-slate-100 border-slate-200 text-slate-600 hover:text-slate-900 hover:border-slate-300'
                  }`}
                >
                  {active ? `✓ ${priority}` : `+ ${priority}`}
                </button>
              );
            })}
          </div>
        </div>

        {/* SUBMIT Button */}
        <div className="pt-3">
          <button
            type="button"
            onClick={handleSubmitClick}
            className="w-full py-3.5 rounded-xl bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white font-extrabold text-xs uppercase tracking-wider transition-all duration-200 shadow-lg shadow-teal-500/30 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
          >
            <span>✓ Submit My Preferences & Run AI Consensus</span>
            <span className="text-sm">→</span>
          </button>
          <p className="text-[10px] text-slate-500 text-center mt-2">Submitting triggers live AI consensus analysis and role matching.</p>
        </div>
      </div>
    </div>
  );
}
