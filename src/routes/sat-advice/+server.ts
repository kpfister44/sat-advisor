// src/routes/+sat-advice.server.ts
import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { makeOpenAIRequest } from '$lib/server/api';

export const POST: RequestHandler = async ({ request }) => {
  // Parse the form data sent in the request body
  const formData = await request.formData();
  
  // Construct userMessage from formData here
  const state = formData.get('state');
  const satScore = Number(formData.get('satScore'));
  const gpa = formData.get('gpa');
  const intendedMajor = formData.get('major')
  const schoolSizePreference = formData.get('school-size')
  const proximityToHomeImportance = formData.get('proximity-importance')
  const financialAidImportance = formData.get('financial-aid-importance');
  
  const userMessage = `I'm from ${state}, and staying close to home is a ${proximityToHomeImportance} out of 1-5 scale of importance for me. My SAT score is ${satScore}, my GPA is ${gpa}, I'm interested in majoring in ${intendedMajor}, and I have a ${schoolSizePreference} size school preference. Financial aid importance is a ${financialAidImportance} out of 1-5 scale of importance for me.. Can you suggest colleges that fit my preferences?`;
  try {
    // Call the makeOpenAIRequest function from api.ts
    const openAiResponse = await makeOpenAIRequest(userMessage);
    // Respond with the data from the OpenAI API
    return json({ openAiResponse });
  } catch (error) {
    // Handle any errors that occur during the API call
    console.error('Error calling OpenAI:', error);
    return json({ error: 'Error calling OpenAI' }, { status: 500 });
  }
};
