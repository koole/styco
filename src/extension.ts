import { commands, ExtensionContext, languages } from "vscode";
import { tailwindcomponentCodeActionProvider } from "./TailwindComponentCodeActionProvider";
import { tailwindcomponentCommand, COMMAND_NAME } from "./command";

export function activate(context: ExtensionContext) {
  context.subscriptions.push(
    commands.registerCommand(COMMAND_NAME, tailwindcomponentCommand),
    languages.registerCodeActionsProvider(
      ["javascriptreact", "typescriptreact"],
      new tailwindcomponentCodeActionProvider()
    )
  );
}
