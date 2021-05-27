import { IClassAttribute } from "./parseDocument";
import generate from "@babel/generator";
import {
  variableDeclaration,
  variableDeclarator,
  identifier,
  taggedTemplateExpression,
  memberExpression,
  callExpression,
  templateLiteral,
  templateElement,
  StringLiteral,
} from "@babel/types";

const generateStyleBlock = (classNames: StringLiteral) => {
  return `${classNames}`;
};

export const generateStyledComponent = (
  elementName: string,
  tailwindcomponentName: string,
  classAttr: IClassAttribute | null
) => {
  const styleString =
    classAttr !== null ? generateStyleBlock(classAttr.properties) : "";

  return generate(
    variableDeclaration("const", [
      variableDeclarator(
        identifier(tailwindcomponentName),
        taggedTemplateExpression(
          // Is default tag? just concat with a '.', otherwise wrap with '()'
          elementName[0] === elementName[0].toLowerCase()
            ? memberExpression(identifier("tw"), identifier(elementName))
            : callExpression(identifier("tw"), [identifier(elementName)]),
          templateLiteral([templateElement({ raw: styleString })], [])
        )
      ),
    ])
  ).code;
};
