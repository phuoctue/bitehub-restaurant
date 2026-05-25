import dishApiRequest from "@/apiRequest/dish";
import { UpdateDishBodyType } from "@/schemaValidations/dish.schema";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocale } from "next-intl";

export const useGetDishListQuery = () => {
  const locale = useLocale();
  return useQuery({
    queryKey: ["dishes", locale],
    queryFn: dishApiRequest.list,
  });
};

export const useGetDishQuery = (id: number) => {
  const locale = useLocale();
  return useQuery({
    queryKey: ["dishes", locale, id],
    queryFn: () => dishApiRequest.getDish(id),
    enabled: !!id,
  });
};

export const useAddDishMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: dishApiRequest.add,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["dishes"],
      });
    },
  });
};

export const useImportDishMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: dishApiRequest.importExcel,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["dishes"],
      });
    },
  });
};

export const useUpdateDishMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: UpdateDishBodyType }) =>
      dishApiRequest.updateDish(id, body),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["dishes"] });
      queryClient.invalidateQueries({ queryKey: ["dishes", variables.id] });
    },
  });
};

export const useDeleteDishMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: dishApiRequest.deleteDish,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dishes"] });
    },
  });
};
