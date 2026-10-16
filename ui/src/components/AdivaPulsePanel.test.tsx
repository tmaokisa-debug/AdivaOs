// @vitest-environment jsdom

import { act } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AdivaPulsePanel } from "./AdivaPulsePanel";

const mockHealthApi = vi.hoisted(() => ({ get: vi.fn() }));

vi.mock("../api/health", () => ({ healthApi: mockHealthApi }));

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

describe("AdivaPulsePanel", () => {
  let container: HTMLDivElement;
  let root: ReturnType<typeof createRoot> | undefined;
  let queryClient: QueryClient;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false, refetchInterval: false } },
    });
    mockHealthApi.get.mockResolvedValue({
      status: "ok",
      version: "test-version",
      deploymentMode: "authenticated",
    });
  });

  afterEach(() => {
    act(() => root?.unmount());
    queryClient.clear();
    container.remove();
    vi.clearAllMocks();
  });

  async function renderPanel() {
    root = createRoot(container);
    await act(async () => {
      root.render(
        <QueryClientProvider client={queryClient}>
          <AdivaPulsePanel />
        </QueryClientProvider>,
      );
      await new Promise((resolve) => window.setTimeout(resolve, 0));
    });
  }

  it("shows the Paperclip health result while keeping unconnected hosts unknown", async () => {
    await renderPanel();

    expect(container.textContent).toContain("Paperclip API");
    expect(container.textContent).toContain("Healthy");
    expect(container.textContent).toContain("test-version");
    expect(container.textContent).toContain("ProBook");
    expect(container.textContent).toContain("Phoenix");
    expect(container.textContent).toContain("AdivaOS Core bridge");
    expect(container.textContent).toContain("Unknown");
    expect(mockHealthApi.get).toHaveBeenCalledTimes(1);
  });

  it("does not infer remote machine failure when the Paperclip health check fails", async () => {
    mockHealthApi.get.mockRejectedValue(new Error("health endpoint unavailable"));
    await renderPanel();

    expect(container.textContent).toContain("Unavailable");
    expect(container.textContent).toContain("health endpoint unavailable");
    expect(container.textContent).toContain("ProBook");
    expect(container.textContent).toContain("Phoenix");
    expect(container.textContent).toContain("Unknown");
  });
});
