import { notFound } from "next/navigation";
import { ClarityForm } from "@/app/components/ClarityForm";
import { updateClarityAction } from "@/app/actions";
import { getClarity } from "@/app/lib/clarities";
import { listAttachments } from "@/app/lib/attachments";

type Params = Promise<{ id: string }>;

export default async function EditClarityPage({
  params,
}: {
  params: Params;
}) {
  const { id } = await params;
  const clarity = await getClarity(id);
  if (!clarity) notFound();

  const attachments = await listAttachments(clarity.id);

  return (
    <div className="flex flex-col gap-4 max-w-2xl">
      <h1 className="text-2xl font-bold">Edit clarity</h1>
      <ClarityForm
        action={updateClarityAction}
        initial={clarity}
        submitLabel="Save"
        existingAttachments={attachments}
      />
    </div>
  );
}
