import {
  CodeActionProvider,
  TextDocument,
  Range,
  Selection,
  ProviderResult,
  Command,
  CodeAction,
  workspace
} from "vscode";
import { COMMAND_NAME } from "./command";

export class tailwindcomponentCodeActionProvider implements CodeActionProvider {
  provideCodeActions(
    document: TextDocument,
    range: Range | Selection
  ): ProviderResult<(Command | CodeAction)[]> {
    if (
      workspace.getConfiguration("tailwindcomponent").get("disableCodeAction") ||
      !document.lineAt(range.start.line).text.includes("style={")
    ) {
      return;
    }

    const cmd = new CodeAction("Extract to styled component");
    cmd.command = { command: COMMAND_NAME, title: "tailwindcomponent" };

    return [cmd];
  }
}
