import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { CheckCircleIcon, XCircleIcon, DocumentArrowDownIcon } from '@heroicons/react/24/outline';
import { supabaseApi } from '../../api/supabaseApi';
import { getPhotoUrls } from '../../lib/storage';
import type { WorkOrder, RV, Customer, DealershipSettings } from '../../types';

type ApprovalStatus = 'loading' | 'valid' | 'expired' | 'not_found' | 'already_processed';

interface ApprovalData {
  workOrder: WorkOrder;
  dealership: DealershipSettings;
  rv: RV;
  customer: Customer;
}

export const CustomerApprovalPage = () => {
  const { token } = useParams<{ token: string }>();
  const [status, setStatus] = useState<ApprovalStatus>('loading');
  const [data, setData] = useState<ApprovalData | null>(null);
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<'approved' | 'rejected' | null>(null);

  useEffect(() => {
    const loadWorkOrder = async () => {
      if (!token) {
        setStatus('not_found');
        return;
      }

      try {
        const result = await supabaseApi.getWorkOrderByApprovalToken(token);

        if (!result) {
          setStatus('not_found');
          return;
        }

        // Check if already processed
        if (result.workOrder.status === 'customer_approved' || result.workOrder.status === 'customer_rejected') {
          setStatus('already_processed');
          setData(result);
          return;
        }

        setData(result);
        setStatus('valid');

        // Load photo URLs
        if (result.workOrder.photos.length > 0) {
          const urls = await getPhotoUrls(result.workOrder.photos);
          setPhotoUrls(urls.filter((url): url is string => url !== null));
        }
      } catch {
        setStatus('not_found');
      }
    };

    loadWorkOrder();
  }, [token]);

  const handleApproval = async (action: 'approve' | 'reject') => {
    if (!token) return;

    setIsSubmitting(true);
    try {
      const response = await supabaseApi.processApproval(token, action, notes);

      if (response.success) {
        setResult(action === 'approve' ? 'approved' : 'rejected');
      } else {
        alert(response.error ?? 'An error occurred. Please try again.');
      }
    } catch {
      alert('An error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (amount: number) => {
    const symbol = data?.dealership.currencySymbol ?? '$';
    return `${symbol}${amount.toFixed(2)}`;
  };

  // Loading state
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  // Error states
  if (status === 'not_found') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full text-center">
          <XCircleIcon className="mx-auto h-16 w-16 text-red-500" />
          <h1 className="mt-4 text-2xl font-bold text-gray-900">Link Not Found</h1>
          <p className="mt-2 text-gray-600">
            This approval link is invalid or has expired. Please contact the service center for assistance.
          </p>
        </div>
      </div>
    );
  }

  if (status === 'expired') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full text-center">
          <XCircleIcon className="mx-auto h-16 w-16 text-yellow-500" />
          <h1 className="mt-4 text-2xl font-bold text-gray-900">Link Expired</h1>
          <p className="mt-2 text-gray-600">
            This approval link has expired. Please contact the service center for a new link.
          </p>
        </div>
      </div>
    );
  }

  if (status === 'already_processed') {
    const isApproved = data?.workOrder.status === 'customer_approved';
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full text-center">
          {isApproved ? (
            <CheckCircleIcon className="mx-auto h-16 w-16 text-green-500" />
          ) : (
            <XCircleIcon className="mx-auto h-16 w-16 text-red-500" />
          )}
          <h1 className="mt-4 text-2xl font-bold text-gray-900">
            Already {isApproved ? 'Approved' : 'Rejected'}
          </h1>
          <p className="mt-2 text-gray-600">
            This work order has already been {isApproved ? 'approved' : 'rejected'}.
          </p>
        </div>
      </div>
    );
  }

  // Success state after action
  if (result) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full text-center">
          {result === 'approved' ? (
            <CheckCircleIcon className="mx-auto h-16 w-16 text-green-500" />
          ) : (
            <XCircleIcon className="mx-auto h-16 w-16 text-red-500" />
          )}
          <h1 className="mt-4 text-2xl font-bold text-gray-900">
            {result === 'approved' ? 'Work Order Approved!' : 'Work Order Rejected'}
          </h1>
          <p className="mt-2 text-gray-600">
            {result === 'approved'
              ? 'Thank you! The service team will begin work on your RV shortly.'
              : 'The service team has been notified of your decision.'}
          </p>
          <p className="mt-4 text-sm text-gray-500">
            You can close this page now.
          </p>
        </div>
      </div>
    );
  }

  // Main approval view
  if (!data) return null;

  const { workOrder, dealership, rv, customer } = data;
  const partsTotal = workOrder.parts.reduce((sum, p) => sum + p.unitPrice * p.quantity, 0);
  const laborTotal = workOrder.laborHours * workOrder.laborRate;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">{dealership.dealershipName}</h1>
          <p className="text-gray-600">{dealership.phone}</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {/* Customer & RV Info */}
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Service Estimate</h2>
            <p className="text-sm text-gray-600 mt-1">
              For {customer.name} - {rv.year} {rv.make} {rv.model}
              {rv.nickname && ` (${rv.nickname})`}
            </p>
          </div>

          {/* Issue Description */}
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Issue Description</h3>
            <p className="mt-2 text-gray-900">{workOrder.issueDescription}</p>
          </div>

          {/* Photos */}
          {photoUrls.length > 0 && (
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">Photos</h3>
              <div className="grid grid-cols-3 gap-3">
                {photoUrls.map((url, idx) => (
                  <img
                    key={idx}
                    src={url}
                    alt={`Photo ${idx + 1}`}
                    className="w-full h-24 object-cover rounded-lg"
                  />
                ))}
              </div>
            </div>
          )}

          {/* Parts */}
          {workOrder.parts.length > 0 && (
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">Parts</h3>
              <div className="space-y-2">
                {workOrder.parts.map((part, idx) => (
                  <div key={idx} className="flex justify-between text-sm">
                    <span className="text-gray-900">
                      {part.name} x {part.quantity}
                    </span>
                    <span className="text-gray-700 font-medium">
                      {formatCurrency(part.unitPrice * part.quantity)}
                    </span>
                  </div>
                ))}
                <div className="flex justify-between text-sm font-medium pt-2 border-t border-gray-100">
                  <span>Parts Subtotal</span>
                  <span>{formatCurrency(partsTotal)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Labor */}
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">Labor</h3>
            <div className="flex justify-between text-sm">
              <span className="text-gray-900">
                {workOrder.laborHours} hours @ {formatCurrency(workOrder.laborRate)}/hr
              </span>
              <span className="text-gray-700 font-medium">
                {formatCurrency(laborTotal)}
              </span>
            </div>
          </div>

          {/* Total */}
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <div className="flex justify-between text-lg font-bold">
              <span>Total Estimate</span>
              <span className="text-blue-600">{formatCurrency(workOrder.totalEstimate)}</span>
            </div>
          </div>

          {/* Terms */}
          {dealership.defaultTerms && (
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">Terms</h3>
              <p className="text-sm text-gray-600">{dealership.defaultTerms}</p>
            </div>
          )}

          {/* Notes Input */}
          <div className="px-6 py-4 border-b border-gray-200">
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
              Notes (optional)
            </label>
            <textarea
              id="notes"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any comments or questions..."
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
            />
          </div>

          {/* Action Buttons */}
          <div className="px-6 py-4 flex gap-4">
            <button
              onClick={() => handleApproval('reject')}
              disabled={isSubmitting}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Reject
            </button>
            <button
              onClick={() => handleApproval('approve')}
              disabled={isSubmitting}
              className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Processing...' : 'Approve'}
            </button>
          </div>

          {/* PDF Download - if available */}
          {workOrder.photos.length > 0 && (
            <div className="px-6 py-4 bg-gray-50 text-center">
              <button className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700">
                <DocumentArrowDownIcon className="h-5 w-5" />
                Download PDF
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-xs text-gray-500">
          Questions? Contact us at {dealership.phone} or {dealership.email}
        </p>
      </div>
    </div>
  );
};
