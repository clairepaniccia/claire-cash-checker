# Claire Cash Checker

A simple web application to check Claire Cash balances stored in Airtable.

## Prerequisites

- Node.js (v14 or higher)
- npm (comes with Node.js)
- Airtable account with API access

## Setup

1. Clone this repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the root directory with the following content:
   ```
   # Airtable Configuration
   AIRTABLE_API_KEY=your_airtable_api_key_here
   AIRTABLE_BASE_ID=your_airtable_base_id_here
   
   # Server Configuration
   PORT=3000
   ```
4. Replace `your_airtable_api_key_here` with your Airtable API key
5. Replace `your_airtable_base_id_here` with your Airtable base ID

## Airtable Setup

1. Create a base in Airtable with at least these fields:
   - `Email` (Single line text)
   - `Claire Cash` (Number)

2. Make sure your table is named "Table 1" or update the table name in `server.js`

## Running the Application

1. Start the development server:
   ```bash
   npm run dev
   ```
2. Open your browser and navigate to `http://localhost:3000`

## Production Deployment

For production, you can use:
```bash
npm start
```

## Environment Variables

- `AIRTABLE_API_KEY`: Your Airtable API key
- `AIRTABLE_BASE_ID`: Your Airtable base ID
- `PORT`: Port number for the server (default: 3000)
