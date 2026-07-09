import QuizPlayerClient from "./QuizPlayerClient";

interface PageProps {
  params: Promise<{
    slug: string;
    quizId: string;
  }>;
}

export function generateStaticParams() {
  const { COURSES } = require("@/lib/coursesData");
  const paths = [];
  for (const c of COURSES) {
    paths.push({
      slug: c.slug,
      quizId: `q-${c.slug}`
    });
  }
  return paths;
}

export default async function QuizPlayerPage({ params }: PageProps) {
  return <QuizPlayerClient params={params} />;
}
