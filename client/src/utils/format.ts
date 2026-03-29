export const currency = (value: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);

export const readableDate = (value: string | Date) =>
  new Date(value).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });

export const monthLabel = (month: number, year: number) =>
  new Date(year, month, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });

export const isoDate = (value = new Date()) => new Date(value).toISOString().slice(0, 10);
