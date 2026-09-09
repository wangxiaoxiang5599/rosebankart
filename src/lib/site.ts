/**
 * Single source of truth for the organisation's details.
 * Transcribed from the old site's Contact and Info pages.
 */
export const site = {
  name: 'Rosebank Art Centre',
  tagline: 'Charitable Trust',
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
  /** Committee, as listed on the old Info page. */
  committee: [
    { name: 'Sue Gordon', role: 'President' },
    { name: 'Linda Bannister', role: 'Vice President' },
    { name: 'Angela George', role: 'Treasurer' },
    { name: 'Margaret Choat', role: 'Secretary' },
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
