// path: src/components/common/Skeletons.jsx
import { Skeleton, SkeletonText } from '../ui/Skeleton'
import { Card, CardContent } from '../ui/Card'

export const TableSkeletons = ({ rows = 5 }) => {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <Card key={i}>
          <CardContent className="p-4">
            <SkeletonText lines={1} />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export const DetailPageSkeleton = () => {
  return (
    <div className="space-y-6">
      <Skeleton className="h-10 w-48" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <SkeletonText lines={3} />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

export const FormSkeleton = () => {
  return (
    <div className="space-y-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i}>
          <Skeleton className="h-4 w-24 mb-2" />
          <Skeleton className="h-10 w-full" />
        </div>
      ))}
    </div>
  )
}
