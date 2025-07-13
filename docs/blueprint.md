# **App Name**: LFBBC Finances

## Core Features:

- Responsive Design: Responsive design with a mobile-first approach.
- Dual Theme: Implements light and dark themes, stored in local storage
- Dashboard: Dashboard shows the overall balance, and a toggle button allows obscuring the balance amount, and show motivational finance quote when toggled.
- Records Table: Displays the data in a filterable tabular format. The amounts are color coded.
- Quick Record Form: Form to create quick financial records with commonly used data. Streamlines entry of simple records.
- Detailed Record Form: Form to create detailed financial records with autocompletion, and comprehensive options.
- CSV Actions: Imports and exports CSV files that manage the financial records data.

## Style Guidelines:

- The app implements a dual theme: Light mode background is white (#FFFFFF), body is light gray (#F0F2F5), text is dark gray (#1A202C), and primary accent color is blue (#007BFF). Dark mode background is dark navy (#0D1B2A), cards are slightly lighter (#1A2736), text is light gray (#E0E6EB), and the primary accent color is gold/amber (#F7B500).
- Font: 'Inter' (sans-serif) for all text. Note: currently only Google Fonts are supported.
- Single-Page Application layout with a fixed header, scrollable main content area, and fixed bottom tab bar.
- Interactive components (buttons, inputs) have clear visual states for hover and focus, adapted to each theme.
- Cards and containers use rounded borders and subtle shadows.
- Bottom navigation bar icons are SVG and correspond to tab labels, with the active tab highlighted in the current theme's accent color.
- Smooth transitions between themes, as well as when displaying, hiding, and updating components.