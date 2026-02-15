import React from 'react';
import { Stats as StatsType } from '../types';
import { Activity, Target, AlertCircle } from 'lucide-react';

interface StatsProps {
  stats: StatsType;
}

const Stats: React.FC<StatsProps> = ({ stats }) => {
  return (
    <div className="grid grid-cols-3 gap-4 w-full max-w-3xl mb-8">
      <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 flex items-center gap-4">
        <div className="p-3 bg-indigo-500/10 rounded-lg text-indigo-400">
          <Activity size={24} />
        </div>
        <div>
          <p className="text-slate-400 text-sm font-medium">Speed</p>
          <p className="text-2xl font-bold text-white">{Math.round(stats.wpm)} <span className="text-sm font-normal text-slate-500">WPM</span></p>
        </div>
      </div>

      <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 flex items-center gap-4">
        <div className="p-3 bg-emerald-500/10 rounded-lg text-emerald-400">
          <Target size={24} />
        </div>
        <div>
          <p className="text-slate-400 text-sm font-medium">Accuracy</p>
          <p className="text-2xl font-bold text-white">{Math.round(stats.accuracy)}%</p>
        </div>
      </div>

      <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 flex items-center gap-4">
        <div className="p-3 bg-rose-500/10 rounded-lg text-rose-400">
          <AlertCircle size={24} />
        </div>
        <div>
          <p className="text-slate-400 text-sm font-medium">Errors</p>
          <p className="text-2xl font-bold text-white">{stats.errors}</p>
        </div>
      </div>
    </div>
  );
};

export default Stats;