import { FormBuilder } from "~/components/forms/form-builder";

export default async function FormBuilderPage({
  params,
}: {
  params: Promise<{ formId: string }>;
}) {
  const { formId } = await params;
  return <FormBuilder key={formId} formId={formId} />;
}
