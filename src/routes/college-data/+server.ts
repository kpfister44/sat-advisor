// src/routes/sat-data/+server.ts
import type { RequestHandler } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';
import { Database } from 'sqlite3';

type CollegeSATData = {
    college_name: string;
    sat_25th_percentile: number | null;
    sat_50th_percentile: number | null;
    sat_75th_percentile: number | null;
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
        const body = await request.json();
        // Destructure the first, second, and third college names from the body
        const { first, second, third } = body;

        // If any of the college names are missing, return an error
        if (!first || !second || !third) {
            return json({ error: 'Missing college name' }, { status: 400 });
        }

        // Create an array of the college names
        const collegeNames = [first, second, third];
        // Map each college name to a promise that resolves to its admissions data
        const collegeDataPromises = collegeNames.map(collegeName => getCollegeAdmissionsData(collegeName));
        // Wait for all the promises to settle
        const collegeDataResults = await Promise.allSettled(collegeDataPromises);

        const collegeData = collegeDataResults.reduce((acc, result, index) => {
            const key = ['first', 'second', 'third'][index];
            if (result.status === 'fulfilled' && result.value) {
                acc[key] = result.value;
            } else {
                acc[key] = {
                    college_name: collegeNames[index],
                    sat_25th_percentile: null,
                    sat_50th_percentile: null,
                    sat_75th_percentile: null
                };
            }
            return acc;
        }, {} as Record<string, CollegeSATData>);
        console.log(collegeData)
        // Return the college data as a JSON response
        return json({ collegeData });
    } catch (error) {
        // Log any errors that occur and return a server error response
        console.error('Error processing request:', error);
        return json({ error: 'Server error occurred' }, { status: 500 });
    }
};
  
