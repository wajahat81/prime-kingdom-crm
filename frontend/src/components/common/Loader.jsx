import React from 'react';

const Loader = ({ message = "Loading..." }) => {
    return (
        <div className="flex flex-col items-center justify-center p-16 space-y-4 page-transition">
            <div className="w-10 h-10 border-4 border-prime-primary/20 border-t-prime-primary rounded-full animate-spin"></div>
            <p className="text-prime-muted font-medium text-sm tracking-wide">{message}</p>
        </div>
    );
};

export default Loader;