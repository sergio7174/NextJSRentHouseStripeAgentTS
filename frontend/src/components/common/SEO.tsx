import Head from 'next/head';

interface SEOProps {
  title?: string;
  description?: string;
  canonical?: string;
  ogImage?: string;
  noIndex?: boolean;
}

export default function SEO({
  title = 'RentControl | Premium Asset & Property Management',
  description = 'Optimize your assets, automate leases, and control your finances with RentControl.',
  canonical = 'https://www.rentcontrol.com',
  ogImage = 'https://www.rentcontrol.com/images/og-default.jpg',
  noIndex = false,
}: SEOProps) {
  const fullTitle = title.includes('RentControl') ? title : `${title} | RentControl`;

  return (
    <Head>
      {/* Basic Metadata */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta name="robots" content={noIndex ? 'noindex, nofollow' : 'index, follow'} />
      <link rel="canonical" href={canonical} />

      {/* Open Graph (Facebook, LinkedIn, Slack) */}
      <meta property="og:type" content="website" />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:url" content={canonical} />
      <meta property="og:site_name" content="RentControl" />

      {/* Twitter Cards */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />
    </Head>
  );
}