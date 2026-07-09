import CheckoutPageClient from "./CheckoutPageClient";

interface PageProps {
  params: Promise<{
    courseId: string;
  }>;
}

export function generateStaticParams() {
  const { COURSES } = require("@/lib/coursesData");
  const paths = COURSES.map((c: any) => ({ courseId: c.id }));
  // Add 'cart' to support bundle checkout path
  paths.push({ courseId: "cart" });
  return paths;
}

export default async function CheckoutPage({ params }: PageProps) {
  return <CheckoutPageClient params={params} />;
}
