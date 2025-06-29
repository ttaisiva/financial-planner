# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript and enable type-aware lint rules. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

# Lifetime Financial Planner (LFP)

CSE 416 Spring 2025 - The Manatees that like to play and draw

# Installation Manual

## 1. Download/clone this repository.

## 2. Install [Node.js](https://nodejs.org/en/download/).

We will use this to manage React and the packages needed to run our server. Installing Node.js also comes with the npm package manager.

## 3. Install

Install all dependencies with this command:

```
npm install
```

Install dnd dependencies:

```
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

## 4. Constants

For the server to work, you will need to make a .env file with the correct variables.

Create a file in the root directory with the name `.env`.

Input the following lines in the `.env` file:

```
Edit with variables for assignment. Don't actually push variables.
```

## 5. Run Application

To run the client, run this command:

```
npm run dev
```

To run the server, run this command:

```
nodemon server/server.js
```

## 6. Run Tests

To run tests, run this command:

```
npm run test
```

To view the coverage of the tests along with running them, run either of the following commamds:

```
npm run test:coverage
```

```
npx vitest run --coverage
```

## Disclaimer
This application is not a substitute for professional financial advice. Anyone who makes decisions based on its output does so at their own risk.
