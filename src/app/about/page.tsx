import Link from 'next/link';
import { PageHeader } from '@/components/PageHeader';
import { site } from '@/lib/site';
import styles from './about.module.css';

export const metadata = {
  title: 'About',
  description: `The history of ${site.name}, the art house on ${site.address.street}, ${site.address.town}, what members get, and the charitable trust that runs it.`,
  alternates: { canonical: '/about' },
};

const BENEFITS = [
  'Our monthly newsletter.',
  'Art sessions on Monday, Wednesday and Friday mornings to explore, learn and enjoy art. We do our best to let you know if the centre is booked for a workshop or exhibition at those times.',
  'You can borrow from our library’s extensive range of books on art, art history, artists, crafts, techniques, and instructional material.',
  'Use of the display boards, easels, boards and some art supplies.',
  'A place to show your work in the art house through the year, whenever there is no exhibition on.',
  'Access to the gallery on this website, which is kept for members — exhibitions and workshops, past and present.',
  'Access to our member exhibitions, including the annual Visual Artist Exhibition at Te Awamutu Library each October.',
  'Access to our private members’ Facebook group.',
] as const;

/**
 * Merges the old About page with the old "Info" page, which held the committee
 * list, membership fees and donation note. Info was a catch-all with no reason
 * to exist on its own. History, the art house and the membership detail were
 * written for the site by the committee in 2026.
 */
export default function AboutPage() {
  return (
    <>
      <PageHeader title="About us" lede={site.intro} />

      <div className="wrap">
        <div className={styles.layout}>
          <section className={`${styles.main} prose`}>
            <h2>Who we are</h2>
            <p>
              Rosebank Art Centre is a charitable trust run by its members. We hold
              exhibitions, run workshops and classes, and provide a place for artists in
              and around Te Awamutu to work and show their art.
            </p>
            <p>
              Members meet at the centre on {site.address.street}. Everyone is welcome,
              whatever your level of experience.
            </p>

            {/* The committee's own wording, kept as written at their request. */}
            <h2>Our history</h2>
            <p>
              In 1992, the Waipa Art Society took possession of a vintage cottage which was
              eventually shifted to its current location at 337 Churchill Street in Te
              Awamutu. In 2001, the Waipa Community Arts Council took over responsibility
              of the cottage after the Society went into recession.
            </p>
            <p>
              In November 2003, the newly constituted Rosebank Art Centre Charitable Trust
              assumed responsibility for the Art Centre, which continues with some support
              from the Waipa District Council to present day.
            </p>
            <p>
              The Charitable Trust offers this community art facility in Te Awamutu to
              foster, promote, and support local arts/artist’s endeavours in the Waipa
              Region.
            </p>

            <h2>The art house</h2>
            <p>
              The cottage works as a gallery, a workshop and a meeting place. It has:
            </p>
            <ul>
              <li>three rooms — two small and one large — and a hallway, all used to hang art</li>
              <li>a kitchen, a painters’ cleaning area and a toilet</li>
              <li>a front verandah with plenty of outdoor space, and an outdoor table and bench</li>
            </ul>
            <p>
              The large room comfortably accommodates art workshops (10–12 people),
              exhibitions and the weekday art sessions.
            </p>

            <h2>Membership</h2>
            <p>
              Artists of every level are welcome, from complete beginners to seasoned
              professionals. Members draw, paint and craft in a supportive, creative
              setting, with a wealth of skill, knowledge and experience to share.
            </p>
            <h3>What members get</h3>
            <ul>
              {BENEFITS.map((benefit) => (
                <li key={benefit}>{benefit}</li>
              ))}
            </ul>
            <h3>How members help</h3>
            <p>
              Members are encouraged to take part in art challenges, workshops and
              exhibitions through the year, and to help look after the art house — at
              working bees, setting up and packing down exhibitions, delivering flyers and
              posters around town, and at fundraising events.
            </p>

            <h2>Our committee</h2>
            <p>
              The centre is run by the Rosebank Art Centre Charitable Trust governed by its
              constitution and looks after the art house for members to use. We currently
              have eight trustees including the chairperson, treasurer, and secretary. We
              are an active committee and gladly welcome members’ ideas.
            </p>
            <ul className={styles.people}>
              {site.committee.map((person) => (
                <li key={person.name}>
                  <span className={styles.personName}>{person.name}</span>
                  <span className={styles.personRole}>{person.role}</span>
                </li>
              ))}
            </ul>
            <ul className={styles.meetings}>
              <li>
                <strong>Committee meetings</strong> are held every two months, and any
                member is welcome to come along.
              </li>
              <li>
                <strong>The annual general meeting</strong> is in May each year, unless we
                let you know otherwise. It is open to members and the public, and it is at
                this meeting new trustees and officers are appointed.
              </li>
            </ul>
          </section>

          <aside className={styles.side}>
            <div className={styles.card}>
              <h2 className={styles.cardHeading}>Membership</h2>
              <p className={styles.fee}>
                <strong>${site.membership.single}</strong> a year for one person
                <br />
                <strong>${site.membership.couple}</strong> a year for a couple
              </p>
              <p className={styles.cardNote}>
                New members are always welcome. Get in touch to join in on the creative
                fun.
              </p>
              <a className={styles.cardBtn} href={`mailto:${site.email}`}>
                Email us to join
              </a>
            </div>

            <div className={styles.card}>
              <h2 className={styles.cardHeading}>Come and visit</h2>
              <p className={styles.cardNote}>
                Drop in during our opening hours on Monday, Wednesday and Friday
                mornings.
              </p>
              <Link className={styles.cardBtnGhost} href="/contact">
                Opening hours and directions
              </Link>
            </div>

            <div className={styles.card}>
              <h2 className={styles.cardHeading}>Donations</h2>
              <p className={styles.cardNote}>
                We are a charitable trust and welcome donations towards the running of
                the centre. Please contact us if you would like to support our work.
              </p>
              <a className={styles.cardBtnGhost} href={`mailto:${site.email}`}>
                Contact us about donating
              </a>
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}
