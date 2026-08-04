"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import {
  ADMIN_AUTH_FAIL,
  adminErrorMessage,
  downloadRsvpsCsv,
  fetchRsvps,
  type RsvpRow,
} from "@/lib/rsvpApi";

const ADMIN_SESSION_KEY = "wedding_admin_unlocked";
const MESSAGE_COLLAPSE_CHARS = 120;

type AttendanceFilter = "all" | "yes" | "no";
type SideFilter = "all" | "bride" | "groom";
type SortKey =
  | "full_name"
  | "side"
  | "attendance"
  | "attend_wedding"
  | "attend_reception"
  | "phone"
  | "message"
  | "created_at";
type SortDir = "asc" | "desc";

const sessionListeners = new Set<() => void>();

function subscribeSession(onStoreChange: () => void) {
  sessionListeners.add(onStoreChange);
  return () => {
    sessionListeners.delete(onStoreChange);
  };
}

function readSessionPassword(): string {
  try {
    return sessionStorage.getItem(ADMIN_SESSION_KEY) ?? "";
  } catch {
    return "";
  }
}

function writeSessionPassword(password: string | null) {
  try {
    if (password) {
      sessionStorage.setItem(ADMIN_SESSION_KEY, password);
    } else {
      sessionStorage.removeItem(ADMIN_SESSION_KEY);
    }
  } catch {
    /* private mode */
  }
  sessionListeners.forEach((listener) => listener());
}

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

function labelYesNo(value: string | null): string {
  if (!value) return "—";
  if (value === "yes") return "Yes";
  if (value === "no") return "No";
  return value;
}

function labelSide(value: string | null): string {
  if (!value) return "—";
  if (value === "bride") return "Bride";
  if (value === "groom") return "Groom";
  return value;
}

function normalizePhone(phone: string | null): string {
  if (!phone) return "";
  return phone.replace(/[^\d+]/g, "");
}

/** Digits only for WhatsApp; 10-digit local numbers get India country code. */
function whatsappDigits(phone: string | null): string | null {
  if (!phone) return null;
  let digits = phone.replace(/\D/g, "");
  if (!digits) return null;
  if (digits.length === 10) digits = `91${digits}`;
  return digits;
}

function telHref(phone: string | null): string | null {
  const cleaned = normalizePhone(phone);
  if (!cleaned) return null;
  return `tel:${cleaned}`;
}

function whatsappHref(phone: string | null): string | null {
  const digits = whatsappDigits(phone);
  if (!digits) return null;
  return `https://wa.me/${digits}`;
}

function sortValue(row: RsvpRow, key: SortKey): string {
  const raw = row[key];
  return (raw ?? "").toString().toLowerCase();
}

function MessageCell({
  message,
  expanded,
  onToggle,
}: {
  message: string | null;
  expanded: boolean;
  onToggle: () => void;
}) {
  if (!message) {
    return <span className="admin-muted">—</span>;
  }

  const normalized = message.replace(/\r\n/g, "\n").trim();
  const needsCollapse = normalized.length > MESSAGE_COLLAPSE_CHARS;

  return (
    <div className={`admin-msg${expanded ? " admin-msg--open" : ""}`}>
      <p className="admin-msg__text">{normalized}</p>
      {needsCollapse && (
        <button
          type="button"
          className="admin-link-btn"
          onClick={onToggle}
          aria-expanded={expanded}
        >
          {expanded ? "Show less" : "Show more"}
        </button>
      )}
    </div>
  );
}

export default function AdminPage() {
  const storedPassword = useSyncExternalStore(
    subscribeSession,
    readSessionPassword,
    () => ""
  );
  const unlocked = Boolean(storedPassword);

  const [password, setPassword] = useState("");
  const [rows, setRows] = useState<RsvpRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [attendanceFilter, setAttendanceFilter] =
    useState<AttendanceFilter>("all");
  const [sideFilter, setSideFilter] = useState<SideFilter>("all");
  const [search, setSearch] = useState("");
  const [loadTick, setLoadTick] = useState(0);
  const [sortKey, setSortKey] = useState<SortKey>("created_at");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [expandedMsgs, setExpandedMsgs] = useState<Record<number, boolean>>(
    {}
  );
  const [phoneSheet, setPhoneSheet] = useState<{
    name: string;
    phone: string;
  } | null>(null);

  const clearAuth = useCallback(() => {
    writeSessionPassword(null);
    setRows([]);
    setPassword("");
    setError(null);
    setPhoneSheet(null);
  }, []);

  const handleLogout = () => {
    clearAuth();
  };

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(null), 2200);
    return () => window.clearTimeout(id);
  }, [toast]);

  useEffect(() => {
    if (!storedPassword) return;

    let cancelled = false;

    void (async () => {
      await Promise.resolve();
      if (cancelled) return;
      setLoading(true);
      setError(null);
      try {
        const data = await fetchRsvps(storedPassword);
        if (cancelled) return;
        setRows(data.rows);
      } catch (err) {
        if (cancelled) return;
        const msg = adminErrorMessage(err, "load");
        setError(msg);
        if (msg === ADMIN_AUTH_FAIL) {
          clearAuth();
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [storedPassword, loadTick, clearAuth]);

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await fetchRsvps(password);
      writeSessionPassword(password);
    } catch (err) {
      setError(adminErrorMessage(err, "login"));
      setLoading(false);
    }
  };

  const handleCsv = async () => {
    if (!storedPassword) return;
    setError(null);
    try {
      await downloadRsvpsCsv(storedPassword);
      setToast("CSV download started");
    } catch (err) {
      setError(adminErrorMessage(err, "csv"));
    }
  };

  const openPhoneSheet = (name: string, phone: string) => {
    setPhoneSheet({ name, phone });
  };

  const closePhoneSheet = () => setPhoneSheet(null);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(key === "created_at" ? "desc" : "asc");
    }
  };

  const clearFilters = () => {
    setSearch("");
    setAttendanceFilter("all");
    setSideFilter("all");
  };

  const filtersActive =
    search.trim() !== "" ||
    attendanceFilter !== "all" ||
    sideFilter !== "all";

  const q = search.trim().toLowerCase();
  const filtered = rows
    .filter((row) => {
      if (attendanceFilter !== "all" && row.attendance !== attendanceFilter) {
        return false;
      }
      if (sideFilter !== "all" && row.side !== sideFilter) {
        return false;
      }
      if (q) {
        const hay = [
          row.full_name,
          row.phone ?? "",
          row.message ?? "",
          row.side ?? "",
        ]
          .join(" ")
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    })
    .slice()
    .sort((a, b) => {
      const av = sortValue(a, sortKey);
      const bv = sortValue(b, sortKey);
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return b.id - a.id;
    });

  const yesCount = rows.filter((r) => r.attendance === "yes").length;
  const noCount = rows.filter((r) => r.attendance === "no").length;
  const brideCount = rows.filter((r) => r.side === "bride").length;
  const groomCount = rows.filter((r) => r.side === "groom").length;
  const weddingYes = rows.filter((r) => r.attend_wedding === "yes").length;
  const receptionYes = rows.filter((r) => r.attend_reception === "yes").length;

  const sortLabel = (key: SortKey, label: string) => {
    const active = sortKey === key;
    return (
      <button
        type="button"
        className={`admin-th-btn${active ? " admin-th-btn--active" : ""}`}
        onClick={() => toggleSort(key)}
      >
        {label}
        <span className="admin-th-btn__arrow" aria-hidden="true">
          {active ? (sortDir === "asc" ? " ↑" : " ↓") : ""}
        </span>
      </button>
    );
  };

  const ariaSortFor = (key: SortKey): "ascending" | "descending" | "none" => {
    if (sortKey !== key) return "none";
    return sortDir === "asc" ? "ascending" : "descending";
  };

  if (!unlocked) {
    return (
      <main className="admin-page">
        <div className="admin-gate">
          <p className="admin-gate__eyebrow">Sushil &amp; Aiswarya</p>
          <h1 className="admin-gate__title">RSVP Admin</h1>
          <p className="admin-gate__hint">Enter the admin password to continue.</p>
          <form className="admin-gate__form" onSubmit={handleUnlock}>
            <label className="admin-label" htmlFor="adminPassword">
              Password
            </label>
            <input
              id="adminPassword"
              type="password"
              className="admin-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
            {error && (
              <p className="admin-error" role="alert">
                {error}
              </p>
            )}
            <button type="submit" className="admin-btn" disabled={loading}>
              {loading ? "Checking…" : "Unlock"}
            </button>
          </form>
        </div>
      </main>
    );
  }

  return (
    <main className="admin-page">
      <header className="admin-header">
        <div>
          <p className="admin-gate__eyebrow">Sushil &amp; Aiswarya</p>
          <h1 className="admin-title">RSVP responses</h1>
          <p className="admin-meta">
            {rows.length} total
            {filtered.length !== rows.length
              ? ` · showing ${filtered.length}`
              : ""}
          </p>
        </div>
        <div className="admin-actions">
          <button
            type="button"
            className="admin-btn admin-btn--ghost"
            onClick={() => setLoadTick((t) => t + 1)}
            disabled={loading}
          >
            {loading ? "Refreshing…" : "Refresh"}
          </button>
          <button
            type="button"
            className="admin-btn"
            onClick={() => void handleCsv()}
          >
            Download CSV
          </button>
          <button
            type="button"
            className="admin-btn admin-btn--ghost"
            onClick={handleLogout}
          >
            Log Out
          </button>
        </div>
      </header>

      <div className="admin-stats" aria-label="Response summary">
        <div className="admin-stat">
          <span className="admin-stat__value">{yesCount}</span>
          <span className="admin-stat__label">Attending</span>
        </div>
        <div className="admin-stat">
          <span className="admin-stat__value">{noCount}</span>
          <span className="admin-stat__label">Declined</span>
        </div>
        <div className="admin-stat">
          <span className="admin-stat__value">{brideCount}</span>
          <span className="admin-stat__label">Bride&apos;s side</span>
        </div>
        <div className="admin-stat">
          <span className="admin-stat__value">{groomCount}</span>
          <span className="admin-stat__label">Groom&apos;s side</span>
        </div>
        <div className="admin-stat">
          <span className="admin-stat__value">{weddingYes}</span>
          <span className="admin-stat__label">Wedding</span>
        </div>
        <div className="admin-stat">
          <span className="admin-stat__value">{receptionYes}</span>
          <span className="admin-stat__label">Reception</span>
        </div>
      </div>

      {error && (
        <p className="admin-error admin-error--banner" role="alert">
          {error}
        </p>
      )}

      <div className="admin-filters">
        <label className="admin-filter admin-filter--search">
          <span>Search</span>
          <input
            type="search"
            className="admin-input"
            placeholder="Name, phone, or message…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
        <label className="admin-filter">
          <span>Attendance</span>
          <select
            className="admin-input"
            value={attendanceFilter}
            onChange={(e) =>
              setAttendanceFilter(e.target.value as AttendanceFilter)
            }
          >
            <option value="all">All</option>
            <option value="yes">Attending</option>
            <option value="no">Declined</option>
          </select>
        </label>
        <label className="admin-filter">
          <span>Side</span>
          <select
            className="admin-input"
            value={sideFilter}
            onChange={(e) => setSideFilter(e.target.value as SideFilter)}
          >
            <option value="all">All</option>
            <option value="bride">Bride</option>
            <option value="groom">Groom</option>
          </select>
        </label>
        {filtersActive && (
          <div className="admin-filter admin-filter--clear">
            <span className="admin-filter__spacer" aria-hidden="true">
              &nbsp;
            </span>
            <button
              type="button"
              className="admin-btn admin-btn--ghost admin-btn--flush"
              onClick={clearFilters}
            >
              Clear filters
            </button>
          </div>
        )}
      </div>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th scope="col" aria-sort={ariaSortFor("full_name")}>
                {sortLabel("full_name", "Name")}
              </th>
              <th scope="col" aria-sort={ariaSortFor("side")}>
                {sortLabel("side", "Side")}
              </th>
              <th scope="col" aria-sort={ariaSortFor("attendance")}>
                {sortLabel("attendance", "RSVP")}
              </th>
              <th scope="col" aria-sort={ariaSortFor("attend_wedding")}>
                {sortLabel("attend_wedding", "Wedding")}
              </th>
              <th scope="col" aria-sort={ariaSortFor("attend_reception")}>
                {sortLabel("attend_reception", "Reception")}
              </th>
              <th scope="col" aria-sort={ariaSortFor("phone")}>
                {sortLabel("phone", "Phone")}
              </th>
              <th scope="col" aria-sort={ariaSortFor("message")}>
                {sortLabel("message", "Message")}
              </th>
              <th scope="col" aria-sort={ariaSortFor("created_at")}>
                {sortLabel("created_at", "Time")}
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="admin-empty">
                  {loading
                    ? "Loading…"
                    : filtersActive
                      ? "No responses match your filters."
                      : "No responses yet."}
                </td>
              </tr>
            ) : (
              filtered.map((row) => {
                const canContact = Boolean(normalizePhone(row.phone));
                return (
                  <tr key={row.id}>
                    <td className="admin-name">{row.full_name}</td>
                    <td>{labelSide(row.side)}</td>
                    <td>
                      <span
                        className={`admin-pill admin-pill--${
                          row.attendance === "yes"
                            ? "yes"
                            : row.attendance === "no"
                              ? "no"
                              : "muted"
                        }`}
                      >
                        {labelYesNo(row.attendance)}
                      </span>
                    </td>
                    <td>{labelYesNo(row.attend_wedding)}</td>
                    <td>{labelYesNo(row.attend_reception)}</td>
                    <td className="admin-phone">
                      {canContact && row.phone ? (
                        <button
                          type="button"
                          className="admin-tel"
                          onClick={() =>
                            openPhoneSheet(row.full_name, row.phone || "")
                          }
                        >
                          {row.phone}
                        </button>
                      ) : (
                        <span className="admin-muted">—</span>
                      )}
                    </td>
                    <td>
                      <MessageCell
                        message={row.message}
                        expanded={Boolean(expandedMsgs[row.id])}
                        onToggle={() =>
                          setExpandedMsgs((prev) => ({
                            ...prev,
                            [row.id]: !prev[row.id],
                          }))
                        }
                      />
                    </td>
                    <td className="admin-time">{formatTime(row.created_at)}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {phoneSheet && (
        <div
          className="admin-sheet-backdrop"
          role="presentation"
          onClick={closePhoneSheet}
        >
          <div
            className="admin-sheet"
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-phone-sheet-title"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="admin-sheet__eyebrow">Contact guest</p>
            <h2 id="admin-phone-sheet-title" className="admin-sheet__title">
              {phoneSheet.name}
            </h2>
            <p className="admin-sheet__number">{phoneSheet.phone}</p>
            <div className="admin-sheet__actions">
              <a
                className="admin-btn admin-sheet__btn"
                href={telHref(phoneSheet.phone) || "#"}
                onClick={closePhoneSheet}
              >
                Call
              </a>
              <a
                className="admin-btn admin-btn--ghost admin-sheet__btn"
                href={whatsappHref(phoneSheet.phone) || "#"}
                target="_blank"
                rel="noopener noreferrer"
                onClick={closePhoneSheet}
              >
                WhatsApp
              </a>
              <button
                type="button"
                className="admin-link-btn admin-sheet__cancel"
                onClick={closePhoneSheet}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="admin-toast" role="status">
          {toast}
        </div>
      )}
    </main>
  );
}
