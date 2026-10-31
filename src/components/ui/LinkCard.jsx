import Icon from './Icon.jsx';

// A card that opens another page: title, a grey line under it, and a chevron.
// icon: optional icon on the left. badge: optional element after the title.
export default function LinkCard({ title, sub, icon, badge, onClick, className = '' }) {
  return (
    <button className={`card card-button row-between link-card ${className}`.trim()} onClick={onClick}>
      <span className="link-card-main">
        {icon && <Icon name={icon} size={20} />}
        <span>
          <strong>{title}</strong>
          {badge}
          {sub && <span className="muted block small">{sub}</span>}
        </span>
      </span>
      <Icon name="chevron" size={18} />
    </button>
  );
}
