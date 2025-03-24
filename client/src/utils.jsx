//import { rnorm } from 'probability-distributions';

// /**
//  * Samples a number from a normal distribution with a provided mean and standard deviation.
//  * @param {number} mean - The mean of the normal distribution.
//  * @param {number} stdDev - The standard deviation of the normal distribution.
//  * @returns {number} - A random number sampled from the normal distribution.
//  */
// export const sampleNormalDistribution = (mean, stdDev) => {
//   return rnorm(1, mean, stdDev)[0];
// };

// /**
//  * Samples a number from a uniform distribution with provided lower and upper bounds.
//  * @param {number} lower - The lower bound of the uniform distribution.
//  * @param {number} upper - The upper bound of the uniform distribution.
//  * @returns {number} - A random number sampled from the uniform distribution.
//  */
// export const sampleUniformDistribution = (lower, upper) => {
//     return runif(1, lower, upper)[0];
//   };

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

export const resetTypes = (type) => {
  switch (type) {
    case "fixed":
      return {
        startValue: "",
        startMean: "",
        startStdDev: "",
        startLower: "",
        startUpper: "",
      };
    case "normal_distribution":
      return {
        startValue: "",
        startMean: "",
        startStdDev: "",
        startLower: "",
        startUpper: "",
      };
    case "uniform_distribution":
      return {
        startValue: "",
        startMean: "",
        startStdDev: "",
        startLower: "",
        startUpper: "",
      };
    default:
      return {
        startValue: "",
        startMean: "",
        startStdDev: "",
        startLower: "",
        startUpper: "",
      };
  }
};

export const inputTypes = ({ type, formData, handleChange, prefix }) => {
  switch (type) {
    case "fixed":
      return (
        <input
          type="number"
          min="0"
          name={`${prefix}Value`}
          placeholder="Enter value"
          value={formData[`${prefix}Value`] || ""}
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
            name={`${prefix}Mean`}
            placeholder="Enter mean"
            value={formData[`${prefix}Mean`] || ""}
            onChange={handleChange}
            required
          />
          <input
            type="number"
            min="0"
            name={`${prefix}StdDev`}
            placeholder="Enter standard deviation"
            value={formData[`${prefix}StdDev`] || ""}
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
            name={`${prefix}Lower`}
            placeholder="Enter lower bound"
            value={formData[`${prefix}Lower`] || ""}
            onChange={handleChange}
            required
          />
          <input
            type="number"
            min="0"
            name={`${prefix}Upper`}
            placeholder="Enter upper bound"
            value={formData[`${prefix}Upper`] || ""}
            onChange={handleChange}
            required
          />
        </>
      );
    default:
      return null;
  }
};

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
