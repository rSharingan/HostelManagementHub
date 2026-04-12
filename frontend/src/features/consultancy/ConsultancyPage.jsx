// path: src/features/consultancy/ConsultancyPage.jsx
import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card'
import { PremiumUpgrade } from '../../components/common/PremiumUpgrade'
import { Button } from '../../components/ui/Button'
import axios from '../../lib/api/axios'
import { API_ENDPOINTS } from '../../lib/api/endpoints'
import { usePremiumStatus } from '../auth/hooks'
import { ExternalLink, Plus } from 'lucide-react'

export const ConsultancyPage = () => {
  const [agencies, setAgencies] = useState([])
  const [loading, setLoading] = useState(true)
  const { data: premiumData, isLoading: premiumLoading } = usePremiumStatus()

  useEffect(() => {
    if (premiumData?.isPremium) {
      fetchAgencies()
    } else {
      setLoading(false)
    }
  }, [premiumData])

  const fetchAgencies = async () => {
    try {
      const response = await axios.get(API_ENDPOINTS.CONSULTANCY.LIST)
      setAgencies(response.data)
    } catch (error) {
      console.error('Error fetching agencies:', error)
    } finally {
      setLoading(false)
    }
  }

  if (premiumLoading || loading) {
    return <div>Loading...</div>
  }

  if (!premiumData?.isPremium) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <PremiumUpgrade
          type="consultancy"
          amount={19.99}
          title="Visa Consultancy Services"
          description="Access professional visa consultancy agencies"
          features={[
            "List of verified agencies",
            "Direct contact links",
            "Expert guidance",
            "Application support",
            "Success rate information",
          ]}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Visa Consultancy Agencies</h1>
        {/* Admin can add agencies, but for now, just display */}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {agencies.map((agency) => (
          <Card key={agency.id}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                {agency.name}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(agency.link, '_blank')}
                >
                  <ExternalLink className="w-4 h-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-dark-300">{agency.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {agencies.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No consultancy agencies available yet.</p>
        </div>
      )}
    </div>
  )
}