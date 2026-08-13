import { flushPromises, mount } from "@vue/test-utils";
import { afterEach, describe, expect, it, vi } from "vitest";
import RecruitmentManager from "./RecruitmentManager.vue";

describe("RecruitmentManager", () => {
  afterEach(() => vi.restoreAllMocks());

  it("loads vacancies and exposes the candidate pipeline", async () => {
    vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify([
            {
              id: 1,
              title: "QA Engineer",
              department: "Quality Assurance",
              description: "Build reliable automated tests",
              positions: 2,
              status: "OPEN",
              _count: { candidates: 1 },
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
              vacancyId: 1,
              firstName: "Anita",
              lastName: "Rao",
              email: "anita@example.test",
              phone: null,
              status: "APPLIED",
              vacancy: { id: 1, title: "QA Engineer" },
            },
          ]),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      );

    const wrapper = mount(RecruitmentManager, {
      props: { token: "test-token" },
    });
    await flushPromises();

    expect(wrapper.text()).toContain("QA Engineer");
    expect(wrapper.text()).toContain("1 candidates");
    await wrapper.get(".segmented button:nth-child(2)").trigger("click");
    expect(wrapper.text()).toContain("Anita Rao");
    expect(wrapper.text()).toContain("APPLIED");
  });
});
