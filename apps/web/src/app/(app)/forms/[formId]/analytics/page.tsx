import { FormAnalytics } from "~/components/forms/form-analytics";

export default async function FormAnalyticsPage({
  params,
}: {
  params: Promise<{ formId: string }>;
}) {
  const { formId } = await params;
  return <FormAnalytics formId={formId} />;
}
