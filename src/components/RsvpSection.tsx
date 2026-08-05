"use client";

import { useState } from "react";
import { useGuestPrefs } from "@/components/GuestPrefsContext";
import { burstPetals } from "@/lib/petalBurst";
import { submitRsvp, guestRsvpErrorMessage, type YesNo } from "@/lib/rsvpApi";

type YesNoNull = YesNo | null;

type EventKey = "wedding" | "receptionKochi" | "receptionBengaluru";

const RSVP_EVENTS: {
  key: EventKey;
  title: string;
  meta: string;
}[] = [
  {
    key: "wedding",
    title: "Wedding",
    meta: "13 September · 11:30 AM onwards · Ernakulam",
  },
  {
    key: "receptionKochi",
    title: "Reception · Kochi",
    meta: "13 September · 6:00 PM – 9:00 PM · YMCA",
  },
  {
    key: "receptionBengaluru",
    title: "Reception · Bengaluru",
    meta: "19 September · 7:30 PM · Konkan Samudhai Bhavan",
  },
];

export default function RsvpSection() {
  const { side } = useGuestPrefs();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attendance, setAttendance] = useState<YesNoNull>(null);
  const [selected, setSelected] = useState<Record<EventKey, boolean>>({
    wedding: false,
    receptionKochi: false,
    receptionBengaluru: false,
  });
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  /** Draft string so guests can clear/retype freely; clamped on blur & submit. */
  const [guestCountDraft, setGuestCountDraft] = useState("1");

  const MIN_GUESTS = 1;
  const MAX_GUESTS = 40;

  const clearEvents = () =>
    setSelected({
      wedding: false,
      receptionKochi: false,
      receptionBengaluru: false,
    });

  const clampGuests = (value: number) =>
    Math.min(MAX_GUESTS, Math.max(MIN_GUESTS, Math.floor(value)));

  const parsedGuestCount = (): number | null => {
    const n = Number.parseInt(guestCountDraft, 10);
    if (!Number.isFinite(n)) return null;
    return n;
  };

  const stepGuests = (delta: number) => {
    const current = parsedGuestCount();
    const base = current ?? MIN_GUESTS;
    setGuestCountDraft(String(clampGuests(base + delta)));
    setError(null);
  };

  const commitGuestDraft = () => {
    const current = parsedGuestCount();
    if (current == null) {
      setGuestCountDraft(String(MIN_GUESTS));
      return MIN_GUESTS;
    }
    const clamped = clampGuests(current);
    setGuestCountDraft(String(clamped));
    return clamped;
  };

  const toggleEvent = (key: EventKey) => {
    setSelected((prev) => ({ ...prev, [key]: !prev[key] }));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!side) {
      setError(
        "Please choose Bride's side or Groom's side above before sending your RSVP."
      );
      return;
    }
    if (!attendance) {
      setError("Please let us know if you will be attending.");
      return;
    }
    if (
      attendance === "yes" &&
      !selected.wedding &&
      !selected.receptionKochi &&
      !selected.receptionBengaluru
    ) {
      setError("Please select at least one celebration you will attend.");
      return;
    }

    const guestCount =
      attendance === "yes" ? commitGuestDraft() : null;
    if (
      attendance === "yes" &&
      (guestCount == null ||
        guestCount < MIN_GUESTS ||
        guestCount > MAX_GUESTS)
    ) {
      setError(
        `Please enter how many guests are coming (${MIN_GUESTS}–${MAX_GUESTS}).`
      );
      return;
    }

    const name = fullName.trim();
    if (!name) {
      setError("Please enter your full name.");
      return;
    }

    setIsSubmitting(true);
    try {
      await submitRsvp({
        full_name: name,
        phone: phone.trim() || undefined,
        attendance,
        guest_count: attendance === "yes" ? guestCount : null,
        attend_wedding:
          attendance === "yes" ? (selected.wedding ? "yes" : "no") : null,
        attend_reception:
          attendance === "yes"
            ? selected.receptionKochi
              ? "yes"
              : "no"
            : null,
        attend_reception_bengaluru:
          attendance === "yes"
            ? selected.receptionBengaluru
              ? "yes"
              : "no"
            : null,
        side,
        message: message.trim() || undefined,
      });
      setIsSubmitted(true);
      burstPetals("full");
    } catch (err) {
      setError(guestRsvpErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="rsvp-section">
      <div className="rsvp-header scroll-anim delay-1">
        <p className="rsvp-eyebrow">Your Gracious Reply</p>
        <h2 className="rsvp-heading">RSVP</h2>
      </div>

      <div className="rsvp-container scroll-anim delay-2">
        <p className="rsvp-intro">
          Your presence would be the greatest gift. We would be absolutely
          delighted to have you join us as we begin this new journey together.
          Please let us know if you can celebrate with us!
        </p>

        {isSubmitted ? (
          <div className="rsvp-success">
            <h3>Thank You!</h3>
            <p>
              {attendance === "yes"
                ? "We are so thrilled you can join us! We cannot wait to celebrate this beautiful occasion together."
                : "We will miss you dearly, but we understand and are grateful for your warm wishes. You will be in our hearts!"}
            </p>
          </div>
        ) : (
          <form className="rsvp-form" onSubmit={handleSubmit}>
            <div className="attendance-toggle">
              <button
                type="button"
                className={`toggle-btn ${attendance === "yes" ? "active" : ""}`}
                onClick={() => {
                  setAttendance("yes");
                  setError(null);
                }}
              >
                Joyfully Accept
              </button>
              <button
                type="button"
                className={`toggle-btn decline ${attendance === "no" ? "active" : ""}`}
                onClick={() => {
                  setAttendance("no");
                  clearEvents();
                  setGuestCountDraft("1");
                  setError(null);
                }}
              >
                Regretfully Decline
              </button>
            </div>

            {attendance === "yes" && (
              <fieldset className="rsvp-events">
                <legend className="rsvp-events__legend">
                  Which celebrations will you join?
                </legend>
                <p className="rsvp-events__hint">Select all that apply</p>

                <div className="rsvp-events__list" role="group">
                  {RSVP_EVENTS.map((ev) => {
                    const isOn = selected[ev.key];
                    const inputId = `rsvp-event-${ev.key}`;
                    return (
                      <label
                        key={ev.key}
                        htmlFor={inputId}
                        className={`rsvp-event${isOn ? " rsvp-event--on" : ""}`}
                      >
                        <input
                          id={inputId}
                          className="rsvp-event__input"
                          type="checkbox"
                          checked={isOn}
                          onChange={() => toggleEvent(ev.key)}
                        />
                        <span className="rsvp-event__check" aria-hidden="true">
                          <svg viewBox="0 0 16 16" width="12" height="12">
                            <path
                              d="M3.5 8.2 6.4 11l6.1-6.4"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </span>
                        <span className="rsvp-event__copy">
                          <span className="rsvp-event__title">{ev.title}</span>
                          <span className="rsvp-event__meta">{ev.meta}</span>
                        </span>
                      </label>
                    );
                  })}
                </div>
              </fieldset>
            )}

            {attendance === "yes" && (
              <div className="rsvp-guests">
                <div className="rsvp-guests__copy">
                  <p className="rsvp-guests__title">Number of guests</p>
                  <p className="rsvp-guests__hint">
                    Including yourself
                  </p>
                </div>
                <div className="rsvp-guests__controls">
                  <button
                    type="button"
                    className="rsvp-guests__btn"
                    aria-label="Fewer guests"
                    disabled={(parsedGuestCount() ?? MIN_GUESTS) <= MIN_GUESTS}
                    onClick={() => stepGuests(-1)}
                  >
                    −
                  </button>
                  <input
                    id="guestCount"
                    className="rsvp-guests__input"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={2}
                    value={guestCountDraft}
                    onChange={(e) => {
                      const raw = e.target.value;
                      if (raw === "") {
                        setGuestCountDraft("");
                        setError(null);
                        return;
                      }
                      if (!/^\d+$/.test(raw)) return;
                      setGuestCountDraft(raw);
                      setError(null);
                    }}
                    onBlur={() => {
                      commitGuestDraft();
                    }}
                    aria-label="Number of guests including yourself"
                  />
                  <button
                    type="button"
                    className="rsvp-guests__btn"
                    aria-label="More guests"
                    disabled={(parsedGuestCount() ?? MIN_GUESTS) >= MAX_GUESTS}
                    onClick={() => stepGuests(1)}
                  >
                    +
                  </button>
                </div>
              </div>
            )}

            <div className="input-group">
              <input
                type="text"
                required
                placeholder=" "
                id="guestName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                autoComplete="name"
              />
              <label htmlFor="guestName">Your Full Name</label>
            </div>

            <div className="input-group">
              <input
                type="tel"
                placeholder=" "
                id="guestPhone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                autoComplete="tel"
              />
              <label htmlFor="guestPhone">Phone Number (Optional)</label>
            </div>

            <div className="input-group">
              <textarea
                rows={3}
                placeholder=" "
                id="guestMessage"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
              <label htmlFor="guestMessage">
                A message for the couple...
              </label>
            </div>

            {error && (
              <p className="rsvp-error" role="alert">
                {error}
              </p>
            )}

            {!side && (
              <p className="rsvp-side-hint">
                Tip: pick Bride&apos;s or Groom&apos;s side in the section above —
                we need that with your RSVP.
              </p>
            )}

            <button
              type="submit"
              className="rsvp-submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Sending..." : "Send My RSVP"}
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
