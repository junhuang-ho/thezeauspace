export function isAndroid(): boolean {
  return (
    typeof navigator !== "undefined" && /android/i.test(navigator.userAgent)
  );
}

export function isSmallIOS(): boolean {
  return (
    typeof navigator !== "undefined" && /iPhone|iPod/.test(navigator.userAgent)
  );
}

export function isLargeIOS(): boolean {
  return typeof navigator !== "undefined" && /iPad/.test(navigator.userAgent);
}

export function isIOS(): boolean {
  return isSmallIOS() || isLargeIOS();
}

export function isMobileDevice(): boolean {
  return isAndroid() || isSmallIOS();
}

// ref: https://vhudyma-blog.eu/detect-mobile-device-in-react/#:~:text=One%20of%20the%20most%20common,request%20header%20of%20the%20navigator.
