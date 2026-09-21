export default function RsvpSection() {
  return (
    <section className="rsvp-section">
      <div className="rsvp-header scroll-anim delay-1">
        <p className="rsvp-eyebrow">Forever Grateful</p>
        <h2 className="rsvp-heading">Thank You</h2>
      </div>

      <div className="rsvp-container scroll-anim delay-2">
        <div className="rsvp-success" style={{ padding: "1rem 0" }}>
          <h3 style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>🤍</h3>
          <p style={{ marginBottom: "1rem", fontStyle: "italic", lineHeight: "1.6" }}>
            Our wedding celebrations have beautifully concluded, and RSVPs are now closed.
          </p>
          <p style={{ marginBottom: "1.5rem", fontStyle: "italic", lineHeight: "1.6" }}>
            Thank you for the overwhelming love, blessings, and joy you shared with us. Whether near or far, you made the start of our forever truly magical.
          </p>
          <p style={{ fontWeight: "600", fontSize: "1.1rem" }}>
            With all our love,<br />
            Aiswarya & Sushil
          </p>
        </div>
      </div>
    </section>
  );
}
