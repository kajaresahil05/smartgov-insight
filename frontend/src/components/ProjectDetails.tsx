import React, { useState, useEffect } from 'react';
import { ArrowLeft, Share2, MapPin, CheckCircle2, Circle, Clock } from 'lucide-react';

export default function ProjectDetails({ projectId, onNavigateBack }) {
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProjectDetail();
  }, [projectId]);

  const fetchProjectDetail = async () => {
    try {
      const res = await fetch(`/api/projects/${projectId || 1}`);
      const json = await res.json();
      if (json.success && json.project) {
        setProject(json.project);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !project) {
    return <div className="p-8 text-center text-xs font-bold text-slate-400">Loading project details...</div>;
  }

  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-2xs max-w-xl mx-auto space-y-5">
      
      {/* Header Bar */}
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-3">
          <button onClick={onNavigateBack} className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-600">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">{project.title}</h2>
            <div className="flex items-center space-x-2 text-xs text-slate-500 font-medium mt-0.5">
              <span>🏛️ {project.category}</span>
              <span>•</span>
              <div className="flex items-center space-x-1">
                <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                <span>{project.location}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <span className="bg-emerald-50 text-emerald-600 border border-emerald-200 text-[10px] font-extrabold px-3 py-1 rounded-full">
            {project.status}
          </span>
          <button className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-100">
            <Share2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Overall Progress */}
      <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-100 space-y-2">
        <div className="flex justify-between items-center text-xs font-bold text-slate-900">
          <span>Overall Progress</span>
          <span className="text-emerald-700 font-extrabold">{project.progress}%</span>
        </div>
        <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
          <div className="bg-emerald-600 h-full rounded-full" style={{ width: `${project.progress}%` }}></div>
        </div>
      </div>

      {/* Statistics Grid */}
      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="p-3 bg-slate-50/80 rounded-2xl border border-slate-100">
          <div className="text-[10px] font-bold text-slate-400 uppercase">Start Date</div>
          <div className="text-xs font-extrabold text-slate-900 mt-1">{project.start_date}</div>
        </div>

        <div className="p-3 bg-slate-50/80 rounded-2xl border border-slate-100">
          <div className="text-[10px] font-bold text-slate-400 uppercase">Expected End</div>
          <div className="text-xs font-extrabold text-slate-900 mt-1">{project.expected_end}</div>
        </div>

        <div className="p-3 bg-slate-50/80 rounded-2xl border border-slate-100">
          <div className="text-[10px] font-bold text-slate-400 uppercase">Estimated Cost</div>
          <div className="text-xs font-extrabold text-emerald-700 mt-1">{project.estimated_cost}</div>
        </div>
      </div>

      {/* Milestones Timeline Checklist */}
      <div className="pt-2">
        <div className="text-xs font-extrabold text-slate-900 mb-4">Milestones</div>

        <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
          {project.milestones && project.milestones.map((m, idx) => (
            <div key={idx} className="relative flex items-center justify-between">
              
              <div className="flex items-center space-x-2">
                <div className={`absolute -left-[23px] w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold ${
                  m.status.includes('Completed')
                    ? 'bg-emerald-600 text-white'
                    : m.status.includes('Progress')
                    ? 'bg-blue-600 text-white ring-2 ring-blue-100'
                    : 'bg-slate-200 text-slate-400'
                }`}>
                  {m.status.includes('Completed') ? '✓' : m.status.includes('Progress') ? '●' : '○'}
                </div>

                <div className={`text-xs font-bold ${m.status.includes('Completed') ? 'text-slate-800' : m.status.includes('Progress') ? 'text-blue-700' : 'text-slate-400'}`}>
                  {m.name}
                </div>
              </div>

              <div className="flex items-center space-x-1">
                <span className={`text-[11px] font-extrabold ${
                  m.status.includes('Completed') ? 'text-emerald-600' : m.status.includes('Progress') ? 'text-blue-600' : 'text-slate-400'
                }`}>
                  {m.status}
                </span>
                {m.status.includes('Completed') && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
              </div>

            </div>
          ))}
        </div>
      </div>

      {/* Bottom Button */}
      <button className="w-full py-3 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 font-bold rounded-2xl text-xs flex items-center justify-center space-x-2 transition-colors mt-2">
        <MapPin className="w-4 h-4 text-emerald-600" />
        <span>View on Map</span>
      </button>

    </div>
  );
}
