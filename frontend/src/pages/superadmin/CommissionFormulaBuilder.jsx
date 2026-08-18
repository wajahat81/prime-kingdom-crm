import React, { useState } from 'react';
import Button from '../../components/common/Button';
import PageWrapper from '../../components/layout/PageWrapper';

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
                setStatus({ type: 'success', text: 'Commission parameters updated securely.' });
                setIsSubmitting(false);
            }, 600);
        } catch (error) {
            setStatus({ type: 'error', text: 'Failed to update commission parameters.' });
            setIsSubmitting(false);
        }
    };

    return (
        <PageWrapper title="Formula Configuration">
            <div className="max-w-2xl mx-auto card-base p-10 bg-white mt-4">
                <div className="mb-8 text-center">
                    <h2 className="text-2xl font-bold text-prime-text tracking-tight mb-2">Commission Formula</h2>
                    <p className="text-sm font-medium text-prime-muted">Adjust global payout variables.</p>
                </div>

                {status && (
                    <div className={`px-6 py-3 mb-8 rounded-full text-sm font-medium text-center ${status.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                        {status.text}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-8">
                    <div>
                        <label className="block text-xs font-semibold text-prime-muted uppercase tracking-wider mb-2 ml-2">
                            Base Payout per Retained Call ($)
                        </label>
                        <input 
                            type="number" 
                            step="0.01"
                            value={payoutPerCall} 
                            onChange={(e) => setPayoutPerCall(parseFloat(e.target.value))}
                            required
                            className="input-base font-mono text-center text-xl font-bold text-prime-primary"
                        />
                        <div className="mt-4 p-5 bg-gray-50 rounded-2xl border border-gray-100 text-center">
                            <p className="text-[11px] font-bold text-prime-muted uppercase tracking-wider mb-1">Calculation Example</p>
                            <p className="text-sm text-prime-text font-medium">100 retained calls × <span className="font-bold text-prime-primary">${payoutPerCall.toFixed(2)}</span> = <strong className="text-prime-text">${(100 * payoutPerCall).toFixed(2)}</strong> payout.</p>
                        </div>
                    </div>

                    <Button 
                        type="submit" 
                        disabled={isSubmitting}
                        variant="primary"
                        className="w-full py-3"
                    >
                        {isSubmitting ? 'Saving...' : 'Save Global Formula'}
                    </Button>
                </form>
            </div>
        </PageWrapper>
    );
};

export default CommissionFormulaBuilder;