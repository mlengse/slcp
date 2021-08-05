const fs = require('fs');
const readline = require('readline');
const {google} = require('googleapis');


// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly'];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = 'token.json';

// Load client secrets from a local file.
const loadCreds = async () => {
  return new Promise((resolve, reject) => {
    fs.readFile('credentials.json', (err, content) => {
      if (err) reject('Error loading client secret file:', err);
      resolve(JSON.parse(content))
      // Authorize a client with credentials, then call the Google Tasks API.
      // authorize(JSON.parse(content), listConnectionNames);
    });
    
  })
}

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
const authorize = async () => {
  const { 
    installed: {
      client_secret,
      client_id,
      redirect_uris
    } 
  } = await loadCreds()
  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
  // Check if we have previously stored a token.
  return await new Promise( resolve => {
    fs.readFile(TOKEN_PATH, async (err, token) => {
      if (err) {
        resolve( await getNewToken(oAuth2Client))
      };
      oAuth2Client.setCredentials(JSON.parse(token));
      resolve(oAuth2Client);
    });
  })
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback for the authorized client.
 */
const getNewToken = async oAuth2Client => {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });
  console.log('Authorize this app by visiting this url:', authUrl);
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return await new Promise ((resolve, reject) => {
    rl.question('Enter the code from that page here: ', (code) => {
      rl.close();
      oAuth2Client.getToken(code, (err, token) => {
        if (err) reject('Error retrieving access token', err);
        oAuth2Client.setCredentials(token);
        // Store the token to disk for later program executions
        fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
          if (err) reject(err);
          console.log('Token stored to', TOKEN_PATH);
        });
        resolve(oAuth2Client);
      });
    });
  
  })
}

exports._fetchSheet = async ( {that, sheetName}) => {
  return await new Promise ( (resolve, reject) => that.sheets.spreadsheets.values.get({
    spreadsheetId: that.config.SHEET_ID,
    range: sheetName,
  }, (err, res) => {
    that.spinner.start('start listing')
    if (err) reject('The API returned an error: ' + err);
    const rows = res.data.values;
    if (rows.length) {
      // Print columns A and E, which correspond to indices 0 and 4.
      let headers, headersID
      rows.map((row, id) => {
        if(row[0] && row[0].toLowerCase() === 'no') {
          headers = row
          headersID = id
        }
        let objRow = {}
        if(id && headers && headersID !== id){
          // console.log(row[id][0])
          // if(row[id][0])
          row.map((col, id) => {
            if(col && col.length && headers[id]){
              let headersName = headers[id].toLowerCase()
              .split('(').join(' ')
              .split(')').join(' ')
              .split('.').join(' ')
              .split('/').join(' ')
              .split('-').join(' ')
              .trim()
              .split('  ').join(' ')
              .split(' ').join('_')
              objRow[headersName] = col
            }
          })
          objRow.kelurahan = sheetName.toLowerCase().split('konter').join(' ').split('konfirm').join(' ').trim()
          Object.keys(objRow).length > 2 ? rows[id] = objRow : null
        }
        // console.log(`${row[0]}, ${row[4]}`);
      })
      
      let filteredRows = rows.filter(row => !Array.isArray(row));
      // rows.shift()
      that.spinner.succeed(`data found ${sheetName}: ${filteredRows.length}`)
      resolve(filteredRows)

    } else {
      that.spinner.succeed('no data found')
      resolve([]);
    }
  }))
}
/**
 * Prints the names and majors of students in a sample spreadsheet:
 * @see https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit
 * @param {google.auth.OAuth2} auth The authenticated Google OAuth client.
 */
exports._fetchKasus =  async ({ that }) => {

  const auth = await authorize()

  that.sheets = google.sheets({version: 'v4', auth});

  const sheetsList = (await that.sheets.spreadsheets.get({ 
    spreadsheetId: that.config.SHEET_ID
  })).data.sheets.map((sheet) => {
    return sheet.properties.title
  })

  that.listConfirms = []
  that.listKonters = []

  if(sheetsList.length) for(sheetName of sheetsList) {
    if(sheetName.toLowerCase().includes('konfirm')){
      that.listConfirms = [ ...that.listConfirms, ...(await that.fetchSheet({sheetName}))]
    }
    if(sheetName.toLowerCase().includes('konter')){
      that.listKonters = [ ...that.listKonters, ...(await that.fetchSheet({sheetName}))]
    }
  }

}
