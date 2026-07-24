import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import type { MemoryDTO } from "@acaixinha/shared";
import { Calendar, MapPin, Paperclip, Users } from "lucide-react";

interface MemoryCardProps {
  memory: MemoryDTO;
}

export function MemoryCard({ memory }: MemoryCardProps) {
  const { t } = useTranslation();
  const date = new Date(memory.memoryDate);

  return (
    <Link
      to="/app/memories/$memoryId"
      params={{ memoryId: memory.id }}
      className="group flex flex-col gap-3 rounded-lg border p-4 transition-shadow hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-medium leading-tight group-hover:text-primary">
          {memory.title}
        </h3>
      </div>

      <p className="line-clamp-2 text-sm text-muted-foreground">
        {memory.description}
      </p>

      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <Calendar className="h-3 w-3" />
          {date.toLocaleDateString()}
        </span>
        {memory.locationName && (
          <span className="inline-flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            {memory.locationName}
          </span>
        )}
        {memory.attachments.length > 0 && (
          <span className="inline-flex items-center gap-1">
            <Paperclip className="h-3 w-3" />
            {memory.attachments.length}
          </span>
        )}
        {memory.sharedWithUserIds.length > 0 && (
          <span className="inline-flex items-center gap-1">
            <Users className="h-3 w-3" />
            {memory.sharedWithUserIds.length}
          </span>
        )}
      </div>

      {memory.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {memory.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-secondary px-2 py-0.5 text-xs"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </Link>
  );
}

export function MemoryCardSkeleton() {
  return (
    <div className="flex flex-col gap-3 rounded-lg border p-4 animate-pulse">
      <div className="h-5 w-2/3 rounded bg-muted" />
      <div className="h-4 w-full rounded bg-muted" />
      <div className="h-4 w-1/2 rounded bg-muted" />
      <div className="flex gap-2">
        <div className="h-5 w-12 rounded-full bg-muted" />
        <div className="h-5 w-16 rounded-full bg-muted" />
      </div>
    </div>
  );
}