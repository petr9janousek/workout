import { useData } from '../../data/DataProvider.jsx';

// On a phone, when the app is open in the browser instead of installed to the
// home screen: Safari deletes a website's data after 7 days of use without a
// visit, Chrome may clear it when space runs low. Installed, it's kept (iOS:
// home screen apps have their own counter; Chrome: installed sites get
// persistent storage). Hidden for 30 days on "Not now".
const isPhone = () => /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
const installed = () => window.matchMedia?.('(display-mode: standalone)').matches || navigator.standalone === true;
const isIos = () => /iPhone|iPad|iPod/i.test(navigator.userAgent);

export default function InstallHint() {
  const { settings, actions } = useData();
  const hidden = settings.installHintHidden && Date.now() - Date.parse(settings.installHintHidden) < 30 * 864e5;
  if (!isPhone() || installed() || hidden) return null;

  return (
    <section className="reminder install-hint" role="status">
      <p>
        <strong>Install the app to keep your data.</strong>{' '}
        {isIos() ? 'Safari might delete it after 7 days of inactivity. Share → Add to Home Screen.' : 'Chrome might clear it when the phone runs low on space. Menu ⋮ → Install app.'}
      </p>
      <button className="btn-text small-link muted" onClick={() => actions.setSetting('installHintHidden', new Date().toISOString())}>
        Not now
      </button>
    </section>
  );
}
