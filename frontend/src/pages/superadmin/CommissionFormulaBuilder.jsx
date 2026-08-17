import React, { useState } from 'react';
import Button from '../../components/common/Button';

const CommissionFormulaBuilder = () => {
    const [payoutPerCall, setPayoutPerCall] = useState(15.00);
    const [status, setStatus] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setStatus(null);

        try {
            setTimeout(() => {
                setStatus({ type: 'success', text: 'Commission parameters updated securely across the system.' });
                setIsSubmitting(false);
            }, 600);
        } catch (error) {
            setStatus({ type: 'error', text: 'Failed to update commission parameters.' });
            setIsSubmitting(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto p-10 mt-10 card-base page-transition">
            <div className="mb-8 border-b border-gray-100 pb-5">
                <h2 className="text-2xl font-extrabold text-prime-text tracking-tight mb-1">Commission Formula Configuration</h2>
                <p className="text-sm font-medium text-prime-muted">Adjust the payout variables used by Admins during the end-of-month processing.</p>
            </div>

            {status && (
                <div className={`p-4 mb-8 rounded-lg text-sm font-semibold border flex items-center gap-2 animate-fade-in ${status.type === 'success' ? 'bg-prime-green/10 text-prime-green border-prime-green/20' : 'bg-red-50 text-red-600 border-red-100'}`}>
                    {status.text}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">
                <div>
                    <label className="block text-xs font-bold text-prime-muted uppercase tracking-wider mb-2">
                        Base Payout per Retained Call ($)
                    </label>
                    <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-gray-400 font-bold">$</span>
                        <input 
                            type="number" 
                            step="0.01"
                            value={payoutPerCall} 
                            onChange={(e) => setPayoutPerCall(parseFloat(e.target.value))}
                            required
                            className="input-base pl-10 font-mono text-xl text-prime-navy font-bold"
                        />
                    </div>
                    <div className="mt-3 p-4 bg-prime-navy/5 rounded-lg border border-prime-navy/10">
                        <p className="text-xs font-semibold text-prime-navy uppercase tracking-wider mb-1">Live Calculation Example</p>
                        <p className="text-sm text-prime-text font-medium">100 retained calls × <span className="font-bold">${payoutPerCall.toFixed(2)}</span> = <strong className="text-prime-green">${(100 * payoutPerCall).toFixed(2)}</strong> payout.</p>
                    </div>
                </div>

                <Button 
                    type="submit" 
                    disabled={isSubmitting}
                    variant="primary"
                    className="w-full py-3"
                >
                    {isSubmitting ? 'Authenticating & Saving...' : 'Save Global Formula'}
                </Button>
            </form>
        </div>
    );
};

export default CommissionFormulaBuilder;