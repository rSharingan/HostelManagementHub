// path: src/components/analytics/PieChart.jsx
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'

const COLORS = {
  primary: '#3b82f6',
  secondary: '#10b981',
  accent: '#f59e0b',
  danger: '#ef4444',
  warning: '#f97316',
  info: '#06b6d4',
  purple: '#8b5cf6',
  pink: '#ec4899',
  indigo: '#6366f1',
  teal: '#14b8a6',
  cyan: '#06b6d4',
  lime: '#84cc16',
  emerald: '#10b981',
  sky: '#0ea5e9',
  violet: '#8b5cf6',
  fuchsia: '#d946ef',
  rose: '#f43f5e',
  slate: '#64748b',
  gray: '#6b7280',
  zinc: '#71717a',
  neutral: '#737373',
  stone: '#78716c'
}

const CHART_COLORS = [
  COLORS.primary,
  COLORS.secondary,
  COLORS.accent,
  COLORS.danger,
  COLORS.warning,
  COLORS.info,
  COLORS.purple,
  COLORS.pink,
  COLORS.indigo,
  COLORS.teal,
  COLORS.cyan,
  COLORS.lime,
  COLORS.emerald,
  COLORS.sky,
  COLORS.violet,
  COLORS.fuchsia,
  COLORS.rose,
  COLORS.slate,
  COLORS.gray,
  COLORS.zinc
]

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const data = payload[0]
    return (
      <div className="bg-white dark:bg-dark-800 p-3 border border-gray-200 dark:border-dark-700 rounded-lg shadow-lg">
        <p className="text-sm font-medium text-gray-900 dark:text-dark-50">
          {data.name}
        </p>
        <p className="text-sm text-gray-600 dark:text-dark-300">
          Count: <span className="font-semibold">{data.value}</span>
        </p>
        {data.payload.percentage && (
          <p className="text-sm text-gray-600 dark:text-dark-300">
            Percentage: <span className="font-semibold">{data.payload.percentage}%</span>
          </p>
        )}
      </div>
    )
  }
  return null
}

export const AnalyticsPieChart = ({
  data,
  title,
  dataKey = 'count',
  nameKey = 'name',
  height = 300,
  showLegend = true,
  showTooltip = true
}) => {
  // Transform data to include colors
  const chartData = data?.map((item, index) => ({
    ...item,
    name: item[nameKey] || item.label || item.type || item.status || item.course || item.age_group || item.gender || item.nationality || item.yearOfStudy || item.issueType || item.department || item.priority || item.paymentMethod || item.method || item.registration_year,
    value: item[dataKey] || item.count || item.total_revenue || item.total_dues || item.total_cost,
    fill: CHART_COLORS[index % CHART_COLORS.length]
  })) || []

  return (
    <div className="w-full">
      {title && (
        <h3 className="text-lg font-semibold text-gray-900 dark:text-dark-50 mb-4 text-center">
          {title}
        </h3>
      )}
      <div style={{ width: '100%', height }}>
        <ResponsiveContainer>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percentage }) =>
                percentage > 5 ? `${name}: ${percentage}%` : ''
              }
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
              stroke="#fff"
              strokeWidth={2}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Pie>
            {showTooltip && <Tooltip content={<CustomTooltip />} />}
            {showLegend && (
              <Legend
                verticalAlign="bottom"
                height={36}
                formatter={(value, entry) => (
                  <span style={{ color: entry.color }}>
                    {value} ({entry.payload.percentage || entry.payload.count}%)
                  </span>
                )}
              />
            )}
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

export default AnalyticsPieChart