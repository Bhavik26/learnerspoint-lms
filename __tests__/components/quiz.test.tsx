import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import QuizPlayerClient from "@/app/courses/[slug]/quiz/[quizId]/QuizPlayerClient";

// Mock React.use to return resolved params synchronously for testing stability under React 19
jest.mock("react", () => {
  const original = jest.requireActual("react");
  return {
    ...original,
    use: (promise: any) => {
      return {
        slug: "nextjs-enterprise-architecture",
        quizId: "q-nextjs-enterprise-architecture",
      };
    },
  };
});

describe("QuizPlayerClient Component UI Checks", () => {
  const mockParams = Promise.resolve({
    slug: "nextjs-enterprise-architecture",
    quizId: "q-nextjs-enterprise-architecture",
  });

  it("should render the quiz player correctly with default question", async () => {
    render(<QuizPlayerClient params={mockParams} />);

    // Now it renders synchronously without suspending
    expect(screen.getByText("Which HTTP status code represents 'Unauthorized'?")).toBeInTheDocument();
    expect(screen.getByText("Question 1 of 3")).toBeInTheDocument();
  });

  it("should attach the animate-shake class to the parent container when incorrect answer is selected", async () => {
    const { container } = render(<QuizPlayerClient params={mockParams} />);

    expect(screen.getByText("Which HTTP status code represents 'Unauthorized'?")).toBeInTheDocument();

    // Correct option for question 1 is "401 Unauthorized" (index 1).
    // Let's click an incorrect option like "200 OK" (index 0).
    const optionButtons = screen.getAllByRole("button");
    const option200 = optionButtons[0]; // first button: "200 OK"
    
    // Click incorrect option
    fireEvent.click(option200);

    // Verify parent container gets the shaking animation class
    const shakingContainer = container.querySelector(".animate-shake");
    expect(shakingContainer).toBeInTheDocument();
  });
});
