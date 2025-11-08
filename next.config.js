// const nextConfig = {
//   images: {
//     domains: ['ipfs.io', 'ipfs.nx-innovation.shop'],
//   },
//   webpack: (config:any) => {
//     config.resolve.fallback = {
//       ...config.resolve.fallback,
//       fs: false,
//       net: false,
//       tls: false,
//     };
//     config.externals.push('electron');
//     return config;
//   },
//   turbopack: {},
// };

// module.exports = nextConfig;
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'ipfs.io',
      },
      {
        protocol: 'https',
        hostname: 'ipfs.nx-innovation.shop',
      },
    ],
  },
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    };
    
    // electron 모듈을 외부 모듈로 처리
    config.externals.push('electron'); 

    return config;
  },
  // turbopack: {},
};

module.exports = nextConfig;