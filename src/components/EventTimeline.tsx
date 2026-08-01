"use client";

import { useState } from "react";
import InteractiveLightbox from "./InteractiveLightbox";

interface WeddingEvent {
  id: string;
  name: string;
  date: string;
  time: string;
  venue: string;
  mapLink: string;
  isSacred?: boolean;
  image: string;
  badge: string;
  overlayColor: string;
}

const EVENTS: WeddingEvent[] = [
  {
    id: "muhurtham",
    name: "Muhurtham",
    date: "September 13",
    time: "7:15 – 8:00 AM",
    venue: "Ernakulam Shiva Temple",
    mapLink:
      "https://www.google.com/maps/place/X79J%2BC93+Ernakulam+Shiva+Temple+West+Gopuram,+Pallimukku,+Kochi,+Ernakulam,+Kerala+682011/data=!4m2!3m1!1s0x3b08730eef982efb:0x6abed4af82314806!18m1!1e1?utm_source=mstt_1&entry=gps&coh=192189&g_ep=CAESBzI2LjI5LjIYACCenQoqlQEsOTQyNjc3MjcsOTQyOTIxOTUsOTQyOTk1MzIsMTAwNzk2NDk4LDEwMDc5Nzc2MSwxMDA3OTY1MzUsOTQyODA1NzYsOTQyMDczOTQsOTQyMDc1MDYsOTQyMDg1MDYsOTQyMTg2NTMsOTQyMjk4MzksOTQyNzUxNjgsOTQyNzk2MTksMTAwODE1NjQwLDEwMDgyMDIzN0ICSU4%3D&skid=ab907d6d-3b3a-4e67-9666-567cc9a7e22b&g_st=aw",
    isSacred: true,
    image: "/images/event-muhurtham.webp",
    badge: "Trace to Reveal",
    overlayColor: "#7A3B2E",
  },
  {
    id: "lunch",
    name: "Wedding Lunch",
    date: "September 13",
    time: "11:30 AM",
    venue: "TDM Hall",
    mapLink:
      "https://www.google.com/maps/place/X79M%2B5HP+TDM+Hall,+Durbar+Hall+Rd,+opposite+Durbar+Hall+Ground,+Ernakulam+South,+Ernakulam,+Kerala+682016,+India/data=!4m2!3m1!1s0x3b0872b21e2ce8ef:0x4b0aa762fde2bb71!18m1!1e1?utm_source=mstt_1&entry=gps&coh=192189&g_ep=CAESBzI2LjI5LjIYACCenQoqlQEsOTQyNjc3MjcsOTQyOTIxOTUsOTQyOTk1MzIsMTAwNzk2NDk4LDEwMDc5Nzc2MSwxMDA3OTU2MjUsOTQyODA1NzYsOTQyMDczOTQsOTQyMDc1MDYsOTQyMDg1MDYsOTQyMTg2NTMsOTQyMjk4MzksOTQyNzUxNjgsOTQyNzk2MTksMTAwODE1NjQwLDEwMDgxMjk5NEICQUU%3D&skid=cc788467-737d-4881-9fe0-e446d4cac314&g_st=aw",
    image: "/images/event-lunch.webp",
    badge: "Rub to Reveal",
    overlayColor: "#F2B705",
  },
  {
    id: "reception",
    name: "Reception",
    date: "September 19",
    time: "7:30 PM",
    venue: "Konkan Samudhai Bhavan",
    mapLink:
      "https://www.google.com/maps/place/1st+Floor,+Konkan+Samudhai+Bhavan,+90,+7th+Main+Rd,+Chellikere,+Chelekare,+Kalyan+Nagar,+Bengaluru,+Karnataka+560043/data=!4m2!3m1!1s0x3bae172fe0932ac9:0x5aac6453cb4328b9!18m1!1e1?utm_source=mstt_1&entry=gps&coh=192189&g_ep=CAESBzI2LjI5LjIYACCenQoqlQEsOTQyNjc3MjcsOTQyOTIxOTUsOTQyOTk1MzIsMTAwNzk2NDk4LDEwMDc5Nzc2MSwxMDA3OTY1MzUsOTQyODA1NzYsOTQyMDczOTQsOTQyMDc1MDYsOTQyMDg1MDYsOTQyMTg2NTMsOTQyMjk4MzksOTQyNzUxNjgsOTQyNzk2MTksMTAwODE1NjQwLDEwMDgyMDIzN0ICSU4%3D&skid=056b68d5-ea69-4323-9978-ad43574a91e6&g_st=aw",
    image: "/images/event-reception.webp",
    badge: "Rub to Reveal",
    overlayColor: "#73222d",
  },
];

export default function EventTimeline() {
  const [activeEvent, setActiveEvent] = useState<WeddingEvent | null>(null);

  return (
    <>
      <div id="timeline">

        {/* Section header */}
        <div className="timeline-header scroll-anim delay-1">
          <p className="timeline-eyebrow">Join us for</p>
          <h2 className="timeline-heading">The Festivities</h2>
          <p className="timeline-intro">
            We joyfully request the honour of your presence
          </p>
        </div>

        {/* Event cards */}
        {EVENTS.map((ev, idx) => (
          <div
            className={`ev-card scroll-anim delay-${idx + 2}`}
            key={ev.id}
          >
            {/* Gold accent bar */}
            <div className="ev-card__accent" aria-hidden="true"></div>

            {/* Sequential number */}
            <p className="ev-card__number">
              {String(idx + 1).padStart(2, "0")}
            </p>

            {/* Event name */}
            <h3 className="ev-card__name">{ev.name}</h3>

            {/* Date & time */}
            <p className="ev-card__datetime">
              <span>{ev.date}</span>
              <span className="ev-card__sep" aria-hidden="true">·</span>
              <span>{ev.time}</span>
            </p>

            {/* Venue */}
            <p className="ev-card__venue">{ev.venue}</p>

            {/* Map link */}
            {ev.mapLink && (
              <a
                href={ev.mapLink}
                target="_blank"
                rel="noopener noreferrer"
                className="ev-card__maplink"
              >
                Get Directions ↗
              </a>
            )}

            {/* Scratch-to-reveal thumbnail */}
            <div className="thumb" onClick={() => setActiveEvent(ev)}>
              <img src={ev.image} alt={ev.name} />
              <div className="badge">{ev.badge}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Interactive lightbox */}
      <InteractiveLightbox
        isOpen={!!activeEvent}
        onClose={() => setActiveEvent(null)}
        overlayColor={activeEvent?.overlayColor}
      >
        {activeEvent && (
          <>
            <img
              src={activeEvent.image}
              alt={activeEvent.name}
              className="lb-event-img"
            />
            <h2 className="lb-event-name">{activeEvent.name}</h2>
            <p className="lb-event-date">{activeEvent.date}</p>
            <p className="lb-event-time">{activeEvent.time}</p>
            <p className="lb-event-venue">{activeEvent.venue}</p>
            <p className="lb-event-couple">Sushil &amp; Aishwarya</p>
          </>
        )}
      </InteractiveLightbox>
    </>
  );
}
