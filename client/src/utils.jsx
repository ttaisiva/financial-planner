import yaml from "js-yaml";

export const handleFileUpload = (e) => {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsedData = yaml.load(e.target.result);
        // do i set the tax info here
        // setFormData((prevData) => ({ ...prevData, taxInfo: parsedData }));
        console.log("Parsed YAML:", parsedData);
      } catch (error) {
        console.error("Error parsing YAML file:", error);
      }
    };

    reader.readAsText(file);
    console.log("file read");
  }
};

export const handleScenarioUpload = (e) => {
  handleFileUpload(e);
  //TODO: send scenario to database
};



export const inputTypes = ({ type, formData, handleChange, prefix }) => {

  /**
   * This function handles the display for user options for fixed, normal, and uniform distributions. 
   */

  
  const prefixParts = prefix.split(".");


  switch (type) {
    case "fixed":
      return (
        <input
          type="number"
          min="0"
          name={`${prefix}.value`} //should be .value instead oops
          placeholder="Enter value"
          value={
            prefixParts.length === 1
              ? formData[prefixParts[0]]?.value || "" // If only one part, access directly
              : formData[prefixParts[0]]?.[prefixParts[1]]?.value || "" // If two parts, use nested access
          }
          onChange={handleChange}
          required
        />
      );
    case "normal_distribution":
      return (
        <>
          <input
            type="number"
            min="0"
            name={`${prefix}.mean`}
            placeholder="Enter mean"
            value={
              prefixParts.length === 1
                ? formData[prefixParts[0]]?.mean || "" // If only one part, access directly
                : formData[prefixParts[0]]?.[prefixParts[1]]?.mean|| "" // If two parts, use nested access
            }
            onChange={handleChange}
            required
          />
          <input
            type="number"
            min="0"
            name={`${prefix}.stdDev`}
            placeholder="Enter standard deviation"
            value={
              prefixParts.length === 1
                ? formData[prefixParts[0]]?.stdDev || "" // If only one part, access directly
                : formData[prefixParts[0]]?.[prefixParts[1]]?.stdDev || "" // If two parts, use nested access
            }
            onChange={handleChange}
            required
          />
        </>
      );
    case "uniform_distribution":
      return (
        <>
          <input
            type="number"
            min="0"
            name={`${prefix}.lower`}
            placeholder="Enter lower bound"
            value={
              prefixParts.length === 1
                ? formData[prefixParts[0]]?.lower || "" // If only one part, access directly
                : formData[prefixParts[0]]?.[prefixParts[1]]?.lower || "" // If two parts, use nested access
            }
            onChange={handleChange}
            required
          />
          <input
            type="number"
            min="0"
            name={`${prefix}.upper`}
            placeholder="Enter upper bound"
            value={
              prefixParts.length === 1
                ? formData[prefixParts[0]]?.upper || "" // If only one part, access directly
                : formData[prefixParts[0]]?.[prefixParts[1]]?.upper || "" // If two parts, use nested access
            }
            onChange={handleChange}
            required
          />
        </>
      );
    default:
      return null;
  }
};

//sophie was working on this but didnt finish
// export const resetTypes = (formData, selectedType, prefix) => { //this needs some reworking

//   /**
//    * This function handles the reset for user options for fixed, normal, and uniform distributions. 
//    */

//   console.log("Type in reset: ", selectedType)
//   console.log("Item to reset: ", prefix)
//   const parts = prefix.split(".");
//   console.log("parts: ", parts);
//   const reset = {};

//   // Reset only fields related to the selectedType
//   if (selectedType === "fixed") {
//     if (parts.length == 2){ //user object
//       reset[formData[parts[0]]?.parts[1]?.Value] = ""; 
//     } else{
//       console.log("this is being reset: ", formData[parts[0]]?.Value);
//       reset[formData[parts[0]]?.Value] = ""; //this is 4 but instead it should be inflation_assumption.Value not the actual value that inflation_assumptino holds
//     }
//     // Reset Value //need to access formData[prefix[0]]?.prefix[1]?.
//   } else if (selectedType === "normal_distribution") {
//     if (parts.length == 2){ 
//       reset[formData[parts[0]]?.parts[1]?.Mean] = "";  // Reset Mean
//       reset[formData[parts[0]]?.parts[1]?.StdDev] = ""; // Reset StdDev
//     }
//     reset[formData[parts[0]]?.Mean] = "";  // Reset Mean
//     reset[formData[parts[0]]?.StdDev] = ""; // Reset StdDev

//   } else if (selectedType === "uniform_distribution") {
//     reset[formData[parts[0]]?.parts[1]?.Lower] = ""; // Reset Lower
//     reset[formData[parts[0]]?.parts[1]?.Upper] = ""; // Reset Upper
//   }

//   return reset;
// };


// export const resetTypes = (selectedType, prefix) => {
//   const reset = {};

//   // Clear all possible inputs under this prefix
//   reset[`${prefix}Value`] = "";
//   reset[`${prefix}Mean`] = "";
//   reset[`${prefix}StdDev`] = "";
//   reset[`${prefix}Lower`] = "";
//   reset[`${prefix}Upper`] = "";

//   // Optionally, keep only the needed fields for the selected type
//   switch (selectedType) {
//     case "fixed":
//       delete reset[`${prefix}Mean`];
//       delete reset[`${prefix}StdDev`];
//       delete reset[`${prefix}Lower`];
//       delete reset[`${prefix}Upper`];
//       break;
//     case "normal_distribution":
//       delete reset[`${prefix}Value`];
//       delete reset[`${prefix}Lower`];
//       delete reset[`${prefix}Upper`];
//       break;
//     case "uniform_distribution":
//       delete reset[`${prefix}Value`];
//       delete reset[`${prefix}Mean`];
//       delete reset[`${prefix}StdDev`];
//       break;
//   }

//   return reset;
// };





export const states = [
  { code: "AL", name: "Alabama" },
  { code: "AK", name: "Alaska" },
  { code: "AZ", name: "Arizona" },
  { code: "AR", name: "Arkansas" },
  { code: "CA", name: "California" },
  { code: "CO", name: "Colorado" },
  { code: "CT", name: "Connecticut" },
  { code: "DE", name: "Delaware" },
  { code: "FL", name: "Florida" },
  { code: "GA", name: "Georgia" },
  { code: "HI", name: "Hawaii" },
  { code: "ID", name: "Idaho" },
  { code: "IL", name: "Illinois" },
  { code: "IN", name: "Indiana" },
  { code: "IA", name: "Iowa" },
  { code: "KS", name: "Kansas" },
  { code: "KY", name: "Kentucky" },
  { code: "LA", name: "Louisiana" },
  { code: "ME", name: "Maine" },
  { code: "MD", name: "Maryland" },
  { code: "MA", name: "Massachusetts" },
  { code: "MI", name: "Michigan" },
  { code: "MN", name: "Minnesota" },
  { code: "MS", name: "Mississippi" },
  { code: "MO", name: "Missouri" },
  { code: "MT", name: "Montana" },
  { code: "NE", name: "Nebraska" },
  { code: "NV", name: "Nevada" },
  { code: "NH", name: "New Hampshire" },
  { code: "NJ", name: "New Jersey" },
  { code: "NM", name: "New Mexico" },
  { code: "NY", name: "New York" },
  { code: "NC", name: "North Carolina" },
  { code: "ND", name: "North Dakota" },
  { code: "OH", name: "Ohio" },
  { code: "OK", name: "Oklahoma" },
  { code: "OR", name: "Oregon" },
  { code: "PA", name: "Pennsylvania" },
  { code: "RI", name: "Rhode Island" },
  { code: "SC", name: "South Carolina" },
  { code: "SD", name: "South Dakota" },
  { code: "TN", name: "Tennessee" },
  { code: "TX", name: "Texas" },
  { code: "UT", name: "Utah" },
  { code: "VT", name: "Vermont" },
  { code: "VA", name: "Virginia" },
  { code: "WA", name: "Washington" },
  { code: "WV", name: "West Virginia" },
  { code: "WI", name: "Wisconsin" },
  { code: "WY", name: "Wyoming" },
];

export const tooltipContent = {
  lifeExpectancy: ["Explanation of the life exp. options"],
  retirementAge: ["Explanation of the retirement age options"],
  filingStatus: [
    "<p>Married is for Married Filing Jointly. <br>\
      Married Filing Separately, Head of Household, and Qualifying Surviving Spouse are currently not supported.</p>",
  ],
  financialGoal: [
    "The financial goal ignores loans, mortgages, and real property such as cars and houses.",
  ],
  startYearTax: [
    "The simulation does not take into account previous events, investments, or income. Therefore, tax \
      payment is omitted for the first (current) year.",
  ],
  taxInfo: [
    "The scenario does not use your federal or state tax documents. \
    Please take a moment to read the assumptions made in place of the full tax information: <br></br> \
    1. Only the four tax types listed are computed. No other taxes will be taken into account. <br></br> \
    2. Income tax will be assumed to have standard deduction. No itemized deductions are taken into account. <br></br> \
    3. Your state may tax your capital gains differently from federal tax. This is not taken into account. <br></br> \
    4. State tax is computed the same way as federal tax, i.e. with tax rates and brackets. <br></br> \
    5. Social security income is assumed to be 85% taxable on the federal level.",
  ],
  taxState: [
    "Leaving this field blank will result in no state tax being computed.",
  ],
};

/**
 * Staggers loading of elements based on vertical position on page.
 *
 * How to use:
 * - Put this in the code: useEffect(() => {loadAnimation()});
 * - Then give elements the "fade-in" class to make it apply
 *
 * TP: GitHub Copilot GPT-4o, prompt - "how to make elements fade in and up when page loads", "how can i make higher elements on the page load before lower elements"
 */
export const loadAnimation = () => {
  const elements = document.querySelectorAll(".fade-in");
  elements.forEach((element) => {
    const rect = element.getBoundingClientRect();
    const delay = rect.top / window.innerHeight;
    element.style.animationDelay = `${delay}s`;
  });
};


export const updateNestedState = (prefix, key, value, setFormData) => {
    
  setFormData((prevData) => {
    // If the prefix is user.lifeExpectancy, break it into its parts
    const prefixParts = prefix.split('.');

    // Create a copy of prevData to ensure we don't mutate the state directly
    const updated = { ...prevData };

    // Navigate to the correct place in the object
    let currentLevel = updated;

    // Loop through the prefixParts to reach the correct level
    for (let i = 0; i < prefixParts.length - 1; i++) {
      currentLevel = currentLevel[prefixParts[i]] = {
        ...currentLevel[prefixParts[i]], // Spread to avoid direct mutation
      };
    }

    // Finally, update the value at the deepest level (key)
    currentLevel[prefixParts[prefixParts.length - 1]] = {
      ...currentLevel[prefixParts[prefixParts.length - 1]], // Spread to avoid direct mutation
      [key]: value,
    };



    return updated;
  });
};
