import keys from "./message-keys.json";

// Only known interface messages are translated. Patient-authored content is never passed here.
export function translatedRehabMessage(
  message: string,
  t: (key: string, values?: Record<string, string | number>) => string,
) {
  const key = (keys as Record<string, string>)[message];
  if (key) return t(key);
  const photos = /^Možete dodati najviše (\d+) slike po dnevnom unosu\.$/.exec(
    message,
  );
  if (photos) return t("labelYouCanAddUpToPhotosPer", { v0: photos[1] });
  return message;
}
