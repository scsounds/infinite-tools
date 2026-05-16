"use client";

import { useId, useState } from "react";
import { FileUp } from "lucide-react";

import { cn, formatBytes } from "@/lib/utils";

type DropzoneProps = {
  accept?: string;
  multiple?: boolean;
  label?: string;
  description?: string;
  onFiles: (files: File[]) => void;
  className?: string;
};

export function Dropzone({
  accept,
  multiple = false,
  label = "Drop a file here",
  description = "or pick one from your device",
  onFiles,
  className
}: DropzoneProps) {
  const id = useId();
  const [active, setActive] = useState(false);
  const [lastFiles, setLastFiles] = useState<File[]>([]);

  function handleFiles(fileList: FileList | null) {
    const files = fileList ? Array.from(fileList) : [];
    if (!files.length) return;
    const selected = multiple ? files : files.slice(0, 1);
    setLastFiles(selected);
    onFiles(selected);
  }

  return (
    <label
      htmlFor={id}
      onDragOver={(event) => {
        event.preventDefault();
        setActive(true);
      }}
      onDragLeave={() => setActive(false)}
      onDrop={(event) => {
        event.preventDefault();
        setActive(false);
        handleFiles(event.dataTransfer.files);
      }}
      className={cn(
        "group flex min-h-40 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-white/18 bg-black/24 px-5 py-8 text-center transition hover:border-cyan-300/45 hover:bg-cyan-300/[0.04]",
        active && "border-cyan-300/60 bg-cyan-300/[0.07]",
        className
      )}
    >
      <input
        id={id}
        type="file"
        accept={accept}
        multiple={multiple}
        className="sr-only"
        onChange={(event) => handleFiles(event.currentTarget.files)}
      />
      <span className="mb-4 grid size-12 place-items-center rounded-md border border-white/12 bg-white/[0.045] text-cyan-100 transition group-hover:scale-105">
        <FileUp className="size-5" />
      </span>
      <span className="text-sm font-medium text-stone-100">{label}</span>
      <span className="mt-1 text-xs text-stone-500">{description}</span>
      {lastFiles.length ? (
        <span className="mt-4 max-w-full truncate rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-stone-400">
          {lastFiles.map((file) => `${file.name} (${formatBytes(file.size)})`).join(", ")}
        </span>
      ) : null}
    </label>
  );
}
