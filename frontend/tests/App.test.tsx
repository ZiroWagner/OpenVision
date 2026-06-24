import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import App from "../src/App";

describe("App", () => {
  it("renders sidebar with navigation items", () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <App />
      </MemoryRouter>,
    );

    expect(screen.getByText("OpenVision")).toBeInTheDocument();
    expect(screen.getAllByText("Dashboard").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Monitoreo").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Eventos")).toBeInTheDocument();
    expect(screen.getByText("Configuración")).toBeInTheDocument();
  });

  it("renders dashboard page by default", () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <App />
      </MemoryRouter>,
    );

    expect(screen.getByRole("heading", { name: "Dashboard" })).toBeInTheDocument();
  });

  it("renders monitoreo page", () => {
    render(
      <MemoryRouter initialEntries={["/monitoreo"]}>
        <App />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("heading", { name: "Monitoreo" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Visualización de cámaras en tiempo real"),
    ).toBeInTheDocument();
  });
});
