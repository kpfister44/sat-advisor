import type { PageServerLoad, Actions, RequestEvent } from './$types'
import { makeOpenAIRequest } from '$lib/server/api';
import type { OpenAIResponse } from '$lib/server/api';
import { Database } from 'sqlite3';

export const load: PageServerLoad = async () => {
  return {
    page_server_data: { message: 'hello world' },
  }
}

// Define a type for the SAT data
type SatData = {
  total_score: number;
  nat_rep_percentile: string;
  user_percentile: string;
};
type SQLiteMasterRow = {
  type: string;
  name: string; // this is the table name
  // You can include more properties here as needed, based on your query
};


async function getSatData(totalScore: number): Promise<SatData | null> {
  return new Promise((resolve, reject) => {
    const db = new Database('./db/mydb.sqlite', (dbErr) => {
      if (dbErr) {
        console.error('Connection Error:', dbErr.message);
        reject(dbErr);
        return;
      }

      // Log to console after successfully connecting to the database
      console.log('Successfully connected to the database.');

      // Check if the 'sat_scores' table exists
      db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='sat_scores';", [], (err, row: SQLiteMasterRow | undefined) => {
        if (err) {
          console.error('Error fetching table:', err.message);
          reject(err);
        } else if (row) {
          console.log('Table exists:', row.name);

          // If the table exists, proceed to query for the specific SAT data
          const query = 'SELECT * FROM sat_scores WHERE total_score = ?';
          db.get(query, [totalScore], (queryErr, satRow: SatData | undefined) => {
            db.close();

            if (queryErr) {
              console.error('Query Error:', queryErr.message);
              reject(queryErr);
            } else {
              resolve(satRow || null);
            }
          });
        } else {
          console.log('Table does not exist.');
          db.close();
          resolve(null); // Resolve with null if the table doesn't exist
        }
      });
    });
  });
}


// Function to process form data
async function processFormData(event: RequestEvent) {
  const formData = await event.request.formData();
  const state = formData.get('state');
  const satScore = Number(formData.get('satScore'));
  const gpa = formData.get('gpa');
  const financialAidImportance = formData.get('financial-aid-importance');
  
  return {
    state,
    satScore,
    gpa,
    financialAidImportance
  };
}


export const actions: Actions = {
  default: async (event: RequestEvent) => {
    try {
      const formData = await processFormData(event);
      const satData = await getSatData(formData.satScore);

      const userMessage = `I'm from ${formData.state}, my SAT score is ${formData.satScore}, my GPA is ${formData.gpa}, and financial aid is ${formData.financialAidImportance} important to me. What are my college options?`;

      console.time('OpenAI API Request');
      const apiResponse: OpenAIResponse = await makeOpenAIRequest(userMessage);
      console.timeEnd('OpenAI API Request');

      // Return combined data from OpenAI and database
      return {
        status: 200,
        body: {
          apiResponse,
          satData
        }
      };
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Error message:', error.message);
        return {
          status: 500,
          body: {
            message: error.message,
          },
        };
      } else {
        console.error('An unexpected error occurred:', error);
        return {
          status: 500,
          body: {
            message: 'An unexpected error occurred.',
          },
        };
      }
    }
  },
};