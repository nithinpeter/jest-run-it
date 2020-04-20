import {platform} from 'os';

/**
 * Get the default Jest path based on the OS
 * @param LINUX Linux path
 * @param MAC MacOS path
 * @param WINDOWS Windows Path
 */
export const getDefaultJestPathForOS = ({LINUX, MAC, WINDOWS}: { [os: string]: string }): string => {
  const osPlatform = platform();

  if (isWindows(osPlatform)) {
    return WINDOWS;
  }

  if (isMacOS(osPlatform)) {
    return MAC;
  }

  return LINUX;
};


/**
 * Check out linux platform
 */
const isLinux = (p: NodeJS.Platform) => {
  const platforms = [
    'aix',
    'android',
    'linux',
  ];

  return platforms.indexOf(p) >= 0;
};

/**
 * Check out MacOS platform
 */
const isMacOS = (p: NodeJS.Platform) => {
  const platforms = [
    'darwin',
    'freebsd',
  ];

  return platforms.indexOf(p) >= 0;
};

/**
 * Check out Windows platform
 */
const isWindows = function (p: NodeJS.Platform) {
  return p && p.match(/^win/) !== null;
};

