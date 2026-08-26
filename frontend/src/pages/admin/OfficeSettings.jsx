import React, { useState, useEffect } from 'react';
import apiClient from '../../services/apiClient';
import PageWrapper from '../../components/layout/PageWrapper';

const OfficeSettings = () => {
    const [settings, setSettings] = useState(null);
    const [overrides, setOverrides] = useState({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false); // NEW: Button spam protection state
    const [message, setMessage] = useState(null);

    // Form state for adding a new date override
    const [newOverrideDate, setNewOverrideDate] = useState('');
    const [newStartTime, setNewStartTime] = useState('13:00');
    const [newGraceMins, setNewGraceMins] = useState(10);
    const [newReqHours, setNewReqHours] = useState(6);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const response = await apiClient.get('/api/v1/attendance/settings');
            // Safely load both weekly settings and date-specific overrides
            setSettings(response.data.data?.setting_value || {});
            setOverrides(response.data.data?.overrides || {});
        } catch (error) {
            console.error("Failed to fetch settings", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (saving) return; // Prevent double clicking
        setMessage(null);
        setSaving(true);
        try {
            // Send both settings and overrides back to the backend payload structure
            await apiClient.put('/api/v1/attendance/settings', {
                setting_value: settings,
                overrides: overrides
            });
            setMessage({ type: 'success', text: 'Office settings updated successfully!' });
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to update settings.' });
        } finally {
            setSaving(false);
        }
    };

    const handleChange = (day, field, value) => {
        setSettings(prev => ({
            ...prev,
            [day]: { ...prev[day], [field]: field === 'start_time' ? value : Number(value) }
        }));
    };

    const handleAddOverride = () => {
    if (!newOverrideDate) return;
    setOverrides(prev => ({
        ...prev,
        [newOverrideDate]: { 
            start_time: newStartTime, 
            req_hours: Number(newReqHours),
            grace_mins: Number(newGraceMins) 
        }
    }));
    setNewOverrideDate('');
};

    const handleRemoveOverride = (dateKey) => {
        setOverrides(prev => {
            const copy = { ...prev };
            delete copy[dateKey];
            return copy;
        });
    };

    if (loading) return <PageWrapper title="Office Settings"><div className="p-8 text-center">Loading settings...</div></PageWrapper>;

    return (
        <PageWrapper title="Office Settings">
            <div className="flex justify-between items-center mb-8 px-2">
                <h1 className="text-2xl font-bold text-prime-text">Shift & Attendance Rules</h1>
                <button 
                    onClick={handleSave} 
                    disabled={saving}
                    className={`px-3 py-1.5 md:px-4 bg-prime-primary text-white rounded-full text-[10px] md:text-lg font-bold transition-colors whitespace-nowrap ${
                        saving ? 'opacity-50 cursor-not-allowed' : 'hover:bg-prime-secondary'
                    }`}
                >
                    {saving ? 'Saving...' : 'Save Changes'}
                </button>
            </div>

            {message && (
                <div className={`p-4 mb-6 rounded-md text-sm font-bold ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {message.text}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {['standard', 'friday', 'saturday'].map((dayType) => (
                    <div key={dayType} className="card-base p-6 bg-white rounded-lg shadow-sm border border-gray-100">
                        <h2 className="text-lg font-bold capitalize mb-4 text-prime-text border-b pb-2">
                            {dayType === 'standard' ? 'Mon - Thu' : dayType}
                        </h2>
                        
                        <div className="mb-4">
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Start Time (24H)</label>
                            <input 
                                type="time" 
                                value={settings[dayType]?.start_time || ''} 
                                onChange={(e) => handleChange(dayType, 'start_time', e.target.value)}
                                className="w-full border rounded p-2 text-sm"
                            />
                        </div>

                        <div className="mb-4">
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Late Grace (Mins)</label>
                            <input 
                                type="number" 
                                value={settings[dayType]?.grace_mins || 0} 
                                onChange={(e) => handleChange(dayType, 'grace_mins', e.target.value)}
                                className="w-full border rounded p-2 text-sm"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Required Hours</label>
                            <input 
                                type="number" step="0.25"
                                value={settings[dayType]?.req_hours || 0} 
                                onChange={(e) => handleChange(dayType, 'req_hours', e.target.value)}
                                className="w-full border rounded p-2 text-sm"
                            />
                        </div>
                    </div>
                ))}
            </div>

            {/* Specific Date Overrides Section */}
            <div className="card-base p-6 bg-white rounded-lg shadow-sm border border-gray-100 mt-8">
                <h2 className="text-lg font-bold mb-4 text-prime-text border-b pb-2">Specific Date Overrides (e.g., Special Half-Days)</h2>
                
                <div className="flex flex-col md:flex-row gap-4 items-end mb-6">
                    <div className="w-full md:w-auto">
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Date</label>
                        <input type="date" value={newOverrideDate} onChange={e => setNewOverrideDate(e.target.value)} className="w-full border rounded p-2 text-sm" />
                    </div>
                    <div className="w-full md:w-auto">
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Start Time</label>
                        <input type="time" value={newStartTime} onChange={e => setNewStartTime(e.target.value)} className="w-full border rounded p-2 text-sm" />
                    </div>
                    <div className="w-full md:w-auto">
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Grace Mins</label>
                        <input type="number" value={newGraceMins} onChange={e => setNewGraceMins(e.target.value)} className="w-full border rounded p-2 text-sm" />
                    </div>
                    <div className="w-full md:w-auto">
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Required Hours</label>
                        <input type="number" step="0.25" value={newReqHours} onChange={e => setNewReqHours(e.target.value)} className="w-full border rounded p-2 text-sm" />
                    </div>
                    <button onClick={handleAddOverride} className="px-3 py-1.5 md:px-4 bg-prime-primary text-white rounded-full text-[10px] md:text-md font-bold transition-colors whitespace-nowrap">
                        Add Override
                    </button>
                </div>

                <div className="space-y-2">
                    {Object.keys(overrides).length === 0 ? (
                        <p className="text-sm text-gray-400 italic">No custom date overrides added yet.</p>
                    ) : (
                        Object.entries(overrides).map(([date, val]) => (
                            <div key={date} className="flex justify-between items-center bg-gray-50 p-3 rounded text-sm border border-gray-100">
                                <span><strong>{date}</strong> &rarr; Start Time: {val.start_time}, Required Hours: {val.req_hours}h, Grace: {val.grace_mins || 0}m</span>
                                <button onClick={() => handleRemoveOverride(date)} className="text-red-600 hover:text-red-800 font-bold text-xs uppercase">Remove</button>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </PageWrapper>
    );
};

export default OfficeSettings;