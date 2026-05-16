import http from '@/lib/http'
import { CreateTableBodyType, ImportTableResType, TableListResType, TableResType, UpdateTableBodyType } from '@/schemaValidations/table.schema'

const tableApiRequest = {
    list: () => http.get<TableListResType>('tables'),
    add: (body: CreateTableBodyType) => http.post<TableResType>('tables', body),
    importExcel: (formData: FormData) => http.post<ImportTableResType>('tables/import', formData),
    getTable : (id: number) => http.get<TableResType>(`tables/${id}`),
    updateTable: (id: number, body: UpdateTableBodyType) => http.put<TableResType>(`tables/${id}`, body),
    deleteTable: (id: number) => http.delete<TableResType>(`tables/${id}`)
}

export default tableApiRequest