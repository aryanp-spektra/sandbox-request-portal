/* Brand marks. Single source of truth for the logo asset paths so the long
   filenames live in exactly one place. Plain <img> keeps these robust without
   next/image config and avoids layout shift via explicit sizing. */

export const LOGO_MARK = "/cl-light-small.webp"; // cloud mark, works on light or dark
export const LOGO_LIGHT_FULL = "/cl-light-mode-full.png"; // dark text, for light bg
export const LOGO_WHITE_FULL = "/cl-dark-full.webp"; // white text, for dark bg
export const SITE_ICON = "/cl-light-small.webp";

/** The purple cloud mark. Works on light or dark surfaces. */
export function BrandMark({
  className = "",
  size = 36,
}: {
  className?: string;
  size?: number;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={LOGO_MARK}
      alt="CloudLabs"
      width={size}
      height={size}
      className={`object-contain ${className}`}
      style={{ width: size, height: size }}
    />
  );
}

/** Full white CloudLabs + Spektra Systems lockup. For always-dark surfaces. */
export function BrandLockupWhite({
  className = "",
  height = 28,
}: {
  className?: string;
  height?: number;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={LOGO_WHITE_FULL}
      alt="CloudLabs by Spektra Systems"
      className={`w-auto object-contain ${className}`}
      style={{ height }}
    />
  );
}

/** Theme-aware full CloudLabs lockup: colored (dark text) on light, white on
    dark. Use on surfaces whose background follows the light/dark theme. */
export function BrandLockup({
  className = "",
  height = 28,
}: {
  className?: string;
  height?: number;
}) {
  return (
    <span className={`inline-flex items-center ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={LOGO_LIGHT_FULL}
        alt="CloudLabs by Spektra Systems"
        className="block w-auto object-contain dark:hidden"
        style={{ height }}
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={LOGO_WHITE_FULL}
        alt=""
        aria-hidden="true"
        className="hidden w-auto object-contain dark:block"
        style={{ height }}
      />
    </span>
  );
}
