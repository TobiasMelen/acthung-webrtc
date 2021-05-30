import setupMessageChannel from "./setupMessageChannel";
import {
  numberConverter,
  booleanConverter,
  stringConverter,
  jsonConverter,
  voidConverter,
  passValueConverter,
} from "./valueConverters";
import { EventEmitter } from "events";
import test from "../test";

const messages = {
  testNr: numberConverter,
  testBool: booleanConverter,
  testStr: stringConverter,
  testJSON: jsonConverter,
  bounce: passValueConverter<"BOUNCE!">(),
};

const emitter = new EventEmitter();

const timeoutTest = (
  message: string,
  handler: (resolve: () => void, assert: (condition: boolean) => void) => void,
  timeoutMs = 100
) =>
  test(
    message,
    (assert) =>
      new Promise<void>((res, reject) => {
        const timeout = setTimeout(() => {
          assert(false);
          reject();
        }, timeoutMs);
        handler(() => {
          clearTimeout(timeout);
          res();
        }, assert);
      })
  );

const sender = setupMessageChannel({
  send(data) {
    emitter.emit("messageToReceiver", data);
  },
  bindReceive(trigger) {
    emitter.on("messageToSender", trigger);
  },
})(messages, messages);

const receiver = setupMessageChannel({
  send(data) {
    emitter.emit("messageToSender", data);
  },
  bindReceive(trigger) {
    emitter.on("messageToReceiver", trigger);
  },
})(messages, messages, "bounce");

timeoutTest("Number is sent over message channel", (resolve, assert) => {
  const sendvalue = 42;
  receiver.on("testNr", (val) => {
    assert(val === 42);
    resolve();
  });
  sender.send("testNr", sendvalue);
});

timeoutTest("String is sent over message channel", (done, assert) => {
  const sendvalue = "FourtyTwo";
  receiver.on("testStr", (val) => {
    assert(val == sendvalue);
    done();
  });
  sender.send("testStr", sendvalue);
});

timeoutTest("Boolean is sent over message channel", (done, assert) => {
  const sendvalue = true;
  receiver.on("testBool", (val) => {
    assert(val === sendvalue);
    done();
  });
  sender.send("testBool", sendvalue);
});

timeoutTest("JSON is sent over message channel", (done, assert) => {
  const sendvalue = { number: 42 };
  receiver.on("testJSON", (val) => {
    assert(val.number === sendvalue.number);
    done();
  });
  sender.send("testJSON", sendvalue);
});

timeoutTest("Configured values bounce", (done, assert) => {
  sender.on("bounce", (val) => {
    assert(val === "BOUNCE!");
    done();
  });
  sender.send("bounce", "BOUNCE!");
});
