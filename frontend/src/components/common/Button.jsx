import React from 'react';

const Button = ({ children, onClick, type = 'button', variant = 'primary', disabled = false, className = '', ...props }) => {
    const baseStyle = "inline-flex justify-center items-center px-5 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ease-out focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none hover:scale-[1.02] active:scale-[0.98]";
    
    const variants = {
        primary: "bg-gradient-to-r from-prime-primary to-prime-secondary text-white hover:shadow-lg focus:ring-prime-primary border-none",
        success: "bg-gradient-to-r from-emerald-500 to-green-400 text-white hover:shadow-lg focus:ring-emerald-500",
        outline: "bg-white border-2 border-prime-primary text-prime-primary hover:bg-prime-bg focus:ring-prime-primary shadow-sm",
        danger: "bg-gradient-to-r from-red-500 to-rose-400 text-white hover:shadow-lg focus:ring-red-500",
        ghost: "bg-transparent text-prime-muted hover:bg-prime-bg focus:ring-prime-bg hover:scale-100"
    };

    return (
        <button 
            type={type} 
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