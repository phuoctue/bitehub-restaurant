import dishApiRequest from "@/apiRequest/dish";
import { EntityError, HttpError } from "@/lib/http";
import { formatCurrency, wrapServerApi } from "@/lib/utils";
import Image from "next/image";
import { notFound } from "next/navigation";
import DishDetail from "./dish-detail";

export default async function DishPage({
  params,
}: {
  params: Promise<{
    id: string;
  }>;
}) {
  const { id } = await params;
  const dishId = Number(id);

  if (!Number.isFinite(dishId) || dishId <= 0) {
    notFound();
  }

  try {
    const data = await wrapServerApi(() => dishApiRequest.getDish(dishId));
    const dish = data?.payload?.data;
    return <DishDetail dish={dish} />;
  } catch (error) {
    if (
      error instanceof EntityError ||
      (error instanceof HttpError && error.status === 404)
    ) {
      notFound();
    }

    throw error;
  }
}
