import React from 'react';

const Button = ({ children, onClick, type = 'button', variant = 'primary', disabled = false, className = '', ...props }) => {
    // Highly rounded (pill) buttons to match the image
    const baseStyle = "inline-flex justify-center items-center px-6 py-2.5 text-sm font-semibold rounded-full transition-colors focus:outline-none disabled:opacity-50 disabled:pointer-events-none";
    
    const variants = {
        primary: "bg-prime-primary text-white hover:bg-prime-secondary",
        outline: "bg-white border border-prime-border text-prime-text hover:bg-gray-50",
    };

    return (
        <button 
            type={type} // Fixes broken form submissions
            onClick={onClick} 
            disabled={disabled} 
            className={`${baseStyle} ${variants[variant]} ${className}`}
            {...props}
        >
            {children}
        </button>
    );
};

export default Button;