// path: src/components/common/PremiumUpgrade.jsx
import { useState } from 'react'
import { Button } from '../ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card'
import { Crown, Check } from 'lucide-react'
import axios from '../../lib/api/axios'
import { API_ENDPOINTS } from '../../lib/api/endpoints'

export const PremiumUpgrade = ({ type = 'premium', amount = 9.99, title, description, features }) => {
  const [loading, setLoading] = useState(false)

  const handleUpgrade = async () => {
    setLoading(true)
    try {
      const response = await axios.post(API_ENDPOINTS.STRIPE.CHECKOUT, {
        type,
        amount,
      })
      // Redirect to Stripe Checkout
      window.location.href = response.data.url
    } catch (error) {
      console.error('Error creating checkout session:', error)
      alert('Failed to initiate payment. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          <Crown className="w-12 h-12 text-yellow-500" />
        </div>
        <CardTitle className="text-2xl">{title}</CardTitle>
        <p className="text-gray-600 dark:text-dark-300">{description}</p>
        <div className="text-3xl font-bold text-primary-600 mt-4">
          ${amount}
        </div>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2 mb-6">
          {features.map((feature, index) => (
            <li key={index} className="flex items-center space-x-2">
              <Check className="w-5 h-5 text-green-500" />
              <span className="text-sm">{feature}</span>
            </li>
          ))}
        </ul>
        <Button
          onClick={handleUpgrade}
          disabled={loading}
          className="w-full"
        >
          {loading ? 'Processing...' : `Upgrade to Premium - $${amount}`}
        </Button>
      </CardContent>
    </Card>
  )
}