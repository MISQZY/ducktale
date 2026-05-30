import Image from "next/image";
import { fetchLastModified } from "@/lib/github";
import { Clock, User } from "lucide-react";

interface Props {
  filePath: string;
}

export async function GitHubLastModified({ filePath }: Props) {
  const result = await fetchLastModified(filePath);

  return (
    <div className="mt-6 pt-4 flex border-t border-fd-border text-xs">
      <div className="flex items-center gap-2 text-fd-muted-foreground">
        <Clock size={12} className="shrink-0" />
        {result?.date ? (
          <span>
            Последнее изменение:{" "}
            {result.date.toLocaleDateString("ru-RU", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </span>
        ) : (
          <span className="opacity-50">
            Не удалось получить дату последнего изменения
          </span>
        )}
      </div>

      <div className="flex items-center gap-2 ml-auto">
        {result?.author ? (
          <>
            {result.author.avatar_url && (
              <Image
                src={result.author.avatar_url}
                alt={result.authorName}
                width={20}
                height={20}
                className="rounded-full shrink-0"
              />
            )}
            <a
              href={`https://github.com/${result.authorName}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-fd-muted-foreground hover:underline"
            >
              {result.authorName}
            </a>
          </>
        ) : (
          <User size={12} className="shrink-0 text-fd-muted-foreground" />
        )}
      </div>
    </div>
  );
}
