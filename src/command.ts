import { window, workspace, TextEditor, Range } from "vscode";
import { JSXElement } from "@babel/types";
import { parseDocument, IClassAttribute } from "./util/parseDocument";
import { generateStyledComponent } from "./util/generateStyledComponent";
import { generateImportStatement } from "./util/generateImportStatement";

export const COMMAND_NAME = "extension.tailwindcomponent";

export const tailwindcomponentCommand = async () => {
  const editor = window.activeTextEditor;

  if (!editor) {
    window.showInformationMessage(
      "Please only execute the command with an active file"
    );
    return;
  }

  const documentInformation = parseDocument(
    editor.document.getText(),
    editor.document.offsetAt(editor.selection.active)
  );

  const {
    selectedElement,
    elementName,
    insertPosition,
    classAttr,
    importStatementExisting,
  } = documentInformation;

  const tailwindcomponentName = await window.showInputBox({
    prompt: "Name: ",
    placeHolder: "Name of the component",
  });

  if (!tailwindcomponentName) {
    window.showInformationMessage("Please enter a name");
    return;
  }
  const component = generateStyledComponent(elementName, tailwindcomponentName, classAttr);

  const importStatement =
    importStatementExisting ||
    workspace.getConfiguration("tailwindcomponent").get("insertImportStatement") === false
      ? null
      : await generateImportStatement(editor.document.uri);

  try {
    await modifyDocument(
      editor,
      component,
      importStatement,
      insertPosition,
      selectedElement,
      classAttr,
      tailwindcomponentName
    );
  } catch (e) {
    window.showInformationMessage("Could not update document");
    return;
  }
  if (workspace.getConfiguration("tailwindcomponent").get("saveAfterExecute")) {
    await editor.document.save();
  }
};

const modifyDocument = async (
  editor: TextEditor,
  styledComponent: string,
  importStatement: string | null,
  insertPosition: number,
  oldElement: JSXElement,
  classAttr: IClassAttribute | null,
  tailwindcomponentName: string
) => {
  const { document } = editor;
  const openName = oldElement.openingElement.name;
  const closeName = oldElement.closingElement?.name;

  await editor.edit(
    editBuilder => {
      // Insert import statement
      if (importStatement !== null) {
        editBuilder.insert(
          document.positionAt(insertPosition),
          `\n${importStatement}`
        );

        // Insert TailwindComponent below
        editBuilder.insert(
          document.positionAt(insertPosition + 1),
          `\n${styledComponent}\n`
        );
      } else {
        // Insert TailwindComponent
        editBuilder.insert(
          document.positionAt(insertPosition),
          `\n\n${styledComponent}\n`
        );
      }

      // Remove style-attribute
      if (classAttr !== null) {
        editBuilder.delete(
          new Range(
            document.positionAt(classAttr.start!),
            document.positionAt(classAttr.end!)
          )
        );
      }

      // Rename Opening Tag
      editBuilder.replace(
        new Range(
          document.positionAt(openName.start!),
          document.positionAt(openName.end!)
        ),
        tailwindcomponentName
      );

      // Rename Closing Tag
      if (closeName !== undefined) {
        editBuilder.replace(
          new Range(
            document.positionAt(closeName.start!),
            document.positionAt(closeName.end!)
          ),
          tailwindcomponentName
        );
      }
    },
    { undoStopBefore: false, undoStopAfter: false }
  );
};
