const Airtable = require('airtable');

exports.handler = async (event, context) => {
  // Handle CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { email } = JSON.parse(event.body);
    
    if (!email) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Email is required' })
      };
    }

    // Initialize Airtable
    const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY })
      .base(process.env.AIRTABLE_BASE_ID);

    console.log('Searching for email:', email);
    
    // Test different possible table names
    const possibleTableNames = [
      'Total Credit Remaining By Person',
      'Total Credit Remaining by Person',
      'Total_Credit_Remaining_By_Person',
      'Table 1'
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
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Could not find the correct table name. Please check your Airtable base.' })
      };
    }
    
    console.log('Found', allRecords.length, 'total records');
    if (allRecords.length > 0) {
      console.log('Sample record fields:', Object.keys(allRecords[0].fields));
    }

    const records = await base(workingTableName)
      .select({
        filterByFormula: `{Email} = '${email.toLowerCase()}'`
      })
      .firstPage();

    if (records.length === 0) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ 
          hasCash: false, 
          message: 'You don\'t have any Claire Cash at the moment. If you think this is incorrect, <a href="https://clairepaniccia.com/support/" target="_blank">submit a support ticket here</a> and we\'ll look into it',
          isHtml: true
        })
      };
    }

    const record = records[0];
    const cashAmount = record.fields['Total Credit Remaining'] || 0;

    if (cashAmount <= 0) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ 
          hasCash: false, 
          message: 'You don\'t have any Claire Cash at the moment. If you think this is incorrect, <a href="https://clairepaniccia.com/support/" target="_blank">submit a support ticket here</a> and we\'ll look into it',
          isHtml: true
        })
      };
    }

    let message;
    if (cashAmount >= 9) {
      message = `You have $${cashAmount} in Claire Cash!<br><br>To redeem your Claire Cash, check out my <a href="https://clairepaniccia.com/allthethings/" target="_blank">All The Things page</a> and then email me at hello@clairepaniccia.com to request to cash in your Claire Cash!`;
    } else {
      message = `You have $${cashAmount} in Claire Cash`;
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        hasCash: true,
        amount: cashAmount,
        message: message,
        isHtml: true
      })
    };
  } catch (error) {
    console.error('Error checking balance:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'An error occurred while checking your balance.' })
    };
  }
};
