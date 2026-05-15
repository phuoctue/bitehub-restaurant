import dishApiRequest from "@/apiRequest/dish";
import { EntityError, HttpError } from "@/lib/http";
import {
  getAlternateOgLocales,
  getDefaultOgImage,
  htmlToPlainText,
  toAbsoluteUrl,
  toOgLocale,
} from "@/lib/seo";
import { wrapServerApi } from "@/lib/utils";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import { headers } from "next/headers";
import DishDetail from "./dish-detail";

const getDishById = cache(async (dishId: number) => {
  const data = await wrapServerApi(() => dishApiRequest.getDish(dishId));
  return data?.payload?.data;
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const dishId = Number(id);

  if (!Number.isFinite(dishId) || dishId <= 0) {
    return {};
  }

  try {
    const dish = await getDishById(dishId);
    if (!dish) return {};
    const requestHeaders = await headers();
    const locale = requestHeaders.get("x-locale") ?? "vi";
    const description = htmlToPlainText(dish.description);
    const imageUrl = toAbsoluteUrl(dish.image || getDefaultOgImage());
    const localizedPath = `/${locale}/dishes/${dish.id}`;

    return {
      title: dish.name,
      description,
      alternates: {
        canonical: localizedPath,
      },
      openGraph: {
        type: "article",
        url: localizedPath,
        locale: toOgLocale(locale),
        alternateLocale: getAlternateOgLocales(locale),
        title: dish.name,
        description,
        images: [
          {
            url: imageUrl,
            alt: dish.name,
          },
        ],
      },
      twitter: {
        card: "summary_large_image",
        title: dish.name,
        description,
        images: [imageUrl],
      },
    };
  } catch {
    return {};
  }
}

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
    const dish = await getDishById(dishId);
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
