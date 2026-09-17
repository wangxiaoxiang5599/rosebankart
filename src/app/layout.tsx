import type { Metadata } from 'next';
import { Lora, Nunito_Sans } from 'next/font/google';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import { site } from '@/lib/site';
import '@/styles/globals.css';

// The old site's two typefaces, kept so the rebuild still reads as the same place.
const lora = Lora({ subsets: ['latin'], variable: '--font-lora', display: 'swap' });
const nunito = Nunito_Sans({ subsets: ['latin'], variable: '--font-nunito', display: 'swap' });

export const metadata: Metadata = {
  // Makes every relative URL below — canonical, share image — absolute.
  metadataBase: new URL(site.url),
  title: {
    default: `${site.name} — ${site.tagline}`,
    template: `%s — ${site.name}`,
  },
  description: site.intro,
  openGraph: {
    siteName: site.name,
    title: site.name,
    description: site.intro,
    type: 'website',
    locale: 'en_NZ',
    // The villa photograph, so a link shared on Facebook shows the building.
    images: [{ url: '/hero-1200.jpg', width: 1200, height: 800, alt: `${site.name}, ${site.address.town}` }],
  },
};

/**
 * Tells search engines what this place is, in their own vocabulary: an art
 * organisation at a street address, with an email and a Facebook page.
 */
const organisation = {
  '@context': 'https://schema.org',
  '@type': 'ArtGallery',
  name: site.name,
  url: site.url,
  email: site.email,
  sameAs: [site.facebook],
  image: `${site.url}/hero-1200.jpg`,
  address: {
    '@type': 'PostalAddress',
    streetAddress: site.address.street,
    addressLocality: site.address.town,
    postalCode: site.address.postcode,
    addressCountry: 'NZ',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-NZ" className={`${lora.variable} ${nunito.variable}`}>
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organisation) }}
        />
        <a className="skip-link" href="#main">Skip to content</a>
        <SiteHeader />
        <main id="main">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
