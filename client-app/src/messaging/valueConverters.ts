import { Converter } from "./setupMessageChannel";

export const jsonConverter: Converter<any> = {
  serialize: JSON.stringify,
  deserialize: JSON.parse
};

export const numberConverter: Converter<number> = {
  serialize: String,
  deserialize: Number
};

export const booleanConverter: Converter<boolean> = {
  serialize: String,
  deserialize: Boolean
};

//This should not be needed, but having a special case for no message conversion will make channel impl. even messier.
//Bench before changing
export const passValueConverter: Converter<string> = {
  serialize: input => input,
  deserialize: result => result
};
