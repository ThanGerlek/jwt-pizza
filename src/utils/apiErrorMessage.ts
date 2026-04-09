import type { ApiError } from "../service/httpPizzaService";

function isApiError(e: unknown): e is ApiError {
  return (
    typeof e === "object" &&
    e !== null &&
    "code" in e &&
    typeof (e as ApiError).code === "number"
  );
}

/** User-facing copy for login failures (401 invalid credentials, etc.). */
export function loginErrorMessage(err: unknown): string {
  if (!isApiError(err)) {
    return "Something went wrong. Please try again.";
  }
  const { code, message, retryAfter } = err;

  if (code === 401) {
    return "Invalid email or password.";
  }
  if (code === 429) {
    const suffix = retryAfter
      ? ` Try again in ${retryAfter} seconds.`
      : " Please try again later.";
    return `Too many attempts.${suffix}`;
  }
  if (code >= 500) {
    return "Something went wrong. Please try again later.";
  }
  if (typeof message === "string" && message.length > 0) {
    return message;
  }
  return "Something went wrong. Please try again.";
}

/** User-facing copy for registration failures (409 duplicate email, rate limit, etc.). */
export function registerErrorMessage(err: unknown): string {
  if (!isApiError(err)) {
    return "Something went wrong. Please try again.";
  }
  const { code, message, retryAfter } = err;

  if (code === 409) {
    if (message === "unable to register") {
      return "That email is already registered.";
    }
    return "Could not complete registration. That email may already be in use.";
  }
  if (code === 429) {
    const suffix = retryAfter
      ? ` Try again in ${retryAfter} seconds.`
      : " Please try again later.";
    return `Too many attempts.${suffix}`;
  }
  if (code >= 500) {
    return "Something went wrong. Please try again later.";
  }
  if (typeof message === "string" && message.length > 0) {
    return message;
  }
  return "Something went wrong. Please try again.";
}

export function orderPlaceErrorMessage(err: unknown): string {
  if (!isApiError(err)) {
    return "Something went wrong. Please try again.";
  }
  const { code, message } = err;
  if (
    code === 400 &&
    typeof message === "string" &&
    message.includes("unknown menu item")
  ) {
    return "Your cart includes an item that is no longer on the menu. Go back to the menu and refresh your order.";
  }
  if (code >= 500) {
    return "Something went wrong. Please try again later.";
  }
  if (typeof message === "string" && message.length > 0) {
    return message;
  }
  return "Something went wrong. Please try again.";
}

export function franchiseCloseErrorMessage(err: unknown): string {
  if (!isApiError(err)) {
    return "Something went wrong. Please try again.";
  }
  const { code, message } = err;
  if (code === 401) {
    return "Your session expired. Please log in again.";
  }
  if (code === 403) {
    return "You do not have permission to do that.";
  }
  if (code >= 500) {
    return "Something went wrong. Please try again later.";
  }
  if (typeof message === "string" && message.length > 0) {
    return message;
  }
  return "Something went wrong. Please try again.";
}
