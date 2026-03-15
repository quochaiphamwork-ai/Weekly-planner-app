# Weekly Planner Widget

Weekly Planner Widget is a desktop-friendly personal planner built with React, Vite, FullCalendar, and Electron. It was created as a first major project and focuses on turning a weekly schedule into a simple widget that stays easy to access during the day.

While the app is still being refined and may contain some bugs, it is already functional for personal use and reflects the progress of learning frontend and desktop application development.

![Weekly Planner Widget preview](./src/assets/hero.png)

## Highlights

- Weekly time-grid calendar with drag-and-drop and resize support
- Left-click add-task modal for title, time range, category, and color
- Right-click task editing menu
- Custom categories with reusable colors
- Current-time indicator and automatic scroll to the present time
- Resizable, movable Electron desktop widget
- Local task and category persistence using `localStorage`
- Windows packaging support with a custom app icon

## Tech Stack

- React
- Vite
- FullCalendar
- Electron

## Running The Project

Install dependencies:

```bash
npm install
```

Run in browser development mode:

```bash
npm run dev
```

Run as an Electron desktop widget in development:

```bash
npm run electron:dev
```

Build the frontend:

```bash
npm run build
```

Run the built Electron app:

```bash
npm run electron
```

Package the Windows app:

```bash
npm run dist:win
```

## Project Structure

```text
src/
  App.jsx                  App shell and widget resize controls
  components/Calendar.jsx  Calendar UI, task modals, and category logic

electron/
  main.js                  Electron main process
  preload.js               Safe bridge between Electron and React
  dev-runner.mjs           Starts Vite and Electron together in development
```

## Current Status

- Good for personal use
- Still under active development
- Some bugs and UI refinements are still being worked on

## Packaging

The Windows app is packaged with `electron-packager`, and the output is written to the `release/` folder.

## Future Improvements

- Hover time display on the red current-time line
- Expanded right-click editing options
- Better compact layout for smaller widget sizes
- Cleaner release workflow for GitHub downloads

## License

This project is currently shared without a formal license.
