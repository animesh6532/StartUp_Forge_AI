/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      {
        source: "/startups",
        destination: "/dashboard",
        permanent: true,
      },
      {
        source: "/settings",
        destination: "/profile",
        permanent: true,
      },
      {
        source: "/market-research",
        destination: "/dashboard",
        permanent: true,
      },
      {
        source: "/financial-models",
        destination: "/dashboard",
        permanent: true,
      },
      {
        source: "/pitch-decks",
        destination: "/dashboard",
        permanent: true,
      },
      {
        source: "/executions",
        destination: "/dashboard",
        permanent: true,
      },
    ];
  },
};

module.exports = nextConfig;
