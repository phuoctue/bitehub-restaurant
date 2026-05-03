import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { DishStatus } from "@/constants/type";
import { EntityError, HttpError } from "@/lib/http";
import { formatCurrency, getVietnameseDishStatus } from "@/lib/utils";
import { DishResType } from "@/schemaValidations/dish.schema";
import Image from "next/image";
import { notFound } from "next/navigation";

export default async function DishDetail({
  dish,
  isModal = false,
}: {
  dish: DishResType["data"] | undefined;
  isModal?: boolean;
}) {
  try {
    if (!dish) notFound();

    const statusVariant =
      dish.status === DishStatus.Available ? "default" : "secondary";

    return (
      <section className={isModal ? "px-4 py-6 md:px-6 md:py-7" : "container mx-auto px-4 py-8 md:py-12"}>
        <div className={isModal ? "mx-auto max-w-3xl" : "mx-auto max-w-5xl"}>
          <div
            className={
              isModal
                ? "grid gap-5"
                : "grid gap-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(320px,0.95fr)] lg:items-start"
            }
          >
            <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
              <div
                className={
                  isModal
                    ? "relative mx-auto aspect-[4/3] w-full max-w-2xl overflow-hidden"
                    : "relative aspect-[4/3] w-full overflow-hidden"
                }
              >
                <Image
                  src={dish.image}
                  fill
                  quality={75}
                  alt={dish.name}
                  className="object-cover"
                  sizes={
                    isModal
                      ? "(min-width: 1024px) 42rem, (min-width: 768px) 70vw, 92vw"
                      : "(min-width: 1024px) 55vw, 100vw"
                  }
                />
              </div>
            </div>

            <Card className="border shadow-sm">
              <CardContent className="p-6 md:p-7">
                <div className="flex items-center gap-3">
                  <Badge
                    variant={statusVariant}
                    className="rounded-full px-3 py-1 text-sm"
                  >
                    {getVietnameseDishStatus(dish.status)}
                  </Badge>
                </div>

                <div className="mt-4 space-y-3">
                  <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
                    {dish.name}
                  </h1>
                  <p className="text-2xl font-semibold text-primary md:text-3xl">
                    {formatCurrency(dish.price)}
                  </p>
                  <p className="text-sm leading-7 text-muted-foreground md:text-base">
                    {dish.description}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
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
