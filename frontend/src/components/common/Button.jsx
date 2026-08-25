import React, { useState } from 'react';

const Button = ({ children, onClick, type = 'button', variant = 'primary', disabled = false, className = '', ...props }) => {
    const [isInternalLoading, setIsInternalLoading] = useState(false);

    const handleClick = async (e) => {
        if (!onClick || disabled || isInternalLoading) return;
        
        try {
            setIsInternalLoading(true);
            // Wait for the parent function to finish (if it's a promise)
            await onClick(e);
        } finally {
            setIsInternalLoading(false);
        }
    };

    // Highly rounded (pill) buttons to match the image
    const baseStyle = "inline-flex justify-center items-center px-6 py-2.5 text-sm font-semibold rounded-full transition-all focus:outline-none";
    
    const variants = {
        primary: "bg-prime-primary text-white hover:bg-prime-secondary",
        outline: "bg-white border border-prime-border text-prime-text hover:bg-gray-50",
    };

    const isDisabled = disabled || isInternalLoading;

    return (
        <button 
            type={type} 
            onClick={type === 'submit' ? onClick : handleClick} // Forms handle their own state
            disabled={isDisabled} 
            className={`${baseStyle} ${variants[variant]} ${className} ${isDisabled ? 'opacity-50 pointer-events-none' : ''}`}
            {...props}
        >
            {isInternalLoading ? (
                <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                </span>
            ) : children}
        </button>
    );
};

export default Button;