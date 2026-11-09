const images = new Map();
const MAX_MEMORY = 20_000_000;
const keyFor = (owner, id) => String(owner || "") + ":" + id;

// Media stay in this browser session, including moves from the dock to full screen.
// Account history keeps the text; it never receives a base64 image.
export function rememberLucynaImage(owner, id, image) {
  images.set(keyFor(owner, id), image);
  let size = [...images.values()].reduce((sum, item) => sum + item.data_url.length, 0);
  while (size > MAX_MEMORY && images.size > 1) {
    const oldest = images.keys().next().value;
    size -= images.get(oldest).data_url.length; images.delete(oldest);
  }
}
export const lucynaImage = (owner, id) => images.get(keyFor(owner, id));
export function forgetLucynaImages(owner, ids) {
  if (ids) ids.forEach(id => images.delete(keyFor(owner, id)));
  else for (const key of images.keys()) if (key.startsWith(String(owner || "") + ":")) images.delete(key);
}
export function isImageGenerationRequest(message) {
  const text = String(message).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/ł/g, "l").trim();
  if (/^(?:nie\b|jak\b|how\b)/.test(text)) return false;
  return /^(?:(?:prosze|please)[, ]+)?(?:narysuj|draw)\b/.test(text)
    || /^(?:(?:prosze|please)[, ]+|(?:czy )?mozesz (?:mi )?)?(?:wygeneruj|wygenerowac|stworz|stworzyc|zrob|zrobic|generate|create|make)\b.{0,100}\b(?:obraz\w*|grafik\w*|ilustracj\w*|zdjec\w*|logo|plakat\w*|baner\w*|image|picture|illustration|poster|banner)\b/s.test(text);
}

export async function prepareLucynaImage(file) {
  if (!file || !["image/jpeg", "image/png", "image/webp"].includes(file.type)) throw new Error("Wybierz obraz JPG, PNG albo WebP.");
  if (!file.size || file.size > 10_000_000) throw new Error("Obraz może mieć maksymalnie 10 MB.");
  const url = URL.createObjectURL(file), img = new Image();
  try {
    await new Promise((resolve, reject) => { img.onload = resolve; img.onerror = () => reject(new Error("Nie mogę odczytać tego obrazu. Wybierz inny plik.")); img.src = url; });
    if (!img.naturalWidth || !img.naturalHeight || img.naturalWidth * img.naturalHeight > 32_000_000) throw new Error("Zmniejsz obraz do maksymalnie 32 megapikseli.");
    const ratio = Math.min(1, 1024 / Math.max(img.naturalWidth, img.naturalHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(img.naturalWidth * ratio)); canvas.height = Math.max(1, Math.round(img.naturalHeight * ratio));
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Przeglądarka nie mogła przygotować obrazu.");
    ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, canvas.width, canvas.height); ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    let data_url = "";
    for (const quality of [.85, .72, .58, .42]) { data_url = canvas.toDataURL("image/jpeg", quality); if (data_url.length <= 500_000) break; }
    if (!data_url.startsWith("data:image/jpeg;base64,") || data_url.length > 500_000) throw new Error("Obraz jest zbyt szczegółowy. Wybierz mniejszy fragment.");
    return { data_url, width: canvas.width, height: canvas.height, mime: "image/jpeg", generated: false };
  } finally { URL.revokeObjectURL(url); }
}

export function validGeneratedImage(image) {
  return image && typeof image.data_url === "string" && image.data_url.length <= 4_000_050
    && /^data:image\/(?:jpeg|png);base64,[A-Za-z0-9+/]+={0,2}$/.test(image.data_url)
    && Number.isInteger(image.width) && Number.isInteger(image.height)
    && image.width > 0 && image.height > 0 && image.width <= 2048 && image.height <= 2048;
}

export function downloadLucynaImage(image, id) {
  const raw = atob(image.data_url.split(",")[1]);
  const bytes = Uint8Array.from(raw, char => char.charCodeAt(0));
  const url = URL.createObjectURL(new Blob([bytes], {type:image.mime}));
  const link = document.createElement("a");
  link.href = url;
  link.download = "Lucyna-" + id.slice(0,8) + (image.mime === "image/png" ? ".png" : ".jpg");
  document.body.appendChild(link); link.click(); link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function isImageRevisionRequest(text) {
  const value=String(text).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/ł/g, "l").trim();
  return /^(?:(?:a teraz|teraz|prosze)[, ]+)?(?:zmien|dodaj|usun|rozjasnij|przyciemnij|narysuj|wygeneruj|popraw|zrob wersje|inna wersja|jeszcze raz|change|add|remove|make it|try again)\b/.test(value);
}
