import { describe, it, expect } from "vitest";
import { parseEditorAction, AVAILABLE_ACTIONS } from "./editor-agent";

describe("parseEditorAction", () => {
  it("parses valid JSON action from response", () => {
    const response = 'Here is the result:\n```json\n{"action": "set_clip_speed", "params": {"speed": 0.5}, "description": "Slow down clip"}\n```';
    const action = parseEditorAction(response);
    expect(action).not.toBeNull();
    expect(action!.action).toBe("set_clip_speed");
    expect(action!.params.speed).toBe(0.5);
  });

  it("returns null for plain text response", () => {
    expect(parseEditorAction("Hello, how can I help?")).toBeNull();
  });

  it("returns null for malformed JSON", () => {
    expect(parseEditorAction('```json\n{"action": broken}\n```')).toBeNull();
  });

  it("parses action with optional clipId", () => {
    const response = '```json\n{"action": "split_clip", "params": {}, "description": "Split at playhead"}\n```';
    const action = parseEditorAction(response);
    expect(action).not.toBeNull();
    expect(action!.action).toBe("split_clip");
  });
});

describe("AVAILABLE_ACTIONS", () => {
  it("has all required actions", () => {
    const actionNames = AVAILABLE_ACTIONS.map((a) => a.name);
    expect(actionNames).toContain("set_clip_speed");
    expect(actionNames).toContain("add_effect");
    expect(actionNames).toContain("split_clip");
    expect(actionNames).toContain("add_text_clip");
    expect(actionNames).toContain("seek");
  });

  it("each action has a description", () => {
    for (const action of AVAILABLE_ACTIONS) {
      expect(action.description).toBeTruthy();
    }
  });
});
