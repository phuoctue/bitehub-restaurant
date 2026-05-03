import dishApiRequest from "@/apiRequest/dish";
import { EntityError, HttpError } from "@/lib/http";
import { wrapServerApi } from "@/lib/utils";
import { notFound } from "next/navigation";
import Modal from "./modal";
import DishDetail from "../../../dishes/[id]/dish-detail";

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
    return (
      <Modal>
        <DishDetail dish={dish} isModal />
      </Modal>
    );
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
