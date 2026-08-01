interface WeddingEvent {
  id: string;
  name: string;
  date: string;
  time: string;
  venue: string;
  mapLink: string;
  /** Full-bleed illustration behind the frosted glass panel */
  cardBg: string;
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
    cardBg: "/images/Morning.webp",
  },
  {
    id: "lunch",
    name: "Wedding Lunch",
    date: "September 13",
    time: "11:30 AM",
    venue: "TDM Hall",
    mapLink:
      "https://www.google.com/maps/place/X79M%2B5HP+TDM+Hall,+Durbar+Hall+Rd,+opposite+Durbar+Hall+Ground,+Ernakulam+South,+Ernakulam,+Kerala+682016,+India/data=!4m2!3m1!1s0x3b0872b21e2ce8ef:0x4b0aa762fde2bb71!18m1!1e1?utm_source=mstt_1&entry=gps&coh=192189&g_ep=CAESBzI2LjI5LjIYACCenQoqlQEsOTQyNjc3MjcsOTQyOTIxOTUsOTQyOTk1MzIsMTAwNzk2NDk4LDEwMDc5Nzc2MSwxMDA3OTU2MjUsOTQyODA1NzYsOTQyMDczOTQsOTQyMDc1MDYsOTQyMDg1MDYsOTQyMTg2NTMsOTQyMjk4MzksOTQyNzUxNjgsOTQyNzk2MTksMTAwODE1NjQwLDEwMDgxMjk5NEICQUU%3D&skid=cc788467-737d-4881-9fe0-e446d4cac314&g_st=aw",
    cardBg: "/images/Afternoon.webp",
  },
  {
    id: "reception",
    name: "Reception",
    date: "September 19",
    time: "7:30 PM",
    venue: "Konkan Samudhai Bhavan",
    mapLink:
      "https://www.google.com/maps/place/1st+Floor,+Konkan+Samudhai+Bhavan,+90,+7th+Main+Rd,+Chellikere,+Chelekare,+Kalyan+Nagar,+Bengaluru,+Karnataka+560043/data=!4m2!3m1!1s0x3bae172fe0932ac9:0x5aac6453cb4328b9!18m1!1e1?utm_source=mstt_1&entry=gps&coh=192189&g_ep=CAESBzI2LjI5LjIYACCenQoqlQEsOTQyNjc3MjcsOTQyOTIxOTUsOTQyOTk1MzIsMTAwNzk2NDk4LDEwMDc5Nzc2MSwxMDA3OTY1MzUsOTQyODA1NzYsOTQyMDczOTQsOTQyMDc1MDYsOTQyMDg1MDYsOTQyMTg2NTMsOTQyMjk4MzksOTQyNzUxNjgsOTQyNzk2MTksMTAwODE1NjQwLDEwMDgyMDIzN0ICSU4%3D&skid=056b68d5-ea69-4323-9978-ad43574a91e6&g_st=aw",
    cardBg: "/images/Night.webp",
  },
];

export default function EventTimeline() {
  return (
    <div id="timeline">

      {/* Section header */}
      <div className="timeline-header scroll-anim delay-1">
        <p className="timeline-eyebrow">Join us for</p>
        <h2 className="timeline-heading">The Festivities</h2>
        <p className="timeline-intro">
          We joyfully request the honour of your presence
        </p>
      </div>

      {/* Continuous full-bleed panorama: the three scenes stack with no
          gaps, each one cross-fading into the next */}
      <div className="timeline-scenes">
        {EVENTS.map((ev, idx) => (
          <article
            className={`ev-scene${idx > 0 ? " ev-scene--overlap" : ""}${
              idx === 0 ? " ev-scene--first" : ""
            }${idx === EVENTS.length - 1 ? " ev-scene--last" : ""}`}
            key={ev.id}
          >
            {/* Scene illustration filling the band edge-to-edge */}
            <img
              src={ev.cardBg}
              alt=""
              className="ev-scene__bg"
              aria-hidden="true"
              draggable={false}
            />

            {/* Frosted glass panel */}
            <div className={`ev-scene__glass scroll-anim delay-${idx + 2}`}>
              <h3 className="ev-card__name">{ev.name}</h3>

              <p className="ev-card__datetime">
                <span>{ev.date}</span>
                <span className="ev-card__sep" aria-hidden="true">·</span>
                <span>{ev.time}</span>
              </p>

              <p className="ev-card__venue">{ev.venue}</p>

              <a
                href={ev.mapLink}
                target="_blank"
                rel="noopener noreferrer"
                className="ev-card__maplink"
              >
                Get Directions ↗
              </a>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
