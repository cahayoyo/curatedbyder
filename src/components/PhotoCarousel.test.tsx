import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PhotoCarousel } from "./PhotoCarousel";

describe("PhotoCarousel", () => {
  it("renders slides and reacts to resize", () => {
    render(<PhotoCarousel />);
    expect(screen.getAllByRole("img").length).toBe(7);
    fireEvent(window, new Event("resize"));
  });

  it("swiping left advances to the next slide", () => {
    render(<PhotoCarousel />);
    const track = screen.getAllByRole("img")[0].parentElement!.parentElement!;
    const before = track.style.transform;
    fireEvent.pointerDown(track, { clientX: 200, pointerId: 1 });
    fireEvent.pointerMove(track, { clientX: 100, pointerId: 1 });
    fireEvent.pointerUp(track, { clientX: 100, pointerId: 1 });
    expect(track.style.transform).not.toBe(before);
    expect(track.style.transform).toContain("translateX(-300px)");
  });

  it("next arrow advances one visible window", () => {
    render(<PhotoCarousel />);
    fireEvent.click(screen.getByRole("button", { name: "Next photo" }));
    const track = screen.getAllByRole("img")[0].parentElement!.parentElement!;
    expect(track.style.transform).toContain("translateX(-300px)");
  });

  it("renders one dot per visible window position", () => {
    render(<PhotoCarousel />);
    expect(screen.getAllByRole("button", { name: /Photo \d/ }).length).toBe(5);
  });

  it("pointer leave cancels an active drag", () => {
    render(<PhotoCarousel />);
    const track = screen.getAllByRole("img")[0].parentElement!.parentElement!;
    fireEvent.pointerDown(track, { clientX: 200, pointerId: 1 });
    fireEvent.pointerLeave(track);
    expect(track.style.transform).toContain("translateX(0px)");
  });
});
