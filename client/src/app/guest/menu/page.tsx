import MenuOrder from "./menu-order";

export default async function MenuPage() {
  return (
    <div className="max-w-[400px] mx-auto px-4 pb-20 space-y-6">
      <h1 className="text-center text-2xl font-bold pt-6">🍕 Menu quán</h1>
      <MenuOrder />
    </div>
  );
}
