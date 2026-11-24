export function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export async function compressImage(file, maxSize = 1000, quality = 0.78) {
  const src = await fileToDataUrl(file);
  const img = await new Promise((resolve, reject) => {
    const el = new Image();
    el.onload = () => resolve(el);
    el.onerror = reject;
    el.src = src;
  });
  const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(img.width * scale);
  canvas.height = Math.round(img.height * scale);
  canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", quality);
}

export async function translateWithMyMemory(text, target) {
  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=autodetect|${target}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Translation service unavailable.");
  const data = await res.json();
  const translated = data?.responseData?.translatedText;
  if (data?.responseStatus !== 200 || !translated) {
    if (String(data?.responseDetails || "").includes("DISTINCT")) return text;
    throw new Error("Translation failed. Try again.");
  }
  return translated;
}
