import { flushPromises, mount } from "@vue/test-utils";
import { afterEach, describe, expect, it, vi } from "vitest";
import UserManager from "./UserManager.vue";

describe("UserManager", () => {
  afterEach(() => vi.restoreAllMocks());

  it("loads accounts without exposing credential material", async () => {
    vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify([
            {
              id: 1,
              username: "Admin",
              displayName: "System Administrator",
              role: "ADMIN",
              active: true,
              employeeId: null,
              employee: null,
            },
          ]),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify([]), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      );

    const wrapper = mount(UserManager, {
      props: { token: "test-token", currentUserId: 1 },
    });
    await flushPromises();

    expect(wrapper.text()).toContain("System Administrator");
    expect(wrapper.text()).toContain("Admin");
    expect(wrapper.text()).not.toContain("passwordHash");
    expect(wrapper.get("tbody button").attributes("disabled")).toBeDefined();
  });
});
