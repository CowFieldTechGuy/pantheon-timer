import React, { useState, useEffect } from 'react';
import { Clock, Plus, Trash2, Bell, BellOff, PlayCircle, StopCircle, RefreshCw, Volume2, VolumeX, Save, Upload, Download } from 'lucide-react';
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
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [notifyBefore, setNotifyBefore] = useState(5); // minutes before spawn to notify
  
  // Load saved mobs from local storage on initial render
  useEffect(() => {
    const savedMobs = localStorage.getItem('pantheonTimerMobs');
    if (savedMobs) {
      try {
        const parsedMobs = JSON.parse(savedMobs);
        // Convert string dates back to Date objects
        const restoredMobs = parsedMobs.map(mob => ({
          ...mob,
          killed: new Date(mob.killed),
          respawnAt: new Date(mob.respawnAt),
          minRespawn: new Date(mob.minRespawn),
          maxRespawn: new Date(mob.maxRespawn),
          history: mob.history.map(h => ({
            ...h,
            killed: new Date(h.killed),
            respawnAt: new Date(h.respawnAt)
          }))
        }));
        setMobs(restoredMobs);
      } catch (error) {
        console.error('Error parsing saved mobs:', error);
      }
    }
    
    // Load sound setting
    const savedSound = localStorage.getItem('pantheonTimerSound');
    if (savedSound !== null) {
      setSoundEnabled(savedSound === 'true');
    }
    
    // Load notify time
    const savedNotifyTime = localStorage.getItem('pantheonTimerNotifyBefore');
    if (savedNotifyTime !== null) {
      setNotifyBefore(parseInt(savedNotifyTime));
    }
  }, []);

  // Update current time every second and check for notifications
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now);
      
      // Check for mobs that need notifications
      if (soundEnabled) {
        mobs.forEach(mob => {
          if (!mob.notify) return;
          
          // Time until spawn in minutes
          const msUntilSpawn = mob.respawnAt - now;
          const minutesUntilSpawn = msUntilSpawn / (1000 * 60);
          
          // Check if spawn is happening now (within last second)
          if (msUntilSpawn <= 0 && msUntilSpawn > -1000 && !mob.spawnNotified) {
            playSound('spawn');
            showDesktopNotification(`${mob.name} has spawned!`, `Camp: ${mob.camp || 'Unknown'}`);
            
            // Mark as notified by updating the mob
            setMobs(prevMobs => prevMobs.map(m => 
              m.id === mob.id ? {...m, spawnNotified: true} : m
            ));
          }
          
          // Check if we should send a warning notification
          if (minutesUntilSpawn <= notifyBefore && 
              minutesUntilSpawn > notifyBefore - 0.016 && // Only trigger once in the minute window
              !mob.warningNotified) {
            playSound('warning');
            showDesktopNotification(
              `${mob.name} spawning soon!`, 
              `Expected in about ${notifyBefore} minutes at ${mob.camp || 'Unknown'}`
            );
            
            // Mark as warning notified
            setMobs(prevMobs => prevMobs.map(m => 
              m.id === mob.id ? {...m, warningNotified: true} : m
            ));
          }
        });
      }
    }, 1000);
    
    return () => clearInterval(timer);
  }, [mobs, soundEnabled, notifyBefore]);
  
  // Save mobs to local storage whenever they change
  useEffect(() => {
    localStorage.setItem('pantheonTimerMobs', JSON.stringify(mobs));
  }, [mobs]);
  
  // Save sound setting whenever it changes
  useEffect(() => {
    localStorage.setItem('pantheonTimerSound', soundEnabled.toString());
  }, [soundEnabled]);
  
  // Save notify time setting
  useEffect(() => {
    localStorage.setItem('pantheonTimerNotifyBefore', notifyBefore.toString());
  }, [notifyBefore]);
  
  // Play notification sounds
  const playSound = (type) => {
    if (!soundEnabled) return;
    
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    if (type === 'spawn') {
      // Spawn notification - higher pitched alert
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(880, audioContext.currentTime); // A5
      
      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.7, audioContext.currentTime + 0.05);
      gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.5);
      
      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.5);
    } else if (type === 'warning') {
      // Warning notification - lower pitched alert
      oscillator.type = 'triangle';
      oscillator.frequency.setValueAtTime(440, audioContext.currentTime); // A4
      
      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.05);
      gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.3);
      
      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.3);
    }
  };
  
  // Show desktop notification
  const showDesktopNotification = (title, body) => {
    if (!("Notification" in window)) return;
    
    if (Notification.permission === "granted") {
      new Notification(title, { body });
    } else if (Notification.permission !== "denied") {
      Notification.requestPermission().then(permission => {
        if (permission === "granted") {
          new Notification(title, { body });
        }
      });
    }
  };

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
      spawnNotified: false,
      warningNotified: false,
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
          spawnNotified: false,
          warningNotified: false,
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

  // Calculate progress bar width (percentage of time elapsed)
  const getProgressBarWidth = (mob) => {
    const total = mob.respawnAt - mob.killed;
    const elapsed = currentTime - mob.killed;
    
    if (total <= 0) return 100;
    
    const percentage = (elapsed / total) * 100;
    return Math.min(Math.max(percentage, 0), 100); // Clamp between 0-100
  };
  
  // Get color for progress bar based on progress
  const getProgressBarColor = (mob) => {
    const percentage = getProgressBarWidth(mob);
    
    if (percentage >= 100) {
      return "#10b981"; // Green when spawned
    } else if (percentage >= 80) {
      return "#f59e0b"; // Yellow when getting close
    } else {
      return "#4f46e5"; // Purple-blue for normal progress
    }
  };

  // Export timer data
  const exportData = () => {
    const dataStr = JSON.stringify(mobs, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `pantheon-timers-${new Date().toISOString().slice(0, 10)}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };
  
  // Import timer data
  const importData = (event) => {
    const fileReader = new FileReader();
    fileReader.readAsText(event.target.files[0], "UTF-8");
    fileReader.onload = e => {
      try {
        const parsedData = JSON.parse(e.target.result);
        
        // Convert string dates back to Date objects
        const importedMobs = parsedData.map(mob => ({
          ...mob,
          killed: new Date(mob.killed),
          respawnAt: new Date(mob.respawnAt),
          minRespawn: new Date(mob.minRespawn),
          maxRespawn: new Date(mob.maxRespawn),
          history: mob.history.map(h => ({
            ...h,
            killed: new Date(h.killed),
            respawnAt: new Date(h.respawnAt)
          }))
        }));
        
        setMobs(importedMobs);
      } catch (error) {
        console.error('Error importing data:', error);
        alert('Error importing data. Please check the file format.');
      }
    };
  };
  
  // Clear all timer data
  const clearAllData = () => {
    if (window.confirm('Are you sure you want to remove all mob timers? This cannot be undone.')) {
      setMobs([]);
      localStorage.removeItem('pantheonTimerMobs');
    }
  };

  // Filter mobs based on current view
  const filteredMobs = mobs.filter(mob => {
    if (view === 'active') {
      return getTimeRemaining(mob.respawnAt).total > 0;
    }
    return true;
  }).sort((a, b) => a.respawnAt - b.respawnAt);
  
  return (
    <div className="min-h-screen p-4" style={{backgroundColor: "#121212", color: "#e0e0e0"}}>
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-3xl font-bold text-center" style={{color: "#e0e0e0"}}>Pantheon Camp Timer</h1>
          
          <div className="flex items-center space-x-2">
            <button 
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 rounded" 
              style={{backgroundColor: "#2c2c3a", color: "#e0e0e0"}}
              title="Settings"
            >
              ⚙️ Settings
            </button>
            <button 
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-2 rounded" 
              style={{backgroundColor: soundEnabled ? "#4f46e5" : "#2c2c3a", color: "#e0e0e0"}}
              title={soundEnabled ? "Sound On" : "Sound Off"}
            >
              {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
            </button>
          </div>
        </div>
        
        {/* Settings Panel */}
        {showSettings && (
          <div className="rounded-lg p-4 mb-6" style={{backgroundColor: "#222639", borderColor: "#3f3f5f", boxShadow: "0 4px 6px rgba(15, 15, 25, 0.25)"}}>
            <h2 className="text-xl font-semibold mb-3" style={{color: "#e0e0e0"}}>Settings</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Notification Minutes Before Spawn</label>
                <input
                  type="number"
                  className="w-full p-2 border rounded"
                  value={notifyBefore}
                  onChange={(e) => setNotifyBefore(parseInt(e.target.value) || 5)}
                  min="1"
                  max="60"
                  style={{backgroundColor: "#2d2d44", color: "#e0e0e0", borderColor: "#3f3f5f"}}
                />
              </div>
              
              <div className="flex flex-col justify-end">
                <div className="flex space-x-2">
                  <button
                    onClick={exportData}
                    className="flex items-center p-2 rounded"
                    style={{backgroundColor: "#2c2c3a", color: "#e0e0e0"}}
                    title="Export Timers"
                  >
                    <Download size={16} className="mr-1" />
                    Export
                  </button>
                  
                  <label className="flex items-center p-2 rounded cursor-pointer"
                    style={{backgroundColor: "#2c2c3a", color: "#e0e0e0"}}
                  >
                    <Upload size={16} className="mr-1" />
                    Import
                    <input
                      type="file"
                      accept=".json"
                      onChange={importData}
                      className="hidden"
                    />
                  </label>
                  
                  <button
                    onClick={clearAllData}
                    className="flex items-center p-2 rounded"
                    style={{backgroundColor: "#2c2c3a", color: "#e0e0e0"}}
                    title="Clear All Data"
                  >
                    <Trash2 size={16} className="mr-1" />
                    Clear All
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Add new mob form */}
        <div className="rounded-lg p-4 mb-6" style={{backgroundColor: "#222639", borderColor: "#3f3f5f", boxShadow: "0 4px 6px rgba(15, 15, 25, 0.25)"}}>
          <h2 className="text-xl font-semibold mb-3 flex items-center" style={{color: "#e0e0e0"}}>
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
                style={{backgroundColor: "#2d2d44", color: "#e0e0e0", borderColor: "#3f3f5f"}}
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
                style={{backgroundColor: "#2d2d44", color: "#e0e0e0", borderColor: "#3f3f5f"}}
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
                style={{backgroundColor: "#2d2d44", color: "#e0e0e0", borderColor: "#3f3f5f"}}
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
                style={{backgroundColor: "#2d2d44", color: "#e0e0e0", borderColor: "#3f3f5f"}}
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
                style={{backgroundColor: "#2d2d44", color: "#e0e0e0", borderColor: "#3f3f5f"}}
              />
            </div>
          </div>
          
          <button
            className="mt-4 py-2 px-4 rounded flex items-center"
            style={{backgroundColor: "#4f46e5", color: "#e0e0e0"}}
            onClick={addMob}
          >
            <Plus size={16} className="mr-1" />
            Add Mob Timer
          </button>
        </div>
        
        {/* View selector */}
        <div className="flex mb-4 space-x-2 justify-center">
          <button
            className="py-2 px-4 rounded"
            style={{backgroundColor: view === 'active' ? "#4f46e5" : "#2c2c3a", color: "#e0e0e0"}}
            onClick={() => setView('active')}
          >
            Active Timers
          </button>
          <button
            className="py-2 px-4 rounded"
            style={{backgroundColor: view === 'all' ? "#4f46e5" : "#2c2c3a", color: "#e0e0e0"}}
            onClick={() => setView('all')}
          >
            All Mobs
          </button>
        </div>
        
        {/* Mob timer list */}
        <div className="space-y-4">
          {filteredMobs.length === 0 ? (
            <div className="text-center py-8" style={{color: "#9ca3af"}}>
              No mob timers yet. Add your first mob above!
            </div>
          ) : (
            filteredMobs.map(mob => (
              <div key={mob.id} className="rounded-lg p-4" style={{backgroundColor: "#222639", borderColor: "#3f3f5f", boxShadow: "0 4px 6px rgba(15, 15, 25, 0.25)"}}>
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
                
                <div className="flex items-center justify-between p-2 rounded" style={{backgroundColor: "#191927"}}>
                  <div className="flex items-center">
                    <Clock size={16} className="mr-2 text-gray-500" />
                    <span className={getTimerColor(mob)}>
                      {formatTimeRemaining(mob.respawnAt)}
                    </span>
                  </div>
                  
                  <div className="text-xs" style={{color: "#9ca3af"}}>
                    Window: {new Date(mob.minRespawn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(mob.maxRespawn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
                
                {/* Progress bar */}
                <div className="mt-2 h-2 rounded bg-gray-700 overflow-hidden">
                  <div 
                    className="h-full transition-all duration-1000"
                    style={{
                      backgroundColor: getProgressBarColor(mob),
                      width: getProgressBarWidth(mob) + '%'
                    }}
                  ></div>
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