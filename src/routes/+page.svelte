<script lang="ts">
	import type { PageServerData } from './$types';
	import { enhance } from '$app/forms';
	import type { OpenAIResponse } from '$lib/server/api';
	import { invalidateAll } from '$app/navigation';
	import { states } from '$lib/states';
	import {
		// Importing UI components from Carbon
		Form,
		ComboBox,
		NumberInput,
		FormGroup,
		Slider,
		RadioButtonGroup,
		RadioButton,
		Button,
		Header,
		HeaderNav,
		HeaderNavItem,
		HeaderNavMenu,
		SkipToContent,
		Content,
		Grid,
		Row,
		Column,
		Tile,
		DataTable,
		SkeletonPlaceholder
	} from 'carbon-components-svelte';


	// UI state variables
	let showForm = true;
	let isSideNavOpen = false;
	let isLoadingSatData = false;
  	let satDataLoaded = false;
	let isLoadingOpenAiData = false;
	let openAIDataLoaded = false;

	// API response state
	let gptMessage: string = '';

	// Interface for school recommendations
	interface SchoolRecommendations {
		first: string;
		second: string;
		third: string;
	}

	let recommendations: SchoolRecommendations = {
		first: '',
		second: '',
		third: ''
	};

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
	// Interface for table rows representing SAT score data
	interface TableRow {
		id: string;
		percentile: string;
		score: string;
		name: string;
	}
	let tableData: TableRow[] = [];

	// Data transformation for ComboBox items
	const stateItems = states.map((state, index) => ({ id: index.toString(), text: state }));
	const majors = [
		{ id: 'undecided', text: 'Undecided' },
		{ id: 'computer-science', text: 'Computer Science' },
		{ id: 'business', text: 'Business' },
		{ id: 'engineering', text: 'Engineering' },
		{ id: 'accounting', text: 'Accounting' },
		{ id: 'teaching', text: 'Teaching' },
		{ id: 'nursing', text: 'Nursing' },
		{ id: 'biology', text: 'Biology' },
		{ id: 'psychology', text: 'Psychology' }
	];

	/**
	 * Determines if a ComboBox item should be shown based on the user's input.
	 * This is a case-insensitive comparison function.
	 * When the user's input is empty, all items are considered a match.
	 * Otherwise, an item is considered a match if its text includes the input value.
	 * 
	 * @param {object} item - The item from the ComboBox list.
	 * @param {string} item.text - The display text of the item used for matching.
	 * @param {string} value - The user's current input used for filtering the list.
	 * @return {boolean} - True if the item should be displayed, false otherwise.
	 */

	function shouldFilterItem(item: { text: string }, value: string): boolean {
		// Show all items when the input box is cleared by the user
		if (!value) return true;
		// Check if the item's text includes the user's input, ignoring case sensitivity
		return item.text.toLowerCase().includes(value.toLowerCase());
	}

	// Form submission handling
	async function handleSubmit(event: Event) {
		// Prevent the default form submission behavior
		event.preventDefault();

		// Hide the form and start the UI for loading OpenAI data
		showForm = false;
		isLoadingOpenAiData = true;

		// Construct the form data object from the form inputs
		const formData = new FormData(event.target as HTMLFormElement);
  
		try {
			// Start loading SAT data
			isLoadingSatData = true;

			// Make a POST request to the /sat-data endpoint with the form data
			const satResponse = await fetch('/sat-data', {
				method: 'POST',
				body: formData
			});

			// If the response is not ok, throw an error
			if (!satResponse.ok) {
				throw new Error(`Error fetching SAT data: ${satResponse.statusText}`);
			}

			// Parse the response data as JSON
			const response = await satResponse.json();

			// Update the UI with the SAT data
			updateSatDataUI(response);

			// Stop loading SAT data and mark it as loaded
			isLoadingSatData = false;
			satDataLoaded = true;

			// Make a POST request to the /sat-advice endpoint with the form data
			const openaiResponse = await fetch('/sat-advice', {
				method: 'POST',
				body: formData
			});

			// If the response is not ok, throw an error
			if (!openaiResponse.ok) {
				throw new Error(`Error from server: ${openaiResponse.statusText}`);
			}

			// Parse the OpenAI API response data as JSON
			const openAiResponse = await openaiResponse.json();

			// Update the UI with the OpenAI data
			updateOpenAIDataUI(openAiResponse);

			// Stop the UI for loading OpenAI data and mark it as loaded
			isLoadingOpenAiData = false;
			openAIDataLoaded = true;

			if (openAIDataLoaded) {
				// Make a POST request to the /college-data endpoint with the form data
				const collegeDataResponse = await fetch('/college-data', {
					method: 'POST',
					body: JSON.stringify(recommendations)
				});

				// If the response is not ok, throw an error
				if (!collegeDataResponse.ok) {
					throw new Error(`Error fetching college data: ${collegeDataResponse.statusText}`);
				}

				// Parse the response data as JSON
				const collegeData = await collegeDataResponse.json();

				// Update the table rows with the new college data
				updateTableData(collegeData);
			}

		} catch (error) {
			// Log the error and stop loading OpenAI data if an error occurs
			console.error('Failed to submit form:', error);
			isLoadingOpenAiData = false;
		}
	}

	/**
	 * Updates the UI with the SAT data received from the server.
	 *
	 * This function takes the SAT data response from the server, extracts the relevant data,
	 * and updates the UI state variables to reflect this data. This includes updating the table
	 * data to show the user's SAT score, as well as scores 100 points higher and lower.
	 *
	 * @param {object} satDataResponse - The response from the server containing the SAT data.
	 * @param {object} satDataResponse.satData - The SAT data for the user's score, and scores 100 points higher and lower.
	 */
	function updateSatDataUI(satDataResponse: { satData: ExtendedSatData }) {
  		const { satData } = satDataResponse; // Now satData has the correct structure
		tableData = [
			{
			id: 'above-user-score', 
			percentile: satData.higher?.user_percentile ?? 'Unavailable',
			score: satData.higher?.total_score?.toString() ?? 'N/A',
			name: ''
			},
			{
			id: 'user', 
			percentile: satData.exact?.user_percentile ?? 'Unavailable',
			score: satData.exact?.total_score?.toString() ?? 'N/A',
			name: 'Your SAT Score'
			},
			{
			id: 'below-user-score', 
			percentile: satData.lower?.user_percentile ?? 'Unavailable',
			score: satData.lower?.total_score?.toString() ?? 'N/A',
			name: '',
			}
		]
	}	
	/**
	 * Updates the UI with the OpenAI data received from the server.
	 *
	 * This function takes the OpenAI data response from the server, extracts the relevant data,
	 * and updates the UI state variables to reflect this data. This includes updating the GPT message
	 * and the school recommendations based on the OpenAI response.
	 *
	 * @param {object} openAiDataResponse - The response from the server containing the OpenAI data.
	 * @param {object} openAiDataResponse.openAiResponse - The OpenAI data for the user's college recommendations.
	 */
	function updateOpenAIDataUI(openAiDataResponse: { openAiResponse: OpenAIResponse }) {
		const { openAiResponse } = openAiDataResponse;
		if (openAiResponse && openAiResponse.message) {
			// Store the content of the message in gptMessage
			gptMessage = openAiResponse.message.content || '';
			// Look through the gptMessage to extract the three school recommendations
			recommendations = extractSchoolRecommendations(gptMessage) ?? {
			first: '',
			second: '',
			third: ''
			};
		} else {
			console.error('Unexpected structure for OpenAI data:', openAiDataResponse);
		}
	}

	function updateTableData(collegeData: any) {
		// Extract the SAT percentiles for each college
		const firstCollege = collegeData.collegeData.first;
		const secondCollege = collegeData.collegeData.second;
		const thirdCollege = collegeData.collegeData.third;

		// Create new table rows for each college
		const firstCollegeRow: TableRow = {
			id: 'first-college',
			percentile: '',
			score: firstCollege.sat_50th_percentile.toString(),
			name: firstCollege.college_name
		};
		const secondCollegeRow: TableRow = {
			id: 'second-college',
			percentile: '',
			score: secondCollege.sat_50th_percentile.toString(),
			name: secondCollege.college_name
		};
		const thirdCollegeRow: TableRow = {
			id: 'third-college',
			percentile: '',
			score: secondCollege.sat_50th_percentile.toString(),
			name: thirdCollege.college_name
		};

		// Add the new rows to tableData
		tableData.push(firstCollegeRow, secondCollegeRow, thirdCollegeRow);

		// Force Svelte to update the component
		tableData = [...tableData];
	}

	// Extracting school recommendations from the GPT message
	function extractSchoolRecommendations(gptMessage: string): SchoolRecommendations | null {
		// Regular expression to find patterns like "1 - College Name" or "1: College Name", stopping at a comma, period, colon or the start of a new sentence
		const recommendationPattern = /(\d) [-:] ([^,:.]+[^\s,:.])/g;
		let match;
		const schools: string[] = [];

		// Loop over the message to find all matches of the pattern
		while ((match = recommendationPattern.exec(gptMessage)) !== null) {
			// Add the college name (second part of the match) to the schools array
			// Trim and remove any trailing periods or commas
			// Also remove the number and dash in front of the school name
			schools.push(match[2].trim().replace(/[,.]$/, ''));
		}

		// If fewer than three colleges were found, return null
		if (schools.length < 3) {
			return null;
		}

		// Return an object with the first three college names extracted
		return {
			first: schools[0], // First college name
			second: schools[1], // Second college name
			third: schools[2] // Third college name
		};
	}

</script>
<header>
	<Header company="Pfister Corp." platformName="SAT Assistant" bind:isSideNavOpen>
		<svelte:fragment slot="skip-to-content">
			<SkipToContent />
		</svelte:fragment>
		<HeaderNav>
			<HeaderNavItem href="/" text="Link 1" />
			<HeaderNavItem href="/" text="Link 2" />
			<HeaderNavItem href="/" text="Link 3" />
			<HeaderNavMenu text="Menu">
				<HeaderNavItem href="/" text="Link 1" />
				<HeaderNavItem href="/" text="Link 2" />
				<HeaderNavItem href="/" text="Link 3" />
			</HeaderNavMenu>
		</HeaderNav>
	</Header>
</header>
<main>
	<Content class="dark-bg">
		{#if showForm}
			<section id="landing-form">
				<div class="form-wrapper container">
					<h1>College Assistant Tool</h1>
					<div class="input-form">
						<Form on:submit={handleSubmit}>
							<FormGroup legendText="Location">
								<ComboBox placeholder="Select a state" name="state" items={stateItems} {shouldFilterItem} />
							</FormGroup>
							<FormGroup legendText="Academic Information">
								<Slider
									labelText="SAT Score"
									name="satScore"
									min={400}
									max={1600}
									value={1000}
									step={10}
								/>
								<NumberInput
									name="gpa"
									min={1.0}
									max={4.0}
									value={2.5}
									step={0.1}
									invalidText="Your GPA should be between 1.00 and 4.00"
									helperText="GPA should be on a 4 point scale"
									label="Overall GPA"
								/>
							</FormGroup>
							<FormGroup legendText="Intended Major">
								<ComboBox
									placeholder="Select an intended major"
									name="major"
									items={majors} {shouldFilterItem}
								/>
								</FormGroup>
							<FormGroup legendText="School Size Preference (in # of students)">
								<RadioButtonGroup orientation="vertical" name="school-size" selected="no preference">
									<RadioButton id="no-preference" value="no preference" labelText="No Preference" />
									<RadioButton id="size-small" value="small (less than 5000 students)" labelText="Small - Less than 5,000" />
									<RadioButton id="size-medium" value="medium (5000 to 20000 students)" labelText="Medium - 5,000 to 20,000" />
									<RadioButton id="size-large" value="large (more than 200000 students)" labelText="Large - More than 20,000" />
								</RadioButtonGroup>
							</FormGroup>													
							<FormGroup legendText="Proximity to Home">
								<RadioButtonGroup orientation="vertical" name="proximity-importance" selected="3">
									<RadioButton id="proximity-1" value="1" labelText="1 - Not a Factor in Decision" />
									<RadioButton id="proximity-2" value="2" labelText="2" />
									<RadioButton id="proximity-3" value="3" labelText="3" />
									<RadioButton id="proximity-4" value="4" labelText="4" />
									<RadioButton id="proximity-5" value="5" labelText="5 - Key Factor in Decision" />
								</RadioButtonGroup>
							</FormGroup>							
							<FormGroup legendText="Financial Aid Importance">
								<RadioButtonGroup orientation="vertical" name="financial-aid-importance" selected="3">
									<RadioButton id="importance-1" value="1" labelText="1 - Not a Factor in Decision" />
									<RadioButton id="importance-2" value="2" labelText="2" />
									<RadioButton id="importance-3" value="3" labelText="3" />
									<RadioButton id="importance-4" value="4" labelText="4" />
									<RadioButton
										id="importance-5"
										value="5"
										labelText="5 - Key Factor in Decision"
									/>
								</RadioButtonGroup>
							</FormGroup>
							<div class="submit-button-container">
								<Button type="submit">Submit</Button>
							</div>
						</Form>
					</div>
				</div>
			</section>
		{:else}
			{#if isLoadingSatData}
				<section id="sat-loading">
					<!-- Show loading indicator for SAT data -->
					<div class="container">
						<p>Loading SAT data...</p>
					</div>
				</section>
			{:else if satDataLoaded}
				<section id="results-percentile">
					<!-- Show the DataTable as soon as SAT data is available -->
					<div class="percentiles-chart container">
						<Tile>
							<DataTable
								sortable
								headers={[
								{ key: 'percentile', value: 'Percentile' },
								{ key: 'score', value: 'Score' },
								{ key: 'name', value: 'Name' },
								]}
								rows={tableData}
							/>
						</Tile>
					</div>
				</section>
				{#if isLoadingOpenAiData}
					<section id="openai-loading">
						<!-- Show loading indicator for OpenAI data -->
						<div class="container">
							<p style="margin:10px">Loading OpenAI data...</p>
							<SkeletonPlaceholder style="height: 12rem; width: 100%; margin: 10px auto" />
							<SkeletonPlaceholder style="height: 12rem; width: 100%; margin: 10px auto" />
						</div>
					</section>
				{:else if openAIDataLoaded}
					<section id=results-openai>
						<div class="container">
							<Tile>
								<h3>Recommended Schools:</h3>
								<p class="tile-content">{recommendations.first}</p>
								<p class="tile-content">{recommendations.second}</p>
								<p class="tile-content">{recommendations.third}</p>
							</Tile>
							<!-- This will display once OpenAI advice is available -->
							<Tile>
								<h3>Advice</h3>
								<p class="tile-content">{gptMessage}</p>
							</Tile>
						</div>
					</section>
				{:else}
					<!-- Handle case when OpenAI data is not loaded and no error has occurred -->
				{/if}
			{:else}
				<!-- Handle error state or when satData is not loaded -->
			{/if}
		{/if}
</Content>
</main>
<footer>
	<section id="footer">
		<div class="footer container dark-bg">
			<p>Kyle Pfister, 2023</p>
		</div>
	</section>
</footer>

<style>
	h1 {
		display: block;
		text-align: center;
	}
	h3 {
		font-size: 22px;
		margin-top: 10px;
		margin-bottom: 10px;
	}
	p {
		display: block;
		margin: auto;
		padding: 0 10px;
		width: 100%;
		max-width: 600px;
	}
	:global(.bx--content) {
		padding: 0rem;
	}
	:global(.bx--form-item) {
		width: 100%;
		margin: auto;
		display: block;
	}
	.container {
		padding: 0 10px;
		margin: auto;
		position: relative;
		width: 100%;
		max-width: 450px;
	}
	.footer {
		margin-top: 20px;
	}
	.form-wrapper {
		margin-top: 48px;
	}
	.input-form {
		margin-top: 20px;
	}
	@media (min-width: 400px) {
		header, main, footer {
			padding: 2rem;
		}
		/* additional tablet-specific styles */
	}
	@media (min-width: 568px) {
		header, main, footer {
			padding: 2rem;
		}
		/* additional tablet-specific styles */
	}
	/* Media query for tablets */
	@media (min-width: 768px) {
		header, main, footer {
			padding: 2rem;
		}
		/* additional tablet-specific styles */
	}

	/* Media query for desktops */
	@media (min-width: 1024px) {
		header, main, footer {
			padding: 3rem;
		}
		/* additional desktop-specific styles */
	}
	@media (min-width: 1300px) {
		header, main, footer {
			padding: 2rem;
		}
		/* additional tablet-specific styles */
	}
	.title-container {
		margin: 15px;
	}
	.percentiles-chart {
		margin-top: 48px; 
	}
	.openai-results-container {
		display: flex;
		justify-content: center; 
		flex-direction: column;
		flex-wrap: wrap;   
		min-width: 300px;
	}
	.form-flex-container {
		display: flex;
		justify-content: center;
		align-items: center;
		min-height: 70vh;
		min-width: 50vw;
		margin: 0;
		padding: 20px;
		flex-direction: column;
		border-radius: 5px;
		box-sizing: border-box;
	}
	.submit-button-container {
		display: flex;
		justify-content: center;
		align-items: center;
	}
	:global(.bx--btn) {
		text-align: center;
		padding: 15px 45px;
		border-radius: 10px;
	}
	:global(.bx--slider-text-input) {
		width: 5rem;
	}
	:global(.bx--slider) {
		min-width: 10rem;
	}
	:global(.bx--col) {
		display: flex;
		justify-content: center;
		align-items: center;
		flex-direction: column; /* if you want to center vertically as well */
	}
	:global(.bx--tile) {
		flex: 1;
		margin: 10px 0px; 
		min-width: 300px;
		overflow: auto;
	}
	:global(.bx--tile h2) {
		margin-bottom: 20px;
	}
	.dark-bg {
		background-color: #282828;
	}
	.tile-content {
		line-height: 1.8em;
	}
</style>
