// path: src/features/student-portal/StudentFeesPage.jsx
import { useState } from 'react'
import { CreditCard, DollarSign, Calendar, AlertCircle } from 'lucide-react'
import { useStudentFees } from './hooks'
import { makePaymentAPI } from './api'
import { PageHeader } from '../../components/common/PageHeader'
import { formatCurrency } from '../../lib/utils'
import { toast } from 'sonner'

export const StudentFeesPage = () => {
  const { data: fees, isLoading, refetch } = useStudentFees()
  const [selectedInvoice, setSelectedInvoice] = useState(null)
  const [paymentMethod, setPaymentMethod] = useState('ONLINE')
  const [reference, setReference] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)

  const pendingInvoices = fees?.filter(invoice => invoice.status === 'PENDING') || []
  const paidInvoices = fees?.filter(invoice => invoice.status === 'PAID') || []

  const handlePayment = async () => {
    if (!selectedInvoice) {
      toast.error('Please select an invoice to pay')
      return
    }

    setIsProcessing(true)
    try {
      await makePaymentAPI({
        invoiceId: selectedInvoice.id,
        amount: selectedInvoice.amount,
        method: paymentMethod,
        reference: reference || `Payment for ${selectedInvoice.month}/${selectedInvoice.year}`,
      })

      toast.success('Payment processed successfully!')
      setSelectedInvoice(null)
      setReference('')
      refetch()
    } catch (error) {
      toast.error('Payment failed. Please try again.')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div>
      <PageHeader
        title="My Fees"
        description="View your invoices and make payments."
        breadcrumbs={[{ label: 'Student Portal' }, { label: 'Fees' }]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Payments */}
        <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <AlertCircle className="text-orange-500" size={20} />
            Pending Payments
          </h3>

          <div className="space-y-3">
            {pendingInvoices.length > 0 ? (
              pendingInvoices.map((invoice) => (
                <div
                  key={invoice.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-all ${
                    selectedInvoice?.id === invoice.id
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                  }`}
                  onClick={() => setSelectedInvoice(invoice)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">
                        {invoice.month} {invoice.year}
                      </p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        Due: {new Date(invoice.dueDate).toLocaleDateString()}
                      </p>
                    </div>
                    <span className="font-semibold text-lg">
                      {formatCurrency(invoice.amount)}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-slate-500 dark:text-slate-400 text-center py-4">
                No pending payments
              </p>
            )}
          </div>
        </div>

        {/* Payment Form */}
        <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <CreditCard className="text-green-500" size={20} />
            Make Payment
          </h3>

          {selectedInvoice ? (
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <h4 className="font-medium mb-2">Payment Details</h4>
                <p>Amount: <span className="font-semibold">{formatCurrency(selectedInvoice.amount)}</span></p>
                <p>Period: <span className="font-semibold">{selectedInvoice.month} {selectedInvoice.year}</span></p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800"
                >
                  <option value="ONLINE">Online Payment</option>
                  <option value="CASH">Cash</option>
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Reference (Optional)</label>
                <input
                  type="text"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  placeholder="Payment reference or notes"
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800"
                />
              </div>

              <button
                onClick={handlePayment}
                disabled={isProcessing}
                className="w-full bg-green-500 text-white py-2 px-4 rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <CreditCard size={16} />
                    Pay {formatCurrency(selectedInvoice.amount)}
                  </>
                )}
              </button>
            </div>
          ) : (
            <p className="text-slate-500 dark:text-slate-400 text-center py-8">
              Select an invoice to make payment
            </p>
          )}
        </div>
      </div>

      {/* Payment History */}
      <div className="mt-8 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <DollarSign className="text-blue-500" size={20} />
          Payment History
        </h3>

        <div className="space-y-3">
          {paidInvoices.length > 0 ? (
            paidInvoices.map((invoice) => (
              <div key={invoice.id} className="flex items-center justify-between py-3 border-b border-slate-100 dark:border-slate-800 last:border-b-0">
                <div>
                  <p className="font-medium">{invoice.month} {invoice.year}</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Paid on: {invoice.payments?.[0] ? new Date(invoice.payments[0].paymentDate).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
                <div className="text-right">
                  <span className="font-semibold text-green-600">
                    {formatCurrency(invoice.amount)}
                  </span>
                  <p className="text-xs text-slate-500">
                    {invoice.payments?.[0]?.method || 'N/A'}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-slate-500 dark:text-slate-400 text-center py-4">
              No payment history
            </p>
          )}
        </div>
      </div>
    </div>
  )
}