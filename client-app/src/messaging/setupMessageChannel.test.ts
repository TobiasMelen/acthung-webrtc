import setupMessageChannel from "./setupMessageChannel";
import {
  numberConverter,
  booleanConverter,
  passValueConverter,
  jsonConverter
} from "./valueConverters";
import { EventEmitter } from "events";

const messages = {
  testNr: numberConverter,
  testBool: booleanConverter,
  testStr: passValueConverter,
  testJSON: jsonConverter,
  bounce: passValueConverter
};

const emitter = new EventEmitter();

const sender = setupMessageChannel({
  send(data) {
    emitter.emit("messageToReceiver", data);
  },
  triggerReceive(trigger) {
    emitter.on("messageToSender", trigger);
  },
  destroy() {}
})(messages, messages);

const receiver = setupMessageChannel({
  send(data) {
    emitter.emit("messageToSender", data);
  },
  triggerReceive(trigger) {
    emitter.on("messageToReceiver", trigger);
  },
  destroy() {}
})(messages, messages, "bounce");

test("Number is sent over message channel", done => {
  const sendvalue = 42;
  receiver.on("testNr", val => {
    expect(val).toBe(sendvalue);
    done();
  });
  sender.send("testNr", sendvalue);
}, 100);

test("String is sent over message channel", done => {
  const sendvalue = "FourtyTwo";
  receiver.on("testStr", val => {
    expect(val).toBe(sendvalue);
    done();
  });
  sender.send("testStr", sendvalue);
}, 100);

test("Boolean is sent over message channel", done => {
  const sendvalue = true;
  receiver.on("testBool", val => {
    expect(val).toBe(sendvalue);
    done();
  });
  sender.send("testBool", sendvalue);
}, 100);

test("JSON is sent over message channel", done => {
  const sendvalue = { number: 42 };
  receiver.on("testJSON", val => {
    expect(val.number).toBe(sendvalue.number);
    done();
  });
  sender.send("testJSON", sendvalue);
}, 100);

test("Configured values bounce", done => {
  sender.on("bounce", val => {
    expect(val).toBe("BOUNCE!");
    done();
  });
  sender.send("bounce", "BOUNCE!");
}, 100);
