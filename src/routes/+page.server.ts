import type { PageServerLoad, Actions, RequestEvent } from './$types'
import { makeOpenAIRequest } from '$lib/server/api';
import type { OpenAIResponse } from '$lib/server/api';

export const load: PageServerLoad = async () => {
  return {
    page_server_data: { message: 'hello world' },
  }
}

// Function to process form data
async function processFormData(event: RequestEvent) {
  const formData = await event.request.formData();
  const state = formData.get('state');
  const satScore = formData.get('satScore');
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
    const formData = await processFormData(event);
    const userMessage = `I'm from ${formData.state}, my SAT score is ${formData.satScore}, my GPA is ${formData.gpa}, and on a scale of 1-5, financial aid is ${formData.financialAidImportance} in importantance to me. What are my college options?`;

    console.time('OpenAI API Request');  // Start the timer
    const apiResponse: OpenAIResponse = await makeOpenAIRequest(userMessage);
    console.timeEnd('OpenAI API Request');  // End the timer and log the time

    console.log('API Response:', apiResponse);

    return { 
      status: 200, 
      body: { 
        message: 'Form submitted successfully',
        apiResponse 
      } 
    };
  },
};
