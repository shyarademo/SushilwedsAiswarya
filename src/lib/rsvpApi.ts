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

async function readError(res: Response): Promise<string> {
  try {
    const data = (await res.json()) as ApiErr;
    if (data?.error) return data.error;
  } catch {
    /* ignore */
  }
  return `Request failed (${res.status})`;
}

export async function submitRsvp(payload: RsvpPayload): Promise<SubmitOk> {
  const res = await fetch(`${RSVP_API_URL}/rsvp`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-RSVP-Secret": RSVP_SECRET,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error(await readError(res));
  }

  const data = (await res.json()) as SubmitOk | ApiErr;
  if (!data.ok) {
    throw new Error(("error" in data && data.error) || "Could not save RSVP");
  }
  return data;
}

export async function fetchRsvps(adminPassword: string): Promise<ListOk> {
  const res = await fetch(`${RSVP_API_URL}/rsvp`, {
    method: "GET",
    headers: {
      "X-Admin-Password": adminPassword,
    },
  });

  if (!res.ok) {
    throw new Error(await readError(res));
  }

  const data = (await res.json()) as ListOk | ApiErr;
  if (!data.ok) {
    throw new Error(("error" in data && data.error) || "Could not load RSVPs");
  }
  return data;
}

/** Download CSV as a file; password is sent via header, never in the URL. */
export async function downloadRsvpsCsv(adminPassword: string): Promise<void> {
  const res = await fetch(`${RSVP_API_URL}/rsvp?format=csv`, {
    method: "GET",
    headers: {
      "X-Admin-Password": adminPassword,
    },
  });

  if (!res.ok) {
    throw new Error(await readError(res));
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
