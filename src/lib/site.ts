/**
 * Single source of truth for the organisation's details.
 * Transcribed from the old site's Contact and Info pages.
 */
export const site = {
  name: 'Rosebank Art Centre',
  tagline: 'Charitable Trust',
  /** Where the site lives. Canonical links, the sitemap and share cards all need the absolute form. */
  url: 'https://rosebankartcentre.org',
  intro:
    'Rosebank Art Centre is a community art facility in Te Awamutu that aims to foster, promote and support local arts.',
  address: {
    street: '337 Churchill Street',
    town: 'Te Awamutu',
    postcode: '3800',
    country: 'New Zealand',
  },
  email: 'rosebankartcentre@gmail.com',
  facebook: 'https://www.facebook.com/rosebankartcentre',
  membership: {
    single: 50,
    couple: 60,
  },
  /**
   * When the art house is open — the same mornings as the members' art
   * sessions. 24-hour times, the form schema.org wants; `formatHours` turns
   * them into "10:30am – 12:30pm" for people.
   */
  hours: [
    { day: 'Monday', opens: '10:30', closes: '12:30' },
    { day: 'Wednesday', opens: '10:00', closes: '12:00' },
    { day: 'Friday', opens: '10:00', closes: '12:00' },
  ],
  /** Closure dates change every year, so they are announced on Facebook rather than kept here. */
  hoursNote:
    'Closed on public holidays, including the Christmas and New Year break. Closures are announced on our Facebook page.',
  /** Current officers — the board has eight trustees, but only these are named. */
  committee: [
    { name: 'Murray Shaw', role: 'Chairperson' },
    { name: 'Margaret Choat', role: 'Treasurer' },
    { name: 'Dawn Greenwood', role: 'Secretary' },
  ],
} as const;

export const nav = [
  { href: '/', label: 'Home' },
  { href: '/events', label: 'Events' },
  { href: '/gallery', label: 'Gallery' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
] as const;

/** The two kinds of thing that get posted. Deliberately only two. */
export const EVENT_KINDS = {
  exhibition: { label: 'Exhibition', plural: 'Exhibitions' },
  workshop: { label: 'Workshop', plural: 'Workshops' },
} as const;

export type EventKind = keyof typeof EVENT_KINDS;
