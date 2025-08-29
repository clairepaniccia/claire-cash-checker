require('dotenv').config();
const express = require('express');
const path = require('path');
const Airtable = require('airtable');

const app = express();
const port = process.env.PORT || 3000;

// Initialize Airtable
const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY })
  .base(process.env.AIRTABLE_BASE_ID);

// Middleware
app.use(express.json());
app.use(express.static('public'));

// Test endpoint to check Airtable connection
app.get('/api/test-connection', async (req, res) => {
  try {
    console.log('Testing Airtable connection...');
    console.log('API Key starts with:', process.env.AIRTABLE_API_KEY?.substring(0, 10));
    console.log('Base ID:', process.env.AIRTABLE_BASE_ID);
    
    // Try to access the base metadata
    const testBase = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY });
    console.log('Airtable client created successfully');
    
    res.json({ 
      status: 'Connection test completed', 
      apiKeyPrefix: process.env.AIRTABLE_API_KEY?.substring(0, 10),
      baseId: process.env.AIRTABLE_BASE_ID
    });
  } catch (error) {
    console.error('Connection test failed:', error);
    res.status(500).json({ error: error.message });
  }
});

// API endpoint to check Claire Cash
app.post('/api/check-balance', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    console.log('Searching for email:', email);
    console.log('Using table: Total Credit Remaining By Person');
    
    // Test different possible table names
    const possibleTableNames = [
      'Total Credit Remaining By Person',
      'Total Credit Remaining by Person',
      'Total_Credit_Remaining_By_Person',
      'Table 1',
      'tblTotalCreditRemainingByPerson'
    ];
    
    let workingTableName = null;
    let allRecords = null;
    
    for (const tableName of possibleTableNames) {
      try {
        console.log('Trying table name:', tableName);
        allRecords = await base(tableName)
          .select({
            maxRecords: 3
          })
          .firstPage();
        workingTableName = tableName;
        console.log('SUCCESS! Found working table name:', tableName);
        break;
      } catch (tableError) {
        console.log('Failed for table:', tableName, tableError.error);
      }
    }
    
    if (!workingTableName) {
      return res.status(500).json({ error: 'Could not find the correct table name. Please check your Airtable base.' });
    }
    
    console.log('Found', allRecords.length, 'total records');
    if (allRecords.length > 0) {
      console.log('Sample record fields:', Object.keys(allRecords[0].fields));
      console.log('Sample record data:', allRecords[0].fields);
    }

    const records = await base(workingTableName)
      .select({
        filterByFormula: `{Email} = '${email.toLowerCase()}'`
      })
      .firstPage();

    if (records.length === 0) {
      return res.json({ 
        hasCash: false, 
        message: 'You don\'t have any Claire Cash at the moment. If you think this is incorrect, <a href="https://clairepaniccia.com/support/" target="_blank">submit a support ticket here</a> and we\'ll look into it',
        isHtml: true
      });
    }

    const record = records[0];
    const cashAmount = record.fields['Total Credit Remaining'] || 0;

    if (cashAmount <= 0) {
      return res.json({ 
        hasCash: false, 
        message: 'You don\'t have any Claire Cash at the moment. If you think this is incorrect, <a href="https://clairepaniccia.com/support/" target="_blank">submit a support ticket here</a> and we\'ll look into it',
        isHtml: true
      });
    }

    let message;
    if (cashAmount >= 9) {
      message = `You have $${cashAmount} in Claire Cash!<br><br>To redeem your Claire Cash, check out my <a href="https://clairepaniccia.com/allthethings/" target="_blank">All The Things page</a> and then email me at hello@clairepaniccia.com to request to cash in your Claire Cash!`;
    } else {
      message = `You have $${cashAmount} in Claire Cash`;
    }

    res.json({
      hasCash: true,
      amount: cashAmount,
      message: message,
      isHtml: true
    });
  } catch (error) {
    console.error('Error checking balance:', error);
    console.error('Error details:', {
      message: error.message,
      statusCode: error.statusCode,
      error: error.error
    });
    res.status(500).json({ error: 'An error occurred while checking your balance.' });
  }
});

// Serve the main page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
