// path: src/features/fees/PaymentProcessPage.jsx
import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import { Badge } from '../../components/ui/Badge'
import { formatCurrency } from '../../lib/utils'
import { toast } from 'sonner'
import axios from '../../lib/api/axios'

export const PaymentProcessPage = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [paymentData, setPaymentData] = useState(null)

  const transactionId = searchParams.get('transaction_id')
  const paymentType = (searchParams.get('paymentType') || 'STUDENT').toUpperCase()
  const method = searchParams.get('method') || 'BKASH'

  useEffect(() => {
    if (!transactionId) {
      toast.error('Invalid payment session')
      navigate('/fees/invoices')
      return
    }

    const fetchPayment = async () => {
      try {
        const endpoint = paymentType === 'STAFF'
          ? `/staff-payments/status/${transactionId}`
          : `/payments/status/${transactionId}`
        const { data } = await axios.get(endpoint)
        setPaymentData({
          transactionId,
          method: data?.method || method,
          amount: Number(data?.amount || 0),
        })
      } catch {
        setPaymentData({
          transactionId,
          method,
          amount: 0,
        })
      }
    }

    fetchPayment()
  }, [transactionId, method, navigate, paymentType])

  const handlePaymentSuccess = async () => {
    setLoading(true)
    try {
      console.log('🔵 Processing payment success callback for transaction:', transactionId)
      
      const successPayload = {
        transaction_id: transactionId,
        reference: `REF_${Date.now()}`,
        status: 'SUCCESS'
      }
      
      console.log('📤 Sending success callback with:', successPayload)
      
      const successEndpoint = paymentType === 'STAFF'
        ? '/staff-payments/callback/success'
        : '/payments/callback/success'

      const response = await axios.post(successEndpoint, successPayload)
      
      console.log('✅ Payment success callback processed:', response.data)
      toast.success('Payment successful!')
      
      setTimeout(() => {
        navigate('/fees/payments')
      }, 1500)
    } catch (error) {
      console.error('❌ Payment success callback error:', error)
      console.error('Error response:', error?.response?.data)
      toast.error(error?.response?.data?.message || 'Payment processing failed')
    } finally {
      setLoading(false)
    }
  }

  const handlePaymentFailure = async () => {
    setLoading(true)
    try {
      console.log('🔵 Processing payment failure callback for transaction:', transactionId)
      
      const failurePayload = {
        transaction_id: transactionId,
        reason: 'User cancelled'
      }
      
      console.log('📤 Sending failure callback with:', failurePayload)
      
      const failureEndpoint = paymentType === 'STAFF'
        ? '/staff-payments/callback/failure'
        : '/payments/callback/failure'

      const response = await axios.post(failureEndpoint, failurePayload)
      
      console.log('✅ Payment failure callback processed:', response.data)
      toast.error('Payment cancelled')
      
      setTimeout(() => {
        navigate('/fees/payments')
      }, 1000)
    } catch (error) {
      console.error('❌ Payment failure callback error:', error)
      console.error('Error response:', error?.response?.data)
      toast.error(error?.response?.data?.message || 'Failed to cancel payment')
    } finally {
      setLoading(false)
    }
  }

  if (!paymentData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading payment details...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">
            {method === 'BKASH' ? 'bKash' : method === 'NAGAD' ? 'Nagad' : 'Payment'} {paymentType === 'STAFF' ? 'Staff Salary' : 'Payment'}
          </CardTitle>
          <p className="text-gray-600 dark:text-gray-400">
            Complete your {paymentType === 'STAFF' ? 'salary disbursement' : 'payment'} securely
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">Transaction ID</span>
              <Badge variant="secondary">{transactionId}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Amount</span>
              <span className="text-lg font-bold text-blue-600">
                {formatCurrency(paymentData.amount)}
              </span>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                {method} Mobile Number
              </label>
              <Input
                type="tel"
                placeholder={`Enter your ${method} number`}
                defaultValue="01712345678"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                PIN
              </label>
              <Input
                type="password"
                placeholder="Enter PIN"
                defaultValue="1234"
              />
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={handlePaymentFailure}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              className="flex-1"
              onClick={handlePaymentSuccess}
              disabled={loading}
            >
              {loading ? 'Processing...' : 'Pay Now'}
            </Button>
          </div>

          <div className="text-center text-xs text-gray-500 dark:text-gray-400">
            <p>This is a demo payment page.</p>
            <p>In production, you would be redirected to the actual {method} gateway.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}