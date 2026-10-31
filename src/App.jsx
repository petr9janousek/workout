// The app's frame: the current screen and the tab bar, plus a banner if
// saving ever fails. Data lives in DataProvider; which screen is shown is
// decided by the address (see hooks/useRoute.js).

import { useEffect } from 'react';
import { DataProvider, useData } from './data/DataProvider.jsx';
import { useRoute, TABS } from './hooks/useRoute.js';
import { useNow } from './hooks/useNow.js';
import Icon from './components/ui/Icon.jsx';
import RestTimer from './components/workout/RestTimer.jsx';
import HomeScreen from './screens/home/HomeScreen.jsx';
import ProgressScreen from './screens/progress/ProgressScreen.jsx';
import PlansScreen from './screens/plans/PlansScreen.jsx';
import ExercisesScreen from './screens/exercises/ExercisesScreen.jsx';
import { formatClock } from './model/format.js';

const SCREENS = { home: HomeScreen, progress: ProgressScreen, plans: PlansScreen, exercises: ExercisesScreen };
const LABELS = { home: 'Home', progress: 'Progress', plans: 'Plans', exercises: 'Exercises' };

export default function App() {
  return (
    <DataProvider>
      <Shell />
    </DataProvider>
  );
}

function Shell() {
  const { tab, path, openTab } = useRoute();
  const { activeWorkout, saveError, actions } = useData();
  const Screen = SCREENS[tab];

  // New page → start at the top. (Opening/closing the exercise picker
  // isn't a new page, so the workout keeps its scroll position.)
  const page = [tab, ...path.filter((p) => p !== 'add')].join('/');
  // Braces matter: an effect may only return a cleanup function. Newer browsers
  // make scrollTo() return a Promise, and React would try to call it.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [page]);

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

      {/* While a workout runs, the rest timer floats above the tabs on every screen. */}
      {activeWorkout && <RestTimer workout={activeWorkout} />}

      <nav className="tabbar">
        {TABS.map((t) => (
          <button key={t} className={tab === t ? 'tab active' : 'tab'} onClick={() => openTab(t)} aria-current={tab === t ? 'page' : undefined}>
            {t === 'home' && activeWorkout ? (
              <WorkoutTab startedAt={activeWorkout.startedAt} />
            ) : (
              <>
                <Icon name={t} />
                <span>{LABELS[t]}</span>
              </>
            )}
          </button>
        ))}
      </nav>
    </div>
  );
}

// While a workout runs, Home is the workout: the tab shows its clock.
function WorkoutTab({ startedAt }) {
  const now = useNow();
  return (
    <>
      <Icon name="timer" />
      <span className="tab-clock" aria-label="Workout in progress">{formatClock(now - Date.parse(startedAt))}</span>
    </>
  );
}
