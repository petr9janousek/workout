// The app's frame: the current screen and the tab bar, plus a banner if
// saving ever fails. Data lives in DataProvider; which screen is shown is
// decided by the address (see hooks/useRoute.js).

import { useEffect } from 'react';
import { DataProvider, useData } from './data/DataProvider.jsx';
import { useRoute, TABS } from './hooks/useRoute.js';
import Icon from './components/ui/Icon.jsx';
import WorkoutScreen from './screens/workout/WorkoutScreen.jsx';
import HistoryScreen from './screens/history/HistoryScreen.jsx';
import ProgressScreen from './screens/progress/ProgressScreen.jsx';
import SettingsScreen from './screens/settings/SettingsScreen.jsx';

const SCREENS = { workout: WorkoutScreen, history: HistoryScreen, progress: ProgressScreen, settings: SettingsScreen };
const LABELS = { workout: 'Workout', history: 'History', progress: 'Progress', settings: 'Settings' };

export default function App() {
  return (
    <DataProvider>
      <Shell />
    </DataProvider>
  );
}

function Shell() {
  const { tab, path, switchTab } = useRoute();
  const { activeWorkout, saveError, actions } = useData();
  const Screen = SCREENS[tab];

  // New page → start at the top. (Opening/closing the exercise picker
  // isn't a new page, so the workout keeps its scroll position.)
  const page = [tab, ...path.filter((p) => p !== 'add')].join('/');
  useEffect(() => window.scrollTo(0, 0), [page]);

  return (
    <div className="app">
      {saveError && (
        <div className="error-banner" role="alert">
          <span>Couldn't save your last change: {saveError}</span>
          <button className="btn-text" onClick={actions.dismissSaveError}>OK</button>
        </div>
      )}

      <main className="screen">
        <Screen path={path} />
      </main>

      <nav className="tabbar">
        {TABS.map((t) => (
          <button key={t} className={tab === t ? 'tab active' : 'tab'} onClick={() => switchTab(t)} aria-current={tab === t ? 'page' : undefined}>
            <Icon name={t} />
            <span>{LABELS[t]}</span>
            {t === 'workout' && activeWorkout && tab !== 'workout' && <span className="tab-dot" aria-label="Workout in progress" />}
          </button>
        ))}
      </nav>
    </div>
  );
}
