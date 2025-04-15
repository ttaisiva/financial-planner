import { render, screen, fireEvent, userEvent } from "@testing-library/react";
// import userEvent from "@testing-library/user-event";
import { faker } from "@faker-js/faker";
import { test, expect, beforeAll, afterEach, afterAll, describe } from "vitest";
import { LifeExpectancyForm } from "../../client/src/components/ScenarioInfo";

// Helper to generate random test cases
const generateRandomTestCase = () => {
  const randomString = faker.string.sample({
    length: 10,
    // Mix digits with banned characters (e, -, ., etc.)
    casing: "mixed",
  });
  const expectedOutput = randomString.replace(/\D/g, ""); // Filter to digits only
  return [randomString, expectedOutput];
};

describe("Life Expectancy: Random Input Short", () => {
  // test.each(Array.from({ length: 5 }, generateRandomTestCase))(
  //   'filters "%s" to "%s"',
  //   async (randomInput, expected) => {
  //     render(<LifeExpectancyForm />);
  //     // 2. Verify select is NOT initially present
  //     expect(screen.queryByTestId("type")).toBeNull();
  //     // 3. Interact with the controlling input
  //     const triggerInput = screen.getByTestId("fixed-test");
  //     await userEvent.selectOptions(triggerInput, "option-that-shows-select"); // or click/type
  //     const input = screen.getByTestId("fixed-test");
  //     console.log("Before typing:", input.value);
  //     await userEvent.type(input, "abc");
  //     console.log("After typing:", input.value);
  //     expect(input).toHaveValue(expected);
  //   }
  // );
  // // Edge case test
  // test("handles empty input", async () => {
  //   render(<LifeExpectancyForm />);
  //   const input = screen.getByTestId("fixed-test");
  //   await userEvent.clear(input);
  //   expect(input).toHaveValue("");
  // });
  // render(<LifeExpectancyForm />);
  // const input = screen.getByTestId("text-input");
  // const display = screen.getByTestId("display-value");
  // const randomText = faker.string.alphanumeric(6);
  // // Simulate typing
  // await userEvent.type(input, randomText);
  // expect(input).toHaveAttribute("type", "number");
  // // expect(display).toHaveTextContent("Hello World");
});
