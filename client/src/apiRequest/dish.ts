import http from "@/lib/http";
import {
  CreateDishBodyType,
  DishListResType,
  ImportDishResType,
  DishResType,
  UpdateDishBodyType,
} from "@/schemaValidations/dish.schema";

type DishRequestOptions = Omit<RequestInit, "method" | "body"> & {
  baseUrl?: string | undefined;
};

const dishApiRequest = {
  list: (options?: DishRequestOptions) => http.get<DishListResType>("/dishes", options),

  add: (body: CreateDishBodyType) => 
    http.post<DishResType>("/dishes", body),

  importExcel: (formData: FormData) =>
    http.post<ImportDishResType>("/dishes/import", formData),

  getDish: (id: number, options?: DishRequestOptions) => http.get<DishResType>(`/dishes/${id}`, options),

  updateDish: (id: number, body: UpdateDishBodyType) =>
    http.put<DishResType>(`/dishes/${id}`, body),

  deleteDish: (id: number) => 
    http.delete<DishResType>(`/dishes/${id}`),
};

export default dishApiRequest;
