// src/routes/sat-data/+server.ts
import type { RequestHandler } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';
import { Database } from 'sqlite3';

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
  
