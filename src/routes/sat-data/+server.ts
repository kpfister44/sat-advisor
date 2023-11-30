// src/routes/sat-data/+server.ts
import type { RequestHandler } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';
import { Database } from 'sqlite3';

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

type CollegeSATData = {
    percentile_25th: number;
    percentile_50th: number;
    percentile_75th: number;
};

async function getCollegeAdmissionsData(collegeName: string): Promise<CollegeSATData | null> {
    return new Promise((resolve, reject) => {
        const db = new Database('./db/mydb.sqlite', (dbErr) => {
            if (dbErr) {
                console.error('Connection Error:', dbErr.message);
                reject(dbErr);
                return;
            }

            const query = 'SELECT * FROM college_scores WHERE college_name = ?';
            type DatabaseRow = CollegeSATData | null;

            db.get(query, [collegeName], (err, row: DatabaseRow) => {
                db.close();
                if (err) {
                    console.error('Query Error:', err.message);
                    reject(err);
                    return;
                }
                resolve(row);
            });
        });
    });
};

export const POST: RequestHandler = async ({ request }) => {
    try {
      // Use formData() for multipart form data
      const formData = await request.formData();
      const satScore = formData.get('satScore');
  
      // Then, convert satScore to a number and use it as needed
      const totalScore = Number(satScore);
      if (isNaN(totalScore)) {
        return json({ error: 'Invalid SAT score' }, { status: 400 });
      }
  
      const satData = await getSatData(totalScore);
      return json({ satData });
    } catch (error) {
      console.error('Error processing form data:', error);
      return json({ error: 'Server error occurred' }, { status: 500 });
    }
  };

export const POST_COLLEGE: RequestHandler = async ({ request }) => {
    try {
      const body = await request.json();
      const collegeName = body.collegeName;
      if (!collegeName) {
        return json({ error: 'Missing college name' }, { status: 400 });
      }
  
      const collegeData = await getCollegeAdmissionsData(collegeName);
      return json({ collegeData });
    } catch (error) {
      console.error('Error processing request:', error);
      return json({ error: 'Server error occurred' }, { status: 500 });
    }
  };
  
