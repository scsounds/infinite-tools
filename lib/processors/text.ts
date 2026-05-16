export function cleanHashtags(input: string, limit = 30) {
  const seen = new Set<string>();
  const tags = input
    .split(/[\s,;]+/)
    .map((tag) => tag.trim().replace(/^#+/, ""))
    .map((tag) => tag.replace(/[^\p{L}\p{N}_]/gu, ""))
    .filter(Boolean)
    .map((tag) => tag.toLowerCase())
    .filter((tag) => {
      if (seen.has(tag)) return false;
      seen.add(tag);
      return true;
    })
    .slice(0, limit);

  return tags.map((tag) => `#${tag}`);
}

export function countText(input: string) {
  const words = input.trim() ? input.trim().split(/\s+/).length : 0;
  const characters = [...input].length;
  const charactersNoSpaces = [...input.replace(/\s/g, "")].length;
  const lines = input ? input.split(/\r\n|\r|\n/).length : 0;
  const bytes = new TextEncoder().encode(input).length;
  const sentences = input.split(/[.!?]+/).map((part) => part.trim()).filter(Boolean).length;
  const readingMinutes = words / 225;

  return {
    characters,
    charactersNoSpaces,
    words,
    lines,
    bytes,
    sentences,
    readingMinutes
  };
}

export function formatYoutubeDescription(input: {
  title: string;
  summary: string;
  links: string;
  credits: string;
  chapters: string;
  hashtags: string;
}) {
  const title = input.title.trim().replace(/\s+/g, " ");
  const sections = [
    input.summary.trim(),
    formatChapters(input.chapters),
    input.links.trim() ? `Links\n${input.links.trim()}` : "",
    input.credits.trim() ? `Credits\n${input.credits.trim()}` : "",
    cleanHashtags(input.hashtags, 8).join(" ")
  ].filter(Boolean);

  return {
    title,
    description: sections.join("\n\n")
  };
}

export function formatChapters(input: string) {
  const lines = input
    .split(/\r\n|\r|\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const match = line.match(/^(\d{1,2}:)?\d{1,2}:\d{2}/);
      return match ? line : `00:00 ${line}`;
    });
  return lines.length ? `Chapters\n${lines.join("\n")}` : "";
}

export function shiftSubtitleTimestamps(input: string, seconds: number, output: "srt" | "vtt") {
  const shifted = input.replace(
    /(\d{1,2}:)?(\d{2}):(\d{2})([,.])(\d{3})/g,
    (match, hourPrefix: string | undefined, minutes: string, secs: string, separator: string, millis: string) => {
      const hours = hourPrefix ? Number.parseInt(hourPrefix.replace(":", ""), 10) : 0;
      const total = Math.max(
        0,
        hours * 3600 + Number.parseInt(minutes, 10) * 60 + Number.parseInt(secs, 10) + Number.parseInt(millis, 10) / 1000 + seconds
      );
      return formatTimestamp(total, output === "srt" ? "," : ".");
    }
  );

  return output === "vtt" && !shifted.trimStart().startsWith("WEBVTT") ? `WEBVTT\n\n${shifted}` : shifted;
}

export function formatTimestamp(totalSeconds: number, separator: "," | ".") {
  const totalMillis = Math.max(0, Math.round(totalSeconds * 1000));
  const hours = Math.floor(totalMillis / 3_600_000);
  const minutes = Math.floor((totalMillis % 3_600_000) / 60_000);
  const seconds = Math.floor((totalMillis % 60_000) / 1000);
  const millis = totalMillis % 1000;
  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds
    .toString()
    .padStart(2, "0")}${separator}${millis.toString().padStart(3, "0")}`;
}
