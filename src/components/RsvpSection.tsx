"use client";

import { useState } from "react";
import { useGuestPrefs } from "@/components/GuestPrefsContext";
import { burstPetals } from "@/lib/petalBurst";
import { submitRsvp, guestRsvpErrorMessage, type YesNo } from "@/lib/rsvpApi";

type YesNoNull = YesNo | null;

export default function RsvpSection() {
  const { side } = useGuestPrefs();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attendance, setAttendance] = useState<YesNoNull>(null);
  const [attendWedding, setAttendWedding] = useState<YesNoNull>(null);
  const [attendReception, setAttendReception] = useState<YesNoNull>(null);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");

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
    if (attendance === "yes" && (!attendWedding || !attendReception)) {
      setError("Please tell us which celebrations you will be attending.");
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
        attend_wedding: attendance === "yes" ? attendWedding : null,
        attend_reception: attendance === "yes" ? attendReception : null,
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
                  setAttendWedding(null);
                  setAttendReception(null);
                  setError(null);
                }}
              >
                Regretfully Decline
              </button>
            </div>

            {attendance === "yes" && (
              <div className="rsvp-questions">
                <div className="rsvp-question">
                  <span className="rsvp-question__label">
                    Attending the Wedding?
                  </span>
                  <div className="rsvp-question__pills">
                    <button
                      type="button"
                      className={`rsvp-pill${
                        attendWedding === "yes" ? " rsvp-pill--yes" : ""
                      }`}
                      onClick={() => setAttendWedding("yes")}
                    >
                      Yes
                    </button>
                    <button
                      type="button"
                      className={`rsvp-pill${
                        attendWedding === "no" ? " rsvp-pill--no" : ""
                      }`}
                      onClick={() => setAttendWedding("no")}
                    >
                      No
                    </button>
                  </div>
                </div>

                <div className="rsvp-question">
                  <span className="rsvp-question__label">
                    Attending the Reception?
                  </span>
                  <div className="rsvp-question__pills">
                    <button
                      type="button"
                      className={`rsvp-pill${
                        attendReception === "yes" ? " rsvp-pill--yes" : ""
                      }`}
                      onClick={() => setAttendReception("yes")}
                    >
                      Yes
                    </button>
                    <button
                      type="button"
                      className={`rsvp-pill${
                        attendReception === "no" ? " rsvp-pill--no" : ""
                      }`}
                      onClick={() => setAttendReception("no")}
                    >
                      No
                    </button>
                  </div>
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
