import { useState, useEffect, useRef } from 'react';
import type { Preference } from '@consensus/shared';

interface Props {
  groupMemberId: string;
  initialValues: Preference | null;
  onBlurSave: (groupMemberId: string, prefs: Preference) => void;
}

interface FormValues {
  skills: string;
  interests: string;
  learningGoals: string;
  availabilityHours: number;
  budget: number;
  priorities: string;
  notes: string;
}

const PRESET_SKILLS = ['React', 'TypeScript', 'Python', 'Machine Learning', 'Linux', 'UI Design', 'Data Analysis', 'Node.js', 'Go', 'Rust'];
const PRESET_INTERESTS = ['AI', 'Social Impact', 'Cybersecurity', 'Web3', 'Frontend', 'Developer Tools', 'EdTech', 'FinTech'];

function csvToArray(val: string): string[] {
  return val
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

function arrayToCsv(arr: string[]): string {
  return arr.join(', ');
}

export default function PreferenceForm({ groupMemberId, initialValues, onBlurSave }: Props) {
  const [values, setValues] = useState<FormValues>({
    skills: '',
    interests: '',
    learningGoals: '',
    availabilityHours: 15,
    budget: 200,
    priorities: '',
    notes: '',
  });

  const [savedStatus, setSavedStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (initialValues) {
      setValues({
        skills: arrayToCsv(initialValues.skills),
        interests: arrayToCsv(initialValues.interests),
        learningGoals: arrayToCsv(initialValues.learningGoals),
        availabilityHours: initialValues.availabilityHours,
        budget: initialValues.budget,
        priorities: arrayToCsv(initialValues.priorities),
        notes: initialValues.notes,
      });
    }
  }, [initialValues]);

  function buildPreference(): Preference {
    return {
      groupMemberId,
      skills: csvToArray(values.skills),
      interests: csvToArray(values.interests),
      learningGoals: csvToArray(values.learningGoals),
      availabilityHours: values.availabilityHours,
      budget: values.budget,
      priorities: csvToArray(values.priorities),
      notes: values.notes,
    };
  }

  function handleTriggerSave() {
    setSavedStatus('saving');
    onBlurSave(groupMemberId, buildPreference());
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setSavedStatus('saved'), 400);
    setTimeout(() => setSavedStatus('idle'), 2500);
  }

  function togglePreset(field: 'skills' | 'interests', item: string) {
    const current = csvToArray(values[field]);
    const updated = current.includes(item)
      ? current.filter((i) => i !== item)
      : [...current, item];
    
    const newCsv = arrayToCsv(updated);
    setValues((v) => ({ ...v, [field]: newCsv }));
    onBlurSave(groupMemberId, { ...buildPreference(), [field]: updated });
    setSavedStatus('saved');
    setTimeout(() => setSavedStatus('idle'), 2000);
  }

  const inputClass =
    'w-full rounded-xl bg-slate-900/80 border border-slate-700/80 text-slate-100 text-xs px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/60 placeholder-slate-500 transition-all';

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div>
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
            Your Member Preferences
          </h3>
          <p className="text-[11px] text-slate-500">Auto-saves to room as you edit</p>
        </div>
        <div>
          {savedStatus === 'saving' && (
            <span className="text-xs text-indigo-400 font-medium animate-pulse flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-ping" /> Saving...
            </span>
          )}
          {savedStatus === 'saved' && (
            <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
              ✓ Synced live
            </span>
          )}
        </div>
      </div>

      <div className="space-y-4 text-left">
        {/* Skills */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">
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
              const active = csvToArray(values.skills).includes(skill);
              return (
                <button
                  key={skill}
                  type="button"
                  onClick={() => togglePreset('skills', skill)}
                  className={`text-[10px] px-2 py-0.5 rounded-md border font-mono transition-all ${
                    active
                      ? 'bg-indigo-600 border-indigo-500 text-white font-bold'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
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
          <label className="block text-xs font-semibold text-slate-300 mb-1">
            Interests <span className="text-slate-500 font-normal">(comma-separated)</span>
          </label>
          <input
            type="text"
            className={inputClass}
            placeholder="e.g. AI, Social Impact, Security"
            value={values.interests}
            onChange={(e) => setValues((v) => ({ ...v, interests: e.target.value }))}
            onBlur={handleTriggerSave}
          />
          <div className="flex flex-wrap gap-1 mt-2">
            {PRESET_INTERESTS.map((interest) => {
              const active = csvToArray(values.interests).includes(interest);
              return (
                <button
                  key={interest}
                  type="button"
                  onClick={() => togglePreset('interests', interest)}
                  className={`text-[10px] px-2 py-0.5 rounded-md border font-mono transition-all ${
                    active
                      ? 'bg-purple-600 border-purple-500 text-white font-bold'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                  }`}
                >
                  {active ? `✓ ${interest}` : `+ ${interest}`}
                </button>
              );
            })}
          </div>
        </div>

        {/* Sliders Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-900/50 p-3.5 rounded-xl border border-slate-800/80">
          {/* Availability */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-semibold text-slate-300">Availability</label>
              <span className="text-xs font-mono font-bold text-indigo-400 bg-indigo-950 px-2 py-0.5 rounded border border-indigo-800">
                {values.availabilityHours} hrs/wk
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={40}
              step={1}
              value={values.availabilityHours}
              onChange={(e) => setValues((v) => ({ ...v, availabilityHours: Number(e.target.value) }))}
              onMouseUp={handleTriggerSave}
              onTouchEnd={handleTriggerSave}
              className="w-full accent-indigo-500 cursor-pointer"
            />
          </div>

          {/* Budget */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-semibold text-slate-300">Budget Limit</label>
              <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
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
              className="w-full accent-emerald-500 cursor-pointer"
            />
          </div>
        </div>

        {/* Priorities & Notes */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">
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
      </div>
    </div>
  );
}
