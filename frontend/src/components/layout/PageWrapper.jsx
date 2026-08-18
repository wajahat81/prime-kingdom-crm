import React, { useEffect } from 'react';

const PageWrapper = ({ title, children }) => {
    useEffect(() => {
        // Fix page titles dynamically
        document.title = title ? `${title} | Prime Kingdom` : 'Prime Kingdom';
    }, [title]);

    return (
        // Optimised for mobile view: strict padding and full width
        <div className="w-full max-w-full px-4 sm:px-6 md:px-8 py-6 mx-auto page-transition overflow-x-hidden">
            {children}
        </div>
    );
};

export default PageWrapper;