/**
 * Formats a given ISO date string into a readable format.
 * @param {string} dateString - ISO Date string
 * @returns {string} Formatted date (e.g., Aug 17, 2026, 2:30 PM)
 */
export const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    
    const options = { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit' 
    };
    
    return new Date(dateString).toLocaleDateString('en-US', options);
};