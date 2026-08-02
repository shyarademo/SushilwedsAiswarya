"use client";

import { useState } from "react";
import { burstPetals } from "@/lib/petalBurst";

type YesNo = "yes" | "no" | null;

export default function RsvpSection() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [attendance, setAttendance] = useState<YesNo>(null);
  const [attendWedding, setAttendWedding] = useState<YesNo>(null);
  const [attendReception, setAttendReception] = useState<YesNo>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!attendance) {
      alert("Please let us know if you will be attending.");
      return;
    }
    if (attendance === "yes" && (!attendWedding || !attendReception)) {
      alert("Please tell us which celebrations you will be attending.");
      return;
    }
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
      burstPetals("full");
    }, 1500);
  };

  return (
    <section className="rsvp-section">

      {/* Section header */}
      <div className="rsvp-header scroll-anim delay-1">
        <p className="rsvp-eyebrow">Your Gracious Reply</p>
        <h2 className="rsvp-heading">RSVP</h2>
      </div>

      {/* Parchment form card */}
      <div className="rsvp-container scroll-anim delay-2">
        <p className="rsvp-intro">
          Your presence would be the greatest gift — we would be absolutely
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
                onClick={() => setAttendance("yes")}
              >
                Joyfully Accept
              </button>
              <button
                type="button"
                className={`toggle-btn decline ${attendance === "no" ? "active" : ""}`}
                onClick={() => setAttendance("no")}
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
              />
              <label htmlFor="guestName">Your Full Name</label>
            </div>

            <div className="input-group">
              <input
                type="tel"
                placeholder=" "
                id="guestPhone"
              />
              <label htmlFor="guestPhone">Phone Number (Optional)</label>
            </div>

            <div className="input-group">
              <textarea
                rows={3}
                placeholder=" "
                id="guestMessage"
              ></textarea>
              <label htmlFor="guestMessage">
                A message for the couple...
              </label>
            </div>

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
