<script lang="ts">
    import type { PageServerData } from './$types';
    import { states } from '$lib/states';
    import {
        Form,
        ComboBox,
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
    // items holds the info from the states array in the format need to be used by the ComboBox component
    const items = states.map((state, index) => ({ id: index.toString(), text: state }));
    
    function shouldFilterItem(item: { text: string }, value: string): boolean {
        if (!value) return true;
        return item.text.toLowerCase().includes(value.toLowerCase());
    }



</script>
<div class="form-flex-container">
    <div class="title-container">
        <h1>College Assistant Tool</h1>
        <h2>{data.page_server_data.message}</h2>
    </div>
    
    <Form on:submit>
        <FormGroup legendText="Location">
            <ComboBox
                placeholder="Select a state"
                items={items}
                {shouldFilterItem}
            />
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
        <RadioButtonGroup name="financial-aid-importance"selected="3">
            <RadioButton id="importance-1" value="1" labelText="1 - Not important at all" />
            <RadioButton id="importance-2" value="2" labelText="2" />
            <RadioButton id="importance-3" value="3" labelText="3" />
            <RadioButton id="importance-4" value="4" labelText="4" />
            <RadioButton id="importance-5" value="5" labelText="5 - Very important in my choice" />
        </RadioButtonGroup>
        </FormGroup>
        <div class="submit-button-container">
            <Button type="submit">Submit</Button> 
        </div>   
    </Form>
</div>

<style>
.title-container {
    margin: 15px;
}
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

</style>