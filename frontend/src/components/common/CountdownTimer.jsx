// path: src/components/common/CountdownTimer.jsx
import { useState, useEffect } from 'react'
import { AlertCircle } from 'lucide-react'

export const CountdownTimer = ({ daysUntil = 0 }) => {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  })

  const isUrgent = daysUntil <= 3

  useEffect(() => {
    const calculateTimeLeft = () => {
      // Total seconds from days until
      let totalSeconds = Math.max(0, daysUntil * 24 * 60 * 60)

      if (totalSeconds === 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 })
        return
      }

      const days = Math.floor(totalSeconds / (24 * 60 * 60))
      const hours = Math.floor((totalSeconds % (24 * 60 * 60)) / (60 * 60))
      const minutes = Math.floor((totalSeconds % (60 * 60)) / 60)
      const seconds = totalSeconds % 60

      setTimeLeft({ days, hours, minutes, seconds })
    }

    calculateTimeLeft()
    const timer = setInterval(calculateTimeLeft, 1000)
    return () => clearInterval(timer)
  }, [daysUntil])

  return (
    <div className="space-y-3">
      {isUrgent && (
        <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm font-semibold text-red-600 dark:text-red-400">
            ⚠️ You have to pay the rent
          </p>
        </div>
      )}

      <div className={`p-4 rounded-lg border-2 ${
        isUrgent
          ? 'bg-red-50 dark:bg-red-900/10 border-red-400 dark:border-red-700'
          : 'bg-blue-50 dark:bg-blue-900/10 border-blue-400 dark:border-blue-700'
      }`}>
        <p className={`text-xs font-medium mb-2 ${
          isUrgent
            ? 'text-red-700 dark:text-red-300'
            : 'text-blue-700 dark:text-blue-300'
        }`}>
          Time until next payment window opens:
        </p>
        <div className="grid grid-cols-4 gap-2">
          <div className="text-center">
            <div className={`text-2xl font-bold ${
              isUrgent
                ? 'text-red-600 dark:text-red-400'
                : 'text-blue-600 dark:text-blue-400'
            }`}>
              {timeLeft.days}
            </div>
            <p className={`text-xs mt-1 ${
              isUrgent
                ? 'text-red-600 dark:text-red-400'
                : 'text-blue-600 dark:text-blue-400'
            }`}>
              Days
            </p>
          </div>
          <div className="text-center">
            <div className={`text-2xl font-bold ${
              isUrgent
                ? 'text-red-600 dark:text-red-400'
                : 'text-blue-600 dark:text-blue-400'
            }`}>
              {timeLeft.hours}
            </div>
            <p className={`text-xs mt-1 ${
              isUrgent
                ? 'text-red-600 dark:text-red-400'
                : 'text-blue-600 dark:text-blue-400'
            }`}>
              Hours
            </p>
          </div>
          <div className="text-center">
            <div className={`text-2xl font-bold ${
              isUrgent
                ? 'text-red-600 dark:text-red-400'
                : 'text-blue-600 dark:text-blue-400'
            }`}>
              {timeLeft.minutes}
            </div>
            <p className={`text-xs mt-1 ${
              isUrgent
                ? 'text-red-600 dark:text-red-400'
                : 'text-blue-600 dark:text-blue-400'
            }`}>
              Minutes
            </p>
          </div>
          <div className="text-center">
            <div className={`text-2xl font-bold ${
              isUrgent
                ? 'text-red-600 dark:text-red-400'
                : 'text-blue-600 dark:text-blue-400'
            }`}>
              {timeLeft.seconds}
            </div>
            <p className={`text-xs mt-1 ${
              isUrgent
                ? 'text-red-600 dark:text-red-400'
                : 'text-blue-600 dark:text-blue-400'
            }`}>
              Seconds
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
