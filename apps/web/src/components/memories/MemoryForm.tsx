import { useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import type { MemoryDTO } from "@acaixinha/shared";
import { useMemoryStore } from "../../stores/memoryStore";
import { useUiStore } from "../../stores/uiStore";
import { TagInput } from "./TagInput";
import { Loader2 } from "lucide-react";

interface MemoryFormProps {
  mode: "create" | "edit";
  memory?: MemoryDTO;
  onSuccess?: () => void;
}

export function MemoryForm({ mode, memory, onSuccess }: MemoryFormProps) {
  const { t } = useTranslation();
  const createMemory = useMemoryStore((s) => s.createMemory);
  const updateMemory = useMemoryStore((s) => s.updateMemory);
  const addToast = useUiStore((s) => s.addToast);

  const [title, setTitle] = useState(memory?.title ?? "");
  const [description, setDescription] = useState(memory?.description ?? "");
  const [memoryDate, setMemoryDate] = useState(
    memory?.memoryDate ? memory.memoryDate.split("T")[0] : "",
  );
  const [locationName, setLocationName] = useState(memory?.locationName ?? "");
  const [lat, setLat] = useState(
    memory?.coordinates?.latitude?.toString() ?? "",
  );
  const [lng, setLng] = useState(
    memory?.coordinates?.longitude?.toString() ?? "",
  );
  const [tags, setTags] = useState<string[]>(memory?.tags ?? []);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim() || !description.trim() || !memoryDate) {
      setError("Title, description, and date are required");
      return;
    }

    setIsSubmitting(true);
    try {
      const coordinates =
        lat && lng
          ? { lat: parseFloat(lat), lng: parseFloat(lng) }
          : undefined;

      if (mode === "create") {
        await createMemory({
          title: title.trim(),
          description: description.trim(),
          memoryDate: new Date(memoryDate).toISOString(),
          locationName: locationName.trim() || undefined,
          coordinates,
          tags,
        });
        addToast({ title: t("memories.memoryCreated") });
      } else if (memory) {
        await updateMemory(memory.id, {
          title: title.trim(),
          description: description.trim(),
          memoryDate: new Date(memoryDate).toISOString(),
          locationName: locationName.trim() || null,
          coordinates: coordinates ?? null,
          tags,
        });
        addToast({ title: t("memories.memoryUpdated") });
      }
      onSuccess?.();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl">
      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div>
        <label className="mb-1 block text-sm font-medium">
          {t("memories.titlePlaceholder")}
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          maxLength={200}
          className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:border-primary"
          placeholder={t("memories.titlePlaceholder")}
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">
          {t("memories.memoryDate")}
        </label>
        <input
          type="date"
          value={memoryDate}
          onChange={(e) => setMemoryDate(e.target.value)}
          required
          className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:border-primary"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">
          {t("memories.description")}
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
          maxLength={10000}
          rows={4}
          className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:border-primary resize-y"
          placeholder={t("memories.descriptionPlaceholder")}
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">
          {t("memories.location")}
        </label>
        <input
          type="text"
          value={locationName}
          onChange={(e) => setLocationName(e.target.value)}
          maxLength={200}
          className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:border-primary"
          placeholder={t("memories.locationPlaceholder")}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-sm font-medium">
            {t("memories.latitude")}
          </label>
          <input
            type="number"
            value={lat}
            onChange={(e) => setLat(e.target.value)}
            min={-90}
            max={90}
            step="any"
            className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:border-primary"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">
            {t("memories.longitude")}
          </label>
          <input
            type="number"
            value={lng}
            onChange={(e) => setLng(e.target.value)}
            min={-180}
            max={180}
            step="any"
            className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:border-primary"
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">
          {t("memories.tags")}
        </label>
        <TagInput tags={tags} onChange={setTags} />
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
      >
        {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
        {mode === "create" ? t("memories.createMemory") : t("common.save")}
      </button>
    </form>
  );
}