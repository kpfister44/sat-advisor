<script lang="ts">
	import type { PageServerData, ActionData } from './$types';
	import { states } from '$lib/states';
	import {
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
		DataTable
	} from 'carbon-components-svelte';

	export let data: PageServerData;
	export let form: ActionData;

	let showForm = true;
	let isSideNavOpen = false;
	// Holds the OPENAI API response message which will be displayed as the "Advice"
	let gptMessage: string = '';
	// Initialize an object with empty strings. This object will eventually hold the school recommendations from the OPEN AI API call
	let recommendations: schoolRecommendations = {
		first: '',
		second: '',
		third: ''
	};

	interface TableRow {
		id: string;
		percentile: string;
		score: string;
		name: string;
	}

	// An array that of TableRows pulled from the db query based on the user's sat score input
	let tableData: TableRow[] = [];

	// items holds the info from the states array in the format need to be used by the ComboBox component
	const items = states.map((state, index) => ({ id: index.toString(), text: state }));

	function shouldFilterItem(item: { text: string }, value: string): boolean {
		if (!value) return true;
		return item.text.toLowerCase().includes(value.toLowerCase());
	}
	function handleSubmit(event: Event): void {
		event.preventDefault();
		showForm = false; // Hide the form
	}
	
	interface schoolRecommendations {
		first: string;
		second: string;
		third: string;
	}

	// Function to extract college recommendations from a given message
	function extractSchoolRecommendations(gptMessage: string): schoolRecommendations | null {
		// Regular expression to find patterns like "1 - College Name", stopping at a comma, period or the start of a new sentence
		const recommendationPattern = /(\d) - ([^,.]+[^\s,.])/g;
		let match;
		const schools: string[] = [];

		// Loop over the message to find all matches of the pattern
		while ((match = recommendationPattern.exec(gptMessage)) !== null) {
			// Add the college name (second part of the match) to the schools array
			// Trim and remove any trailing periods or commas
			schools.push(match[0].trim().replace(/[,.]$/, ''));
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
	// Reactive check to see if form submission was successful
	$: if (form?.status === 200) {
		showForm = false;
		gptMessage = form.body?.apiResponse?.message?.content ?? '';
		recommendations = extractSchoolRecommendations(gptMessage) ?? {
			first: '',
			second: '',
			third: ''
		};
		console.log(form.body.satData)
		  // Only attempt to update tableData if satData is not null or undefined
		  if (form.body.satData) {
			tableData = [
				{
				id: 'above-user-score', 
				percentile: form.body.satData.higher?.user_percentile ?? 'Unavailable',
				score: form.body.satData.higher?.total_score?.toString() ?? 'N/A',
				name: ''
				},
				{
				id: 'user', 
				percentile: form.body.satData.exact?.user_percentile ?? 'Unavailable',
				score: form.body.satData.exact?.total_score?.toString() ?? 'N/A',
				name: 'Your SAT Score'
				},
				{
				id: 'below-user-score', 
				percentile: form.body.satData.lower?.user_percentile ?? 'Unavailable',
				score: form.body.satData.lower?.total_score?.toString() ?? 'N/A',
				name: '',
				}
				// ... Additional entries for the average scores of recommended schools
			// {
			// 	id: 'school-one-average-score', 
			// 	percentile: form.body.satData.user_percentile,
			// 	score: form.body.satData.total_score.toString()
			// },
			// {
			// 	id: 'school-two-average-score', 
			// 	percentile: form.body.satData.user_percentile,
			// 	score: form.body.satData.total_score.toString()
			// },
			// {
			// 	id: 'school-three-average-score', 
			// 	percentile: form.body.satData.user_percentile,
			// 	score: form.body.satData.total_score.toString()
			// }
			];
		} else {
			// Display a default message if satData is null
			tableData = [
				{
					id: 'default',
					name: 'N/A',
					percentile: 'Data unavailable',
					score: 'N/A'
				}
        	];
		}
	}


</script>

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
<Content>
	<Grid>
		<Row>
			<Column>
				{#if showForm}
					<div class="form-flex-container dark-bg">
						<div class="title-container">
							<h1>College Assistant Tool</h1>
						</div>

						<Form method="POST">
							<FormGroup legendText="Location">
								<ComboBox placeholder="Select a state" name="state" {items} {shouldFilterItem} />
							</FormGroup>
							<FormGroup legendText="Academic Information">
								<Slider
									labelText="SAT Score"
									name="satScore"
									min={400}
									max={1600}
									maxLabel="1600"
									fullWidth
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
							<FormGroup legendText="Financial Aid Importance">
								<RadioButtonGroup name="financial-aid-importance" selected="3">
									<RadioButton id="importance-1" value="1" labelText="1 - Not important at all" />
									<RadioButton id="importance-2" value="2" labelText="2" />
									<RadioButton id="importance-3" value="3" labelText="3" />
									<RadioButton id="importance-4" value="4" labelText="4" />
									<RadioButton
										id="importance-5"
										value="5"
										labelText="5 - Very important in my choice"
									/>
								</RadioButtonGroup>
							</FormGroup>
							<div class="submit-button-container">
								<Button type="submit">Submit</Button>
							</div>
						</Form>
					</div>
				{:else}
					{#if form?.status === 200}
						<div class="top-tiles-container">
							<Tile>
								<h2>Recommended Schools:</h2>
								<p class="tile-content">{recommendations.first}</p>
								<p class="tile-content">{recommendations.second}</p>
								<p class="tile-content">{recommendations.third}</p>
							</Tile>
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
						<Tile>
							<h2>Advice</h2>
							<p class="tile-content">{gptMessage}</p>
						</Tile>
					{/if}
				{/if}
			</Column>
		</Row>
	</Grid>
</Content>

<style>
	.title-container {
		margin: 15px;
	}
	.top-tiles-container {
		display: flex;
		justify-content: center; 
		flex-wrap: wrap;  
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
	:global(.bx--col) {
		display: flex;
		justify-content: center;
		align-items: center;
		flex-direction: column; /* if you want to center vertically as well */
	}
	:global(.bx--tile) {
		flex: 1;
		margin: 10px; 
		min-width: 300px;
	}
	:global(.bx--tile h2) {
		margin-bottom: 20px;
	}
	.dark-bg {
		background-color: #282828;
	}
	.tile-content {
		line-height: 1.6;
	}
</style>
