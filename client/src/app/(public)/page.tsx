import dishApiRequest from "@/apiRequest/dish";
import { formatCurrency } from "@/lib/utils";
import { DishListResType } from "@/schemaValidations/dish.schema";
import { getTranslations } from "next-intl/server";
import Image from "next/image";
import Link from "next/link";

export const revalidate = 60;

export default async function Home() {
  const t = await getTranslations("PublicHome");

  let dishList: DishListResType["data"] = [];
  try {
    const result = await dishApiRequest.list();
    const {
      payload: { data }
    } = result;
    dishList = data;
  } catch {
    return <div>{t("loadingError")}</div>;
  }

  return (
    <div className="w-full">
      <section className="relative z-10">
        <span className="absolute top-0 left-0 z-10 h-full w-full bg-black opacity-50"></span>
        <Image
          src="/banner.png"
          width={400}
          height={200}
          quality={75}
          alt="Banner"
          className="absolute top-0 left-0 h-full w-full object-cover"
        />
        <div className="relative z-20 px-4 py-10 sm:px-10 md:px-20 md:py-20">
          <h1 className="text-center text-xl font-bold text-white sm:text-2xl md:text-4xl lg:text-5xl">
            {t("heroTitle")}
          </h1>
          <p className="mt-4 text-center text-sm text-white sm:text-base">
            {t("heroSubtitle")}
          </p>
        </div>
      </section>
      <section className="container mx-auto px-4 py-16">
        <h2 className="mb-10 text-center text-2xl font-bold">{t("sectionTitle")}</h2>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {dishList.map((dish) => (
            <Link
              href={`/dishes/${dish.id}`}
              className="flex gap-4 rounded-lg border bg-card p-4 shadow-sm transition-shadow hover:shadow-md"
              key={dish.id}
            >
              <div className="flex-shrink-0">
                <Image
                  src={dish.image}
                  width={150}
                  height={150}
                  quality={75}
                  alt={dish.name}
                  className="h-[120px] w-[120px] rounded-md object-cover"
                />
              </div>
              <div className="flex-1 space-y-1">
                <h3 className="line-clamp-1 text-lg font-semibold">{dish.name}</h3>
                <p className="line-clamp-2 text-sm text-muted-foreground">{dish.description}</p>
                <p className="mt-2 font-bold text-primary">{formatCurrency(dish.price)}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
