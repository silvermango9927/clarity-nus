import { ClarityForm } from "@/app/components/ClarityForm";
import { createClarityAction } from "@/app/actions";

export default function NewClarityPage() {
  return (
    <div className="flex flex-col gap-4 max-w-2xl">
      <h1 className="text-2xl font-bold">New clarity</h1>
      <ClarityForm action={createClarityAction} submitLabel="Create" />
    </div>
  );
}
