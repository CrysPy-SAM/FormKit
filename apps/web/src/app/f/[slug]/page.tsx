import { PublicForm } from "~/components/public/public-form";

export default async function PublicFormPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <PublicForm slug={slug} />;
}
