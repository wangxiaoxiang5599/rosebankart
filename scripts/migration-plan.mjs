/**
 * How the old site's 25 posts and 5 pages map onto the new structure.
 *
 * Everything on the old site was filed under "Uncategorized", so this mapping
 * was made by reading each post. It is deliberately written out by hand rather
 * than guessed at run time — it is the one part of the migration a human should
 * check, and keeping it in one list makes that possible.
 *
 * `sources` are old post IDs, in the order their pictures should appear.
 * The first picture found becomes the event's cover.
 */

export const EVENTS = [
  {
    slug: 'face-of-2020-visual-art-exhibition',
    title: 'Face of 2020 Visual Art Exhibition',
    kind: 'exhibition',
    startsOn: '2020-10-16',
    endsOn: '2020-10-18',
    location: 'i-SITE, Burchill Pavilion, Te Awamutu',
    summary: 'Visual art exhibition by Rosebank Art Centre artists, 10.00am – 4.00pm.',
    sources: [9],
  },
  {
    slug: 'art-at-the-library-2021',
    title: 'Art at the Library',
    kind: 'exhibition',
    startsOn: '2021-05-22',
    endsOn: null,
    location: 'Te Awamutu Library',
    summary: 'Work by centre members on show at the Te Awamutu Library.',
    // 193 and 199 were the same show posted twice on the same day.
    sources: [193, 199],
  },
  {
    slug: 'margaret-dixon-and-angela-george',
    title: 'Exhibition of Margaret Dixon and Angela George',
    kind: 'exhibition',
    startsOn: '2021-05-30',
    endsOn: null,
    location: null,
    summary: '',
    sources: [239],
  },
  {
    slug: 'historic-iconic-beautiful-te-awamutu',
    title: 'Historic, Iconic, Beautiful Te Awamutu Exhibition',
    kind: 'exhibition',
    startsOn: '2022-09-08',
    endsOn: null,
    location: null,
    summary:
      'A great exhibition at Rosebank Art Centre. It was well attended by the public and the feedback was excellent. Well done artists.',
    // The August posts were the poster, the September ones the show itself, and
    // 435 was a re-blog of 370. One exhibition, six posts.
    sources: [354, 358, 370, 435, 431, 429],
  },
  {
    slug: 'coming-soon-september-2022',
    title: 'Coming Soon',
    kind: 'exhibition',
    startsOn: '2022-09-19',
    endsOn: null,
    location: null,
    summary: '',
    sources: [437],
  },
  {
    slug: 'gretchen-gavey-susie-verry-margaret-day',
    title: 'Exhibition by Gretchen Gavey, Susie Verry and Margaret Day',
    kind: 'exhibition',
    startsOn: '2023-02-27',
    endsOn: null,
    location: null,
    summary: '',
    // 449 was the "up coming" notice for this same show.
    sources: [449, 452],
  },
  {
    slug: 'exhibition-september-2023',
    title: 'Exhibition',
    kind: 'exhibition',
    startsOn: '2023-09-17',
    endsOn: null,
    location: null,
    summary: '',
    sources: [466],
  },
  {
    slug: 'factory-challenge-2024',
    title: 'Factory Challenge',
    kind: 'exhibition',
    startsOn: '2024-03-04',
    endsOn: null,
    location: null,
    summary:
      'Members took on the Factory Challenge. The winner was Pip Annan with "Heart beat of a Rural town".',
    sources: [479],
  },
  {
    slug: 'frida-x-2',
    title: 'Frida x 2',
    kind: 'exhibition',
    startsOn: '2024-04-22',
    endsOn: null,
    location: null,
    summary: '',
    sources: [496],
  },

  /* -- Workshops and classes --------------------------------------------- */
  {
    slug: 'workshops-2020',
    title: 'Workshops',
    kind: 'workshop',
    startsOn: '2020-09-22',
    endsOn: null,
    location: null,
    summary: 'Heather Campbell – Basic Portraits. Elwyn Stone – Mixed Media II. Lindsay Muirhead – Landscapes (2 days, Sat and Sun).',
    sources: [66],
  },
  {
    slug: 'gretchens-clay-sculpture-class',
    title: "Gretchen's Clay Sculpture Class",
    kind: 'workshop',
    startsOn: '2022-07-04',
    endsOn: null,
    location: null,
    summary: '',
    // Posted twice, in February and again in July 2022.
    sources: [335, 260],
  },
  {
    slug: 'come-join-us-2023',
    title: 'Come Join Us!',
    kind: 'workshop',
    startsOn: '2023-02-28',
    endsOn: null,
    location: null,
    summary: '',
    sources: [459],
  },
  {
    slug: 'decorative-art-classes-2024',
    title: 'Decorative Art Classes 2024',
    kind: 'workshop',
    startsOn: '2024-02-08',
    endsOn: null,
    location: null,
    summary: '',
    sources: [475],
  },
];

/**
 * Sources whose pictures are artworks rather than event photography.
 * `page:N` refers to a page rather than a post.
 */
export const GALLERY_SOURCES = [
  'page:91',   // old home page — 32 pictures, 23 of them captioned with the artist
  'page:87',   // "Artwork"
  267,         // Spring/Summer Collection
  319,         // Summer Holiday Collection
  370,         // artwork photographed at the Historic-Iconic-Beautiful show
];

/** Posts intentionally left out, and why. */
export const DROPPED = {
  227: 'Empty post titled "Home" — no text, no pictures.',
  75: 'Committee list; now held in src/lib/site.ts and shown on /about.',
  'page:6': 'Old "Info" page — fees, donations and committee, folded into /about.',
  'page:7': 'Old "Contact Us" page — details now in src/lib/site.ts.',
  'page:8': 'Old "About" page — text now in src/lib/site.ts.',
  'page:91': 'Old home page kept only for its pictures, which go to the gallery.',
};

/**
 * The same artists were spelled several ways across ten years of captions,
 * which would otherwise show up as separate people in the gallery's filter.
 *
 * Only unambiguous typos are merged here. "Gretchen Gavey" is the spelling the
 * centre used in a post title, so the caption spelling "Garvey" and the bare
 * first name follow it — but that one is a judgement call and is worth
 * confirming with the committee.
 */
export const ARTIST_ALIASES = {
  'Janice Helh': 'Janice Hehl',
  'Maryanne Wolter Pryke': 'Maryanne Wolter-Pryke',
  'Gretchen Garvey': 'Gretchen Gavey',
  Gretchen: 'Gretchen Gavey',
};
