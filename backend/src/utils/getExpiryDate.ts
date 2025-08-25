import ms from "ms";

export function getExpiryDate(timeString: string) {
  const milliseconds = ms(timeString as ms.StringValue);
  return new Date(Date.now() + milliseconds);
}
