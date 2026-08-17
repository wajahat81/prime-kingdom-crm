import React from 'react';
import Button from './Button';

const Modal = ({ isOpen, onClose, title, children, onConfirm, confirmText = "Confirm" }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-prime-navy/60 backdrop-blur-sm animate-fade-in p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all scale-100">
                <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <h3 className="text-lg font-bold text-prime-text tracking-tight">{title}</h3>
                    <button 
                        onClick={onClose} 
                        className="text-gray-400 hover:text-red-500 transition-colors focus:outline-none rounded-full p-1 hover:bg-red-50"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                
                <div className="px-6 py-6 text-prime-text">
                    {children}
                </div>
                
                <div className="px-6 py-4 border-t border-gray-100 flex justify-end space-x-3 bg-gray-50/50">
                    <Button variant="ghost" onClick={onClose}>Cancel</Button>
                    {onConfirm && <Button variant="primary" onClick={onConfirm}>{confirmText}</Button>}
                </div>
            </div>
        </div>
    );
};

export default Modal;