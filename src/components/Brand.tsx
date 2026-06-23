/* Brand marks. Single source of truth for the logo asset paths so the long
   filenames live in exactly one place. Plain <img> keeps these robust without
   next/image config and avoids layout shift via explicit sizing. */

export const LOGO_MARK = "/logo.png";
export const LOGO_WHITE_FULL = "/CloudLabs-with-SS-white-Full-1024x346-1-768x260-1.png";

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

/** Full white CloudLabs + Spektra Systems lockup. For dark surfaces only. */
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
