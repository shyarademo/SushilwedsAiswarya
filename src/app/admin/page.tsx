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

type AttendanceFilter = "all" | "yes" | "no";
type SideFilter = "all" | "bride" | "groom";

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
  const [attendanceFilter, setAttendanceFilter] =
    useState<AttendanceFilter>("all");
  const [sideFilter, setSideFilter] = useState<SideFilter>("all");
  const [search, setSearch] = useState("");
  const [loadTick, setLoadTick] = useState(0);

  const clearAuth = useCallback(() => {
    writeSessionPassword(null);
    setRows([]);
    setPassword("");
  }, []);

  useEffect(() => {
    if (!storedPassword) return;

    let cancelled = false;

    void (async () => {
      // Defer setState so this effect is not a synchronous cascading render.
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

  const handleLogout = () => {
    clearAuth();
  };

  const handleCsv = async () => {
    if (!storedPassword) return;
    setError(null);
    try {
      await downloadRsvpsCsv(storedPassword);
    } catch (err) {
      setError(adminErrorMessage(err, "csv"));
    }
  };

  const q = search.trim().toLowerCase();
  const filtered = rows.filter((row) => {
    if (attendanceFilter !== "all" && row.attendance !== attendanceFilter) {
      return false;
    }
    if (sideFilter !== "all" && row.side !== sideFilter) {
      return false;
    }
    if (q && !row.full_name.toLowerCase().includes(q)) {
      return false;
    }
    return true;
  });

  const yesCount = rows.filter((r) => r.attendance === "yes").length;
  const noCount = rows.filter((r) => r.attendance === "no").length;

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
            {rows.length} total · {yesCount} attending · {noCount} declined
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
            Lock
          </button>
        </div>
      </header>

      {error && (
        <p className="admin-error admin-error--banner" role="alert">
          {error}
        </p>
      )}

      <div className="admin-filters">
        <label className="admin-filter">
          <span>Search</span>
          <input
            type="search"
            className="admin-input"
            placeholder="Name…"
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
      </div>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Side</th>
              <th>RSVP</th>
              <th>Wedding</th>
              <th>Reception</th>
              <th>Phone</th>
              <th>Message</th>
              <th>Time</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="admin-empty">
                  {loading ? "Loading…" : "No responses match."}
                </td>
              </tr>
            ) : (
              filtered.map((row) => (
                <tr key={row.id}>
                  <td>{row.full_name}</td>
                  <td className="admin-cap">{row.side || "—"}</td>
                  <td>{labelYesNo(row.attendance)}</td>
                  <td>{labelYesNo(row.attend_wedding)}</td>
                  <td>{labelYesNo(row.attend_reception)}</td>
                  <td>{row.phone || "—"}</td>
                  <td className="admin-msg">{row.message || "—"}</td>
                  <td className="admin-time">{formatTime(row.created_at)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
