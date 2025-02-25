import React, { useState, useEffect } from 'react';
import { Clock, Plus, Trash2, Bell, BellOff, PlayCircle, StopCircle, RefreshCw } from 'lucide-react';
import './App.css';

function App() {
  const [mobs, setMobs] = useState([]);
  const [newMob, setNewMob] = useState({
    name: '',
    camp: '',
    respawnTime: 20,
    respawnVariance: 2,
    notes: '',
  });
  const [currentTime, setCurrentTime] = useState(new Date());
  const [view, setView] = useState('active'); // 'active', 'all', or 'history'
  
  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);
  
  // Add a new mob to the tracking list
  const addMob = () => {
    if (!newMob.name) return;
    
    const timeNow = new Date();
    const respawnMinutes = newMob.respawnTime;
    
    // Calculate respawn time (current time + respawn minutes)
    const respawnTime = new Date(timeNow.getTime() + respawnMinutes * 60000);
    
    const mobWithTimer = {
      ...newMob,
      id: Date.now(),
      status: 'active',
      killed: timeNow,
      respawnAt: respawnTime,
      minRespawn: new Date(timeNow.getTime() + (respawnMinutes - newMob.respawnVariance) * 60000),
      maxRespawn: new Date(timeNow.getTime() + (respawnMinutes + newMob.respawnVariance) * 60000),
      notify: true,
      history: []
    };
    
    setMobs([...mobs, mobWithTimer]);
    
    // Reset form fields
    setNewMob({
      name: '',
      camp: '',
      respawnTime: 20,
      respawnVariance: 2,
      notes: ''
    });
  };
  
  // Mark a mob as killed, resetting its timer
  const resetMob = (id) => {
    setMobs(mobs.map(mob => {
      if (mob.id === id) {
        const timeNow = new Date();
        const respawnMinutes = mob.respawnTime;
        const respawnTime = new Date(timeNow.getTime() + respawnMinutes * 60000);
        
        // Add previous kill to history
        const historyEntry = {
          killed: mob.killed,
          respawnAt: mob.respawnAt
        };
        
        return {
          ...mob,
          status: 'active',
          killed: timeNow,
          respawnAt: respawnTime,
          minRespawn: new Date(timeNow.getTime() + (respawnMinutes - mob.respawnVariance) * 60000),
          maxRespawn: new Date(timeNow.getTime() + (respawnMinutes + mob.respawnVariance) * 60000),
          history: [...mob.history, historyEntry]
        };
      }
      return mob;
    }));
  };
  
  // Remove a mob from the list
  const removeMob = (id) => {
    setMobs(mobs.filter(mob => mob.id !== id));
  };
  
  // Toggle notifications for a mob
  const toggleNotify = (id) => {
    setMobs(mobs.map(mob => {
      if (mob.id === id) {
        return {...mob, notify: !mob.notify};
      }
      return mob;
    }));
  };
  
  // Calculate time remaining until respawn
  const getTimeRemaining = (respawnTime) => {
    const total = respawnTime - currentTime;
    
    if (total <= 0) return { total: 0, minutes: 0, seconds: 0 };
    
    const minutes = Math.floor((total / 1000 / 60) % 60);
    const seconds = Math.floor((total / 1000) % 60);
    
    return {
      total,
      minutes,
      seconds
    };
  };
  
  // Format time remaining for display
  const formatTimeRemaining = (respawnTime) => {
    const time = getTimeRemaining(respawnTime);
    
    if (time.total <= 0) {
      return "SPAWNED";
    }
    
    return `${time.minutes}m ${time.seconds}s`;
  };
  
  // Determine display color based on spawn window
  const getTimerColor = (mob) => {
    if (currentTime >= mob.respawnAt) {
      return "text-green-500 font-bold";
    }
    
    if (currentTime >= mob.minRespawn) {
      return "text-yellow-500 font-bold";
    }
    
    return "text-gray-700";
  };

  // Filter mobs based on current view
  const filteredMobs = mobs.filter(mob => {
    if (view === 'active') {
      return getTimeRemaining(mob.respawnAt).total > 0;
    }
    return true;
  }).sort((a, b) => a.respawnAt - b.respawnAt);
  
  return (
    <div className="bg-gray-100 min-h-screen p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-6">Pantheon Camp Timer</h1>
        
        {/* Add new mob form */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <h2 className="text-xl font-semibold mb-3 flex items-center">
            <Plus size={20} className="mr-2" />
            Add New Mob
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Mob Name</label>
              <input
                type="text"
                className="w-full p-2 border rounded"
                value={newMob.name}
                onChange={(e) => setNewMob({...newMob, name: e.target.value})}
                placeholder="Enter mob name"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Camp Location</label>
              <input
                type="text"
                className="w-full p-2 border rounded"
                value={newMob.camp}
                onChange={(e) => setNewMob({...newMob, camp: e.target.value})}
                placeholder="Enter camp location"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Respawn Time (minutes)</label>
              <input
                type="number"
                className="w-full p-2 border rounded"
                value={newMob.respawnTime}
                onChange={(e) => setNewMob({...newMob, respawnTime: parseInt(e.target.value) || 0})}
                min="1"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Variance (+/- minutes)</label>
              <input
                type="number"
                className="w-full p-2 border rounded"
                value={newMob.respawnVariance}
                onChange={(e) => setNewMob({...newMob, respawnVariance: parseInt(e.target.value) || 0})}
                min="0"
              />
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Notes</label>
              <input
                type="text"
                className="w-full p-2 border rounded"
                value={newMob.notes}
                onChange={(e) => setNewMob({...newMob, notes: e.target.value})}
                placeholder="Additional notes (drops, strategies, etc.)"
              />
            </div>
          </div>
          
          <button
            className="mt-4 bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 flex items-center"
            onClick={addMob}
          >
            <Plus size={16} className="mr-1" />
            Add Mob Timer
          </button>
        </div>
        
        {/* View selector */}
        <div className="flex mb-4 space-x-2 justify-center">
          <button
            className={`py-2 px-4 rounded ${view === 'active' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
            onClick={() => setView('active')}
          >
            Active Timers
          </button>
          <button
            className={`py-2 px-4 rounded ${view === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
            onClick={() => setView('all')}
          >
            All Mobs
          </button>
        </div>
        
        {/* Mob timer list */}
        <div className="space-y-4">
          {filteredMobs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No mob timers yet. Add your first mob above!
            </div>
          ) : (
            filteredMobs.map(mob => (
              <div key={mob.id} className="bg-white rounded-lg shadow p-4">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-lg font-bold">{mob.name}</h3>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => toggleNotify(mob.id)}
                      className={`p-1 rounded ${mob.notify ? 'text-yellow-500' : 'text-gray-400'}`}
                      title={mob.notify ? 'Notifications on' : 'Notifications off'}
                    >
                      {mob.notify ? <Bell size={18} /> : <BellOff size={18} />}
                    </button>
                    <button
                      onClick={() => resetMob(mob.id)}
                      className="p-1 rounded text-blue-500"
                      title="Reset timer (mob killed)"
                    >
                      <RefreshCw size={18} />
                    </button>
                    <button
                      onClick={() => removeMob(mob.id)}
                      className="p-1 rounded text-red-500"
                      title="Remove mob"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <div className="text-sm">
                    <span className="text-gray-500">Camp:</span> {mob.camp || 'N/A'}
                  </div>
                  <div className="text-sm">
                    <span className="text-gray-500">Respawn:</span> {mob.respawnTime}m ±{mob.respawnVariance}m
                  </div>
                </div>
                
                {mob.notes && (
                  <div className="text-sm mb-3 italic">
                    {mob.notes}
                  </div>
                )}
                
                <div className="flex items-center justify-between p-2 bg-gray-100 rounded">
                  <div className="flex items-center">
                    <Clock size={16} className="mr-2 text-gray-500" />
                    <span className={getTimerColor(mob)}>
                      {formatTimeRemaining(mob.respawnAt)}
                    </span>
                  </div>
                  
                  <div className="text-xs text-gray-500">
                    Window: {new Date(mob.minRespawn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(mob.maxRespawn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default App;