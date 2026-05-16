"use client";

import { Download, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { downloadBlob, formatBytes } from "@/lib/utils";

export type OutputFile = {
  blob: Blob;
  filename: string;
  url?: string;
  meta?: string;
};

export function OutputCard({ output }: { output: OutputFile }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.035] p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="max-w-full truncate text-sm font-medium text-stone-100">{output.filename}</p>
          <p className="text-xs text-stone-500">
            {formatBytes(output.blob.size)}
            {output.meta ? ` - ${output.meta}` : ""}
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={() => downloadBlob(output.blob, output.filename)}>
          <Download />
          Download
        </Button>
      </div>
      {output.url?.startsWith("blob:") && output.blob.type.startsWith("image/") ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={output.url} alt="" className="max-h-80 w-full rounded-md border border-white/10 object-contain" />
      ) : null}
      {output.url?.startsWith("blob:") && output.blob.type.startsWith("audio/") ? (
        <audio src={output.url} controls className="mt-2 w-full" />
      ) : null}
      {output.url?.startsWith("blob:") && output.blob.type.startsWith("video/") ? (
        <video src={output.url} controls className="mt-2 max-h-80 w-full rounded-md border border-white/10" />
      ) : null}
    </div>
  );
}

export function ToolStatus({ busy, message, error }: { busy?: boolean; message?: string; error?: string }) {
  if (!busy && !message && !error) return null;

  return (
    <div
      role={error ? "alert" : "status"}
      className={`rounded-lg border p-4 text-sm ${
        error ? "border-red-300/25 bg-red-400/10 text-red-100" : "border-cyan-300/20 bg-cyan-300/[0.06] text-cyan-50"
      }`}
    >
      <div className="flex items-center gap-2">
        {busy ? <Loader2 className="size-4 animate-spin" /> : null}
        <span>{error || message}</span>
      </div>
    </div>
  );
}
