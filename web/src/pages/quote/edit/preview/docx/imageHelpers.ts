export interface LoadedImage {
  data: Uint8Array
  width: number
  height: number
}

// Uses fetch (not HTMLImageElement + canvas) to avoid the browser CORS cache
// poisoning problem: <img> tags in the HTML preview load images without CORS
// headers and populate the cache; a subsequent Image() with crossOrigin=
// 'anonymous' gets the cached non-CORS response, which taints the canvas and
// causes toDataURL() to return blank bytes silently.
// fetch() has its own independent CORS request lifecycle and is unaffected.
//
// PNG dimensions are read directly from the binary header (bytes 16–23).
export async function loadImageFromUrl(url: string): Promise<LoadedImage> {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`HTTP ${response.status}: ${url}`)
  const arrayBuffer = await response.arrayBuffer()
  const view = new DataView(arrayBuffer)
  // PNG IHDR chunk: bytes 16–19 = width, 20–23 = height (big-endian uint32)
  const width = view.getUint32(16, false)
  const height = view.getUint32(20, false)
  if (!width || !height) {
    throw new Error(`Could not read PNG dimensions from ${url}`)
  }
  return { data: new Uint8Array(arrayBuffer), width, height }
}

// Converts a raw base64 string (no data: prefix) to a Uint8Array.
// Used for delimitação images stored as base64 in quoteFiles.
export function base64ToUint8Array(base64: string): Uint8Array {
  const binaryString = atob(base64)
  const bytes = new Uint8Array(binaryString.length)
  for (let byteIndex = 0; byteIndex < binaryString.length; byteIndex++) {
    bytes[byteIndex] = binaryString.charCodeAt(byteIndex)
  }
  return bytes
}

// Renders an SVG string to a square PNG at the given pixel size.
// Uses blob URL + canvas — safe because blob URLs are same-origin (no CORS taint).
// The returned PNG preserves alpha so transparent areas remain transparent in Word.
export async function renderSvgToPng(
  svgString: string,
  sizePx: number,
): Promise<LoadedImage> {
  const blob = new Blob([svgString], { type: 'image/svg+xml' })
  const objectUrl = URL.createObjectURL(blob)
  try {
    await new Promise<void>((resolve, reject) => {
      const imageElement = new Image()
      imageElement.onload = () => resolve()
      imageElement.onerror = () => reject(new Error('SVG load failed'))
      imageElement.src = objectUrl
    })
    const canvas = document.createElement('canvas')
    canvas.width = sizePx
    canvas.height = sizePx
    const ctx = canvas.getContext('2d')!
    const imageElement = new Image()
    imageElement.src = objectUrl
    ctx.drawImage(imageElement, 0, 0, sizePx, sizePx)
    const pngBlob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(result => {
        if (result) resolve(result)
        else reject(new Error('canvas toBlob returned null'))
      }, 'image/png')
    })
    const buffer = await pngBlob.arrayBuffer()
    return { data: new Uint8Array(buffer), width: sizePx, height: sizePx }
  } finally {
    URL.revokeObjectURL(objectUrl)
  }
}

// Reads image dimensions from a Uint8Array via a blob URL + HTMLImageElement.
// Safe to use here (unlike remote URLs): blob URLs are same-origin so there is
// no CORS cache poisoning risk.
export async function loadImageDimensions(
  data: Uint8Array,
): Promise<{ widthPx: number; heightPx: number }> {
  return new Promise((resolve, reject) => {
    const blob = new Blob([data.buffer as ArrayBuffer])
    const objectUrl = URL.createObjectURL(blob)
    const imageElement = new Image()
    imageElement.onload = () => {
      resolve({
        widthPx: imageElement.naturalWidth,
        heightPx: imageElement.naturalHeight,
      })
      URL.revokeObjectURL(objectUrl)
    }
    imageElement.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error('Could not load image to read dimensions'))
    }
    imageElement.src = objectUrl
  })
}
