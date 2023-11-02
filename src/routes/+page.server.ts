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

interface ExtendedSatData {
  exact: SatData | null;
  higher: SatData | null;
  lower: SatData | null;
}

async function getSatData(totalScore: number): Promise<ExtendedSatData | null> {
	return new Promise((resolve, reject) => {
		const db = new Database('./db/mydb.sqlite', (dbErr) => {
			if (dbErr) {
				console.error('Connection Error:', dbErr.message);
				reject(dbErr);
				return;
			}

			// Prepare the final result object
			const result: ExtendedSatData = { exact: null, higher: null, lower: null };

			// Query for the exact SAT data
      const exactQuery = 'SELECT * FROM sat_scores WHERE total_score = ?';
      console.log(`Running exact query with score: ${totalScore}`);
      db.get(exactQuery, [totalScore], (exactErr, exactRow: SatData | undefined) => {
        if (exactErr) {
          console.error('Exact Query Error:', exactErr.message);
          db.close();
          reject(exactErr);
          return;
        }
        result.exact = exactRow || null;

        // Determine the scores to query for higher and lower
        const higherScore = totalScore > 1500 ? 1600 : totalScore + 100;
        const lowerScore = totalScore < 500 ? 400 : totalScore - 100;

        // Query for SAT data 100 points higher or max score
        const higherQuery = 'SELECT * FROM sat_scores WHERE total_score = ?';
        db.get(higherQuery, [higherScore], (higherErr, higherRow: SatData | undefined) => {
          if (higherErr) {
            console.error('Higher Query Error:', higherErr.message);
          } else {
            result.higher = higherRow || null;
          }

          // Query for SAT data 100 points lower or min score
          const lowerQuery = 'SELECT * FROM sat_scores WHERE total_score = ?';
          db.get(lowerQuery, [lowerScore], (lowerErr, lowerRow: SatData | undefined) => {
            db.close();
            if (lowerErr) {
              console.error('Lower Query Error:', lowerErr.message);
            } else {
              result.lower = lowerRow || null;
            }

            // Resolve the promise with all the gathered data
            resolve(result);
          });
        });
      });
		});
	});
};




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