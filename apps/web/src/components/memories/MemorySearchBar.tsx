import { useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { Search, Calendar, X } from "lucide-react";

interface MemorySearchBarProps {
  onSearch: (filters: {
    text?: string;
    tags?: string[];
    dateFrom?: string;
    dateTo?: string;
  }) => void;
}

export function MemorySearchBar({ onSearch }: MemorySearchBarProps) {
  const { t } = useTranslation();
  const [text, setText] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [showDateFilter, setShowDateFilter] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSearch({
      text: text || undefined,
      tags: tagsInput ? tagsInput.split(",").map((t) => t.trim()) : undefined,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
    });
  };

  const clearFilters = () => {
    setText("");
    setTagsInput("");
    setDateFrom("");
    setDateTo("");
    onSearch({});
  };

  const hasFilters = text || tagsInput || dateFrom || dateTo;

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={t("memories.searchPlaceholder")}
            className="w-full rounded-md border py-2 pl-9 pr-3 text-sm outline-none focus:border-primary"
          />
        </div>
        <button
          type="button"
          onClick={() => setShowDateFilter(!showDateFilter)}
          className={`rounded-md border p-2 ${showDateFilter ? "bg-accent" : ""}`}
          title={t("memories.filterByDate")}
        >
          <Calendar className="h-4 w-4" />
        </button>
        <button
          type="submit"
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          {t("common.search")}
        </button>
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={tagsInput}
          onChange={(e) => setTagsInput(e.target.value)}
          placeholder={t("memories.filterByTags")}
          className="flex-1 rounded-md border px-3 py-1.5 text-sm outline-none focus:border-primary"
        />
      </div>

      {showDateFilter && (
        <div className="flex items-center gap-2">
          <label className="text-sm text-muted-foreground">
            {t("memories.dateFrom")}:
          </label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="rounded-md border px-2 py-1 text-sm"
          />
          <label className="text-sm text-muted-foreground">
            {t("memories.dateTo")}:
          </label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="rounded-md border px-2 py-1 text-sm"
          />
        </div>
      )}

      {hasFilters && (
        <button
          type="button"
          onClick={clearFilters}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <X className="h-3 w-3" />
          {t("memories.clearFilters")}
        </button>
      )}
    </form>
  );
}