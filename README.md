# FriieD360 Studio

FriieD360 Studio is a local-first Xbox 360 content manager for scanning, organizing, staging, and exporting Xbox 360 packages from your own drives. It runs entirely on your machine and keeps its working state in local files.

## What It Handles

- Avatar items
- Themes
- Gamerpics
- DLC, demos, and title updates
- XBLA and GOD packages
- Profile-linked content owners for staging and USB export

## Current Highlights

- Recursive local scanning with optional startup scans
- Extension repair for extensionless `.CON` content
- Metadata lookup, custom Title ID mappings, and profile mappings
- Installed-content detection against Xbox HDD or USB roots
- Smart collections and custom collections
- Batch rename, duplicate cleanup, integrity checks, and library organization
- Staging previews with Xbox 360 content-path layout
- Quick stage copy, export wizard, and one-click USB export
- Local activity history and dashboard health views

## Requirements

- Node.js 18 or newer
- npm
- Windows is the primary supported environment for drive detection and free-space checks

## Setup

1. Clone the repository.
   ```bash
   git clone https://github.com/your-username/friied-360-studio.git
   cd friied-360-studio
   ```
2. Install dependencies.
   ```bash
   npm install
   ```
3. Start the app in development mode.
   ```bash
   npm run dev
   ```
4. Open `http://localhost:3000`.

## Scripts

- `npm run dev`
  Starts the Express + Vite development server through `tsx`.
- `npm run build`
  Builds the frontend into `dist/`.
- `npm start`
  Starts the production server with the built frontend.
- `npm run clean`
  Removes the `dist/` folder.
- `npm run lint`
  Runs TypeScript type-checking with `tsc --noEmit`.

## Typical Workflow

1. Open **Settings** and add one or more source folders.
2. Run **Scan Now** or use the dashboard/library scan actions.
3. Review content in the library views, game hubs, and collections.
4. Fix issues in **Maintenance** if you have missing metadata, duplicates, or extensionless files.
5. Add content to **Staging Area** or export directly through **USB Export**.
6. Choose the correct content owner for profile-scoped packages before staging or USB deployment.

## Notes

- The app is local-first and does not require a cloud backend.
- `db.json` stores indexed library state, settings, collections, and recent activity locally.
- Production mode expects a built `dist/` folder, so run `npm run build` before `npm start`.

## License

This project is licensed under the Apache-2.0 License.
