export function storageKey(tool: string, value: string): string {
  return `${tool}+${value}`
}

export function loadStored(
  tool: string,
  value: string,
  fallback: string,
): string {
  const saved = localStorage.getItem(storageKey(tool, value))
  return saved !== null ? saved : fallback
}

export function saveStored(tool: string, value: string, data: string): void {
  localStorage.setItem(storageKey(tool, value), data)
}
