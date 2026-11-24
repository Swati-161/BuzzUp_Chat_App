import { render, screen, fireEvent } from "@testing-library/react";
import App from "./App";

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});

test("shows the welcome screen with a demo entry point", async () => {
  render(<App />);
  expect(await screen.findByRole("button", { name: /explore the demo/i })).toBeInTheDocument();
});

test("demo sign-in lands on home with seeded rooms", async () => {
  render(<App />);
  fireEvent.click(await screen.findByRole("button", { name: /explore the demo/i }));
  expect(await screen.findByText(/your rooms/i)).toBeInTheDocument();
  expect((await screen.findAllByText("Peak Seekers")).length).toBeGreaterThan(0);
  expect(screen.getByText("Chasing sunsets and mountain tops")).toBeInTheDocument();
});
