"use client";

type EntryTemplate = {
  conditionSummary: string;
  painLevel: number | null;
  therapy: string;
  notes: string;
};

function setFormValue(form: HTMLFormElement, name: string, value: string) {
  const field = form.elements.namedItem(name);
  if (!(field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement)) return;
  field.value = value;
  field.dispatchEvent(new Event("input", { bubbles: true }));
}

export function RehabCopyLastEntryButton({ entry }: { entry: EntryTemplate }) {
  return (
    <button
      type="button"
      onClick={(event) => {
        const form = event.currentTarget.form;
        if (!form) return;
        setFormValue(form, "condition_summary", entry.conditionSummary);
        setFormValue(form, "pain_level", entry.painLevel === null ? "" : String(entry.painLevel));
        setFormValue(form, "therapy", entry.therapy);
        setFormValue(form, "notes", entry.notes);
        const conditionField = form.elements.namedItem("condition_summary");
        if (conditionField instanceof HTMLInputElement) conditionField.focus();
      }}
      className="rounded-md border border-teal/30 bg-white px-3 py-2 text-xs font-medium text-teal-dark hover:bg-teal-50"
    >
      Popuni iz poslednjeg unosa
    </button>
  );
}
