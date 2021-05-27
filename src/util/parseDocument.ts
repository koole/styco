import { parse, ParserOptions } from "@babel/parser";
import traverse from "@babel/traverse";
import {
  JSXElement,
  File,
  JSXIdentifier,
  JSXAttribute,
  ObjectProperty,
  StringLiteral,
} from "@babel/types";

const babelOptions: ParserOptions = {
  sourceType: "module",
  plugins: [
    "jsx",
    "typescript",
    ["decorators", { decoratorsBeforeExport: true }],
    "classProperties",
    "optionalChaining",
    "nullishCoalescingOperator",
  ],
};

export type Property = { key: string; value: string };

export interface IClassAttribute {
  start: number;
  end: number;
  properties: any;
}

const findTagAndInsertPosition = (file: File, offset: number) => {
  let selectedElement: JSXElement | undefined;
  let insertPosition: number = 0;
  let importStatementExisting = false;

  traverse(file, {
    JSXElement: (enter) => {
      if (enter.node.start === null || enter.node.start > offset) {
        return;
      }
      if (
        selectedElement === undefined ||
        enter.node.start > selectedElement.start!
      ) {
        selectedElement = enter.node;
      }
    },
    ImportDeclaration: (enter) => {
      // Just find last Import Statement
      if (enter.node.end !== null) {
        insertPosition = enter.node.end;
      }

      // Check wether 'tw' is already imported
      if (
        enter.node.specifiers.find((s) => s.local.name === "tw") !== undefined
      ) {
        importStatementExisting = true;
      }
    },
  });

  return { selectedElement, insertPosition, importStatementExisting };
};

const getClassNames = (element: JSXElement): IClassAttribute | null => {
  const classAttr = element.openingElement.attributes.find(
    (a) => a.type === "JSXAttribute" && a.name.name === "className"
  ) as JSXAttribute | undefined;

  console.log(classAttr);

  if (
    !classAttr ||
    !classAttr.value ||
    ((classAttr.value.type !== "JSXExpressionContainer" ||
      classAttr.value.expression.type !== "TemplateLiteral") &&
      classAttr.value.type !== "StringLiteral")
  ) {
    return null;
  }

  let properties = ``;
  if (
    classAttr.value.type === "JSXExpressionContainer" &&
    classAttr.value.expression.type === "TemplateLiteral"
  ) {
    if (classAttr.value.expression.quasis.length === 1) {
      properties = classAttr.value.expression.quasis[0].value.raw;
    } else {
      return null;
    }
  }

  if (classAttr.value.type === "StringLiteral") {
    properties = classAttr.value.value;
  }

  properties = `\n  ${properties.split(" ").join("\n  ")}\n`;

  return {
    start: classAttr.start!,
    end: classAttr.end!,
    properties,
  };
};

export const parseDocument = (text: string, currentOffset: number) => {
  const file = parse(text, babelOptions);

  const { selectedElement, insertPosition, importStatementExisting } =
    findTagAndInsertPosition(file, currentOffset);

  if (selectedElement === undefined) {
    throw new Error("Could not find element");
  }

  const elementName = (selectedElement.openingElement.name as JSXIdentifier)
    .name;

  const classAttr = getClassNames(selectedElement);

  return {
    selectedElement,
    elementName,
    insertPosition,
    importStatementExisting,
    classAttr,
  };
};
