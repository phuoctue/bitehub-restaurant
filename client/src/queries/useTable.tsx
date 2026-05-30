import tableApiRequest from "@/apiRequest/table"; 
import { UpdateTableBodyType } from "@/schemaValidations/table.schema";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

// 1. Lấy danh sách bàn
export const usegetTableListQuery = () => {
  return useQuery({
    queryKey: ["tables"], // Key là "tables"
    queryFn: tableApiRequest.list,
  });
};

// 2. Lấy chi tiết 1 bàn
export const usegetTableQuery = (id: number) => {
  return useQuery({
    queryKey: ["tables", id], // Nên dùng chung prefix "tables" để quản lý dễ hơn
    queryFn: () => tableApiRequest.getTable(id),
    enabled: !!id,
  });
};

// 3. Thêm bàn mới
export const useAddTableMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: tableApiRequest.add,
    onSuccess: () => {
      // Làm mới danh sách bàn để bàn mới xuất hiện ngay
      queryClient.invalidateQueries({
        queryKey: ["tables"],
      });
    },
  });
};

export const useImportTableMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: tableApiRequest.importExcel,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["tables"],
      });
    },
  });
};

// 4. Cập nhật bàn
export const useUpdateTableMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: UpdateTableBodyType }) =>
      tableApiRequest.updateTable(id, body),
    onSuccess: (_, variables) => {
      // FIX: Invalidate đúng key "tables" để danh sách ở trang quản lý cập nhật lại
      queryClient.invalidateQueries({ queryKey: ["tables"] });
      // Cập nhật lại thông tin chi tiết của chính cái bàn vừa sửa
      queryClient.invalidateQueries({ queryKey: ["tables", variables.id] });
    },
  });
};

// 5. Xóa bàn
export const useDeleteTableMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: tableApiRequest.deleteTable,
    onSuccess: () => {
      // FIX: Invalidate đúng key "tables"
      queryClient.invalidateQueries({ queryKey: ["tables"] });
    },
  });
};