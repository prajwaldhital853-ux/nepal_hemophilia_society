const RESET_EMAIL_KEY = "nhms-reset-email";
const RESET_TOKEN_KEY = "nhms-reset-token";

export function storeResetEmail(email: string) {
  sessionStorage.setItem(RESET_EMAIL_KEY, email.trim().toLowerCase());
}

export function readResetEmail() {
  return sessionStorage.getItem(RESET_EMAIL_KEY) || "";
}

export function storeResetToken(token: string) {
  sessionStorage.setItem(RESET_TOKEN_KEY, token);
}

export function readResetToken() {
  return sessionStorage.getItem(RESET_TOKEN_KEY) || "";
}

export function clearResetSession() {
  sessionStorage.removeItem(RESET_EMAIL_KEY);
  sessionStorage.removeItem(RESET_TOKEN_KEY);
}
