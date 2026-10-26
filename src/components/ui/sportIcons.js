// Sport icons for activities, from Tabler Icons (https://tabler.io/icons),
// copied here so they work offline. Same 24×24 line style as Icon.jsx.
//
// MIT License. Copyright (c) 2020-2026 Paweł Kuna
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions: The above copyright
// notice and this permission notice shall be included in all copies or
// substantial portions of the Software. THE SOFTWARE IS PROVIDED "AS IS",
// WITHOUT WARRANTY OF ANY KIND.

// activity type id → the icon's paths
export const SPORT_ICONS = {
  run: ['M11.007 5a2 2 0 1 0 4 0a2 2 0 1 0 -4 0', 'M4 17l5 1l.75 -1.5', 'M15 21v-4l-4 -3l1 -6', 'M7 12v-3l5 -1l3 3l3 1'], // run
  walk: ['M12 4a1 1 0 1 0 2 0a1 1 0 1 0 -2 0', 'M7 21l3 -4', 'M16 21l-2 -4l-3 -3l1 -6', 'M6 12l2 -3l4 -1l3 3l3 1'], // walk
  cycle: ['M2 18a3 3 0 1 0 6 0a3 3 0 0 0 -6 0', 'M16 18a3 3 0 1 0 6 0a3 3 0 0 0 -6 0', 'M12 19v-4l-3 -3l5 -4l2 3h3', 'M13.007 5a2 2 0 1 0 4 0a2 2 0 1 0 -4 0'], // bike
  swim: ['M15 9a1 1 0 1 0 2 0a1 1 0 1 0 -2 0', 'M6 11l4 -2l3.5 3l-1.5 2', 'M3 16.75a2.4 2.4 0 0 0 1 .25a2.4 2.4 0 0 0 2 -1a2.4 2.4 0 0 1 2 -1a2.4 2.4 0 0 1 2 1a2.4 2.4 0 0 0 2 1a2.4 2.4 0 0 0 2 -1a2.4 2.4 0 0 1 2 -1a2.4 2.4 0 0 1 2 1a2.4 2.4 0 0 0 2 1a2.4 2.4 0 0 0 1 -.25'], // swimming
  dance: ['M3 17a3 3 0 1 0 6 0a3 3 0 0 0 -6 0', 'M13 17a3 3 0 1 0 6 0a3 3 0 0 0 -6 0', 'M9 17v-13h10v13', 'M9 8h10'], // music
  yoga: ['M4 20h4l1.5 -3', 'M17 20l-1 -5h-5l1 -7', 'M4 10l4 -1l4 -1l4 1.5l4 1.5', 'M10.007 5a2 2 0 1 0 4 0a2 2 0 1 0 -4 0'], // yoga
  hike: ['M11 4a1 1 0 1 0 2 0a1 1 0 1 0 -2 0', 'M7 21l2 -4', 'M13 21v-4l-3 -3l1 -6l3 4l3 2', 'M10 14l-1.827 -1.218a2 2 0 0 1 -.831 -2.15l.28 -1.117a2 2 0 0 1 1.939 -1.515h1.439l4 1l3 -2', 'M17 12v9', 'M16 20h2'], // trekking
  sport: ['M3 12a9 9 0 1 0 18 0a9 9 0 1 0 -18 0', 'M12 7l4.76 3.45l-1.76 5.55h-6l-1.76 -5.55l4.76 -3.45', 'M12 7v-4m3 13l2.5 3m-.74 -8.55l3.74 -1.45m-11.44 7.05l-2.56 2.95m.74 -8.55l-3.74 -1.45'], // ball-football
  climb: ['M3 20h18l-6.921 -14.612a2.3 2.3 0 0 0 -4.158 0l-6.921 14.612', 'M7.5 11l2 2.5l2.5 -2.5l2 3l2.5 -2'], // mountain
  other: ['M3 12h4l3 8l4 -16l3 8h4'], // activity
};
