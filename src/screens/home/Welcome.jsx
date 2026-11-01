import { useState } from 'react';
import FitHeading from '../../components/ui/FitHeading.jsx';
import BodyFigure from '../../components/charts/BodyFigure.jsx';
import Icon from '../../components/ui/Icon.jsx';
import { openTab } from '../../hooks/useRoute.js';
import { useData } from '../../data/DataProvider.jsx';

// How warm each muscle gets on the chosen figure: a whole-body workout
// lighting up, the app's muscle map in miniature.
const WARM = { chest: 3, shoulders: 2, biceps: 2, triceps: 1, forearms: 1, abs: 2, obliques: 1, quads: 4, adductors: 2, calves: 1, glutes: 3, hamstrings: 2, lats: 3, traps: 1 };

// First run, one screen: who's training (the figures set the body drawing,
// recommended plans and rest), an optional name for training together, then
// three ways to start. Home follows with a short walkthrough (Tour.jsx). Home's heading
// answers this one: "Ready to train". The weekly goal isn't asked: it comes
// from the plan (or 2 without one), and can be changed in Settings.
export default function Welcome() {
  const { settings, actions } = useData();
  const [name, setName] = useState(settings.name);

  function start(where) {
    if (name.trim()) actions.setSetting('name', name.trim());
    actions.setSetting('setupDone', true);
    if (where === 'library') openTab('plans', 'library');
    if (where === 'new') openTab('plans', 'new');
  }

  const figure = (body, label) => (
    <button
      className={settings.body === body ? 'welcome-body on' : 'welcome-body'}
      role="radio"
      aria-checked={settings.body === body}
      onClick={() => actions.setSetting('body', body)}
    >
      <BodyFigure body={body} back={false} captions={false} levelOf={(m) => (settings.body === body ? WARM[m] || 1 : 0)} label="" />
      <span>{label}</span>
    </button>
  );

  return (
    <div className="welcome">
      <div className="welcome-hero">
        <FitHeading>Getting ready</FitHeading>
        <p className="welcome-lead">No account, no tracking.</p>
      </div>

      <div className="welcome-bodies" role="radiogroup" aria-label="Who's training">
        {figure('male', 'Man')}
        {figure('female', 'Woman')}
      </div>

      <input
        className="search"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Your name (optional, for training together)"
        aria-label="Your name, optional, for training together"
        autoComplete="given-name"
      />

      <div className="welcome-starts">
        <StartRow
          icon="list"
          title="Pick a ready-made plan"
          sub="2 to 6 days a week, ready to go"
          onClick={() => start('library')}
          main
        />
        <StartRow icon="plans" title="Make my own plan" sub="Name it, add exercises to each day" onClick={() => start('new')} />
        <StartRow icon="plus" title="Just start" sub="Pick exercises as you go" onClick={() => start('home')} />
      </div>
    </div>
  );
}

function StartRow({ icon, title, sub, onClick, main = false }) {
  return (
    <button className={main ? 'welcome-start main' : 'welcome-start'} onClick={onClick}>
      <span className="welcome-start-icon"><Icon name={icon} size={20} /></span>
      <span className="welcome-start-text">
        <strong>{title}</strong>
        <span className="muted small">{sub}</span>
      </span>
      <Icon name="chevron" size={18} />
    </button>
  );
}
