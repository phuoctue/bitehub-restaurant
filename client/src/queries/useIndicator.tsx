import indicatorApiRequest from '@/apiRequest/indicator'
import { DashboardIndicatorQueryParamsType } from '@/schemaValidations/indicator.schema'
import { useQuery } from '@tanstack/react-query'

export const useDashboardIndicator = (
  queryParams: DashboardIndicatorQueryParamsType
) => {
  return useQuery({
    queryFn: () => indicatorApiRequest.getDashboardIndicators(queryParams),
    queryKey: ['dashboardIndicators', queryParams]
  })
}