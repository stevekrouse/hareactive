import * as H from "../src/index";
import { streamFromEvent, behaviorFromEvent } from "../src/dom";
import "mocha";
import { assert } from "chai";
import * as browserEnv from "browser-env";

browserEnv();

describe("dom", () => {
  describe("streamFromEvent", () => {
    it("has occurrence on event", () => {
      const div = document.createElement("div");
      const s = streamFromEvent(div, "click");
      const result = [];
      s.subscribe((ev) => result.push(ev));
      const event = new MouseEvent("click", {
        view: window
      });
      div.dispatchEvent(event);
      div.dispatchEvent(event);
      div.dispatchEvent(event);
      assert.strictEqual(result.length, 3);
    });

    it("applies extractor to event", () => {
      const input = document.createElement("input");
      const s = streamFromEvent(input, "input", (e, elm) => ({
        bubbles: e.bubbles,
        value: elm.value
      }));
      const result = [];
      s.subscribe((ev) => result.push(ev));
      const event = new Event("input");
      input.dispatchEvent(event);
      assert.strictEqual(result.length, 1);
      assert.strictEqual(result[0].bubbles, false);
      assert.strictEqual(result[0].value, "");
    });
  });

  describe("behaviorFromEvent", () => {
    it("has initial value", () => {
      const input = document.createElement("input");
      input.value = "initial";
      const s = behaviorFromEvent(
        input,
        "change",
        (elm) => elm.value,
        (evt, elm) => elm.value
      );
      const result = [];
      s.subscribe((ev) => result.push(ev));
      assert.strictEqual(result.length, 1);
      assert.strictEqual(result[0], "initial");
    });
    it("updates the current value on event", () => {
      const input = document.createElement("input");
      input.value = "initial";
      const s = behaviorFromEvent(
        input,
        "change",
        (elm) => elm.value,
        (evt, elm) => elm.value
      );
      const result = [];
      s.subscribe((ev) => result.push(ev));
      // simulate input low latency
      input.value = "second";
      input.dispatchEvent(new Event("change"));
      assert.deepEqual(result, ["initial", "second"]);
    });
    it("is possible to snapshot behavior", () => {
      const input = document.createElement("input");
      input.value = "initial";
      const b = behaviorFromEvent(
        input,
        "change",
        (elm) => elm.value,
        (_evt, elm) => elm.value
      );
      const result = [];
      const sink = H.sinkStream<number>();
      // We snapshot the behaviors without activating it
      const s = H.snapshot(b, sink);
      s.subscribe((ev) => result.push(ev));
      H.push(0, sink);
      input.value = "second";
      H.push(0, sink);
      assert.deepEqual(result, ["initial", "second"]);
    });
  });
});
