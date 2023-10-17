<script lang="ts">
    import type { PageServerData } from './$types';
    import {
        Form,
        NumberInput,
        FormGroup,
        Slider,
        RadioButtonGroup,
        RadioButton,
        Select,
        SelectItem,
        Button,
    } from "carbon-components-svelte";
  
    export let data: PageServerData
  
    const states: string[] = ['Alabama','Alaska','American Samoa','Arizona','Arkansas','California','Colorado','Connecticut','Delaware','District of Columbia','Federated States of Micronesia','Florida','Georgia','Guam','Hawaii','Idaho','Illinois','Indiana','Iowa','Kansas','Kentucky','Louisiana','Maine','Marshall Islands','Maryland','Massachusetts','Michigan','Minnesota','Mississippi','Missouri','Montana','Nebraska','Nevada','New Hampshire','New Jersey','New Mexico','New York','North Carolina','North Dakota','Northern Mariana Islands','Ohio','Oklahoma','Oregon','Palau','Pennsylvania','Puerto Rico','Rhode Island','South Carolina','South Dakota','Tennessee','Texas','Utah','Vermont','Virgin Island','Virginia','Washington','West Virginia','Wisconsin','Wyoming']


</script>
<div class="form-flex-container">
    <div>
        <h1>College Assistant Tool</h1>
        <h2>{data.page_server_data.message}</h2>
    </div>
    
    <Form on:submit>
        <FormGroup legendText="Location">
            <Select selected={states[0]}>
                {#each states as state}
                <SelectItem text={state} />
                {/each}
            </Select>
        </FormGroup>
        <FormGroup legendText="Academic Information">
        <Slider 
            labelText="SAT Score"
            min={400}
            max={1600}
            maxLabel="1600"
            fullWidth value={1000}
        />
        <NumberInput
            min={1.00}
            max={4.00}
            value={2.50}
            step={0.10}
            invalidText="Your GPA should be between 1.00 and 4.00"
            helperText="GPA should be on a 4 point scale"
            label="Overall GPA"
        />
        </FormGroup>
        <FormGroup legendText="Financial Aid Importance">
        <RadioButtonGroup name="financial-aid-importance">
            <RadioButton id="importance-1" value="1" labelText="1 - Not important at all" />
            <RadioButton id="importance-2" value="2" labelText="2" />
            <RadioButton id="importance-3" value="3" labelText="3" />
            <RadioButton id="importance-4" value="4" labelText="4" />
            <RadioButton id="importance-5" value="5" labelText="5 - Very important in my choice" />
        </RadioButtonGroup>
        </FormGroup>
        <Button type="submit">Submit</Button>    
    </Form>
</div>

<style>
.form-flex-container {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    margin: 0;
    padding: 20px;
    flex-direction: column;
    border-radius: 20px;
    box-sizing: border-box;
}

</style>