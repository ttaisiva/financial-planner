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

## 5. Run

To run the client, run this command:

```
npm run dev
```

To run the server, run this command:

```
nodemon server/server.js
```
