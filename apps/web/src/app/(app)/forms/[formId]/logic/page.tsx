import { FormLogicMap } from "~/components/forms/form-logic-map";

export default async function FormLogicPage({
  params,
}: {
  params: Promise<{ formId: string }>;
}) {
  const { formId } = await params;
  return <FormLogicMap formId={formId} />;
}
