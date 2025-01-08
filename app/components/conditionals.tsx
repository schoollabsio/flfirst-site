import React from "react";

const resolve = (children: React.ReactNode | (() => React.JSX.Element)) =>
  typeof children === "function" ? children() : children;

export const Show = ({
  when,
  children,
}: {
  when: boolean;
  children: React.ReactNode | (() => React.JSX.Element);
}) => {
  return when ? <>{resolve(children)}</> : null;
};

export const Hide = ({
  when,
  children,
}: {
  when: boolean;
  children: React.ReactNode | (() => React.JSX.Element);
}) => {
  return !when ? <>{resolve(children)}</> : null;
};

export const Either = ({
  condition,
  then: thenElement,
  otherwise: elseElement,
}: {
  condition: boolean;
  then: React.ReactNode | (() => React.JSX.Element);
  otherwise: React.ReactNode | (() => React.JSX.Element);
}) => {
  return condition ? <>{resolve(thenElement)}</> : <>{resolve(elseElement)}</>;
};

export const Switch = ({
  value,
  children,
}: {
  value: string | number;
  children: React.ReactNode | (() => React.JSX.Element);
}) => {
  const matchingCase = React.Children.toArray(resolve(children)).find(
    (child) =>
      React.isValidElement(child) &&
      child.type === Case &&
      child.props.value === value,
  );
  const defaultCase = React.Children.toArray(resolve(children)).find(
    (child) =>
      React.isValidElement(child) &&
      child.type === Case &&
      child.props.value === undefined,
  );
  return <>{matchingCase ?? defaultCase ?? null}</>;
};

export const Case = ({
  value, // eslint-disable-line @typescript-eslint/no-unused-vars
  children,
}: {
  value?: string | number;
  children: React.ReactNode | (() => React.JSX.Element);
}) => {
  return <>{resolve(children)}</>;
};
