/** @type {import('next').NextConfig} */
const nextConfig = {
  // eslint: {
  //   // Allow builds to complete while addressing lint warnings/errors
  //   ignoreDuringBuilds: true,
  // },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        
      },
      // Etsy listing images (used by chelleConfig until images move to S3)
      { protocol: 'https', hostname: 'i.etsystatic.com' },
      // ** = any depth, needed for <bucket>.s3.<region>.amazonaws.com
      { protocol: 'https', hostname: '**.amazonaws.com' },
      { protocol: 'https', hostname: 's3.amazonaws.com' },
      // if using CloudFront:
      { protocol: 'https', hostname: 'd23es5hp06bfni.cloudfront.net' },
    ],
  },
};

module.exports = nextConfig;
