export const VENDOR_PHONE_ERROR =
  "Enter a valid 10-digit North American phone number with an optional +1 country code.";

export function normalizeVendorPhone(phone: string): string | null {
  const input = phone.trim();

  if (!input) {
    return null;
  }

  if (!/^\+?[0-9\s().-]+$/.test(input)) {
    throw new Error(VENDOR_PHONE_ERROR);
  }

  let digits = input.replace(/[^0-9]/g, "");

  if (input.startsWith("+") && (digits.length !== 11 || digits[0] !== "1")) {
    throw new Error(VENDOR_PHONE_ERROR);
  }

  if (digits.length === 11 && digits[0] === "1") {
    digits = digits.substring(1);
  }

  if (digits.length !== 10) {
    throw new Error(VENDOR_PHONE_ERROR);
  }

  if (digits[0] < "2" || digits[3] < "2") {
    throw new Error(VENDOR_PHONE_ERROR);
  }

  return `+1 (${digits.substring(0, 3)}) ${digits.substring(3, 6)}-${digits.substring(6, 10)}`;
}
