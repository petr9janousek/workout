// A heading stretched to exactly the full width of its container, whatever
// the phone's screen size or font. Drawn as SVG text so the width is exact.
export default function FitHeading({ children, as: Tag = 'h1', className = '' }) {
  return (
    <Tag className={`fit-heading ${className}`} aria-label={children}>
      <svg viewBox="0 0 100 16" aria-hidden="true">
        <text x="0" y="14.2" textLength="100" lengthAdjust="spacingAndGlyphs">
          {children}
        </text>
      </svg>
    </Tag>
  );
}
