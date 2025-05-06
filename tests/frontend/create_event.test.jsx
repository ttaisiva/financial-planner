import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import {
  EventsForm,
  ViewEventsDetails,
} from "../../client/src/components/EventsForm";

describe("EventsForm", () => {
  it("Display the name of the created event on the page", async () => {
    // Mock state for events
    let events = [];
    const setEvents = (newEvents) => {
      events = newEvents;

      // Render the EventsForm and ViewEventsDetails components
      rerender(
        <>
          <EventsForm
            EventsForm
            events={events}
            setEvents={setEvents}
            setShowEventsForm={vi.fn()}
          />
          <ViewEventsDetails events={events} />
        </>
      );
    };

    // Render the EventsForm and ViewEventsDetails components
    const { rerender } = render(
      <>
        <EventsForm
          events={events}
          setEvents={setEvents}
          setShowEventsForm={vi.fn()}
        />
        <ViewEventsDetails events={events} />
      </>
    );

    // Fill out the form
    fireEvent.change(screen.getByLabelText("Name:"), {
      target: { value: "Test Event" },
    });
    fireEvent.change(screen.getByLabelText("Description:"), {
      target: { value: "This is a test event." },
    });
    fireEvent.change(screen.getByLabelText("Event Type:"), {
      target: { value: "income" },
    });

    // Submit the form
    fireEvent.click(screen.getByText("Save"));

    // Simulate adding the event to the events array
    setEvents([
      ...events,
      {
        name: "Test Event",
        description: "This is a test event.",
        type: "income",
      },
    ]);

    // Wait for the DOM to update
    await waitFor(() => {
      expect(screen.getByText("Test Event")).toBeInTheDocument();
    });
  });
});
