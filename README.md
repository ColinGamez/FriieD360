# FriieD 360 Studio

A modern, local-first Xbox 360 content manager for avatar items and themes.

## Features

- **Local-First Scanning**: Recursively scan your local folders for Xbox 360 content.
- **Extension Repair**: Automatically detect and fix extensionless files (adds `.CON`).
- **Installed Detection**: Point to your Xbox HDD/USB to see which items are already installed.
- **Staging System**: Organize items into the standard Xbox 360 folder structure (`Content/0000000000000000/...`).
- **USB Export**: One-click deployment to removable drives.
- **Collections**: Group your items into custom curated sets.

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [npm](https://www.npmjs.com/)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/friied-360-studio.git
   cd friied-360-studio
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open your browser to `http://localhost:3000`.

## Usage

1. **Settings**: Add your source folders where you keep your Xbox 360 content.
2. **Scan**: Click "Scan Now" to index your library.
3. **Library**: Browse your Avatar Items and Themes.
4. **Stage**: Add items to the staging queue.
5. **Export**: Go to the USB Export tab to deploy your staged items to a drive.

## License

This project is licensed under the Apache-2.0 License.
