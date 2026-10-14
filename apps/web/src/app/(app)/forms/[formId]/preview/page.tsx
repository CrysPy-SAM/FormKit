import { FormPreview } from "~/components/forms/form-preview";

export default async function FormPreviewPage({
  params,
}: {
  params: Promise<{ formId: string }>;
}) {
  const { formId } = await params;
  return <FormPreview formId={formId} />;
}
