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

type CollegeSATData = {
    college_name: string;
    sat_25th_percentile: number;
    sat_50th_percentile: number;
    sat_75th_percentile: number;
    percentile: string; 
}

type percentileData = {
    percentile: string | null;
}

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

async function getpercentileData(totalScore: number): Promise<percentileData | null> {
    const roundedScore = Math.round(totalScore / 10) * 10;
	return new Promise((resolve, reject) => {
		const db = new Database('./db/mydb.sqlite', (dbErr) => {
			if (dbErr) {
				console.error('Connection Error:', dbErr.message);
				reject(dbErr);
				return;
			}
            // Prepare the final result object
            const result: percentileData = { percentile: null };

            // Query for the exact SAT data
            const percentileQuery = 'SELECT * FROM sat_scores WHERE total_score = ?';
            console.log(`Running perceentile query with score: ${totalScore}`);
            db.get(percentileQuery, [roundedScore], (exactErr, exactRow: SatData | undefined) => {
                if (exactErr) {
                console.error('Percentile Error:', exactErr.message);
                db.close();
                reject(exactErr);
                return;
                }
                if (exactRow) {
                    result.percentile = exactRow.nat_rep_percentile || null;
                }

                // Resolve the promise with all the gathered data
                console.log(result)
                resolve(result);
            });
        });
    });
};

export const POST: RequestHandler = async ({ request }) => {
    try {
        const body = await request.json();
        const { first, second, third } = body;

        if (!first || !second || !third) {
            return json({ error: 'Missing college name' }, { status: 400 });
        }

        const collegeNames = [first, second, third];
        const collegeDataPromises = collegeNames.map(collegeName => getCollegeAdmissionsData(collegeName));
        const collegeDataResults = await Promise.allSettled(collegeDataPromises);

        const collegeData = await Promise.all(collegeDataResults.map(async (result, index) => {
            const key = ['first', 'second', 'third'][index];
            let collegeSATData: CollegeSATData;
            if (result.status === 'fulfilled' && result.value) {
                collegeSATData = result.value;
            } else {
                collegeSATData = {
                    college_name: collegeNames[index],
                    sat_25th_percentile: 0,
                    sat_50th_percentile: 0,
                    sat_75th_percentile: 0,
                    percentile: 'N/A'
                };
            }

            // Fetch the percentile data for the college's SAT 50th percentile score
            if (collegeSATData.sat_50th_percentile !== 0) {
                // Round the 50th percentile score to the nearest whole number so the db query works as expected
                const percentileData = await getpercentileData(collegeSATData.sat_50th_percentile);
                collegeSATData = { ...collegeSATData, percentile: percentileData?.percentile || 'N/A' };
            }
            return { [key]: collegeSATData };
        }));

        console.log(collegeData)
        return json({ collegeData });
    } catch (error) {
        console.error('Error processing request:', error);
        return json({ error: 'Server error occurred' }, { status: 500 });
    }
};
  
