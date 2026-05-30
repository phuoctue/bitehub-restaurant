import http from '@/lib/http'
import { DashboardIndicatorQueryParamsType, DashboardIndicatorResType } from '@/schemaValidations/indicator.schema'
import queryString from 'query-string'
import { format } from 'date-fns'

const indicatorApiRequest = {
  getDashboardIndicators: (queryParams: DashboardIndicatorQueryParamsType) =>
    http.get<DashboardIndicatorResType>(
      '/indicators/dashboard?' +
      queryString.stringify({
        fromDate: queryParams.fromDate ? format(queryParams.fromDate, 'yyyy-MM-dd') : undefined,
        toDate: queryParams.toDate ? format(queryParams.toDate, 'yyyy-MM-dd') : undefined
      })
    )
}

export default indicatorApiRequest