/**
 * Client helpers for the Cloudflare RSVP Worker + D1 backend.
 * Secrets in a static build are visible by design; they only deter casual spam.
 */

export const RSVP_API_URL =
  "https://sushil-aiswarya-rsvp.hr-shyara.workers.dev";

export const RSVP_SECRET = "SushilAiswarya_Rsvp_2026_K7mQ9pX2nL4w";

export type YesNo = "yes" | "no";
export type GuestSide = "bride" | "groom";

export type RsvpPayload = {
  full_name: string;
  phone?: string;
  attendance: YesNo;
  attend_wedding?: YesNo | null;
  attend_reception?: YesNo | null;
  side: GuestSide;
  message?: string;
};

export type RsvpRow = {
  id: number;
  created_at: string;
  full_name: string;
  phone: string | null;
  attendance: string;
  attend_wedding: string | null;
  attend_reception: string | null;
  side: string | null;
  message: string | null;
};

type SubmitOk = { ok: true; id: number | null };
type ApiErr = { ok: false; error: string };
type ListOk = { ok: true; count: number; rows: RsvpRow[] };

const GUEST_SUBMIT_FAIL =
  "We couldn't save your RSVP just now. Please try again in a moment.";
const GUEST_NETWORK_FAIL =
  "We couldn't reach the RSVP desk. Please check your connection and try again.";

export const ADMIN_AUTH_FAIL =
  "That password doesn't look right. Please try again.";
const ADMIN_LOAD_FAIL =
  "We couldn't load the responses. Please try Refresh in a moment.";
const ADMIN_NETWORK_FAIL =
  "We couldn't reach the RSVP desk. Please check your connection and try again.";
const ADMIN_CSV_FAIL =
  "We couldn't download the CSV just now. Please try again in a moment.";

function isNetworkError(err: unknown): boolean {
  if (err instanceof TypeError) return true;
  const msg = err instanceof Error ? err.message : String(err ?? "");
  return /failed to fetch|networkerror|load failed|network request failed/i.test(
    msg
  );
}

function isAuthError(status: number, message: string): boolean {
  return (
    status === 401 ||
    status === 403 ||
    /unauthor|forbidden|invalid (password|secret)/i.test(message)
  );
}

async function readApiMessage(res: Response): Promise<string> {
  try {
    const data = (await res.json()) as ApiErr;
    if (data?.error) return data.error;
  } catch {
    /* ignore */
  }
  return "";
}

/** Friendly copy for guests on the invite RSVP form. */
export function guestRsvpErrorMessage(err: unknown): string {
  if (err instanceof Error) {
    if (
      err.message === GUEST_SUBMIT_FAIL ||
      err.message === GUEST_NETWORK_FAIL
    ) {
      return err.message;
    }
  }
  if (isNetworkError(err)) return GUEST_NETWORK_FAIL;
  return GUEST_SUBMIT_FAIL;
}

/** Friendly copy for the couple on /admin. */
export function adminErrorMessage(
  err: unknown,
  kind: "login" | "load" | "csv" = "load"
): string {
  if (err instanceof Error) {
    if (
      err.message === ADMIN_AUTH_FAIL ||
      err.message === ADMIN_LOAD_FAIL ||
      err.message === ADMIN_NETWORK_FAIL ||
      err.message === ADMIN_CSV_FAIL
    ) {
      return err.message;
    }
  }
  if (isNetworkError(err)) return ADMIN_NETWORK_FAIL;
  const msg = err instanceof Error ? err.message : "";
  if (isAuthError(0, msg) || /unauthor|forbidden|401|403/i.test(msg)) {
    return ADMIN_AUTH_FAIL;
  }
  if (kind === "login") return ADMIN_AUTH_FAIL;
  if (kind === "csv") return ADMIN_CSV_FAIL;
  return ADMIN_LOAD_FAIL;
}

export async function submitRsvp(payload: RsvpPayload): Promise<SubmitOk> {
  let res: Response;
  try {
    res = await fetch(`${RSVP_API_URL}/rsvp`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-RSVP-Secret": RSVP_SECRET,
      },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    throw new Error(guestRsvpErrorMessage(err));
  }

  if (!res.ok) {
    throw new Error(GUEST_SUBMIT_FAIL);
  }

  const data = (await res.json()) as SubmitOk | ApiErr;
  if (!data.ok) {
    throw new Error(GUEST_SUBMIT_FAIL);
  }
  return data;
}

export async function fetchRsvps(adminPassword: string): Promise<ListOk> {
  let res: Response;
  try {
    res = await fetch(`${RSVP_API_URL}/rsvp`, {
      method: "GET",
      headers: {
        "X-Admin-Password": adminPassword,
      },
    });
  } catch (err) {
    throw new Error(adminErrorMessage(err, "load"));
  }

  if (!res.ok) {
    const apiMsg = await readApiMessage(res);
    if (isAuthError(res.status, apiMsg)) {
      throw new Error(ADMIN_AUTH_FAIL);
    }
    throw new Error(ADMIN_LOAD_FAIL);
  }

  const data = (await res.json()) as ListOk | ApiErr;
  if (!data.ok) {
    if (isAuthError(0, "error" in data ? data.error : "")) {
      throw new Error(ADMIN_AUTH_FAIL);
    }
    throw new Error(ADMIN_LOAD_FAIL);
  }
  return data;
}

/** Download CSV as a file; password is sent via header, never in the URL. */
export async function downloadRsvpsCsv(adminPassword: string): Promise<void> {
  let res: Response;
  try {
    res = await fetch(`${RSVP_API_URL}/rsvp?format=csv`, {
      method: "GET",
      headers: {
        "X-Admin-Password": adminPassword,
      },
    });
  } catch (err) {
    throw new Error(adminErrorMessage(err, "csv"));
  }

  if (!res.ok) {
    const apiMsg = await readApiMessage(res);
    if (isAuthError(res.status, apiMsg)) {
      throw new Error(ADMIN_AUTH_FAIL);
    }
    throw new Error(ADMIN_CSV_FAIL);
  }

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "rsvps.csv";
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
