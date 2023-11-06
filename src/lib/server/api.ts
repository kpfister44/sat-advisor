// api.ts
import { OpenAI } from 'openai';
import { OPENAI_API_KEY } from '$env/static/private';

export interface OpenAIResponse {
	index: number;
	message: {
		role: string;
		content: string | null;
	};
	finish_reason: string;
}

export async function makeOpenAIRequest(userMessage: string) {
	const openai = new OpenAI({ apiKey: OPENAI_API_KEY });
	const completion = await openai.chat.completions.create({
		model: 'gpt-3.5-turbo',
		messages: [
			{
				role: 'system',
				content: 'You are an AI acting as a college-career counselor. Provide three school recommendations based on the students criteria. List each recommendation clearly and concisely, using the format: "1 - [School Name], 2 - [School Name], 3 - [School Name]," and ensure the recommendations are suitable for the students profile.'
			},
			{ role: 'user', content: userMessage }
		],
		temperature: 0.7
	});

	return completion.choices[0];
}
