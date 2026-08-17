import React, { useState } from 'react';
import apiClient from '../../services/apiClient';

const AnnouncementEditor = () => {
    const [message, setMessage] = useState('');
    const [status, setStatus] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setStatus(null);

        try {
            await apiClient.post('/api/v1/announcements/', { message });
            setStatus({ type: 'success', text: 'Announcement is now live on all agent dashboards.' });
            setMessage('');
        } catch (error) {
            setStatus({ 
                type: 'error', 
                text: error.response?.data?.detail || 'Failed to broadcast announcement.' 
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto p-8 mt-10 bg-white rounded-lg shadow-md border-t-4 border-blue-600">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Live Announcement Broadcast</h2>
            <p className="text-gray-500 mb-6 text-sm">Update the banner message displayed on all employee dashboards instantly.</p>
            
            {status && (
                <div className={`p-4 mb-6 rounded ${status.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {status.text}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Broadcast Message</label>
                    <textarea 
                        rows="3"
                        value={message} 
                        onChange={(e) => setMessage(e.target.value)}
                        required
                        maxLength={255}
                        className="w-full p-3 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500 resize-none"
                        placeholder="e.g., Target achieved! Free pizza in the breakroom at 1 PM."
                    />
                    <p className="text-xs text-gray-400 mt-1 text-right">{message.length}/255 characters</p>
                </div>

                <button 
                    type="submit" 
                    disabled={isSubmitting || message.length === 0}
                    className="bg-blue-600 text-white font-bold py-2 px-6 rounded hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                    {isSubmitting ? 'Broadcasting...' : 'Push to Dashboards'}
                </button>
            </form>
        </div>
    );
};

export default AnnouncementEditor;