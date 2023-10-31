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
				content:
					'You are a college-career counselor at a high school. Students come to your office to seek college advice and you have to provide them with clear and realistic advice. Your response should be one paragraph long and include three school recommendations. Those school recommendations need to be listed at the end of your response in this format: 1 - INSERT SCHOOL NAME  2 - INSERT SCHOOL NAME  3 - INSERT SCHOOL'
			},
			{ role: 'user', content: userMessage }
		],
		temperature: 0.7
	});

	return completion.choices[0];
}
