import { flushPromises, mount } from "@vue/test-utils";
import { afterEach, describe, expect, it, vi } from "vitest";
import LeaveManager from "./LeaveManager.vue";

describe("LeaveManager", () => {
  afterEach(() => vi.restoreAllMocks());

  it("shows pending requests and provides review actions", async () => {
    vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify([
            {
              id: 1,
              employeeId: 2,
              leaveType: "ANNUAL",
              startDate: "2026-09-01T00:00:00.000Z",
              endDate: "2026-09-02T00:00:00.000Z",
              reason: "Family event",
              status: "PENDING",
              employee: {
                firstName: "Meera",
                lastName: "Patel",
                employeeNumber: "EMP-1002",
              },
            },
          ]),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify([
            {
              id: 2,
              employeeNumber: "EMP-1002",
              firstName: "Meera",
              lastName: "Patel",
            },
          ]),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      );

    const wrapper = mount(LeaveManager, { props: { token: "test-token" } });
    await flushPromises();

    expect(wrapper.text()).toContain("Meera Patel");
    expect(wrapper.text()).toContain("Family event");
    expect(wrapper.text()).toContain("Approve");
    expect(wrapper.text()).toContain("Reject");
  });
});
