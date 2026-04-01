import dishApiRequest from "@/apiRequest/dish";
import { formatCurrency } from "@/lib/utils";
import { DishListResType } from "@/schemaValidations/dish.schema";
import Image from "next/image";

export const revalidate = 60;

export default async function Home() {
  let dishList: DishListResType["data"] = [];
  try {
    const result = await dishApiRequest.list();
    const {
      payload: { data },
    } = result;
    dishList = data;
  } catch (error) {
    return <div>Error loading dishes</div>;
  }

  return (
    <div className="w-full">
      <section className="relative z-10">
        <span className="absolute top-0 left-0 w-full h-full bg-black opacity-50 z-10"></span>
        <Image
          src="/banner.png"
          width={400}
          height={200}
          quality={75}
          alt="Banner"
          className="absolute top-0 left-0 w-full h-full object-cover"
        />
        <div className="z-20 relative py-10 md:py-20 px-4 sm:px-10 md:px-20">
          <h1 className="text-center text-xl sm:text-2xl md:text-4xl lg:text-5xl font-bold text-white">
            Nhà hàng BiteHub
          </h1>
          <p className="text-center text-sm sm:text-base mt-4 text-white">
            Vị ngon, trọn khoảnh khắc
          </p>
        </div>
      </section>
      <section className="py-16 container mx-auto px-4">
        <h2 className="text-center text-2xl font-bold mb-10">
          Đa dạng các món ăn
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {dishList.map((dish) => (
            <div
              className="flex gap-4 bg-card p-4 rounded-lg border shadow-sm hover:shadow-md transition-shadow"
              key={dish.id}
            >
              <div className="flex-shrink-0">
                <Image
                  src={dish.image}
                  width={150}
                  height={150}
                  quality={75}
                  alt={dish.name}
                  className="object-cover w-[120px] h-[120px] rounded-md"
                />
              </div>
              <div className="space-y-1 flex-1">
                <h3 className="text-lg font-semibold line-clamp-1">
                  {dish.name}
                </h3>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {dish.description}
                </p>
                <p className="font-bold text-primary mt-2">
                  {formatCurrency(dish.price)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
