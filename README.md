# 🚦 GLIDE-Lite — 高密度交通流量智慧號誌協調系統

> **Mei-Chu Hackathon 2025 · Maker Track · 🥈 2nd Place**
>
> An AI-powered traffic signal coordination system for Hsinchu County, featuring GLIDE green-wave optimization, Transit Signal Priority (TSP), and anti-bunching control.

## What is GLIDE-Lite?

GLIDE-Lite is a browser-based traffic simulation and visualization system that demonstrates how intelligent signal coordination can improve corridor traffic flow. Built during a 24-hour hackathon using Hsinchu County open data, the system simulates a 5-intersection arterial corridor and compares three control strategies in real time.

The project was recognized by the **Hsinchu County Transportation Bureau** and **Youth Department Director** for its potential public value.

## Features

**Three simulation modes:**

- **Fixed Timing** — baseline with pre-timed signals
- **GLIDE Green Wave** — progressive signal coordination that creates a "green wave" for vehicles traveling at the target cruise speed, reducing stops
- **GLIDE + TSP** — adds Transit Signal Priority for buses, with green extension, phase hold, and anti-bunching logic to maintain service regularity

**Real-time visualization:**

- Animated multi-lane corridor with 5 intersections modeled after real Hsinchu arterial roads (大學路口、光復路口、中正路口、民族路口、竹北側路口)
- Per-vehicle rendering with lane assignment, bus stop dwell, and stopped-vehicle indicators
- Live KPI dashboard showing progression rate, average delay, stop count, and travel time

**Bus operations:**

- Configurable headway, dwell time, and tolerance range
- TSP parameters: max green extension, max hold duration, cooldown period
- Bunching simulation toggle and anti-bunching control
- Per-route and per-stop monitoring tables

## Tech Stack

| Layer | Tools |
|-------|-------|
| Frontend | React 18, Vite 5, TailwindCSS 3 |
| Visualization | HTML5 Canvas (custom renderer) |
| Simulation engine | Python backend (FastAPI at `localhost:8001`) |
| RL training | SUMO-RL (reinforcement learning for multi-intersection coordination) |
| Dev tooling | ESLint, Prettier, Vitest, Testing Library |

## Quick Start

```bash
# Clone the repo
git clone https://github.com/ellatso/2025meichuhackathonteam8.git
cd 2025meichuhackathonteam8

# Install dependencies
npm install

# Start the frontend dev server
npm run dev
```

> **Note:** The simulation backend (FastAPI server on port 8001) must be running separately for the simulation to work. The frontend sends POST requests to `/glide/sim` with configuration parameters.

## Project Structure

```
2025meichuhackathonteam8/
├── public/              # Static assets
├── src/                 # React source code
├── index.html           # Main simulation UI (Canvas + controls)
├── package.json         # Dependencies and scripts
├── vite.config.js       # Vite configuration
├── tailwind.config.js   # TailwindCSS configuration
└── postcss.config.js    # PostCSS configuration
```

## Simulation Parameters

| Parameter | Default | Range | Description |
|-----------|---------|-------|-------------|
| Cycle length | 90s | 60–180s | Signal timing cycle |
| Cruise speed | 50 km/h | 30–70 km/h | Target green wave speed |
| Simulation steps | 300 | 180–600 | Duration of simulation run |
| Traffic volume | 1700 vph | 600–2200 vph | Per-direction, per-lane flow rate |
| Bus headway | 6 min | 2–20 min | Scheduled departure interval |
| TSP max extension | 10s | 0–30s | Max green time added for bus |
| TSP max hold | 30s | 0–60s | Max red hold for bus approach |
| TSP cooldown | 120s | 0–600s | Min gap between TSP activations |

## KPI Outputs

The system reports the following performance indicators after each simulation run:

- **Progression rate** — percentage of vehicles that pass through the corridor without stopping
- **Average stops per vehicle** — mean number of red-light stops on the mainline
- **Average signal delay** — mean time lost waiting at signals
- **Average travel time** — end-to-end corridor traversal time
- **TSP / Hold events** — count of transit priority activations

## Results

In our hackathon demonstration, the GLIDE green wave mode achieved approximately **30% improvement** in simulated corridor flow compared to the fixed-timing baseline, while the TSP mode maintained bus schedule adherence without significantly degrading general traffic performance.


## Acknowledgments

- **Hsinchu County Government** — open traffic data
- **Mei-Chu Hackathon 2025** organizers
- **SUMO** (Simulation of Urban MObility) — traffic simulation framework

## License

MIT
