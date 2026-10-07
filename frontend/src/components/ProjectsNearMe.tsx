import React, { useState, useEffect } from 'react';
import { MapPin, SearchX, Layers } from 'lucide-react';

export default function ProjectsNearMe({ userLocation, onSelectProject }) {
  const [projects, setProjects] = useState([]);
  const [activeCategory, setActiveCategory] = useState('All');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProjects();
  }, [activeCategory]);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      let url = '/api/projects';
      if (activeCategory !== 'All') url += `?category=${encodeURIComponent(activeCategory)}`;
      const res = await fetch(url);
      const json = await res.json();
      if (json.success) {
        setProjects(json.projects || []);
      }
    } catch (e) {
      console.error(e);
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  const citizenArea = userLocation || 'Kothrud, Pune';

  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-2xs max-w-xl mx-auto space-y-5">
      
      {/* Title */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Projects Near Me</h2>
        <div className="text-xs font-semibold text-slate-500 flex items-center gap-1">
          <MapPin className="w-3.5 h-3.5 text-emerald-600" />
          <span>{citizenArea}</span>
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {['All', 'Road', 'Water', 'Drainage', 'Others'].map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-extrabold transition-all shrink-0 ${
              activeCategory === cat
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* MAP AREA VIEW */}
      {projects.length > 0 ? (
        <div className="h-44 w-full rounded-2xl overflow-hidden bg-slate-100 relative border border-slate-200 shadow-inner">
          <div className="absolute inset-0 bg-cover bg-center opacity-80" style={{ backgroundImage: `url('https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?auto=format&fit=crop&w=800&q=80')` }}></div>
          {projects.map((proj, idx) => (
            <div key={proj.id} className="absolute bg-emerald-600 text-white p-1.5 rounded-full shadow-lg" style={{ top: `${20 + idx * 25}%`, left: `${25 + idx * 30}%` }}>
              <MapPin className="w-4 h-4 fill-white" />
            </div>
          ))}
        </div>
      ) : (
        /* Empty State Map Placeholder when 0 projects exist */
        <div className="h-40 w-full rounded-2xl bg-slate-50 border border-slate-200 flex flex-col items-center justify-center p-4 text-center">
          <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2">
            <MapPin className="w-5 h-5" />
          </div>
          <div className="text-xs font-bold text-slate-800">No government projects in {citizenArea} yet.</div>
          <div className="text-[11px] text-slate-400 font-medium mt-0.5">Projects created by local government authorities will appear on this map.</div>
        </div>
      )}

      {/* PROJECT LIST OR PROFESSIONAL EMPTY STATE */}
      {loading ? (
        <div className="text-center py-10 text-xs font-bold text-slate-400">Fetching projects from database...</div>
      ) : projects.length > 0 ? (
        <div className="space-y-3 pt-1">
          {projects.map((proj) => (
            <div
              key={proj.id}
              onClick={() => onSelectProject(proj.id)}
              className="p-3.5 rounded-2xl border border-slate-150 hover:border-emerald-500 hover:shadow-xs transition-all bg-white cursor-pointer flex items-center justify-between"
            >
              <div className="flex items-center space-x-3.5">
                <div className="w-14 h-14 rounded-xl overflow-hidden bg-slate-200 shrink-0">
                  <img src={proj.image} alt={proj.title} className="w-full h-full object-cover" />
                </div>
                <div>
                  <div className="text-xs font-extrabold text-slate-900">{proj.title}</div>
                  <div className="text-[10px] text-slate-400 font-semibold mt-0.5">
                    Start: {proj.start_date} • End: {proj.expected_end}
                  </div>
                  
                  <div className="w-36 bg-slate-100 h-1.5 rounded-full overflow-hidden mt-2">
                    <div className="bg-emerald-600 h-full rounded-full" style={{ width: `${proj.progress}%` }}></div>
                  </div>
                </div>
              </div>

              <div className="text-right">
                <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full ${
                  proj.status === 'Completed' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-blue-50 text-blue-600 border border-blue-200'
                }`}>
                  {proj.status}
                </span>
                <div className="text-xs font-extrabold text-slate-700 mt-2">{proj.progress}%</div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* PROFESSIONAL EMPTY STATE WHEN 0 PROJECTS IN DB */
        <div className="py-10 px-6 border border-dashed border-slate-200 rounded-3xl bg-slate-50/50 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto text-xl">
            📍
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-slate-900">
              {activeCategory !== 'All' ? `No projects found in "${activeCategory}"` : 'No Projects Available'}
            </h3>
            <p className="text-xs text-slate-500 font-medium max-w-xs mx-auto mt-1 leading-relaxed">
              There are currently no government projects available in your area. Projects will appear here once the government creates and publishes them.
            </p>
          </div>
        </div>
      )}

    </div>
  );
}
